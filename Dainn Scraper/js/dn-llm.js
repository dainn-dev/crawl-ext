/*!
 * dn-llm — shared client for the BYO-key AI features.
 *
 * Responsibilities:
 *   1. Persist provider/model/apiKey in chrome.storage.local (NOT sync — keys
 *      shouldn't leave this browser even with the same Google profile).
 *   2. Wrap chrome.runtime.sendMessage({ action: 'dn:aiCall' }) so callers
 *      get a Promise back and don't have to deal with manifest-relay shape.
 *   3. Provide the two domain prompts the rest of the UI consumes:
 *        - dnAiGenerateScraperConfig(html, description) — NL setup
 *        - dnAiSuggestColumnCleanup(headers, sampleRows) — schema cleanup
 *
 * Anything that isn't UI-specific lives here so it can be unit-tested in
 * isolation later. The popup never touches provider URLs / API shapes
 * directly — only this module and background.js do.
 */
(function () {
    if (window.dnLlm) return;

    const STORAGE_KEY = 'dnAiSettings';

    const DEFAULTS = {
        anthropic: {
            model: 'claude-haiku-4-5',
            keyUrl: 'https://console.anthropic.com/settings/keys',
            keyPrefix: 'sk-ant-',
            baseUrl: 'https://api.anthropic.com'
        },
        openai: {
            model: 'gpt-4o-mini',
            keyUrl: 'https://platform.openai.com/api-keys',
            keyPrefix: 'sk-',
            baseUrl: 'https://api.openai.com'
        }
    };

    function getSettings() {
        return new Promise(function (resolve) {
            if (!(chrome && chrome.storage && chrome.storage.local)) { resolve(null); return; }
            chrome.storage.local.get([STORAGE_KEY], function (result) {
                resolve((result && result[STORAGE_KEY]) || null);
            });
        });
    }

    function saveSettings(settings) {
        return new Promise(function (resolve) {
            if (!(chrome && chrome.storage && chrome.storage.local)) { resolve(false); return; }
            const payload = {}; payload[STORAGE_KEY] = settings;
            chrome.storage.local.set(payload, function () { resolve(true); });
        });
    }

    function clearSettings() {
        return new Promise(function (resolve) {
            chrome.storage.local.remove([STORAGE_KEY], function () { resolve(); });
        });
    }

    // Core LLM call — returns { ok, text, usage?, error? }.
    // background.js owns the actual fetch so we sidestep CORS for any future
    // provider and so cost/rate-limit logic has a single chokepoint.
    function call(opts) {
        return new Promise(function (resolve) {
            const settings = opts.settings || {};
            const provider = settings.provider || 'anthropic';
            const model    = settings.model || (DEFAULTS[provider] && DEFAULTS[provider].model);
            const apiKey   = settings.apiKey || '';

            if (!apiKey) { resolve({ ok: false, error: 'No API key configured (Settings → AI)' }); return; }

            chrome.runtime.sendMessage({
                action: 'dn:aiCall',
                provider: provider,
                apiKey: apiKey,
                model: model,
                // Custom base URL — undefined falls back to the provider's
                // default in background.js. Trim trailing slash so the path
                // we append doesn't double up.
                baseUrl: (settings.baseUrl || '').replace(/\/+$/, '') || undefined,
                system: opts.system || '',
                user: opts.user || '',
                maxTokens: opts.maxTokens || 1024,
                jsonMode: opts.jsonMode === true
            }, function (resp) {
                if (chrome.runtime.lastError) {
                    resolve({ ok: false, error: chrome.runtime.lastError.message });
                    return;
                }
                resolve(resp || { ok: false, error: 'No response from service worker' });
            });
        });
    }

    // Lower-cost variant — sends a 1-token "ping" to confirm key+model work.
    // Used by the "Test API key" button in Settings.
    async function ping(settings) {
        return call({
            settings: settings,
            system: 'Reply with exactly the single word: OK',
            user: 'ping',
            maxTokens: 8
        });
    }

    // --- Domain prompt #1: natural-language scraper setup ---------------
    //
    // Strips boilerplate from the HTML, then asks the model to identify the
    // list container + next-page selector + the column fields the user wants.
    // We force JSON output via a strict schema in the system prompt; the
    // jsonMode flag also turns on the provider's native JSON enforcement
    // where available (OpenAI).
    function trimHtmlForPrompt(html, maxChars) {
        if (!html) return '';
        // Strip noisy elements that almost never carry data — saves ~30-60%
        // of tokens on most modern web apps.
        let cleaned = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<svg[\s\S]*?<\/svg>/gi, '<svg/>')
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(/\s+/g, ' ');
        const cap = maxChars || 40000;
        if (cleaned.length > cap) cleaned = cleaned.slice(0, cap) + ' …[TRUNCATED]';
        return cleaned;
    }

    async function generateScraperConfig(args) {
        const html = trimHtmlForPrompt(args.html, args.maxChars || 40000);
        const description = (args.description || '').trim();

        const system = [
            'You are a CSS selector assistant. The user wants to scrape a webpage. Given the HTML snippet and a natural-language description, identify:',
            '  - contentSelector: a CSS selector that matches the wrapper element containing the repeating list/grid items the user cares about. Prefer stable IDs/data-* attributes/semantic classes over Tailwind utility classes. Must work as `document.querySelector(contentSelector)`.',
            '  - nextSelector: a CSS selector for the pagination "next page" button if one exists on the page; null otherwise.',
            '  - columns: an array of {name, sampleValue} for each data field the user requested. Use clear short English names in snake_case (e.g. "product_name", "price_usd"). sampleValue is one literal example found in the HTML.',
            'Return ONLY valid JSON, no prose, in this exact shape:',
            '{"contentSelector": "string", "nextSelector": "string|null", "columns": [{"name": "string", "sampleValue": "string"}]}',
            'If the HTML clearly does not contain what the user described, return {"error": "string explanation"} instead.'
        ].join('\n');

        const user = [
            'User description: ' + description,
            '',
            'HTML snippet:',
            html
        ].join('\n');

        const resp = await call({
            settings: args.settings,
            system: system,
            user: user,
            maxTokens: 1024,
            jsonMode: true
        });
        if (!resp.ok) return resp;
        return parseJsonFromText(resp.text);
    }

    // --- Domain prompt #2: schema-level cleanup -------------------------
    //
    // Sends headers + sample rows, asks for: rename, type, and a transform
    // chosen from a fixed enum. The transform enum is enforced client-side
    // so the model can't return arbitrary code.
    const ALLOWED_TRANSFORMS = ['none', 'trim', 'lowercase', 'uppercase', 'extractNumber', 'parseDate', 'removeUnits', 'stripHtml'];

    async function suggestColumnCleanup(args) {
        const headers = args.headers || [];
        const rows = (args.sampleRows || []).slice(0, 10); // cap to 10 rows for cost

        const system = [
            'You are a data normalization assistant. Given column headers and sample rows from a scraped table, suggest cleanup for each column.',
            'For each column output an object with:',
            '  - original: the exact header string as given',
            '  - rename: a clear short snake_case English name (e.g. "price_usd", "posted_date")',
            '  - type: one of "text" | "number" | "currency" | "date" | "url" | "email" | "phone"',
            '  - transform: one of ' + JSON.stringify(ALLOWED_TRANSFORMS) + '. Pick "extractNumber" for currency/numeric columns that have $ or commas, "parseDate" for dates in any format, "stripHtml" if values contain HTML tags, "trim" as a safe default.',
            'Return ONLY a JSON array, no prose: [{"original": "...", "rename": "...", "type": "...", "transform": "..."}]'
        ].join('\n');

        const user = [
            'Headers: ' + JSON.stringify(headers),
            'Sample rows (first ' + rows.length + '):',
            JSON.stringify(rows)
        ].join('\n');

        const resp = await call({
            settings: args.settings,
            system: system,
            user: user,
            maxTokens: 2048,
            jsonMode: true
        });
        if (!resp.ok) return resp;
        const parsed = parseJsonFromText(resp.text);
        if (!parsed.ok) return parsed;
        // Sanitize transform values — only ALLOWED_TRANSFORMS get through.
        const out = (Array.isArray(parsed.data) ? parsed.data : []).map(function (col) {
            return {
                original: String(col.original || ''),
                rename: String(col.rename || col.original || ''),
                type: String(col.type || 'text'),
                transform: ALLOWED_TRANSFORMS.indexOf(col.transform) >= 0 ? col.transform : 'none'
            };
        });
        return { ok: true, data: out };
    }

    // Models often wrap JSON in ```json fences or add prose before/after.
    // Extract the first {…} or […] block as a best-effort fallback.
    function parseJsonFromText(text) {
        if (!text) return { ok: false, error: 'Empty response from model' };
        let raw = String(text).trim();
        raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
            return { ok: true, data: JSON.parse(raw) };
        } catch (e) {
            const m = raw.match(/[\[{][\s\S]*[\]}]/);
            if (m) {
                try { return { ok: true, data: JSON.parse(m[0]) }; }
                catch (e2) { /* fall through */ }
            }
            return { ok: false, error: 'Model did not return valid JSON', raw: raw.slice(0, 500) };
        }
    }

    window.dnLlm = {
        DEFAULTS: DEFAULTS,
        ALLOWED_TRANSFORMS: ALLOWED_TRANSFORMS,
        getSettings: getSettings,
        saveSettings: saveSettings,
        clearSettings: clearSettings,
        call: call,
        ping: ping,
        generateScraperConfig: generateScraperConfig,
        suggestColumnCleanup: suggestColumnCleanup,
        trimHtmlForPrompt: trimHtmlForPrompt,
        parseJsonFromText: parseJsonFromText
    };
})();
