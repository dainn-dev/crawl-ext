/*! Dainn Scraper — MV3 service worker.
 *
 * Responsibilities:
 *  1. Open the scraper UI in a popup window when the toolbar icon is clicked
 *     (preserved from the original behaviour).
 *  2. Relay outbound HTTP requests from the extension UI so we escape the
 *     popup's same-origin restrictions (webhooks).
 *  3. Hold the Google OAuth flow + Drive uploads.
 *
 *     We use chrome.identity.launchWebAuthFlow rather than getAuthToken.
 *     getAuthToken requires the user to be signed into the Chrome browser
 *     ("Allow Chrome sign-in" enabled) and fails with "The user turned off
 *     browser signin" otherwise — that's a hard blocker for users on managed
 *     profiles or anyone running Chrome without sync. launchWebAuthFlow
 *     instead opens a normal OAuth popup that works in any state.
 *
 *     Setup checklist (one-time, by the developer):
 *       1. Google Cloud Console → APIs & Services → Enable Drive API.
 *       2. Credentials → Create OAuth client ID → application type
 *          **Web application** (NOT Chrome Extension).
 *       3. Add Authorized redirect URI:
 *             https://<your-extension-id>.chromiumapp.org/
 *          (chrome.identity.getRedirectURL() returns this — log it once
 *          and paste it into the console.)
 *       4. Copy the resulting client_id into manifest.json's `oauth2.client_id`.
 *
 *  Messaging contract (sender → sw):
 *    { action: 'dn:webhook', url, method?, headers?, body? }
 *      → { ok, status?, statusText?, durationMs, body?, error? }
 *
 *    { action: 'dn:driveAuth', interactive?: bool }
 *      → { ok: true, token, expiresAt } | { ok: false, error }
 *
 *    { action: 'dn:driveAuthRevoke' }
 *      → { ok: true } (always — best-effort cleanup)
 *
 *    { action: 'dn:driveUpload', filename, mimeType, bytesBase64 }
 *      → { ok: true, fileId, webViewLink, durationMs }
 *      → { ok: false, error, durationMs }
 *
 *    { action: 'dn:aiCall', provider, apiKey, model, system, user, maxTokens?, jsonMode? }
 *      → { ok: true, text, usage, durationMs }
 *      → { ok: false, error, durationMs }
 *      Currently supports provider='anthropic' (Messages API) and 'openai'
 *      (Chat Completions). All HTTPS so it could also run in-page, but
 *      routing through the SW keeps the API key out of any page context
 *      that opens DevTools and lets us add cost tracking in one place later.
 */

chrome.action.onClicked.addListener(function (activeTab) {
    const targetUrl = chrome.runtime.getURL(
        "index.html?tabid=" + encodeURIComponent(activeTab.id) +
        "&url=" + encodeURIComponent(activeTab.url)
    );
    chrome.windows.create({
        url: targetUrl,
        type: "popup",
        width: 720,
        height: 650
    });
});

// Reject anything other than http/https — webhooks must not be able to coerce
// the service worker into hitting chrome-extension://, file://, etc.
function isAllowedWebhookUrl(raw) {
    if (typeof raw !== 'string' || !raw) return false;
    try {
        const u = new URL(raw);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

async function relayWebhook(req) {
    const started = performance.now();
    if (!isAllowedWebhookUrl(req && req.url)) {
        return { ok: false, error: 'Invalid or disallowed URL', durationMs: 0 };
    }
    const method = (req.method || 'POST').toUpperCase();
    const headers = (req.headers && typeof req.headers === 'object') ? req.headers : {};
    const body = (method === 'GET' || method === 'HEAD') ? undefined : req.body;

    try {
        const resp = await fetch(req.url, { method, headers, body });
        const durationMs = Math.round(performance.now() - started);
        // Body is best-effort — large responses get truncated so we don't blow
        // out the message channel. Callers should treat it as diagnostic only.
        let bodyText = null;
        try {
            const raw = await resp.text();
            bodyText = raw.length > 2048 ? raw.slice(0, 2048) + '…' : raw;
        } catch (_) {}
        return {
            ok: resp.ok,
            status: resp.status,
            statusText: resp.statusText,
            durationMs,
            body: bodyText
        };
    } catch (err) {
        return {
            ok: false,
            error: (err && err.message) || String(err),
            durationMs: Math.round(performance.now() - started)
        };
    }
}

const DRIVE_TOKEN_KEY = 'dnDriveToken'; // { token, expiresAt }

function getOAuthClientId() {
    const oauth2 = chrome.runtime.getManifest().oauth2;
    return oauth2 && oauth2.client_id ? oauth2.client_id : null;
}
function getOAuthScopes() {
    const oauth2 = chrome.runtime.getManifest().oauth2;
    return (oauth2 && Array.isArray(oauth2.scopes) && oauth2.scopes.length)
        ? oauth2.scopes
        : ['https://www.googleapis.com/auth/drive.file'];
}

function readCachedDriveToken() {
    return new Promise(function (resolve) {
        chrome.storage.local.get([DRIVE_TOKEN_KEY], function (result) {
            const cached = result && result[DRIVE_TOKEN_KEY];
            // Treat tokens within 60 s of expiry as already-expired so we
            // don't hand back a token that'll die mid-upload.
            if (cached && cached.token && cached.expiresAt && cached.expiresAt > Date.now() + 60_000) {
                resolve(cached);
            } else {
                resolve(null);
            }
        });
    });
}

function writeCachedDriveToken(token, expiresInSec) {
    const expiresAt = Date.now() + Math.max(0, (expiresInSec || 3600) - 60) * 1000;
    return new Promise(function (resolve) {
        const payload = {};
        payload[DRIVE_TOKEN_KEY] = { token: token, expiresAt: expiresAt };
        chrome.storage.local.set(payload, function () { resolve({ token: token, expiresAt: expiresAt }); });
    });
}

function clearCachedDriveToken() {
    return new Promise(function (resolve) {
        chrome.storage.local.remove([DRIVE_TOKEN_KEY], function () { resolve(); });
    });
}

// Implicit OAuth flow — Google redirects back to chromiumapp.org with
// `#access_token=...&expires_in=3600&...`. Chrome detects the redirect and
// returns the full URL to our callback; we parse the fragment ourselves.
async function launchDriveOAuth(interactive) {
    if (!(chrome.identity && chrome.identity.launchWebAuthFlow)) {
        return { ok: false, error: 'chrome.identity.launchWebAuthFlow unavailable — check manifest permissions' };
    }
    const clientId = getOAuthClientId();
    const redirectUri = chrome.identity.getRedirectURL();
    if (!clientId || clientId.indexOf('REPLACE_WITH_YOUR_CLIENT_ID') === 0) {
        // Surface the redirect URI in the error so the developer can paste it
        // straight into the Google Cloud Console "Authorized redirect URIs"
        // field — the value depends on this extension's ID, which they may
        // not have looked up yet.
        return { ok: false, error: 'OAuth client_id not set. Register a Google Cloud OAuth client (Web application type), add this redirect URI: ' + redirectUri + ' — then paste the client_id into manifest.json (oauth2.client_id).' };
    }
    const scope = getOAuthScopes().join(' ');
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
        + '?client_id=' + encodeURIComponent(clientId)
        + '&redirect_uri=' + encodeURIComponent(redirectUri)
        + '&response_type=token'
        + '&scope=' + encodeURIComponent(scope)
        + '&include_granted_scopes=true'
        + '&prompt=' + (interactive ? 'consent' : 'none');

    const redirected = await new Promise(function (resolve) {
        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: !!interactive }, function (responseUrl) {
            if (chrome.runtime.lastError) {
                resolve({ error: chrome.runtime.lastError.message });
                return;
            }
            if (!responseUrl) {
                resolve({ error: 'No response URL from auth flow' });
                return;
            }
            resolve({ url: responseUrl });
        });
    });
    if (redirected.error) return { ok: false, error: redirected.error };

    // Fragment is on the URL hash; URL constructor preserves it as `hash`.
    let token = null, expiresIn = 3600, err = null;
    try {
        const u = new URL(redirected.url);
        const params = new URLSearchParams(u.hash ? u.hash.slice(1) : (u.search ? u.search.slice(1) : ''));
        token = params.get('access_token');
        const exp = parseInt(params.get('expires_in') || '3600', 10);
        if (!isNaN(exp) && exp > 0) expiresIn = exp;
        err = params.get('error');
    } catch (e) {
        return { ok: false, error: 'Failed to parse OAuth response: ' + (e && e.message) };
    }
    if (err) return { ok: false, error: 'OAuth error: ' + err };
    if (!token) return { ok: false, error: 'No access_token in OAuth response' };

    const stored = await writeCachedDriveToken(token, expiresIn);
    return { ok: true, token: stored.token, expiresAt: stored.expiresAt };
}

async function getDriveAuthToken(interactive) {
    const cached = await readCachedDriveToken();
    if (cached) return { ok: true, token: cached.token, expiresAt: cached.expiresAt };
    // Non-interactive callers (e.g. "are we connected?" check) shouldn't pop
    // a sign-in window; just report no token.
    if (!interactive) return { ok: false, error: 'No cached token' };
    return launchDriveOAuth(true);
}

async function revokeDriveAuthToken() {
    const cached = await readCachedDriveToken();
    await clearCachedDriveToken();
    if (cached && cached.token) {
        // Best-effort server-side revoke so the next interactive auth re-prompts cleanly.
        fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(cached.token), { method: 'POST' })
            .catch(function () {});
    }
    return { ok: true };
}

// Decode base64 to a Uint8Array. Drive's multipart endpoint needs raw bytes —
// FormData/Blob built in the SW would also work but we already have base64
// from the popup (atob is unavailable in some SW contexts only when the SW
// is module-mode; we're in classic SW so atob is fine).
function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function uploadToDrive(req) {
    const started = performance.now();
    let auth = await getDriveAuthToken(false);
    if (!auth.ok) {
        return { ok: false, error: 'Not authenticated with Drive — click Connect to Drive in Settings first.', durationMs: Math.round(performance.now() - started) };
    }
    const filename = (req && req.filename) || ('dainn-export-' + Date.now() + '.xlsx');
    const mimeType = (req && req.mimeType) || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    let bytes;
    try { bytes = base64ToBytes(req.bytesBase64 || ''); }
    catch (e) { return { ok: false, error: 'Invalid bytesBase64 payload', durationMs: 0 }; }

    // Multipart upload — metadata + body in one request. Documented at
    // https://developers.google.com/drive/api/guides/manage-uploads#multipart
    const boundary = '-------dainn-' + Math.random().toString(16).slice(2);
    const metadata = JSON.stringify({ name: filename, mimeType: mimeType });
    const header =
        '--' + boundary + '\r\n' +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        metadata + '\r\n' +
        '--' + boundary + '\r\n' +
        'Content-Type: ' + mimeType + '\r\n\r\n';
    const footer = '\r\n--' + boundary + '--';

    const headerBytes = new TextEncoder().encode(header);
    const footerBytes = new TextEncoder().encode(footer);
    const body = new Uint8Array(headerBytes.length + bytes.length + footerBytes.length);
    body.set(headerBytes, 0);
    body.set(bytes, headerBytes.length);
    body.set(footerBytes, headerBytes.length + bytes.length);

    try {
        const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + auth.token,
                'Content-Type': 'multipart/related; boundary=' + boundary
            },
            body: body
        });
        const durationMs = Math.round(performance.now() - started);
        if (!resp.ok) {
            // Token may have expired between our cache check and the request;
            // drop the cache so the next call re-auths interactively.
            if (resp.status === 401) await clearCachedDriveToken();
            const errBody = await resp.text().catch(function () { return ''; });
            return { ok: false, error: 'Drive upload HTTP ' + resp.status + (errBody ? ': ' + errBody.slice(0, 500) : ''), durationMs: durationMs };
        }
        const json = await resp.json();
        return { ok: true, fileId: json.id, webViewLink: json.webViewLink || null, durationMs: durationMs };
    } catch (err) {
        return { ok: false, error: (err && err.message) || String(err), durationMs: Math.round(performance.now() - started) };
    }
}

async function callAnthropic(req) {
    // Anthropic Messages API. We don't use the Anthropic JS SDK because
    // service workers don't ship XHR and the SDK pulls in extras; native
    // fetch is fine.
    // baseUrl override lets users point at proxies / self-hosted gateways.
    // We append the canonical path so the user only configures the host.
    const base = (req.baseUrl && String(req.baseUrl).replace(/\/+$/, '')) || 'https://api.anthropic.com';
    const url = base + '/v1/messages';
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': req.apiKey,
            'anthropic-version': '2023-06-01',
            // Required so fetch from an extension page is allowed —
            // browsers otherwise enforce same-origin checks even for the
            // SW. See https://docs.anthropic.com/en/api/client-sdks#browser-usage
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: req.model || 'claude-haiku-4-5',
            max_tokens: req.maxTokens || 1024,
            system: req.system || undefined,
            messages: [{ role: 'user', content: req.user || '' }]
        })
    });
    const json = await resp.json().catch(function () { return {}; });
    if (!resp.ok) {
        return { ok: false, error: 'Anthropic HTTP ' + resp.status + ': ' + ((json && json.error && json.error.message) || resp.statusText) };
    }
    // content is an array of blocks; we only request text so take block[0].
    const text = (json.content && json.content[0] && json.content[0].text) || '';
    return { ok: true, text: text, usage: json.usage || null };
}

async function callOpenAI(req) {
    const messages = [];
    if (req.system) messages.push({ role: 'system', content: req.system });
    messages.push({ role: 'user', content: req.user || '' });

    const body = {
        model: req.model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: req.maxTokens || 1024
    };
    // jsonMode: ask for response_format=json_object so the model is forced
    // to return parseable JSON. Caller is still expected to defensively
    // strip code fences (some older models ignore the param).
    if (req.jsonMode) body.response_format = { type: 'json_object' };

    const base = (req.baseUrl && String(req.baseUrl).replace(/\/+$/, '')) || 'https://api.openai.com';
    const url = base + '/v1/chat/completions';
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + req.apiKey
        },
        body: JSON.stringify(body)
    });
    const json = await resp.json().catch(function () { return {}; });
    if (!resp.ok) {
        return { ok: false, error: 'OpenAI HTTP ' + resp.status + ': ' + ((json && json.error && json.error.message) || resp.statusText) };
    }
    const text = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || '';
    return { ok: true, text: text, usage: json.usage || null };
}

async function callAi(req) {
    const started = performance.now();
    if (!req || !req.apiKey) {
        return { ok: false, error: 'Missing API key', durationMs: 0 };
    }
    let result;
    try {
        if (req.provider === 'openai') {
            result = await callOpenAI(req);
        } else {
            // Default to Anthropic — keeps behaviour predictable if the
            // popup forgets to send `provider`.
            result = await callAnthropic(req);
        }
    } catch (err) {
        result = { ok: false, error: (err && err.message) || String(err) };
    }
    result.durationMs = Math.round(performance.now() - started);
    return result;
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (!msg || typeof msg !== 'object') return false;

    if (msg.action === 'dn:webhook') {
        relayWebhook(msg).then(sendResponse);
        return true;
    }
    if (msg.action === 'dn:driveAuth') {
        getDriveAuthToken(!!msg.interactive).then(sendResponse);
        return true;
    }
    if (msg.action === 'dn:driveAuthRevoke') {
        revokeDriveAuthToken().then(sendResponse);
        return true;
    }
    if (msg.action === 'dn:driveUpload') {
        uploadToDrive(msg).then(sendResponse);
        return true;
    }
    if (msg.action === 'dn:aiCall') {
        callAi(msg).then(sendResponse);
        return true;
    }

    return false;
});
