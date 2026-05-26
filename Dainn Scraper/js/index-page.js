(function () {
	// Format seconds → hh:mm:ss. Defers to the popup.js implementation when
	// loaded; this local fallback exists because index-page.js can briefly run
	// before popup.js defines window.dnFormatWorkingTime.
	function formatWorkingTime(seconds) {
		if (typeof window.dnFormatWorkingTime === 'function') {
			return window.dnFormatWorkingTime(seconds);
		}
		const totalSeconds = seconds || 0;
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const secs = totalSeconds % 60;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Helper function to get current tab ID
	function getCurrentTabId() {
		// Try to get tab ID from URL parameters first
		const urlParams = new URLSearchParams(window.location.search);
		const tabId = urlParams.get('tabid');
		if (tabId) {
			return parseInt(tabId);
		}

		// Fallback: try to get from chrome.tabs API
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			return new Promise((resolve) => {
				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					if (tabs[0]) {
						resolve(tabs[0].id);
					} else {
						resolve(null);
					}
				});
			});
		}

		return null;
	}

	// Function to update page title with startingUrl
	function updatePageTitle(tabId = null) {
		const titleElement = document.querySelector('title');
		if (!titleElement) {
			console.log('Title element not found');
			return;
		}

		// Get startingUrl from global variables if available
		if (typeof window.s !== 'undefined' && window.s.startingUrl) {
			const startingUrl = window.s.startingUrl;
			titleElement.textContent = `Dainn Scraper - ${startingUrl}`;
			console.log('✅ Updated title with startingUrl from global s:', startingUrl);
			return;
		}

		// If no global startingUrl, try to get from tab
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			const handleTab = function (tab) {
				const tabs = tab ? [tab] : [];
				if (tabs[0] && tabs[0].url) {
					try {
						const url = new URL(tabs[0].url);

						// Check if this is a chrome extension URL and extract the actual URL parameter
						if (url.protocol === 'chrome-extension:') {
							const urlParam = url.searchParams.get('url');
							if (urlParam) {
								// Decode the URL parameter to get the actual target URL
								const decodedUrl = decodeURIComponent(urlParam);
								titleElement.textContent = `Dainn Scraper - ${decodedUrl}`;
								console.log('✅ Updated title with decoded URL parameter:', decodedUrl);
							} else {
								titleElement.textContent = `Dainn Scraper - ${url.hostname}`;
								console.log('✅ Updated title with hostname:', url.hostname);
							}
						} else {
							// Regular URL (not chrome extension)
							const hostname = url.hostname;
							const pathname = url.pathname.length > 30 ? url.pathname.substring(0, 30) + '...' : url.pathname;
							const fullUrl = hostname + pathname;
							titleElement.textContent = `Dainn Scraper - ${fullUrl}`;
							console.log('✅ Updated title with regular URL:', fullUrl);
						}
					} catch (e) {
						titleElement.textContent = `Dainn Scraper - ${tabs[0].url}`;
						console.log('✅ Updated title with raw URL:', tabs[0].url);
					}
				} else {
					titleElement.textContent = 'Dainn Scraper';
					console.log('✅ Updated title to default');
				}
			};

			if (tabId) {
				chrome.tabs.get(tabId, function (tab) {
					if (chrome.runtime.lastError) {
						console.warn('Could not get tab', tabId, '-', chrome.runtime.lastError.message);
						handleTab(null);
						return;
					}
					handleTab(tab);
				});
			} else {
				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					handleTab(tabs && tabs[0]);
				});
			}
		} else {
			// Fallback for when chrome.tabs is not available
			titleElement.textContent = 'Dainn Scraper';
			console.log('✅ Updated title to default (no chrome.tabs)');
		}
	}

	// Hide loading overlay once page is fully loaded
	window.addEventListener('load', function () {
		const loadingOverlay = document.getElementById('loadingOverlay');
		setTimeout(() => {
			loadingOverlay.style.opacity = '0';
			loadingOverlay.style.transition = 'opacity 0.5s ease-out';
			setTimeout(() => {
				loadingOverlay.style.display = 'none';
			}, 500);
		}, 800);

		// Update page title with current URL
		updatePageTitle();
	});

	// Get DOM elements
	const menuToggle = document.getElementById('menuToggle');
	const sidebarMenu = document.getElementById('sidebarMenu');
	const sidebarOverlay = document.getElementById('sidebarOverlay');
	const closeSidebar = document.getElementById('closeSidebar');

	// Settings modal elements
	const openSettings = document.getElementById('openSettings');
	const settingsModal = document.getElementById('settingsModal');
	const settingsOverlay = document.getElementById('settingsOverlay');
	const closeSettings = document.getElementById('closeSettings');
	const cancelSettings = document.getElementById('cancelSettings');
	const saveSettings = document.getElementById('saveSettings');
	const resetSettings = document.getElementById('resetSettings');
	const addSelector = document.getElementById('addSelector');

	// Authentication method elements
	// Drive OAuth UI — uses chrome.identity, not user-entered Client ID/secret.
	// Service-account flow was removed: storing a service-account private key
	// in a client-side extension is unsafe (anyone inspecting storage can
	// exfiltrate it). The "Connect to Drive" button below drives the flow.
	const dnDriveConnectBtn = document.getElementById('dnDriveConnect');
	const dnDriveDisconnectBtn = document.getElementById('dnDriveDisconnect');
	const dnDriveStatusEl = document.getElementById('dnDriveStatus');

	const autoUploadDrive = document.getElementById('autoUploadDrive');
	const enableWebhooks = document.getElementById('enableWebhooks');
	const authMethodSection = document.getElementById('authMethodSection');
	const webhookSettingsContent = document.getElementById('webhookSettingsContent');

	const paginationNone = document.getElementById('paginationNone');
	const paginationCSS = document.getElementById('paginationCSS');
	const paginationInfinite = document.getElementById('paginationInfinite');
	const cssSelector = document.getElementById('cssSelector');

	const startScrapingBtn = document.getElementById('startScraping');
	const stopScrapingBtn = document.getElementById('stopScraping');
	const nextSelectorInput = document.getElementById('nextSelectorInput');
	const applyNextSelector = document.getElementById('applyNextSelector');
	const refreshHistoryBtn = document.getElementById('refreshHistory');

	function openSidebar() {
		sidebarOverlay.classList.remove('hidden');
		sidebarMenu.classList.remove('-translate-x-full');
		document.body.style.overflow = 'hidden';
	}

	function closeSidebarMenu() {
		sidebarOverlay.classList.add('hidden');
		sidebarMenu.classList.add('-translate-x-full');
		document.body.style.overflow = 'auto';
	}

	function openSettingsModal() {
		settingsOverlay.classList.remove('hidden');
		settingsModal.classList.remove('hidden');
		document.body.style.overflow = 'hidden';
		closeSidebarMenu();
	}

	function closeSettingsModal() {
		settingsOverlay.classList.add('hidden');
		settingsModal.classList.add('hidden');
		document.body.style.overflow = 'auto';
	}

	// Build a .dn-selector-row matching the markup styled by popup.css.
	// When `value` is empty (Add button), the row starts in edit mode (input
	// focused); commit on blur/Enter into a <span>. When `value` is supplied
	// (loading saved settings), render directly as a committed span.
	function buildSelectorRow(value) {
		const row = document.createElement('div');
		row.className = 'dn-selector-row';

		const editing = !value;
		if (editing) {
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = "e.g. a[title='Next Page']";
			input.className = 'dn-selector-code dn-selector-code-input';
			row.appendChild(input);
		} else {
			const span = document.createElement('span');
			span.className = 'dn-selector-code';
			span.textContent = value;
			row.appendChild(span);
		}

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.className = 'dn-icon-btn dn-icon-btn-danger dn-selector-remove';
		removeBtn.title = 'Remove';
		removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
		row.appendChild(removeBtn);

		return row;
	}

	function addNewSelector() {
		const selectorsList = document.getElementById('selectorsList');
		if (!selectorsList) return;
		const row = buildSelectorRow('');
		selectorsList.appendChild(row);

		const input = row.querySelector('input');
		input.focus();

		function commit() {
			const v = input.value.trim();
			if (!v) {
				row.remove();
				updateSelectorSuggestions();
				return;
			}
			const span = document.createElement('span');
			span.className = 'dn-selector-code';
			span.textContent = v;
			row.replaceChild(span, input);
			updateSelectorSuggestions();
		}

		input.addEventListener('blur', commit);
		input.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
			else if (e.key === 'Escape') { row.remove(); updateSelectorSuggestions(); }
		});
	}

	function readSelectorRows() {
		const rows = document.querySelectorAll('#selectorsList .dn-selector-row');
		const out = [];
		rows.forEach(row => {
			const span = row.querySelector('span.dn-selector-code');
			const input = row.querySelector('input.dn-selector-code');
			const value = (span && span.textContent.trim())
				|| (input && input.value.trim())
				|| '';
			if (value) out.push(value);
		});
		// De-dupe while preserving order.
		return Array.from(new Set(out));
	}

	// Stub kept so call-sites that still reference switchAuthMethod don't
	// throw — the auth-method radios were removed when service-account flow
	// was retired. Safe to delete once those call-sites are cleaned up.
	function switchAuthMethod() { /* no-op since service-account was removed */ }

	function dnSetDriveStatus(kind, message) {
		if (!dnDriveStatusEl) return;
		dnDriveStatusEl.classList.remove('hidden', 'is-success', 'is-error', 'is-loading');
		dnDriveStatusEl.classList.add('is-' + kind);
		dnDriveStatusEl.textContent = message;
	}

	function dnRefreshDriveConnected(showWhenIdle) {
		if (!dnDriveConnectBtn) return;
		chrome.runtime.sendMessage({ action: 'dn:driveAuth', interactive: false }, function (resp) {
			if (chrome.runtime.lastError || !resp || !resp.ok) {
				dnDriveConnectBtn.classList.remove('hidden');
				if (dnDriveDisconnectBtn) dnDriveDisconnectBtn.classList.add('hidden');
				if (showWhenIdle && dnDriveStatusEl) dnDriveStatusEl.classList.add('hidden');
				return;
			}
			dnDriveConnectBtn.classList.add('hidden');
			if (dnDriveDisconnectBtn) dnDriveDisconnectBtn.classList.remove('hidden');
			dnSetDriveStatus('success', 'Connected to Drive');
		});
	}

	function dnInitDriveAuth() {
		if (!dnDriveConnectBtn) return;
		dnDriveConnectBtn.addEventListener('click', function () {
			dnSetDriveStatus('loading', 'Opening Google sign-in…');
			chrome.runtime.sendMessage({ action: 'dn:driveAuth', interactive: true }, function (resp) {
				if (chrome.runtime.lastError) {
					dnSetDriveStatus('error', chrome.runtime.lastError.message);
					return;
				}
				if (!resp || !resp.ok) {
					dnSetDriveStatus('error', (resp && resp.error) || 'Sign-in failed');
					return;
				}
				dnRefreshDriveConnected();
			});
		});
		if (dnDriveDisconnectBtn) {
			dnDriveDisconnectBtn.addEventListener('click', function () {
				chrome.runtime.sendMessage({ action: 'dn:driveAuthRevoke' }, function () {
					dnSetDriveStatus('success', 'Disconnected');
					dnRefreshDriveConnected();
				});
			});
		}
		dnRefreshDriveConnected(true);
	}

	// Triggers an XLSX upload to Drive when autoUploadDrive is enabled. Bound
	// to scrape:completed so it runs after data is final. We delay slightly
	// to let popup.js' table render settle (s.data is mutated during the
	// completion callback chain).
	//
	// We do NOT gate on payload.reason — even when the scrape ended with an
	// error (target tab navigated away mid-crawl, sendMessage failure, etc.)
	// the data already collected is still worth saving. dnBuildXlsxBase64
	// returns null only when s.data is empty, which is the real "nothing to
	// upload" signal.
	function dnInitDriveAutoUpload() {
		if (!window.dnBus) return;
		window.dnBus.on('scrape:completed', function (payload) {
			const toggle = document.getElementById('autoUploadDrive');
			console.log('[drive] scrape:completed payload=', payload, 'toggle.checked=', toggle && toggle.checked);
			if (!toggle || !toggle.checked) return;
			if (typeof window.dnBuildXlsxBase64 !== 'function') {
				console.warn('[drive] window.dnBuildXlsxBase64 not available — popup.js helpers missing');
				return;
			}
			setTimeout(function () {
				console.log('[drive] timeout fired, building xlsx…');
				let base64;
				try { base64 = window.dnBuildXlsxBase64(); }
				catch (e) { console.error('[drive] dnBuildXlsxBase64 threw:', e); return; }
				if (!base64) {
					console.warn('[drive] no scraped data to upload (s.data empty)');
					showScrapingNotification('Drive: no data to upload', 'warning');
					return;
				}
				const filename = (typeof window.dnSuggestExportFilename === 'function')
					? window.dnSuggestExportFilename('xlsx')
					: ('dainn-export-' + Date.now() + '.xlsx');
				console.log('[drive] uploading filename=', filename, 'size=', base64.length, 'b64chars');
				showScrapingNotification('Uploading to Drive…', 'info');
				chrome.runtime.sendMessage({
					action: 'dn:driveUpload',
					filename: filename,
					mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					bytesBase64: base64
				}, function (resp) {
					console.log('[drive] upload response:', resp, 'lastError=', chrome.runtime.lastError && chrome.runtime.lastError.message);
					if (chrome.runtime.lastError || !resp || !resp.ok) {
						const reason = (resp && resp.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'unknown';
						showScrapingNotification('Drive upload failed: ' + reason, 'error');
						return;
					}
					showScrapingNotification('Uploaded to Drive (' + filename + ')', 'success');
				});
			}, 300);
		});
	}

	// ===================================================================
	// AI (BYO key) — Settings tab fields + Step 1 NL setup + Step 3 cleanup
	// ===================================================================

	// Whitelisted client-side transforms. The model only chooses a name from
	// dnLlm.ALLOWED_TRANSFORMS; we resolve the name to a function here so
	// the LLM can't smuggle arbitrary code in. Each fn is a value → value
	// map that runs once per cell.
	window.dnAiTransformFns = {
		none: function (v) { return v; },
		trim: function (v) { return v == null ? v : String(v).trim(); },
		lowercase: function (v) { return v == null ? v : String(v).toLowerCase(); },
		uppercase: function (v) { return v == null ? v : String(v).toUpperCase(); },
		extractNumber: function (v) {
			if (v == null) return v;
			const m = String(v).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
			return m ? Number(m[0]) : v;
		},
		parseDate: function (v) {
			if (v == null || v === '') return v;
			const t = Date.parse(String(v));
			return isNaN(t) ? v : new Date(t).toISOString().slice(0, 10);
		},
		removeUnits: function (v) {
			if (v == null) return v;
			return String(v).replace(/\s*[a-zA-Z%°]+\s*$/, '').trim();
		},
		stripHtml: function (v) {
			if (v == null) return v;
			return String(v).replace(/<[^>]*>/g, '').trim();
		}
	};

	function dnAiSetFeedback(el, kind, msg) {
		if (!el) return;
		el.classList.remove('hidden', 'is-success', 'is-error', 'is-loading');
		el.classList.add('is-' + kind);
		el.textContent = msg;
	}

	function dnAiCurrentSettingsFromUI() {
		const provider = (document.querySelector('input[name="dnAiProvider"]:checked') || {}).value || 'anthropic';
		const apiKeyInput = document.getElementById('dnAiApiKey');
		const modelInput = document.getElementById('dnAiModel');
		const baseUrlInput = document.getElementById('dnAiBaseUrl');
		return {
			provider: provider,
			apiKey: (apiKeyInput && apiKeyInput.value.trim()) || '',
			model: (modelInput && modelInput.value.trim()) || (window.dnLlm.DEFAULTS[provider] && window.dnLlm.DEFAULTS[provider].model) || '',
			baseUrl: (baseUrlInput && baseUrlInput.value.trim()) || ''
		};
	}

	function dnAiApplySettingsToUI(settings) {
		if (!settings) return;
		const radio = document.querySelector('input[name="dnAiProvider"][value="' + settings.provider + '"]');
		if (radio) radio.checked = true;
		const apiKeyInput = document.getElementById('dnAiApiKey');
		if (apiKeyInput) apiKeyInput.value = settings.apiKey || '';
		const modelInput = document.getElementById('dnAiModel');
		if (modelInput && settings.model) modelInput.value = settings.model;
		const baseUrlInput = document.getElementById('dnAiBaseUrl');
		if (baseUrlInput) baseUrlInput.value = settings.baseUrl || '';
		dnAiUpdateProviderHints();
		dnAiRefreshAvailability();
	}

	// Updates inline hints (model placeholder, base URL placeholder,
	// key-portal link) when the provider radio changes. Doesn't overwrite
	// user-entered values.
	function dnAiUpdateProviderHints() {
		const provider = (document.querySelector('input[name="dnAiProvider"]:checked') || {}).value || 'anthropic';
		const defaults = (window.dnLlm && window.dnLlm.DEFAULTS && window.dnLlm.DEFAULTS[provider]) || {};
		const modelInput = document.getElementById('dnAiModel');
		if (modelInput) modelInput.placeholder = defaults.model || '';
		const baseUrlInput = document.getElementById('dnAiBaseUrl');
		if (baseUrlInput) baseUrlInput.placeholder = defaults.baseUrl || '';
		const link = document.getElementById('dnAiKeyLink');
		if (link && defaults.keyUrl) {
			link.innerHTML = '<a href="' + defaults.keyUrl + '" target="_blank" rel="noopener">' + defaults.keyUrl + '</a>';
		}
	}

	// Whether AI features are usable right now (key present in saved settings).
	function dnAiIsConfigured(settings) {
		return !!(settings && settings.apiKey && settings.apiKey.length > 10);
	}

	// Toggle visibility of in-wizard AI affordances (Step 1 card + Step 3 button).
	function dnAiRefreshAvailability(savedSettings) {
		const show = function (cb) {
			if (savedSettings !== undefined) { cb(savedSettings); return; }
			window.dnLlm.getSettings().then(cb);
		};
		show(function (s) {
			const ready = dnAiIsConfigured(s);
			const card = document.getElementById('dnAiSetupCard');
			const cleanBtn = document.getElementById('dnAiClean');
			if (card) card.classList.toggle('hidden', !ready);
			if (cleanBtn) cleanBtn.classList.toggle('hidden', !ready);
		});
	}

	async function dnAiHandleTestKey() {
		const feedback = document.getElementById('dnAiTestFeedback');
		const btn = document.getElementById('dnAiTest');
		const uiSettings = dnAiCurrentSettingsFromUI();
		if (!uiSettings.apiKey) { dnAiSetFeedback(feedback, 'error', 'Enter an API key first'); return; }
		btn.disabled = true;
		const original = btn.innerHTML;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing…';
		dnAiSetFeedback(feedback, 'loading', 'Sending ping to ' + uiSettings.provider + '…');
		const resp = await window.dnLlm.ping(uiSettings);
		btn.disabled = false;
		btn.innerHTML = original;
		if (resp && resp.ok) {
			// Persist on successful test — saves the user a second click.
			await window.dnLlm.saveSettings(uiSettings);
			dnAiSetFeedback(feedback, 'success', 'Connected. Model replied: ' + (resp.text || '').trim().slice(0, 40));
			dnAiRefreshAvailability(uiSettings);
		} else {
			dnAiSetFeedback(feedback, 'error', (resp && resp.error) || 'Ping failed');
		}
	}

	// Persist AI settings whenever provider/key/model fields change so user
	// doesn't have to hit "Save settings" in the modal footer (which lives
	// in a separate save chain for non-AI fields).
	function dnAiAutoSaveBindings() {
		const inputs = [
			document.getElementById('dnAiApiKey'),
			document.getElementById('dnAiModel'),
			document.getElementById('dnAiBaseUrl')
		].concat(Array.from(document.querySelectorAll('input[name="dnAiProvider"]')));
		inputs.forEach(function (el) {
			if (!el) return;
			el.addEventListener('change', function () {
				window.dnLlm.saveSettings(dnAiCurrentSettingsFromUI()).then(function () {
					dnAiUpdateProviderHints();
					dnAiRefreshAvailability();
				});
			});
		});
	}

	// --- Step 1: AI-assisted scraper setup -----------------------------
	let dnAiSetupSuggestion = null;

	async function dnAiHandleGenerateSelectors() {
		const promptEl = document.getElementById('dnAiSetupPrompt');
		const feedback = document.getElementById('dnAiSetupFeedback');
		const btn = document.getElementById('dnAiSetupGenerate');
		const result = document.getElementById('dnAiSetupResult');
		const resultBody = document.getElementById('dnAiSetupResultBody');
		const description = (promptEl && promptEl.value.trim()) || '';
		if (!description) {
			dnAiSetFeedback(feedback, 'error', 'Describe what you want to scrape first.');
			if (promptEl) promptEl.focus();
			return;
		}
		const settings = await window.dnLlm.getSettings();
		if (!dnAiIsConfigured(settings)) {
			dnAiSetFeedback(feedback, 'error', 'No API key — open Settings → AI');
			return;
		}
		btn.disabled = true;
		const original = btn.innerHTML;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reading page…';
		dnAiSetFeedback(feedback, 'loading', 'Fetching page HTML…');

		// Get the page HTML through the content script. popup.js parses tabid
		// from the URL on load; we re-parse it here rather than reach across
		// the module boundary (popup.js loads as a module, so its locals
		// aren't on window).
		const tabId = parseInt(new URLSearchParams(window.location.search).get('tabid'), 10);
		const html = await new Promise(function (resolve) {
			if (!tabId || !chrome.tabs || !chrome.tabs.sendMessage) { resolve(null); return; }
			chrome.tabs.sendMessage(tabId, { action: 'getPageHTML' }, function (resp) {
				if (chrome.runtime.lastError || !resp || !resp.html) {
					console.warn('[ai] getPageHTML failed:', chrome.runtime.lastError && chrome.runtime.lastError.message);
					resolve(null);
					return;
				}
				resolve(resp.html);
			});
		});
		if (!html) {
			btn.disabled = false; btn.innerHTML = original;
			dnAiSetFeedback(feedback, 'error', 'Could not read page HTML — try reloading the target tab.');
			return;
		}

		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Asking AI…';
		dnAiSetFeedback(feedback, 'loading', 'Calling ' + settings.provider + '…');
		const out = await window.dnLlm.generateScraperConfig({ settings: settings, html: html, description: description });
		btn.disabled = false; btn.innerHTML = original;

		if (!out.ok) {
			dnAiSetFeedback(feedback, 'error', out.error || 'AI call failed');
			return;
		}
		const data = out.data || {};
		if (data.error) {
			dnAiSetFeedback(feedback, 'error', 'AI: ' + data.error);
			return;
		}
		dnAiSetupSuggestion = data;
		dnAiSetFeedback(feedback, 'success', 'Got a suggestion — review below.');
		if (resultBody) resultBody.textContent = JSON.stringify(data, null, 2);
		if (result) result.classList.remove('hidden');
	}

	function dnAiHandleApplySetup() {
		if (!dnAiSetupSuggestion) return;
		const sug = dnAiSetupSuggestion;
		// Apply content selector
		if (sug.contentSelector) {
			const inp = document.getElementById('contentSelectorInput');
			if (inp) inp.value = sug.contentSelector;
			const applyBtn = document.getElementById('applyContentSelector');
			if (applyBtn) applyBtn.click();
		}
		// Apply next-page selector if returned
		if (sug.nextSelector) {
			const inp = document.getElementById('nextSelectorInput');
			if (inp) {
				inp.value = sug.nextSelector;
				inp.dispatchEvent(new Event('input'));
			}
			const cssPag = document.getElementById('paginationCSS');
			if (cssPag) { cssPag.checked = true; cssPag.dispatchEvent(new Event('change')); }
		}
		showScrapingNotification('AI suggestion applied. Preview to verify.', 'success');
		const result = document.getElementById('dnAiSetupResult');
		if (result) result.classList.add('hidden');
		dnAiSetupSuggestion = null;
	}

	function dnAiHandleDismissSetup() {
		dnAiSetupSuggestion = null;
		const result = document.getElementById('dnAiSetupResult');
		if (result) result.classList.add('hidden');
	}

	// --- Step 3: AI cleanup --------------------------------------------
	let dnAiCleanSuggestion = null;

	async function dnAiHandleClean() {
		const btn = document.getElementById('dnAiClean');
		const result = document.getElementById('dnAiCleanResult');
		const resultBody = document.getElementById('dnAiCleanResultBody');
		if (typeof window.dnGetTableSnapshot !== 'function') {
			showScrapingNotification('Crawl something first.', 'warning');
			return;
		}
		const snap = window.dnGetTableSnapshot();
		if (!snap || !snap.data || !snap.data.length) {
			showScrapingNotification('No scraped data to clean.', 'warning');
			return;
		}
		const settings = await window.dnLlm.getSettings();
		if (!dnAiIsConfigured(settings)) {
			showScrapingNotification('No API key — open Settings → AI', 'error');
			return;
		}
		btn.disabled = true;
		const original = btn.innerHTML;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analysing…';
		const out = await window.dnLlm.suggestColumnCleanup({
			settings: settings,
			headers: snap.fields,                  // original (pre-rename) column names — these match s.namePaths keys
			sampleRows: snap.data.slice(0, 8)
		});
		btn.disabled = false; btn.innerHTML = original;
		if (!out.ok) {
			showScrapingNotification('AI cleanup failed: ' + (out.error || 'unknown'), 'error');
			return;
		}
		dnAiCleanSuggestion = out.data;
		if (resultBody) resultBody.textContent = JSON.stringify(out.data, null, 2);
		if (result) result.classList.remove('hidden');
	}

	function dnAiHandleApplyClean() {
		if (!Array.isArray(dnAiCleanSuggestion) || !dnAiCleanSuggestion.length) return;
		if (typeof window.dnApplyAiCleanup !== 'function') {
			showScrapingNotification('Cleanup hook missing in popup.js', 'error');
			return;
		}
		const touched = window.dnApplyAiCleanup(dnAiCleanSuggestion);
		showScrapingNotification('Applied cleanup (' + touched + ' cells transformed).', 'success');
		const result = document.getElementById('dnAiCleanResult');
		if (result) result.classList.add('hidden');
		dnAiCleanSuggestion = null;
	}

	function dnAiHandleDismissClean() {
		dnAiCleanSuggestion = null;
		const result = document.getElementById('dnAiCleanResult');
		if (result) result.classList.add('hidden');
	}

	function dnInitAi() {
		if (!window.dnLlm) {
			console.warn('[ai] dn-llm.js not loaded — AI features disabled');
			return;
		}
		// Settings tab wiring
		const testBtn = document.getElementById('dnAiTest');
		if (testBtn) testBtn.addEventListener('click', dnAiHandleTestKey);
		dnAiAutoSaveBindings();
		dnAiUpdateProviderHints();
		window.dnLlm.getSettings().then(dnAiApplySettingsToUI);

		// Step 1 — Generate / Apply / Dismiss
		const genBtn = document.getElementById('dnAiSetupGenerate');
		const applyBtn = document.getElementById('dnAiSetupApply');
		const dismissBtn = document.getElementById('dnAiSetupDismiss');
		if (genBtn) genBtn.addEventListener('click', dnAiHandleGenerateSelectors);
		if (applyBtn) applyBtn.addEventListener('click', dnAiHandleApplySetup);
		if (dismissBtn) dismissBtn.addEventListener('click', dnAiHandleDismissSetup);

		// Step 3 — Clean / Apply / Dismiss
		const cleanBtn = document.getElementById('dnAiClean');
		const cleanApplyBtn = document.getElementById('dnAiCleanApply');
		const cleanDismissBtn = document.getElementById('dnAiCleanDismiss');
		if (cleanBtn) cleanBtn.addEventListener('click', dnAiHandleClean);
		if (cleanApplyBtn) cleanApplyBtn.addEventListener('click', dnAiHandleApplyClean);
		if (cleanDismissBtn) cleanDismissBtn.addEventListener('click', dnAiHandleDismissClean);
	}

	function toggleAuthMethodSection() {
		if (autoUploadDrive.checked) {
			authMethodSection.classList.remove('hidden');
		} else {
			authMethodSection.classList.add('hidden');
		}
	}

	function toggleWebhookSettingsContent() {
		if (enableWebhooks.checked) {
			webhookSettingsContent.classList.remove('hidden');
		} else {
			webhookSettingsContent.classList.add('hidden');
		}
	}

	function toggleCSSSelector() {
		if (paginationCSS.checked) {
			cssSelector.classList.remove('hidden');
		} else {
			cssSelector.classList.add('hidden');
		}
	}

	function updateSelectorSuggestions() {
		const datalist = document.getElementById('selectorSuggestions');
		if (!datalist) return;
		datalist.innerHTML = '';
		readSelectorRows().forEach(value => {
			const option = document.createElement('option');
			option.value = value;
			datalist.appendChild(option);
		});
	}

	// Click handlers are now UI-only — show/hide buttons, update status badge.
	// Crawl-history bookkeeping is driven by the dnBus lifecycle events
	// emitted from popup.js so a single source of truth handles it (no more
	// duplicate entries when both click handlers and popup.js fired together).
	function handleStartScraping() {
		startScrapingBtn.classList.add('hidden');
		stopScrapingBtn.classList.remove('hidden');
		updateStatusBadge('scraping');
		setTimeout(updateStatusBadgeWithNextPage, 500);
	}

	function handleStopScraping() {
		stopScrapingBtn.classList.add('hidden');
		startScrapingBtn.classList.remove('hidden');
		updateStatusBadge('ready');
		setTimeout(updateStatusBadgeWithNextPage, 500);
	}

	// Owns the crawl-history side effects driven by dnBus lifecycle events.
	// scrape:started → create entry; scrape:completed → update item count +
	// status. Subscribed once at DOMContentLoaded; safe with the existing
	// updateCrawlHistoryItem call in dnInitWebhookObservers because both
	// resolve to the same record by id.
	function dnInitCrawlHistoryBus() {
		if (!window.dnBus) return;
		window.dnBus.on('scrape:started', function (payload) {
			let url = (payload && payload.startingUrl) || (window.s && window.s.startingUrl) || 'Unknown URL';
			let title = 'Unknown Page';
			if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					if (tabs && tabs[0]) {
						if (!payload || !payload.startingUrl) url = tabs[0].url;
						title = tabs[0].title || title;
					}
					currentCrawlId = addCrawlHistoryItem(url, title);
				});
			} else {
				currentCrawlId = addCrawlHistoryItem(url, title);
			}
		});

		window.dnBus.on('scrape:completed', function (payload) {
			if (!currentCrawlId) return;
			const total = (payload && payload.totalRows) || 0;
			// Mark as 'error' only when truly nothing was captured. A run
			// that scraped 300 rows then died on page N+1 still produced
			// useful data — labelling that "error" hides the success.
			const isFailedRun = total === 0 && payload && payload.reason === 'error';
			updateCrawlHistoryItem(currentCrawlId, total, isFailedRun ? 'error' : 'completed');
			currentCrawlId = null;
		});
	}

	// Function to update status badge with next page information
	function updateStatusBadgeWithNextPage() {
		console.log('🔍 Updating status badge with next page information...');
		
		// Get current next selector value
		const nextSelectorValue = nextSelectorInput ? nextSelectorInput.value.trim() : '';
		
		if (!nextSelectorValue) {
			// No selector configured
			console.log('ℹ️ No next selector configured');
			updateStatusBadge('no-pages');
			return;
		}
		
		// Check if infinite scroll is enabled
		const paginationInfinite = document.getElementById('paginationInfinite');
		if (paginationInfinite && paginationInfinite.checked) {
			console.log('✅ Infinite scroll enabled - assuming next page exists');
			updateStatusBadge('ready');
			return;
		}
		
		// Check if we're in extension context and can communicate with content script
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error querying tabs:', chrome.runtime.lastError);
					console.error('❌ Error details:', chrome.runtime.lastError.message);
					// Fallback to basic check
					updateStatusBadge('ready');
					return;
				}
				
				if (tabs && tabs[0]) {
					console.log('🔍 Checking next page with selector:', nextSelectorValue, 'on tab:', tabs[0].id);
					
					// Check if next page exists
					chrome.tabs.sendMessage(tabs[0].id, {
						action: "checkNextPageExists",
						selector: nextSelectorValue
					}, function (response) {
						if (chrome.runtime.lastError) {
							console.warn('Next-page check skipped — content script not reachable on tab', tabs[0].id, '-', chrome.runtime.lastError.message);
							updateStatusBadge('ready');
							return;
						}

						console.log('📡 Response from content script:', response);

						if (response && response.exists) {
							console.log('✅ Next page exists');
							updateStatusBadge('ready');
						} else {
							console.log('❌ No next page found');
							updateStatusBadge('no-pages');
						}
					});
				} else {
					console.error('❌ No active tab found');
					// Fallback to basic check
					updateStatusBadge('ready');
				}
			});
		} else {
			console.error('❌ Chrome tabs API not available');
			// Fallback to basic check
			updateStatusBadge('ready');
		}
	}

	// Enhanced function to update status badge
	function updateStatusBadge(status) {
		console.log('🔍 Updating status badge to:', status);

		const statusBadge = document.getElementById('dnHeaderStatus')
			|| document.querySelector('.bg-green-100, .bg-blue-100, .bg-yellow-100, .bg-red-100');
		if (statusBadge) {
			// Reset brand state classes
			statusBadge.classList.remove('is-running', 'is-error', 'is-warn');
			// Also strip legacy Tailwind classes if the element happens to be the old badge
			statusBadge.classList.remove('bg-green-100', 'text-green-800', 'bg-blue-100', 'text-blue-800', 'bg-yellow-100', 'text-yellow-800', 'bg-red-100', 'text-red-800');

			switch (status) {
				case 'scraping':
					statusBadge.classList.add('is-running');
					statusBadge.textContent = 'Scraping…';
					break;
				case 'ready':
					statusBadge.textContent = 'Ready';
					break;
				case 'no-pages':
					statusBadge.classList.add('is-warn');
					statusBadge.textContent = 'No more pages';
					break;
				case 'error':
					statusBadge.classList.add('is-error');
					statusBadge.textContent = 'Error';
					break;
				default:
					statusBadge.textContent = 'Ready';
			}
		}

		// Show the "Reload page" button only when the page is stuck on
		// no-pages or in an error state — reloading clears both cases.
		const reloadBtn = document.getElementById('dnReloadPage');
		if (reloadBtn) {
			const showReload = (status === 'no-pages' || status === 'error');
			reloadBtn.classList.toggle('hidden', !showReload);
		}

		// Update status text based on status
		updateStatusText(status);
	}

	// Enhanced function to update status text
	function updateStatusText(status) {
		let statusText = '';
		
		switch (status) {
			case 'scraping':
				statusText = 'Please wait for more pages or press "Stop crawling".';
				break;
			case 'ready':
				statusText = 'Download data or locate "Next" to crawl multiple pages';
				break;
			case 'no-pages':
				statusText = 'No more pages available. Download your data.';
				break;
			case 'error':
				statusText = 'Error occurred. Please check your configuration.';
				break;
			case 'last-page':
				statusText = 'Reached the last page. Scraping will stop automatically.';
				break;
			default:
				statusText = 'Ready to start scraping.';
		}
		
		// Update instructions text if available
		const instructionsElement = document.getElementById('instructions');
		if (instructionsElement) {
			instructionsElement.textContent = statusText;
		}
		
		// Also show notification for important status changes
		if (status === 'no-pages' || status === 'last-page') {
			showScrapingNotification(statusText, status === 'no-pages' ? 'warning' : 'info');
		}
	}

	// Track picker mode locally so the button can toggle to cancel.
	let isPickerActive = false;

	function setPickerButtonState(state) {
		if (!applyNextSelector) return;
		applyNextSelector.classList.remove('picker-state-picking', 'picker-state-success');
		if (state === 'picking') {
			applyNextSelector.classList.add('picker-state-picking');
			applyNextSelector.innerHTML = '<i class="fas fa-crosshairs mr-2"></i>Picking… (click to cancel)';
		} else if (state === 'success') {
			applyNextSelector.classList.add('picker-state-success');
			applyNextSelector.innerHTML = '<i class="fas fa-check mr-2"></i>Captured';
		} else {
			applyNextSelector.textContent = 'Use selector';
		}
	}

	// Resolve the target web-page tab. Dainn runs in a separate popup window
	// (see background.js), so the target tab id is passed via ?tabid=N in the URL.
	// chrome.tabs.query({active,currentWindow}) from this window would return the
	// popup itself, which has no content script — that's the bug that causes
	// "Could not reach the page".
	function resolveTargetTabId(cb) {
		const result = getCurrentTabId();
		if (result && typeof result.then === 'function') {
			result.then(id => cb(id || null));
		} else {
			cb(result || null);
		}
	}

	function sendToActiveTab(message, cb) {
		if (typeof chrome === 'undefined' || !chrome.tabs) {
			if (cb) cb(null, new Error('Chrome tabs API not available'));
			return;
		}
		resolveTargetTabId(function (tabId) {
			if (!tabId) {
				if (cb) cb(null, new Error('No target tab found. Re-open Dainn from the tab you want to scrape.'));
				return;
			}
			chrome.tabs.sendMessage(tabId, message, function (response) {
				if (chrome.runtime.lastError) {
					if (cb) cb(null, chrome.runtime.lastError);
					return;
				}
				if (cb) cb(response, null);
			});
		});
	}

	function cancelActivePicker() {
		console.log('🛑 Cancelling active picker');
		sendToActiveTab({ action: 'cancelPicker' }, function () {
			// The pending getNextButton callback will resolve with { cancelled: true }
			// and reset the button state. Nothing more needed here.
		});
	}

	function startPicker() {
		console.log('🎯 Starting element picker');
		isPickerActive = true;
		setPickerButtonState('picking');
		showScrapingNotification('Switch to your tab and click an element. Press ESC to cancel.', 'info');

		sendToActiveTab({ action: 'getNextButton' }, function (response, err) {
			isPickerActive = false;

			if (err) {
				console.error('❌ Picker error:', err);
				setPickerButtonState('default');
				showScrapingNotification('Could not start picker. Open this from the tab you want to scrape.', 'error');
				return;
			}

			if (response && response.cancelled) {
				console.log('🛑 Picker cancelled');
				setPickerButtonState('default');
				return;
			}

			if (response && response.selector) {
				console.log('✅ Selector captured:', response.selector);
				if (nextSelectorInput) nextSelectorInput.value = response.selector;
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem('nextSelector', response.selector);
				}
				saveRecentPick(response.selector);
				setPickerButtonState('success');
				showScrapingNotification('Selector captured', 'success');
				setTimeout(() => setPickerButtonState('default'), 2000);
				setTimeout(() => updateStatusBadgeWithNextPage(), 800);
				return;
			}

			// Unknown / empty response
			setPickerButtonState('default');
			showScrapingNotification('No selector received. Try again.', 'warning');
		});
	}

	function validateSelector(selectorValue) {
		console.log('🔍 Validating selector:', selectorValue);
		showScrapingNotification('Validating selector…', 'info');
		sendToActiveTab({ action: 'markNextButton', selector: selectorValue }, function (response, err) {
			if (err) {
				console.error('❌ Validation error:', err);
				showScrapingNotification('Error validating selector', 'error');
				return;
			}
			if (response && response.error) {
				console.error('❌ Selector validation failed:', response.error);
				showScrapingNotification('Selector validation failed: ' + response.error, 'error');
				return;
			}
			console.log('✅ Selector validated');
			showScrapingNotification('Selector validated', 'success');
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('nextSelector', selectorValue);
			}
			saveRecentPick(selectorValue);
		});
	}

	// Function to handle "Use selector" functionality
	function handleUseSelectorClick() {
		console.log('🔍 Use selector clicked. pickerActive=', isPickerActive);

		// If picker is already running, the button acts as a cancel control.
		if (isPickerActive) {
			cancelActivePicker();
			return;
		}

		const selectorValue = nextSelectorInput ? nextSelectorInput.value.trim() : '';
		if (!selectorValue) {
			startPicker();
		} else {
			validateSelector(selectorValue);
		}
	}

	// --- Recent picks ---
	const RECENT_PICKS_KEY = 'dainn:recentPicks';
	const RECENT_PICKS_MAX = 6;

	function getRecentPicks() {
		if (typeof localStorage === 'undefined') return [];
		try {
			const raw = localStorage.getItem(RECENT_PICKS_KEY);
			const list = raw ? JSON.parse(raw) : [];
			return Array.isArray(list) ? list : [];
		} catch (e) {
			return [];
		}
	}

	function saveRecentPick(selector) {
		if (!selector || typeof localStorage === 'undefined') return;
		const list = getRecentPicks().filter(s => s !== selector);
		list.unshift(selector);
		const trimmed = list.slice(0, RECENT_PICKS_MAX);
		try {
			localStorage.setItem(RECENT_PICKS_KEY, JSON.stringify(trimmed));
		} catch (e) {}
		renderRecentPicks();
	}

	function removeRecentPick(selector) {
		if (typeof localStorage === 'undefined') return;
		const list = getRecentPicks().filter(s => s !== selector);
		try {
			localStorage.setItem(RECENT_PICKS_KEY, JSON.stringify(list));
		} catch (e) {}
		renderRecentPicks();
	}

	function renderRecentPicks() {
		const container = document.getElementById('recentPicks');
		if (!container) return;
		const list = getRecentPicks();
		if (!list.length) {
			container.classList.add('hidden');
			container.innerHTML = '';
			return;
		}
		container.classList.remove('hidden');
		const items = list.map(sel => {
			const safe = sel.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
			return `
				<div class="recent-pick-row">
					<button type="button" class="recent-pick" title="${safe}" data-selector="${safe}">${safe}</button>
					<button type="button" class="recent-pick-remove" title="Remove" data-selector="${safe}">
						<i class="fas fa-times"></i>
					</button>
				</div>
			`;
		}).join('');
		container.innerHTML = `
			<div class="recent-picks-wrap">
				<div class="recent-picks-label">Recent picks</div>
				${items}
			</div>
		`;
		container.querySelectorAll('.recent-pick').forEach(btn => {
			btn.addEventListener('click', function () {
				const sel = this.getAttribute('data-selector');
				if (nextSelectorInput && sel) {
					nextSelectorInput.value = sel;
					nextSelectorInput.dispatchEvent(new Event('input'));
					nextSelectorInput.focus();
				}
			});
		});
		container.querySelectorAll('.recent-pick-remove').forEach(btn => {
			btn.addEventListener('click', function (e) {
				e.stopPropagation();
				removeRecentPick(this.getAttribute('data-selector'));
			});
		});
	}

	// =====================================================
	// Wizard navigation (Setup → Preview → Run)
	// =====================================================
	const DN_STEPS = ['1', '2', '3'];
	const dnReachable = new Set(['1']); // Step 1 always reachable
	let dnCurrentStep = '1';

	function dnGetSteps() {
		return {
			pills: document.querySelectorAll('#dnStepper .dn-step-pill'),
			sections: document.querySelectorAll('.dn-step[data-step]')
		};
	}

	function dnGoToStep(step) {
		step = String(step);
		if (!DN_STEPS.includes(step)) return;
		if (!dnReachable.has(step)) return; // gated
		dnCurrentStep = step;
		const { pills, sections } = dnGetSteps();
		pills.forEach(p => {
			const s = p.getAttribute('data-step');
			p.classList.remove('is-active');
			p.classList.toggle('is-reachable', dnReachable.has(s));
			p.classList.toggle('is-done', dnReachable.has(s) && Number(s) < Number(step));
			if (s === step) p.classList.add('is-active');
		});
		sections.forEach(sec => {
			sec.classList.toggle('is-active', sec.getAttribute('data-step') === step);
		});
		try {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (e) {
			window.scrollTo(0, 0);
		}
	}

	function dnUnlockStep(step) {
		dnReachable.add(String(step));
		const pill = document.querySelector(`#dnStepper .dn-step-pill[data-step="${step}"]`);
		if (pill) pill.classList.add('is-reachable');
	}

	function dnCanLeaveSetup() {
		// If user picked CSS but selector is empty, warn them.
		const cssRadio = document.getElementById('paginationCSS');
		const selInput = document.getElementById('nextSelectorInput');
		if (cssRadio && cssRadio.checked && selInput && !selInput.value.trim()) {
			showScrapingNotification('Pick a "Next page" selector or switch to None / Infinite scroll.', 'warning');
			return false;
		}
		return true;
	}

	function dnInitWizard() {
		// Next buttons
		document.querySelectorAll('[data-dn-next]').forEach(btn => {
			btn.addEventListener('click', function () {
				const target = this.getAttribute('data-dn-next');
				if (dnCurrentStep === '1' && !dnCanLeaveSetup()) return;
				dnUnlockStep(target);
				dnGoToStep(target);
			});
		});
		// Back buttons
		document.querySelectorAll('[data-dn-back]').forEach(btn => {
			btn.addEventListener('click', function () {
				const target = this.getAttribute('data-dn-back');
				dnUnlockStep(target);
				dnGoToStep(target);
			});
		});
		// Click on stepper pills (only reachable)
		document.querySelectorAll('#dnStepper .dn-step-pill').forEach(pill => {
			pill.addEventListener('click', function () {
				const s = this.getAttribute('data-step');
				if (dnReachable.has(s)) dnGoToStep(s);
			});
		});
	}

	// Highlight the radio card whose <input> is checked.
	function dnSyncRadioCards() {
		document.querySelectorAll('.dn-radio-card').forEach(card => {
			const radio = card.querySelector('input[type="radio"]');
			if (radio) card.classList.toggle('is-checked', radio.checked);
		});
	}
	function dnInitRadioCards() {
		document.querySelectorAll('.dn-radio-card input[type="radio"]').forEach(r => {
			r.addEventListener('change', dnSyncRadioCards);
		});
		dnSyncRadioCards();
	}

	// Expose for debugging
	window.dnGoToStep = dnGoToStep;

	// =====================================================
	// Settings modal — tab switching
	// =====================================================
	function dnSwitchSettingsTab(tabName) {
		document.querySelectorAll('#dnSettingsTabs .dn-modal-tab').forEach(btn => {
			const isMatch = btn.getAttribute('data-dn-tab') === tabName;
			btn.classList.toggle('is-active', isMatch);
			btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
		});
		document.querySelectorAll('.dn-modal-pane[data-dn-pane]').forEach(pane => {
			pane.classList.toggle('is-active', pane.getAttribute('data-dn-pane') === tabName);
		});
	}

	function dnInitSettingsTabs() {
		document.querySelectorAll('#dnSettingsTabs .dn-modal-tab').forEach(btn => {
			btn.addEventListener('click', function () {
				dnSwitchSettingsTab(this.getAttribute('data-dn-tab'));
			});
		});
	}

	// =====================================================
	// Reload target page (shown when status = no-pages / error)
	// =====================================================
	function dnInitReloadPageButton() {
		const btn = document.getElementById('dnReloadPage');
		if (!btn) return;
		btn.addEventListener('click', function () {
			if (btn.disabled) return;
			resolveTargetTabId(function (tabId) {
				if (!tabId) {
					showScrapingNotification('No target tab found. Re-open Dainn from the page you want to scrape.', 'error');
					return;
				}
				btn.disabled = true;
				btn.classList.add('is-spinning');
				const labelEl = btn.querySelector('span');
				const prevLabel = labelEl ? labelEl.textContent : '';
				if (labelEl) labelEl.textContent = 'Reloading…';

				chrome.tabs.reload(tabId, { bypassCache: false }, function () {
					if (chrome.runtime.lastError) {
						console.error('Reload failed:', chrome.runtime.lastError);
						showScrapingNotification('Reload failed: ' + chrome.runtime.lastError.message, 'error');
					} else {
						showScrapingNotification('Page reloaded. Checking for next page…', 'info');
					}
					// Give the page a moment to load + content script to re-inject,
					// then re-evaluate the next-page selector to refresh status.
					setTimeout(() => {
						btn.disabled = false;
						btn.classList.remove('is-spinning');
						if (labelEl) labelEl.textContent = prevLabel || 'Reload page';
						if (typeof updateStatusBadgeWithNextPage === 'function') {
							updateStatusBadgeWithNextPage();
						}
					}, 1800);
				});
			});
		});
	}

	// =====================================================
	// Test webhook — POST a sample payload to the configured URL
	// =====================================================
	function dnSetTestWebhookFeedback(state, message) {
		const fb = document.getElementById('dnTestWebhookFeedback');
		if (!fb) return;
		fb.classList.remove('hidden', 'is-loading', 'is-success', 'is-error');
		if (!state) { fb.classList.add('hidden'); fb.innerHTML = ''; return; }
		const cls = 'is-' + state;
		const icon = state === 'loading' ? 'fa-spinner fa-spin'
			: state === 'success' ? 'fa-circle-check'
			: 'fa-circle-exclamation';
		fb.classList.add(cls);
		fb.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
	}

	function dnGetSelectedWebhookAuth() {
		const checked = document.querySelector('input[name="webhookAuth"]:checked');
		return checked ? checked.value : 'none';
	}

	// =====================================================
	// Webhook auth fields — show only the relevant credential block
	// based on the currently selected auth radio.
	// =====================================================
	function dnSyncWebhookAuthFields() {
		const method = dnGetSelectedWebhookAuth();
		const map = {
			basic:  'dnAuthBasicFields',
			bearer: 'dnAuthBearerFields',
			api:    'dnAuthApiFields'
		};
		Object.keys(map).forEach(key => {
			const el = document.getElementById(map[key]);
			if (el) el.classList.toggle('hidden', method !== key);
		});
	}
	function dnInitWebhookAuthFields() {
		document.querySelectorAll('input[name="webhookAuth"]').forEach(r => {
			r.addEventListener('change', dnSyncWebhookAuthFields);
		});
		dnSyncWebhookAuthFields();
	}

	// =====================================================
	// Webhook dispatcher — fires a real HTTP POST to the configured URL
	// when the named event is triggered (and enabled in settings).
	// =====================================================
	const DN_WEBHOOK_EVENT_TO_TRIGGER = {
		scraping_started:   'scrapingStarted',
		scraping_completed: 'scrapingCompleted',
		page_completed:     'pageCompleted',
		error_occurred:     'errorOccurred'
	};

	function dnReadWebhookSettings(cb) {
		if (!chrome?.storage?.sync) { cb(null); return; }
		chrome.storage.sync.get(['scrapperSettings'], function (result) {
			if (chrome.runtime.lastError) { cb(null); return; }
			cb((result && result.scrapperSettings && result.scrapperSettings.webhooks) || null);
		});
	}

	function dnBuildAuthHeaders(authMethod, credentials) {
		const headers = {};
		const creds = credentials || {};
		if (authMethod === 'basic' && creds.basic && creds.basic.username) {
			headers['Authorization'] = 'Basic ' + btoa(`${creds.basic.username}:${creds.basic.password || ''}`);
		} else if (authMethod === 'bearer' && creds.bearer && creds.bearer.token) {
			headers['Authorization'] = 'Bearer ' + creds.bearer.token;
		} else if (authMethod === 'api' && creds.api && creds.api.header && creds.api.value) {
			headers[creds.api.header] = creds.api.value;
		}
		return headers;
	}

	function dnCollectScrapeStats() {
		const itemsEl = document.querySelector('.dn-stat .text-blue-600');
		const pagesEl = document.querySelector('.dn-stat .text-green-600');
		const timeEl  = document.querySelector('.dn-stat .text-purple-600');
		return {
			itemsScraped: parseInt((itemsEl && itemsEl.textContent) || '0', 10) || 0,
			pagesCrawled: parseInt((pagesEl && pagesEl.textContent) || '0', 10) || 0,
			workingTime: (timeEl && timeEl.textContent) || '00:00:00',
			targetUrl: (window.s && window.s.startingUrl) || null,
			hostname:  (window.s && window.s.hostName)    || null
		};
	}

	function dnFireWebhook(eventKey, extra) {
		dnReadWebhookSettings(function (cfg) {
			if (!cfg || !cfg.enabled || !cfg.url) return;
			const triggerKey = DN_WEBHOOK_EVENT_TO_TRIGGER[eventKey];
			if (!triggerKey || !cfg.triggers || !cfg.triggers[triggerKey]) return;

			let parsed;
			try { parsed = new URL(cfg.url); } catch (e) { console.warn('Webhook URL invalid:', cfg.url); return; }
			if (!/^https?:$/.test(parsed.protocol)) return;

			const payload = {
				event: eventKey,
				source: 'Dainn Scraper',
				version: chrome.runtime.getManifest().version,
				timestamp: new Date().toISOString(),
				stats: dnCollectScrapeStats(),
				data: extra || {}
			};

			const headers = Object.assign(
				{ 'Content-Type': 'application/json' },
				dnBuildAuthHeaders(cfg.authentication || 'none', cfg.credentials)
			);

			console.log(`📡 Firing webhook [${eventKey}] →`, cfg.url);
			// Route through the service worker so we bypass page-context CORS.
			// Most webhook receivers (Discord, Slack, Zapier, Make, n8n, custom
			// backends) don't ship CORS headers; fetching from the popup would
			// have been blocked at preflight.
			chrome.runtime.sendMessage({
				action: 'dn:webhook',
				url: cfg.url,
				method: 'POST',
				headers: headers,
				body: JSON.stringify(payload)
			}, function (resp) {
				if (chrome.runtime.lastError) {
					console.warn(`❌ Webhook [${eventKey}] relay failed:`, chrome.runtime.lastError.message);
					return;
				}
				if (resp && resp.ok) {
					console.log(`✅ Webhook [${eventKey}] delivered (HTTP ${resp.status}) in ${resp.durationMs} ms`);
				} else if (resp && resp.status) {
					console.warn(`⚠️ Webhook [${eventKey}] returned HTTP ${resp.status}`);
				} else {
					console.warn(`❌ Webhook [${eventKey}] failed:`, resp && resp.error);
				}
			});
		});
	}
	window.dnFireWebhook = dnFireWebhook;

	// =====================================================
	// Subscribes to dnBus lifecycle events emitted by popup.js and translates
	// them into webhook deliveries. Previously this used MutationObservers on
	// the Stop button's .hidden class and the page counter's text — that broke
	// every time UI markup changed. dnBus is the single contract now.
	// =====================================================
	function dnInitWebhookObservers() {
		if (!window.dnBus) {
			console.warn('[webhook] dnBus not available — webhook events disabled');
			return;
		}

		let errorReportedForRun = false;

		window.dnBus.on('scrape:started', function () {
			errorReportedForRun = false;
			dnFireWebhook('scraping_started');
		});

		window.dnBus.on('scrape:page', function (payload) {
			dnFireWebhook('page_completed', {
				pageNumber: (payload && payload.pageNumber) || 0,
				rowsThisPage: (payload && payload.rowsThisPage) || 0,
				totalRows: (payload && payload.totalRows) || 0
			});
		});

		window.dnBus.on('scrape:error', function (payload) {
			if (errorReportedForRun) return;
			errorReportedForRun = true;
			dnFireWebhook('error_occurred', {
				message: (payload && payload.message) || ''
			});
		});

		window.dnBus.on('scrape:completed', function (payload) {
			dnFireWebhook('scraping_completed', payload || {});
			// History close-out lives in dnInitCrawlHistoryBus — it also
			// subscribes to scrape:completed and owns currentCrawlId.
		});
	}

	function dnInitTestWebhook() {
		const btn = document.getElementById('dnTestWebhook');
		if (!btn) return;
		btn.addEventListener('click', async function () {
			const urlInput = document.getElementById('dnWebhookUrl');
			const url = urlInput ? urlInput.value.trim() : '';

			if (!url) {
				dnSetTestWebhookFeedback('error', 'Enter a webhook URL first');
				if (urlInput) urlInput.focus();
				return;
			}
			let parsedUrl;
			try {
				parsedUrl = new URL(url);
				if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error('Only http(s) URLs are allowed');
			} catch (e) {
				dnSetTestWebhookFeedback('error', 'Invalid URL: ' + (e.message || 'parse failed'));
				return;
			}

			const authMethod = dnGetSelectedWebhookAuth();
			const credentials = getWebhookCredentials();
			const payload = {
				event: 'test',
				source: 'Dainn Scraper',
				version: chrome.runtime.getManifest().version,
				timestamp: new Date().toISOString(),
				authMethod: authMethod,
				message: 'This is a test ping from Dainn Scraper. If you can see this, your webhook is reachable.'
			};

			btn.disabled = true;
			const originalHTML = btn.innerHTML;
			btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
			dnSetTestWebhookFeedback('loading', 'Sending test ping…');

			const startedAt = performance.now();
			try {
				// Same rationale as dnFireWebhook — relay through the SW so we
				// don't get blocked by CORS preflight on user-supplied URLs.
				const response = await new Promise(function (resolve, reject) {
					chrome.runtime.sendMessage({
						action: 'dn:webhook',
						url: url,
						method: 'POST',
						headers: Object.assign(
							{ 'Content-Type': 'application/json' },
							dnBuildAuthHeaders(authMethod, credentials)
						),
						body: JSON.stringify(payload)
					}, function (r) {
						if (chrome.runtime.lastError) {
							reject(new Error(chrome.runtime.lastError.message));
							return;
						}
						if (!r) {
							reject(new Error('No response from service worker'));
							return;
						}
						if (r.ok) resolve(r);
						else if (r.status) resolve(r); // HTTP error — surface status to user
						else reject(new Error(r.error || 'Relay failed'));
					});
				});
				const elapsed = response.durationMs != null ? response.durationMs : Math.round(performance.now() - startedAt);
				if (response.ok) {
					dnSetTestWebhookFeedback('success', `Delivered (HTTP ${response.status}) in ${elapsed} ms`);
				} else {
					dnSetTestWebhookFeedback('error', `Server returned HTTP ${response.status} after ${elapsed} ms`);
				}
			} catch (err) {
				const elapsed = Math.round(performance.now() - startedAt);
				// CORS / network errors land here. Be specific because users
				// often hit CORS first time.
				const isLikelyCors = String(err && err.message).toLowerCase().includes('failed to fetch');
				dnSetTestWebhookFeedback('error',
					isLikelyCors
						? `Could not reach server (likely CORS or offline) after ${elapsed} ms`
						: `Request failed: ${err && err.message ? err.message : 'unknown error'}`
				);
			} finally {
				btn.disabled = false;
				btn.innerHTML = originalHTML;
			}
		});
	}

	// =====================================================
	// Preview (Step 2): fetch first page only
	// =====================================================
	let dnPreviewLoaded = false;
	let dnPreviewTableId = 0;
	let dnPreviewTableCount = 0;

	function dnEscapeHTML(s) {
		if (s == null) return '';
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function dnFormatCell(v) {
		if (v == null) return '';
		let s = String(v).trim();
		// Truncate very long values for preview
		if (s.length > 120) s = s.slice(0, 117) + '…';
		return dnEscapeHTML(s);
	}

	function dnRenderPreviewError(message) {
		const result = document.getElementById('dnPreviewResult');
		if (!result) return;
		result.classList.remove('hidden');
		document.getElementById('dnPreviewMeta').innerHTML =
			`<span style="color: var(--dn-danger); font-weight:500;"><i class="fas fa-circle-exclamation"></i> ${dnEscapeHTML(message)}</span>`;
		const body = result.querySelector('.dn-data-body');
		if (body) {
			body.innerHTML = `
				<div class="dn-empty">
					<i class="fas fa-circle-exclamation" style="color: var(--dn-danger);"></i>
					<div class="dn-empty-title">Could not preview</div>
					<div class="dn-empty-desc">${dnEscapeHTML(message)}</div>
				</div>`;
		}
	}

	// Convert an auto-detected field name like
	// "/MAT-CELL.MAT-MDC-CELL.MDC-DATA-TABLE__CELL.CDK-CELL.CDK-COLUMN-MERCHANTID.MAT-COLUMN-MERCHANTID"
	// into a friendlier short label like "merchantid" — using the last segment
	// after the final dot/slash, stripped of common prefixes.
	function dnShortHeader(name) {
		if (!name) return '';
		let s = String(name).trim();
		// Take the last segment after / or .
		const parts = s.split(/[/.]/).filter(Boolean);
		if (parts.length > 1) s = parts[parts.length - 1];
		// Strip common Angular/Material prefixes
		s = s.replace(/^(MAT|MDC|CDK|NG|XAP)-/i, '')
			 .replace(/^(MAT|MDC|CDK)-COLUMN-/i, '')
			 .replace(/^MAT-MDC-CELL/i, 'cell')
			 .replace(/^CDK-/i, '')
			 .replace(/^MAT-/i, '');
		return s.toLowerCase();
	}

	function dnRenderPreviewTable(rows, tableSelector) {
		const result = document.getElementById('dnPreviewResult');
		if (!result) return;
		result.classList.remove('hidden');

		const meta = document.getElementById('dnPreviewMeta');
		if (!rows || !rows.length) {
			meta.innerHTML = '<i class="fas fa-circle-info"></i> No rows detected on this page.';
			result.querySelector('.dn-data-body').innerHTML = `
				<div class="dn-empty">
					<i class="fas fa-table"></i>
					<div class="dn-empty-title">No rows detected</div>
					<div class="dn-empty-desc">The page may not contain a list-like structure. Try going back and adjusting your setup.</div>
				</div>`;
			return;
		}

		// Apply the same field-filtering pipeline that the Run step uses, so
		// preview shows the exact columns the user will end up with (drops
		// noise/duplicate columns, respects user renames). Falls back to raw
		// object keys if popup.js hasn't exposed the filter yet.
		let headers, dataRows;
		if (typeof window.dnFilterTableData === 'function') {
			try {
				const filtered = window.dnFilterTableData(rows);
				headers = filtered.fields || [];
				dataRows = filtered.data || [];
			} catch (e) {
				console.warn('Preview filter failed, falling back to raw:', e);
			}
		}
		if (!headers) {
			// Fallback: raw object keys
			const seen = new Set();
			headers = [];
			rows.forEach(r => Object.keys(r).forEach(k => {
				if (!seen.has(k)) { seen.add(k); headers.push(k); }
			}));
			dataRows = rows.map(r => headers.map(h => r[h]));
		}

		const totalRows = dataRows.length;
		const totalCols = headers.length;

		const candidateLabel = dnPreviewTableCount > 1
			? `<span class="dn-preview-candidate">Table <b>${dnPreviewTableId + 1}</b> of <b>${dnPreviewTableCount}</b></span>`
			: '';
		const tryAnotherBtn = dnPreviewTableCount > 1
			? `<button type="button" id="dnTryAnotherTable" class="dn-btn dn-btn-secondary dn-try-another"><i class="fas fa-shuffle"></i> Try another table</button>`
			: '';

		meta.innerHTML = `
			<div class="dn-preview-meta-row">
				<div class="dn-preview-meta-text">
					<i class="fas fa-circle-check" style="color: var(--dn-success);"></i>
					Detected <b>${totalRows}</b> ${totalRows === 1 ? 'row' : 'rows'} &middot;
					<b>${totalCols}</b> ${totalCols === 1 ? 'column' : 'columns'}
					${candidateLabel ? '&middot; ' + candidateLabel : ''}
				</div>
				${tryAnotherBtn}
			</div>
			${tableSelector ? `<div class="dn-preview-selector-row" title="${dnEscapeHTML(tableSelector)}">table selector: <code>${dnEscapeHTML(tableSelector.length > 200 ? tableSelector.slice(0, 197) + '…' : tableSelector)}</code></div>` : ''}
			${dnPreviewTableCount > 1 && totalRows <= 1 ? `<div class="dn-preview-warning"><i class="fas fa-triangle-exclamation"></i> Looks like only a header was detected. Click <b>Try another table</b> until you see the rows you want.</div>` : ''}
		`;

		// Wire the cycle button (re-attached on every render)
		const cycleBtn = document.getElementById('dnTryAnotherTable');
		if (cycleBtn) cycleBtn.addEventListener('click', dnCycleTable);

		// Render the same HTML structure as the main scraped-data table so the
		// brand styling (.dn-data-body .resizable-table ...) applies uniformly.
		let html = `
			<div class="table-scroll-container relative">
				<table class="w-full resizable-table">
					<thead><tr>`;
		headers.forEach(h => {
			const shortLabel = dnShortHeader(h);
			const fullLabel = dnEscapeHTML(h);
			html += `<th class="resizable-column" title="${fullLabel}">
				<div class="flex items-center justify-between pr-2">
					<span class="header-text">${dnEscapeHTML(shortLabel)}</span>
				</div>
			</th>`;
		});
		html += '</tr></thead><tbody class="divide-y divide-gray-200">';
		dataRows.forEach(row => {
			html += '<tr>';
			row.forEach(raw => {
				const isUrl = typeof raw === 'string' && /^https?:\/\//i.test(raw.trim());
				const cellClass = isUrl ? 'text-blue-600' : '';
				html += `<td class="${cellClass}" title="${dnEscapeHTML(raw == null ? '' : String(raw))}">${dnFormatCell(raw)}</td>`;
			});
			html += '</tr>';
		});
		html += '</tbody></table></div>';
		result.querySelector('.dn-data-body').innerHTML = html;
	}

	function dnFetchPreview() {
		const btn = document.getElementById('dnPreviewFetch');
		if (!btn || btn.disabled) return;
		const originalHTML = btn.innerHTML;
		btn.disabled = true;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching…';

		// Show a loading skeleton in the result area
		const result = document.getElementById('dnPreviewResult');
		if (result) {
			result.classList.remove('hidden');
			document.getElementById('dnPreviewMeta').innerHTML =
				'<i class="fas fa-spinner fa-spin"></i> Detecting tables and extracting first page…';
			const body = result.querySelector('.dn-data-body');
			if (body) body.innerHTML = `
				<div class="dn-empty">
					<i class="fas fa-spinner fa-spin"></i>
					<div class="dn-empty-title">Working…</div>
					<div class="dn-empty-desc">Scanning the page for list-like data.</div>
				</div>`;
		}

		function restoreBtn() {
			btn.disabled = false;
			btn.innerHTML = originalHTML;
		}

		if (typeof chrome === 'undefined' || !chrome.tabs) {
			dnRenderPreviewError('Chrome tabs API not available. This must run as a Chrome extension.');
			restoreBtn();
			return;
		}

		resolveTargetTabId(function (tabId) {
			if (!tabId) {
				dnRenderPreviewError('No target tab found. Re-open Dainn from the tab you want to scrape.');
				restoreBtn();
				return;
			}
			// 1. Detect candidate tables
			chrome.tabs.sendMessage(tabId, { action: 'findTables' }, function (findResp) {
				if (chrome.runtime.lastError) {
					dnRenderPreviewError('Could not reach the page. Reload the page you want to scrape and try again. (' + chrome.runtime.lastError.message + ')');
					restoreBtn();
					return;
				}
				if (!findResp || (findResp.error && !findResp.tableSelector)) {
					dnRenderPreviewError(findResp && findResp.error ? findResp.error : 'No tables detected on the page.');
					restoreBtn();
					return;
				}
				dnPreviewTableId = (typeof findResp.tableId === 'number') ? findResp.tableId : 0;
				dnPreviewTableCount = (typeof findResp.tableCount === 'number') ? findResp.tableCount : 1;
				// 2. Extract data from the currently selected table
				chrome.tabs.sendMessage(tabId, { action: 'getTableData' }, function (dataResp) {
					if (chrome.runtime.lastError) {
						dnRenderPreviewError('Could not extract data: ' + chrome.runtime.lastError.message);
						restoreBtn();
						return;
					}
					if (!dataResp || dataResp.error) {
						dnRenderPreviewError((dataResp && dataResp.error) || 'Failed to extract data.');
						restoreBtn();
						return;
					}
					dnPreviewLoaded = true;
					dnRenderPreviewTable(dataResp.data || [], dataResp.tableSelector);
					restoreBtn();
				});
			});
		});
	}

	// Cycle to the next candidate table that the content script already detected.
	function dnCycleTable() {
		const cycleBtn = document.getElementById('dnTryAnotherTable');
		const originalHTML = cycleBtn ? cycleBtn.innerHTML : '';
		if (cycleBtn) {
			cycleBtn.disabled = true;
			cycleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Switching…';
		}
		const meta = document.getElementById('dnPreviewMeta');
		if (meta) {
			meta.querySelectorAll('.dn-preview-warning').forEach(w => w.remove());
		}

		function restoreCycleBtn() {
			if (cycleBtn) {
				cycleBtn.disabled = false;
				cycleBtn.innerHTML = originalHTML;
			}
		}

		resolveTargetTabId(function (tabId) {
			if (!tabId) {
				dnRenderPreviewError('Lost the target tab. Re-open Dainn from the source tab.');
				restoreCycleBtn();
				return;
			}
			chrome.tabs.sendMessage(tabId, { action: 'nextTable' }, function (resp) {
				if (chrome.runtime.lastError || !resp) {
					dnRenderPreviewError('Could not switch table: ' + ((chrome.runtime.lastError && chrome.runtime.lastError.message) || 'no response'));
					restoreCycleBtn();
					return;
				}
				if (typeof resp.tableId === 'number') dnPreviewTableId = resp.tableId;
				if (typeof resp.tableCount === 'number') dnPreviewTableCount = resp.tableCount;
				chrome.tabs.sendMessage(tabId, { action: 'getTableData' }, function (dataResp) {
					if (chrome.runtime.lastError) {
						dnRenderPreviewError('Could not extract data: ' + chrome.runtime.lastError.message);
						restoreCycleBtn();
						return;
					}
					if (!dataResp || dataResp.error) {
						dnRenderPreviewError((dataResp && dataResp.error) || 'Failed to extract data.');
						restoreCycleBtn();
						return;
					}
					dnRenderPreviewTable(dataResp.data || [], dataResp.tableSelector);
					restoreCycleBtn();
				});
			});
		});
	}

	function dnInitPreview() {
		const btn = document.getElementById('dnPreviewFetch');
		if (btn) btn.addEventListener('click', dnFetchPreview);
	}

	// =====================================================
	// Live progress (Step 3): toggle strip + mirror stats + pulse on change
	// =====================================================
	function dnSetProgressVisible(visible) {
		const el = document.getElementById('dnProgress');
		if (!el) return;
		el.classList.toggle('hidden', !visible);
	}

	function dnPulseStat(el) {
		if (!el) return;
		el.classList.remove('is-pulsing');
		// Force reflow so the animation restarts when the class is added again
		void el.offsetWidth;
		el.classList.add('is-pulsing');
	}

	function dnInitProgress() {
		const stopBtn = document.getElementById('stopScraping');
		const startBtn = document.getElementById('startScraping');
		const progress = document.getElementById('dnProgress');
		const headerStatus = document.getElementById('dnHeaderStatus');
		if (!progress) return;

		const itemsStat = document.querySelector('.dn-stat .text-blue-600');
		const pagesStat = document.querySelector('.dn-stat .text-green-600');
		const timeStat  = document.querySelector('.dn-stat .text-purple-600');

		const progItems = document.getElementById('dnProgressItems');
		const progPages = document.getElementById('dnProgressPages');
		const progTime  = document.getElementById('dnProgressElapsed');

		// Show/hide progress based on the stop button's visibility (which the
		// existing scrape code already toggles to indicate run state).
		function syncFromStopBtn() {
			if (!stopBtn) return;
			const running = !stopBtn.classList.contains('hidden');
			dnSetProgressVisible(running);
			if (headerStatus) {
				if (running) {
					headerStatus.classList.add('is-running');
					headerStatus.classList.remove('is-error', 'is-warn');
					if (headerStatus.textContent.trim() === 'Ready') {
						headerStatus.textContent = 'Scraping…';
					}
				}
			}
		}

		if (stopBtn) {
			new MutationObserver(syncFromStopBtn)
				.observe(stopBtn, { attributes: true, attributeFilter: ['class'] });
			// Initial check in case scraping is already running on init
			syncFromStopBtn();
		}

		// Belt-and-suspenders: also react to button clicks immediately
		if (startBtn) startBtn.addEventListener('click', () => {
			// Ensure we're on Step 3 when user starts crawling from anywhere
			if (dnReachable && typeof dnGoToStep === 'function') {
				dnReachable.add('3');
				dnGoToStep('3');
			}
			setTimeout(syncFromStopBtn, 50);
		});
		if (stopBtn) stopBtn.addEventListener('click', () => {
			setTimeout(syncFromStopBtn, 50);
		});

		// Mirror stat values into the progress strip and pulse on change.
		function mirrorAndPulse(srcEl, dstEl) {
			if (!srcEl) return;
			const obs = new MutationObserver(() => {
				const txt = (srcEl.textContent || '').trim();
				if (dstEl) dstEl.textContent = txt;
				dnPulseStat(srcEl);
			});
			obs.observe(srcEl, { characterData: true, childList: true, subtree: true });
		}
		mirrorAndPulse(itemsStat, progItems);
		mirrorAndPulse(pagesStat, progPages);
		mirrorAndPulse(timeStat,  progTime);
	}

	function showScrapingNotification(message, type = 'info') {
		const colors = {
			info: 'bg-blue-100 border-blue-400 text-blue-700',
			success: 'bg-green-100 border-green-400 text-green-700',
			warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
			error: 'bg-red-100 border-red-400 text-red-700'
		};

		const icons = {
			info: 'fas fa-info-circle',
			success: 'fas fa-check-circle',
			warning: 'fas fa-exclamation-triangle',
			error: 'fas fa-exclamation-circle'
		};

		const notification = document.createElement('div');
		notification.className = `fixed top-4 right-4 ${colors[type]} px-4 py-3 rounded shadow-lg z-50 scraping-notification`;
		notification.innerHTML = `
			<div class="flex items-center">
				<i class="${icons[type]} mr-2"></i>
				<span>${message}</span>
				<button class="ml-4 hover:opacity-80" onclick="this.closest('.scraping-notification').remove()">
					<i class="fas fa-times"></i>
				</button>
			</div>
		`;

		document.body.appendChild(notification);

		setTimeout(() => {
			notification.style.opacity = '0';
			notification.style.transition = 'opacity 0.3s ease-out';
			setTimeout(() => {
				if (notification.parentNode) {
					notification.remove();
				}
			}, 300);
		}, 3000);
	}

	// Crawl History Management Functions
	function addCrawlHistoryItem(url, pageTitle = '') {
		console.log('📝 Adding crawl history item:', url);

		const historyContainer = document.getElementById('crawlHistoryContainer');
		if (!historyContainer) {
			console.error('❌ Crawl history container not found');
			return null;
		}

		// Generate unique ID for this crawl session
		const crawlId = 'crawl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

		// Get domain and display URL
		let domain;
		let displayUrl = url;
		try {
			const urlObj = new URL(url);
			domain = urlObj.hostname;
			// Keep the full URL for display, but clean it up and decode it
			displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
			displayUrl = decodeURIComponent(displayUrl);
		} catch (e) {
			domain = url;
			displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
			displayUrl = decodeURIComponent(displayUrl);
		}

		// Create the history item
		const historyItem = document.createElement('div');
		historyItem.className = 'p-3 bg-gray-50 rounded-lg';
		historyItem.setAttribute('data-crawl-id', crawlId);

		const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

		const decodedUrl = decodeURIComponent(url);

		historyItem.innerHTML = `
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<a href="${decodedUrl}" target="_blank" class="font-medium text-blue-600 text-sm break-all hover:text-blue-800 hover:underline" title="${decodedUrl}">${displayUrl}</a>
							<div class="flex justify-between items-center mt-1">
								<span class="text-xs text-gray-500">${currentDate}</span>
								<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded crawl-status">Crawling...</span>
							</div>
						</div>
						<button class="text-gray-400 hover:text-red-500 ml-2 crawl-history-remove">
							<i class="fas fa-times text-sm"></i>
						</button>
					</div>
				`;

		// Add to the top of the history (most recent first)
		historyContainer.insertBefore(historyItem, historyContainer.firstChild);

		// Store crawl session data
		const crawlData = {
			id: crawlId,
			url: url,
			domain: domain,
			displayUrl: displayUrl,
			pageTitle: pageTitle,
			startTime: new Date().toISOString(),
			status: 'crawling',
			itemCount: 0
		};

		// Save to storage
		saveCrawlToHistory(crawlData);

		console.log('✅ Crawl history item added:', crawlData);
		return crawlId;
	}

	function updateCrawlHistoryItem(crawlId, itemCount, status = 'completed') {
		console.log('📊 Updating crawl history item:', crawlId, 'Items:', itemCount, 'Status:', status);

		const historyItem = document.querySelector(`[data-crawl-id="${crawlId}"]`);
		if (!historyItem) {
			console.error('❌ Crawl history item not found:', crawlId);
			return;
		}

		const statusElement = historyItem.querySelector('.crawl-status');
		if (statusElement) {
			statusElement.className = 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded crawl-status';
			statusElement.textContent = `${itemCount} items`;
		}

		// Update stored data
		updateCrawlInHistory(crawlId, {
			itemCount: itemCount,
			status: status,
			endTime: new Date().toISOString()
		});

		console.log('✅ Crawl history item updated successfully');
	}

	// Crawl history persists to chrome.storage.local — NOT sync.
	// chrome.storage.sync has a 100 KB total / 8 KB-per-item quota; with
	// 50 entries containing long URLs we routinely blow it. .local has
	// ~5 MB by default and is the correct storage for transient session
	// records like this. Settings (scrapperSettings) stay in sync where
	// cross-device propagation actually matters.
	const HISTORY_KEY = 'crawlHistory';
	const HISTORY_MAX_ITEMS = 50;

	function withLocalHistory(mutator, done) {
		if (chrome && chrome.storage && chrome.storage.local) {
			chrome.storage.local.get([HISTORY_KEY], function (result) {
				if (chrome.runtime.lastError) {
					console.warn('history read failed:', chrome.runtime.lastError.message);
					if (done) done(null);
					return;
				}
				const current = Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
				const next = mutator(current.slice());
				if (next === current) { if (done) done(current); return; }
				const obj = {}; obj[HISTORY_KEY] = next;
				chrome.storage.local.set(obj, function () {
					if (chrome.runtime.lastError) {
						console.warn('history write failed:', chrome.runtime.lastError.message);
					}
					if (done) done(next);
				});
			});
		} else if (typeof localStorage !== 'undefined') {
			try {
				const current = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
				const next = mutator(current.slice());
				if (next !== current) localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
				if (done) done(next);
			} catch (e) { console.warn('history localStorage failed:', e); if (done) done(null); }
		}
	}

	function saveCrawlToHistory(crawlData) {
		withLocalHistory(function (history) {
			history.unshift(crawlData);
			return history.slice(0, HISTORY_MAX_ITEMS);
		});
	}

	function updateCrawlInHistory(crawlId, updateData) {
		withLocalHistory(function (history) {
			const idx = history.findIndex(item => item && item.id === crawlId);
			if (idx === -1) return history;
			history[idx] = Object.assign({}, history[idx], updateData);
			return history;
		});
	}

	// One-time migration: prior versions stored history in chrome.storage.sync
	// (wrong quota). Move it to local once and clear the sync slot. Idempotent
	// — guarded by a flag in local so it won't run twice and re-overwrite
	// fresh local data with stale sync data.
	function migrateHistoryFromSync(done) {
		if (!(chrome && chrome.storage && chrome.storage.local && chrome.storage.sync)) {
			if (done) done();
			return;
		}
		chrome.storage.local.get(['crawlHistoryMigrated'], function (flag) {
			if (flag && flag.crawlHistoryMigrated) { if (done) done(); return; }
			chrome.storage.sync.get([HISTORY_KEY], function (syncResult) {
				const syncHistory = (syncResult && Array.isArray(syncResult[HISTORY_KEY])) ? syncResult[HISTORY_KEY] : [];
				if (!syncHistory.length) {
					chrome.storage.local.set({ crawlHistoryMigrated: true }, function () { if (done) done(); });
					return;
				}
				chrome.storage.local.get([HISTORY_KEY], function (localResult) {
					const localHistory = (localResult && Array.isArray(localResult[HISTORY_KEY])) ? localResult[HISTORY_KEY] : [];
					// Merge by id, prefer local (fresher) entries on conflict.
					const seen = new Set(localHistory.map(it => it && it.id));
					const merged = localHistory.concat(syncHistory.filter(it => it && !seen.has(it.id))).slice(0, HISTORY_MAX_ITEMS);
					const writePayload = {}; writePayload[HISTORY_KEY] = merged; writePayload.crawlHistoryMigrated = true;
					chrome.storage.local.set(writePayload, function () {
						chrome.storage.sync.remove([HISTORY_KEY], function () { if (done) done(); });
					});
				});
			});
		});
	}

	function loadCrawlHistory() {
		withLocalHistory(function (history) {
			const swept = sweepStaleCrawling(history);
			return swept;
		}, function (history) {
			renderCrawlHistory(history || []);
		});
	}

	// Mark any history item that's still 'crawling' as 'completed' — they came
	// from a prior session that ended without an explicit Stop click, so the
	// stale status would be misleading in the sidebar. The active run owns
	// currentCrawlId and won't appear in storage yet at load time.
	function sweepStaleCrawling(items) {
		if (!Array.isArray(items) || !items.length) return items;
		let changed = false;
		const swept = items.map(it => {
			if (it && it.status === 'crawling' && it.id !== currentCrawlId) {
				changed = true;
				return Object.assign({}, it, { status: 'completed' });
			}
			return it;
		});
		return changed ? swept : items;
	}

	function renderCrawlHistory(historyData) {
		const historyContainer = document.querySelector('#crawlHistoryContainer');
		const emptyState = document.getElementById('dnHistoryEmpty');

		if (!historyContainer) return;

		historyContainer.innerHTML = '';

		const hasItems = Array.isArray(historyData) && historyData.length > 0;
		if (emptyState) emptyState.classList.toggle('hidden', hasItems);
		if (!hasItems) return;

		// Add items from storage
		historyData.slice(0, 10).forEach(crawlData => { // Show only last 10
			const historyItem = document.createElement('div');
			historyItem.className = 'p-3 bg-gray-50 rounded-lg';
			historyItem.setAttribute('data-crawl-id', crawlData.id);

			const date = new Date(crawlData.startTime).toISOString().split('T')[0];
			// Only the currently active crawl can show "Crawling…". Anything
			// else with a stale 'crawling' status is from a previous session
			// that ended without an explicit Stop click — treat as completed
			// and show whatever item count it captured.
			const isActiveCrawl = crawlData.id === currentCrawlId && crawlData.status === 'crawling';
			const statusClass = isActiveCrawl ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
			const statusText = isActiveCrawl ? 'Crawling...' : `${crawlData.itemCount || 0} items`;

			// Use displayUrl if available, otherwise create one from url or fall back to domain
			let displayText;
			if (crawlData.displayUrl) {
				displayText = decodeURIComponent(crawlData.displayUrl);
			} else if (crawlData.url) {
				const decodedUrl = decodeURIComponent(crawlData.url);
				displayText = decodedUrl.length > 60 ? decodedUrl.substring(0, 57) + '...' : decodedUrl;
			} else {
				displayText = crawlData.domain || 'Unknown URL';
			}

			const urlForLink = crawlData.url || crawlData.domain || '#';
			const decodedUrlForLink = decodeURIComponent(urlForLink);
			const decodedTitle = decodeURIComponent(crawlData.url || crawlData.domain || '');

			historyItem.innerHTML = `
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<a href="${decodedUrlForLink}" target="_blank" class="font-medium text-blue-600 text-sm break-all hover:text-blue-800 hover:underline" title="${decodedTitle}">${displayText}</a>
						<div class="flex justify-between items-center mt-1">
							<span class="text-xs text-gray-500">${date}</span>
							<span class="text-xs ${statusClass} px-2 py-1 rounded crawl-status">${statusText}</span>
						</div>
					</div>
					<button class="text-gray-400 hover:text-red-500 ml-2 crawl-history-remove" onclick="removeCrawlHistoryItem('${crawlData.id}')" title="Remove from history" data-crawl-id="${crawlData.id}">
						<i class="fas fa-times text-sm"></i>
					</button>
				</div>
			`;

			console.log('🔧 Generated remove button for crawl ID:', crawlData.id);
			historyContainer.appendChild(historyItem);
		});

		console.log('✅ Rendered', historyData.slice(0, 10).length, 'crawl history items');
	}

	// Global variable to store current crawl ID
	let currentCrawlId = null;

	// Global function to remove crawl history item (called from onclick)
	window.removeCrawlHistoryItem = function (crawlId) {
		console.log('🗑️ Global remove function called for:', crawlId);
		if (crawlId) {
			// Remove from storage first
			removeCrawlFromHistory(crawlId);

			// Find and remove the DOM element
			const historyItem = document.querySelector(`[data-crawl-id="${crawlId}"]`);
			if (historyItem) {
				historyItem.remove();
				console.log('✅ History item removed from DOM via global function');

				// Show success notification
				showScrapingNotification('Crawl history item removed', 'success');
			} else {
				console.log('⚠️ History item not found in DOM, but removed from storage');
			}
		}
	};

	// Test function to verify remove functionality
	window.testRemoveFunction = function () {
		console.log('🧪 Testing remove functionality...');
		const removeButtons = document.querySelectorAll('.crawl-history-remove');
		console.log('🔍 Found remove buttons:', removeButtons.length);

		removeButtons.forEach((button, index) => {
			const crawlId = button.getAttribute('data-crawl-id');
			const onclick = button.getAttribute('onclick');
			console.log(`🔧 Button ${index}: crawlId=${crawlId}, onclick=${onclick}`);
		});

		// Test if removeCrawlFromHistory function is accessible
		console.log('🔍 removeCrawlFromHistory function accessible:', typeof window.removeCrawlFromHistory);
		console.log('🔍 removeCrawlFromHistory function accessible:', typeof removeCrawlFromHistory);
	};

	// Function to update stats display
	function updateStatsDisplay() {
		console.log('📊 Updating stats display...');

		// Get actual item count
		const itemCount = getScrapedItemCount();

		// Update Items Scraped
		const itemsScrapedElement = document.querySelector('.text-3xl.font-bold.text-blue-600');
		if (itemsScrapedElement) {
			itemsScrapedElement.textContent = itemCount;
			console.log('✅ Updated Items Scraped to:', itemCount);
		}

		// Update Pages Crawled (if available)
		const pagesCrawledElement = document.querySelector('.text-3xl.font-bold.text-green-600');
		if (pagesCrawledElement) {
			// Try to get pages count from global variables
			let pagesCount = 1; // Default
			if (typeof window.s !== 'undefined' && window.s.pages) {
				pagesCount = window.s.pages || 1;
			}
			pagesCrawledElement.textContent = pagesCount;
			console.log('✅ Updated Pages Crawled to:', pagesCount);
		}

		// Update Working Time (if available)
		const workingTimeElement = document.querySelector('.text-3xl.font-bold.text-purple-600');
		if (workingTimeElement) {
			// Try to get working time from global variables
			let workingTime = '00:00:00'; // Default
			if (typeof window.s !== 'undefined' && window.s.workingTime) {
				const totalSeconds = Math.floor(window.s.workingTime / 1000);
				workingTime = formatWorkingTime(totalSeconds);
			}
			workingTimeElement.textContent = workingTime;
			console.log('✅ Updated Working Time to:', workingTime);
		}
	}

	// Function to get scraped item count
	function getScrapedItemCount() {
		console.log('📊 Getting scraped item count...');

		// Method 1: Check global variables if they exist (from popup.js) - PRIORITY
		if (typeof window.s !== 'undefined' && window.s.data) {
			const count = Array.isArray(window.s.data) ? window.s.data.length : 0;
			console.log('📊 Item count from global s.data:', count);
			return count;
		}

		// Method 2: Check for pagination info in the table footer
		const paginationInfo = document.querySelector('.pagination-controls .text-sm');
		if (paginationInfo && paginationInfo.textContent) {
			const match = paginationInfo.textContent.match(/of (\d+) records/);
			if (match) {
				const count = parseInt(match[1]);
				console.log('📊 Item count from pagination info:', count);
				return count;
			}
		}

		// Method 3: Check stats section for item count
		const statsElements = document.querySelectorAll('[class*="text-3xl"], [class*="font-bold"]');
		for (let element of statsElements) {
			if (element.textContent && element.textContent.match(/^\d+$/)) {
				const nextElement = element.nextElementSibling;
				if (nextElement && nextElement.textContent && nextElement.textContent.includes('Items Scraped')) {
					const count = parseInt(element.textContent);
					console.log('📊 Item count from stats section:', count);
					return count;
				}
			}
		}

		// Method 4: Check if there's a table with data (but get total, not just visible rows)
		const table = document.querySelector('#hot table, .handsontable table');
		if (table) {
			// Look for pagination info or total count in the table
			const tableContainer = table.closest('.table-container');
			if (tableContainer) {
				const paginationText = tableContainer.querySelector('.pagination-controls .text-sm');
				if (paginationText && paginationText.textContent) {
					const match = paginationText.textContent.match(/of (\d+) records/);
					if (match) {
						const count = parseInt(match[1]);
						console.log('📊 Item count from table pagination:', count);
						return count;
					}
				}
			}

			// Fallback: count all data rows (not just visible ones)
			const allRows = table.querySelectorAll('tbody tr, tr[data-index]');
			if (allRows.length > 0) {
				console.log('📊 Item count from all table rows:', allRows.length);
				return allRows.length;
			}
		}

		// Method 5: Check for any element containing total item count
		const allElements = document.querySelectorAll('*');
		for (let element of allElements) {
			if (element.textContent && element.textContent.includes('of') && element.textContent.includes('records')) {
				const match = element.textContent.match(/of (\d+) records/);
				if (match) {
					const count = parseInt(match[1]);
					console.log('📊 Item count from records text:', count);
					return count;
				}
			}
		}

		// Method 6: Fallback - estimate based on DOM
		const dataElements = document.querySelectorAll('[data-row], .data-row, tr[data-index]');
		if (dataElements.length > 0) {
			console.log('📊 Item count from data elements:', dataElements.length);
			return dataElements.length;
		}

		console.log('📊 Item count fallback: 0');
		return 0;
	}

	// Function to load saved next selector
	function loadSavedNextSelector() {
		if (nextSelectorInput && typeof localStorage !== 'undefined') {
			const savedSelector = localStorage.getItem('nextSelector');
			if (savedSelector) {
				nextSelectorInput.value = savedSelector;
				console.log('✅ Loaded saved next selector:', savedSelector);
			}
		}
	}

	// Helper function to get webhook triggers — reads from explicit IDs.
	function getWebhookTriggers() {
		return {
			scrapingStarted:   !!document.getElementById('dnTrigScrapingStarted')?.checked,
			scrapingCompleted: !!document.getElementById('dnTrigScrapingCompleted')?.checked,
			pageCompleted:     !!document.getElementById('dnTrigPageCompleted')?.checked,
			errorOccurred:     !!document.getElementById('dnTrigErrorOccurred')?.checked
		};
	}

	// Helper to read auth credentials based on currently selected auth method.
	function getWebhookCredentials() {
		return {
			basic: {
				username: document.getElementById('dnAuthBasicUser')?.value || '',
				password: document.getElementById('dnAuthBasicPass')?.value || ''
			},
			bearer: {
				token: document.getElementById('dnAuthBearerToken')?.value || ''
			},
			api: {
				header: document.getElementById('dnAuthApiHeader')?.value || '',
				value:  document.getElementById('dnAuthApiValue')?.value  || ''
			}
		};
	}

	// Function to save all settings to Chrome storage
	function saveAllSettings() {
		console.log('🔍 DEBUG: Starting saveAllSettings function');

		// Debug: Check Chrome API availability
		console.log('🔍 DEBUG: chrome object:', chrome);
		console.log('🔍 DEBUG: chrome.storage:', chrome?.storage);
		console.log('🔍 DEBUG: chrome.storage.sync:', chrome?.storage?.sync);

		const settings = {
			// Next Page Selectors
			nextPageSelectors: [],

			// Automation Settings
			autoDownloadCSV: document.getElementById('autoDownloadCSV')?.checked || false,
			autoUploadDrive: document.getElementById('autoUploadDrive')?.checked || false,

			// Drive auth is owned by chrome.identity — no user-entered
			// credentials to persist here. (Legacy oauth/serviceAccount fields
			// retired alongside the Service-account UI removal.)

			// Webhook Settings
			webhooks: {
				enabled: document.getElementById('enableWebhooks')?.checked || false,
				url: document.getElementById('dnWebhookUrl')?.value || '',
				authentication: document.querySelector('input[name="webhookAuth"]:checked')?.value || 'none',
				triggers: getWebhookTriggers(),
				credentials: getWebhookCredentials()
			},

			// Timestamp
			savedAt: new Date().toISOString()
		};

		// Collect next page selectors
		settings.nextPageSelectors = readSelectorRows();

		if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
			chrome.storage.sync.set({ scrapperSettings: settings }, function () {
				if (chrome.runtime.lastError) {
					console.error('Error saving settings:', chrome.runtime.lastError);
					showScrapingNotification('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
					return;
				}
				console.log('Settings saved:', settings);
				showScrapingNotification('Settings saved', 'success');
			});
		} else {
			// Fallback to localStorage when running outside a Chrome extension context
			try {
				localStorage.setItem('scrapperSettings', JSON.stringify(settings));
				showScrapingNotification('Settings saved to local storage', 'success');
			} catch (error) {
				console.error('Error saving to localStorage:', error);
				showScrapingNotification('Error saving settings: ' + error.message, 'error');
			}
		}
	}

	// Function to load all settings from Chrome storage
	function loadAllSettings() {
		console.log('🔄 Loading settings from storage...');

		if (chrome && chrome.storage) {
			chrome.storage.sync.get(['scrapperSettings'], function (result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error loading settings:', chrome.runtime.lastError);
					showScrapingNotification('Error loading settings: ' + chrome.runtime.lastError.message, 'error');
					return;
				}

				const settings = result.scrapperSettings;
				if (settings) {
					try {
						applySettings(settings);
						console.log('✅ Settings loaded from Chrome storage:', settings);
						showScrapingNotification('Settings loaded successfully!', 'success');
					} catch (error) {
						console.error('❌ Error applying settings:', error);
						showScrapingNotification('Error applying settings: ' + error.message, 'error');
					}
				} else {
					console.log('ℹ️ No saved settings found, using defaults');
					showScrapingNotification('No saved settings found, using defaults', 'info');
				}
			});
		} else {
			// Fallback to localStorage
			console.log('⚠️ Chrome storage not available, using localStorage fallback');

			try {
				const savedSettings = localStorage.getItem('scrapperSettings');
				if (savedSettings) {
					const settings = JSON.parse(savedSettings);
					applySettings(settings);
					console.log('✅ Settings loaded from localStorage:', settings);
					showScrapingNotification('Settings loaded from local storage!', 'success');
				} else {
					console.log('ℹ️ No saved settings found in localStorage');
					showScrapingNotification('No saved settings found, using defaults', 'info');
				}
			} catch (e) {
				console.error('❌ Error parsing saved settings:', e);
				showScrapingNotification('Error loading saved settings: ' + e.message, 'error');
			}
		}
	}

	// Function to apply loaded settings to the UI
	function applySettings(settings) {
		// Automation Settings
		if (settings.autoDownloadCSV !== undefined) {
			const autoDownloadCSV = document.getElementById('autoDownloadCSV');
			if (autoDownloadCSV) autoDownloadCSV.checked = settings.autoDownloadCSV;
		}

		if (settings.autoUploadDrive !== undefined) {
			const autoUploadDrive = document.getElementById('autoUploadDrive');
			if (autoUploadDrive) {
				autoUploadDrive.checked = settings.autoUploadDrive;
				toggleAuthMethodSection(); // Trigger visibility logic
			}
		}

		// settings.authMethod / settings.oauth / settings.serviceAccount were
		// retired when the auth UI moved to chrome.identity. Old payloads in
		// storage are ignored harmlessly — they just get overwritten on next
		// save without those fields.

		// Webhook Settings
		if (settings.webhooks) {
			const enableWebhooks = document.getElementById('enableWebhooks');
			if (enableWebhooks) {
				enableWebhooks.checked = settings.webhooks.enabled;
				toggleWebhookSettingsContent(); // Trigger visibility logic
			}

			const webhookUrlInput = document.getElementById('dnWebhookUrl');
			if (webhookUrlInput) webhookUrlInput.value = settings.webhooks.url || '';

			// Webhook Authentication method
			if (settings.webhooks.authentication) {
				const authRadio = document.querySelector(`input[name="webhookAuth"][value="${settings.webhooks.authentication}"]`);
				if (authRadio) {
					authRadio.checked = true;
					if (typeof dnSyncWebhookAuthFields === 'function') dnSyncWebhookAuthFields();
				}
			}

			// Event triggers — use explicit IDs
			if (settings.webhooks.triggers) {
				const t = settings.webhooks.triggers;
				const map = {
					dnTrigScrapingStarted:   t.scrapingStarted,
					dnTrigScrapingCompleted: t.scrapingCompleted,
					dnTrigPageCompleted:     t.pageCompleted,
					dnTrigErrorOccurred:     t.errorOccurred
				};
				Object.keys(map).forEach(id => {
					const el = document.getElementById(id);
					if (el) el.checked = !!map[id];
				});
			}

			// Auth credentials
			if (settings.webhooks.credentials) {
				const c = settings.webhooks.credentials;
				if (c.basic) {
					if (document.getElementById('dnAuthBasicUser')) document.getElementById('dnAuthBasicUser').value = c.basic.username || '';
					if (document.getElementById('dnAuthBasicPass')) document.getElementById('dnAuthBasicPass').value = c.basic.password || '';
				}
				if (c.bearer) {
					if (document.getElementById('dnAuthBearerToken')) document.getElementById('dnAuthBearerToken').value = c.bearer.token || '';
				}
				if (c.api) {
					if (document.getElementById('dnAuthApiHeader')) document.getElementById('dnAuthApiHeader').value = c.api.header || '';
					if (document.getElementById('dnAuthApiValue')) document.getElementById('dnAuthApiValue').value = c.api.value || '';
				}
			}
		}

		// Next Page Selectors — replace whatever defaults are in the DOM with
		// the user's saved list. Use buildSelectorRow so the saved entries
		// keep the same markup/styling as freshly-added ones.
		if (settings.nextPageSelectors && Array.isArray(settings.nextPageSelectors)) {
			const selectorsList = document.getElementById('selectorsList');
			if (selectorsList) {
				selectorsList.innerHTML = '';
				settings.nextPageSelectors.forEach(value => {
					selectorsList.appendChild(buildSelectorRow(value));
				});
				updateSelectorSuggestions();
			}
		}

		console.log('Settings applied to UI successfully');
	}

	// Function to reset all settings
	function resetAllSettings() {
		if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
			// Clear Chrome storage
			if (chrome && chrome.storage) {
				chrome.storage.sync.remove(['scrapperSettings'], function () {
					if (chrome.runtime.lastError) {
						console.error('Error clearing settings:', chrome.runtime.lastError);
					} else {
						console.log('Settings cleared from Chrome storage');
					}
				});
			} else {
				localStorage.removeItem('scrapperSettings');
				console.log('Settings cleared from localStorage');
			}

			// Reset UI to defaults
			resetUIToDefaults();
			showScrapingNotification('Settings reset to defaults!', 'warning');
		}
	}

	// Function to reset UI to default values
	function resetUIToDefaults() {
		// Reset automation settings — both OFF by default
		const autoDownloadCSV = document.getElementById('autoDownloadCSV');
		const autoUploadDrive = document.getElementById('autoUploadDrive');
		if (autoDownloadCSV) autoDownloadCSV.checked = false;
		if (autoUploadDrive) autoUploadDrive.checked = false;

		// Reset webhook settings — OFF by default
		const enableWebhooks = document.getElementById('enableWebhooks');
		if (enableWebhooks) enableWebhooks.checked = false;

		const webhookUrl = document.getElementById('dnWebhookUrl');
		if (webhookUrl) webhookUrl.value = '';

		// Reset webhook auth to none + clear credentials
		const webhookAuthNone = document.querySelector('input[name="webhookAuth"][value="none"]');
		if (webhookAuthNone) webhookAuthNone.checked = true;
		['dnAuthBasicUser', 'dnAuthBasicPass', 'dnAuthBearerToken', 'dnAuthApiHeader', 'dnAuthApiValue'].forEach(id => {
			const el = document.getElementById(id);
			if (el) el.value = '';
		});

		// Event triggers — only "scraping completed" on by default. Use IDs
		// (the old label-matching broke after the wizard rename to lowercase).
		const triggerDefaults = {
			dnTrigScrapingStarted:   false,
			dnTrigScrapingCompleted: true,
			dnTrigPageCompleted:     false,
			dnTrigErrorOccurred:     false
		};
		Object.keys(triggerDefaults).forEach(id => {
			const el = document.getElementById(id);
			if (el) el.checked = triggerDefaults[id];
		});

		// Sync conditional visibility blocks to the reset state.
		if (typeof toggleAuthMethodSection === 'function') toggleAuthMethodSection();
		if (typeof toggleWebhookSettingsContent === 'function') toggleWebhookSettingsContent();
		if (typeof dnSyncWebhookAuthFields === 'function') dnSyncWebhookAuthFields();
		if (typeof switchAuthMethod === 'function') switchAuthMethod();

		// Reset selectors list to defaults
		const selectorsList = document.getElementById('selectorsList');
		if (selectorsList) {
			selectorsList.innerHTML = '';
			["a[title='Next Page']", "button[rel='next']"].forEach(value => {
				const row = buildSelectorRow(value);
				row.setAttribute('data-default', 'true');
				selectorsList.appendChild(row);
			});
		}

		// Trigger visibility logic
		toggleAuthMethodSection();
		toggleWebhookSettingsContent();
		switchAuthMethod();
		updateSelectorSuggestions();
	}

	// Event listeners with null checks
	if (menuToggle) menuToggle.addEventListener('click', openSidebar);
	if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarMenu);
	if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarMenu);
	if (openSettings) openSettings.addEventListener('click', openSettingsModal);
	if (closeSettings) closeSettings.addEventListener('click', closeSettingsModal);
	if (cancelSettings) cancelSettings.addEventListener('click', closeSettingsModal);
	if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettingsModal);
	if (addSelector) addSelector.addEventListener('click', addNewSelector);
	// (auth-method radios removed — service-account flow retired)
	if (paginationNone) paginationNone.addEventListener('change', function() {
		toggleCSSSelector();
		// Check next page existence after pagination type change
		setTimeout(() => {
			updateStatusBadgeWithNextPage();
		}, 300);
	});
	if (paginationCSS) paginationCSS.addEventListener('change', function() {
		toggleCSSSelector();
		// Check next page existence after pagination type change
		setTimeout(() => {
			updateStatusBadgeWithNextPage();
		}, 300);
	});
	if (paginationInfinite) paginationInfinite.addEventListener('change', function() {
		toggleCSSSelector();
		// Check next page existence after pagination type change
		setTimeout(() => {
			updateStatusBadgeWithNextPage();
		}, 300);
	});
	// (private-key file picker removed alongside service-account flow)
	if (saveSettings) {
		saveSettings.addEventListener('click', function () {
			// Show loading state
			const originalText = saveSettings.textContent;
			saveSettings.textContent = 'Saving...';
			saveSettings.disabled = true;

			// Save settings with a slight delay to show loading state
			setTimeout(() => {
				saveAllSettings();

				// Restore button state
				saveSettings.textContent = originalText;
				saveSettings.disabled = false;

				// Close modal after save
				setTimeout(() => {
					closeSettingsModal();
				}, 1000);
			}, 200);
		});
	}
	if (resetSettings) {
		resetSettings.addEventListener('click', function () {
			resetAllSettings();
		});
	}
	// Single delegated click handler — earlier code had two near-identical
	// listeners trying to dedupe themselves with overlapping conditions,
	// which is exactly the redundancy a delegated handler is meant to avoid.
	document.addEventListener('click', function (e) {
		// Crawl-history remove
		const historyRemoveBtn = e.target.closest('.crawl-history-remove');
		if (historyRemoveBtn) {
			const historyItem = historyRemoveBtn.closest('[data-crawl-id]');
			if (historyItem) {
				const crawlId = historyItem.getAttribute('data-crawl-id');
				if (crawlId) {
					removeCrawlFromHistory(crawlId);
					historyItem.remove();
					// Toggle empty state if this was the last row.
					const container = document.getElementById('crawlHistoryContainer');
					const emptyState = document.getElementById('dnHistoryEmpty');
					if (container && emptyState && !container.querySelector('[data-crawl-id]')) {
						emptyState.classList.remove('hidden');
					}
					showScrapingNotification('Crawl history item removed', 'success');
				}
			}
			return;
		}

		// Selectors-tab remove — scoped to its dedicated class so we don't
		// swallow trash clicks elsewhere in the modal.
		const selectorRemoveBtn = e.target.closest('.dn-selector-remove');
		if (selectorRemoveBtn) {
			const selectorItem = selectorRemoveBtn.closest('.dn-selector-row');
			if (selectorItem && selectorItem.parentElement && selectorItem.parentElement.id === 'selectorsList') {
				selectorItem.remove();
				updateSelectorSuggestions();
			}
		}
	});
	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			if (settingsModal && !settingsModal.classList.contains('hidden')) {
				closeSettingsModal();
			} else if (sidebarMenu && !sidebarMenu.classList.contains('-translate-x-full')) {
				closeSidebarMenu();
			}
		}
	});
	if (autoUploadDrive) autoUploadDrive.addEventListener('change', toggleAuthMethodSection);
	if (enableWebhooks) enableWebhooks.addEventListener('change', toggleWebhookSettingsContent);
	if (startScrapingBtn) startScrapingBtn.addEventListener('click', handleStartScraping);
	if (stopScrapingBtn) stopScrapingBtn.addEventListener('click', handleStopScraping);
	if (applyNextSelector) applyNextSelector.addEventListener('click', handleUseSelectorClick);
	if (paginationCSS) paginationCSS.addEventListener('change', toggleCSSSelector);
	if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', handleRefreshHistory);
	
	// Add event listener for next selector input changes to check next page existence
	if (nextSelectorInput) {
		nextSelectorInput.addEventListener('input', function() {
			// Debounce the check to avoid too many requests
			clearTimeout(window.nextPageCheckTimeout);
			window.nextPageCheckTimeout = setTimeout(() => {
				updateStatusBadgeWithNextPage();
			}, 500);
		});
	}
	
	// Add a retry mechanism for content script communication
	window.retryNextPageCheck = function(maxRetries = 3, delay = 1000) {
		let retryCount = 0;
		
		function attemptCheck() {
			console.log(`🔄 Attempting next page check (attempt ${retryCount + 1}/${maxRetries})`);
			
			updateStatusBadgeWithNextPage();
			
			// Check if we need to retry (if status is still error after a delay)
			setTimeout(() => {
				const statusBadge = document.querySelector('.bg-red-100');
				if (statusBadge && statusBadge.textContent === 'Error' && retryCount < maxRetries - 1) {
					retryCount++;
					attemptCheck();
				}
			}, delay);
		}
		
		attemptCheck();
	};
	// Function to test Chrome storage permissions and functionality
	function testChromeStorage() {
		console.log('🔍 DEBUG: Testing Chrome storage permissions...');

		// Check if running in extension context
		if (typeof chrome === 'undefined') {
			console.error('❌ Chrome API not available - not running in extension context');
			return false;
		}

		// Check if storage API exists
		if (!chrome.storage) {
			console.error('❌ Chrome storage API not available - missing storage permission?');
			return false;
		}

		// Check if sync storage exists
		if (!chrome.storage.sync) {
			console.error('❌ Chrome sync storage not available');
			return false;
		}

		// Test basic storage functionality
		const testKey = 'storageTest_' + Date.now();
		const testValue = 'test_' + Math.random();

		console.log('🔍 DEBUG: Testing storage with key:', testKey, 'value:', testValue);

		chrome.storage.sync.set({ [testKey]: testValue }, function () {
			if (chrome.runtime.lastError) {
				console.error('❌ Storage test write failed:', chrome.runtime.lastError);
				return false;
			}

			console.log('✅ Storage test write successful');

			// Test read
			chrome.storage.sync.get([testKey], function (result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Storage test read failed:', chrome.runtime.lastError);
					return false;
				}

				if (result[testKey] === testValue) {
					console.log('✅ Storage test read successful - Chrome storage is working!');

					// Clean up test data
					chrome.storage.sync.remove([testKey], function () {
						console.log('🧹 Test data cleaned up');
					});
				} else {
					console.error('❌ Storage test read failed - value mismatch');
					console.error('Expected:', testValue, 'Got:', result[testKey]);
				}
			});
		});

		return true;
	}

	// Debug function - can be called from browser console
	window.debugStorage = function () {
		console.log('🔧 Manual storage debug called');
		console.log('🔍 Chrome object:', chrome);
		console.log('🔍 Chrome storage:', chrome?.storage);
		console.log('🔍 Chrome storage sync:', chrome?.storage?.sync);

		if (chrome && chrome.storage && chrome.storage.sync) {
			// Try to save a test value
			const testData = { debugTest: 'Manual test - ' + new Date().toISOString() };
			chrome.storage.sync.set(testData, function () {
				if (chrome.runtime.lastError) {
					console.error('❌ Debug storage save failed:', chrome.runtime.lastError);
				} else {
					console.log('✅ Debug storage save successful:', testData);

					// Try to read it back
					chrome.storage.sync.get(['debugTest'], function (result) {
						if (chrome.runtime.lastError) {
							console.error('❌ Debug storage read failed:', chrome.runtime.lastError);
						} else {
							console.log('✅ Debug storage read successful:', result);
						}
					});
				}
			});
		} else {
			console.error('❌ Chrome storage not available for manual debug');
		}
	};

	// Make saveAllSettings available globally for testing
	window.testSaveSettings = saveAllSettings;

	// Make crawl history functions available globally for popup.js integration
	window.addCrawlHistoryItem = addCrawlHistoryItem;
	window.updateCrawlHistoryItem = updateCrawlHistoryItem;
	window.currentCrawlId = null;

	// Function to periodically update crawl progress
	window.updateCrawlProgress = function (itemCount) {
		if (window.currentCrawlId) {
			const historyItem = document.querySelector(`[data-crawl-id="${window.currentCrawlId}"]`);
			if (historyItem) {
				const statusElement = historyItem.querySelector('.crawl-status');
				if (statusElement) {
					statusElement.textContent = `${itemCount} items`;
				}
			}
		}
	};

	// Function to handle refresh history button click
	function handleRefreshHistory() {
		console.log('🔄 Refreshing crawl history...');

		// Add loading animation to refresh button
		const refreshIcon = refreshHistoryBtn.querySelector('i');
		if (refreshIcon) {
			refreshIcon.classList.add('animate-spin');
		}

		// Reload crawl history
		loadCrawlHistory();

		// Stop animation after a short delay
		setTimeout(() => {
			if (refreshIcon) {
				refreshIcon.classList.remove('animate-spin');
			}
			showScrapingNotification('Crawl history refreshed', 'success');

			// Hide the success notification after 3 seconds
			setTimeout(() => {
				const notifications = document.querySelectorAll('.notification');
				notifications.forEach(notification => {
					if (notification.textContent.includes('Crawl history refreshed')) {
						notification.style.opacity = '0';
						setTimeout(() => {
							notification.remove();
						}, 300);
					}
				});
			}, 3000);
		}, 1000);
	}

	// Listen for Chrome storage changes to sync across extensions
	function setupChromeStorageListener() {
		if (chrome && chrome.storage && chrome.storage.onChanged) {
			chrome.storage.onChanged.addListener(function (changes, namespace) {
				// Crawl history now lives in .local; settings still sync.
				if (namespace === 'local' && changes[HISTORY_KEY]) {
					loadCrawlHistory();
				}
			});
		}
	}

	// Listen for tab updates to update title when URL changes
	function setupTabUpdateListener() {
		if (chrome && chrome.tabs && chrome.tabs.onUpdated) {
			chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
				if (changeInfo.status === 'complete' && tab.active) {
					// Update title when page navigation is complete
					setTimeout(() => {
						updatePageTitle(tabId);
					}, 1000); // Small delay to ensure page is fully loaded
				}
			});
			console.log('✅ Tab update listener set up');
		}
	}

	function removeCrawlFromHistory(crawlId) {
		withLocalHistory(function (history) {
			return history.filter(item => item && item.id !== crawlId);
		});
	}
	window.removeCrawlFromHistory = removeCrawlFromHistory;

	document.addEventListener('DOMContentLoaded', function () {
		updateSelectorSuggestions();

		// Test Chrome storage functionality
		testChromeStorage();

		// Load saved settings from Chrome storage
		loadAllSettings();

		// Load saved next selector
		loadSavedNextSelector();

		// Render recent picks list
		renderRecentPicks();

		// Wizard nav + radio cards + preview + progress + settings tabs +
		// reload page + test webhook + auth fields + webhook event observers
		dnInitWizard();
		dnInitRadioCards();
		dnInitPreview();
		dnInitProgress();
		dnInitSettingsTabs();
		dnInitReloadPageButton();
		dnInitTestWebhook();
		dnInitWebhookAuthFields();
		dnInitWebhookObservers();
		dnInitCrawlHistoryBus();
		dnInitDriveAuth();
		dnInitDriveAutoUpload();
		dnInitAi();

		// One-time move from chrome.storage.sync → .local for crawl history,
		// then load. Wrapped so the migration callback fires before render.
		migrateHistoryFromSync(loadCrawlHistory);

		// Setup Chrome storage change listener for cross-extension sync
		setupChromeStorageListener();

		// Setup tab update listener for title updates
		setupTabUpdateListener();

		// Update stats display with actual data
		updateStatsDisplay();

		// Update page title with current URL
		updatePageTitle();

		// Check next page existence on initial load with retry mechanism
		setTimeout(() => {
			window.retryNextPageCheck(3, 1500);
		}, 1000);

		// Demo table generation for testing (remove in production)
		if (window.location.search.includes('demo=true')) {
			setTimeout(() => {
				generateDemoTable();
			}, 2000);
		}
	});

	// Make updateStatsDisplay globally accessible for testing
	window.updateStatsDisplay = updateStatsDisplay;

	// Make updatePageTitle globally accessible
	window.updatePageTitle = updatePageTitle;
	
	// Debug function to test content script communication
	window.testContentScriptCommunication = function() {
		console.log('🧪 Testing content script communication...');
		
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error querying tabs:', chrome.runtime.lastError);
					return;
				}
				
				if (tabs && tabs[0]) {
					console.log('📡 Sending test message to tab:', tabs[0].id);
					
					chrome.tabs.sendMessage(tabs[0].id, {
						action: "test"
					}, function (response) {
						if (chrome.runtime.lastError) {
							console.error('❌ Content script communication failed:', chrome.runtime.lastError);
						} else {
							console.log('✅ Content script communication successful:', response);
						}
					});
				} else {
					console.error('❌ No active tab found');
				}
			});
		} else {
			console.error('❌ Chrome tabs API not available');
		}
	};

	// Demo function to test table generation
	window.generateDemoTable = function() {
		// Simulate scraped data structure with more columns to demonstrate horizontal scrolling
		const demoData = {
			fields: ['name', 'price', 'rating', 'reviews', 'availability', 'category', 'brand', 'sku', 'weight', 'dimensions', 'warranty', 'shipping'],
			data: [
				['Product Alpha', '$24.99', '4.5/5', '127', 'In Stock', 'Electronics', 'TechCorp', 'TC-001', '2.5 lbs', '10x5x3"', '1 Year', 'Free'],
				['Product Beta', '$35.50', '3.8/5', '89', 'Out of Stock', 'Home & Garden', 'HomeMax', 'HM-002', '1.8 lbs', '8x4x2"', '2 Years', '$5.99'],
				['Product Gamma', '$19.99', '4.2/5', '203', 'In Stock', 'Sports', 'SportPro', 'SP-003', '3.2 lbs', '12x6x4"', '90 Days', 'Free'],
				['Widget Pro', '$49.99', '4.8/5', '456', 'In Stock', 'Tools', 'ToolMaster', 'TM-004', '5.1 lbs', '15x8x6"', 'Lifetime', '$8.99'],
				['Gadget X', '$12.75', '3.1/5', '67', 'Limited Stock', 'Kitchen', 'KitchenPlus', 'KP-005', '0.9 lbs', '6x3x2"', '6 Months', 'Free']
			]
		};

		// Check if generateModernTable function exists (from popup.js)
		if (typeof generateModernTable === 'function') {
			generateModernTable(demoData);
		} else {
			// Fallback: generate simple table
			generateSimpleTable(demoData);
		}
	}

	function generateSimpleTable(data) {
		const headers = data.fields;
		const rows = data.data;

		let tableHtml = `
			<div class="table-scroll-container relative">
				<!-- Scroll shadow indicators -->
				<div class="scroll-shadow-left hidden"></div>
				<div class="scroll-shadow-right"></div>
				
				<!-- Scroll indicators -->
				<div class="scroll-indicator left" title="Scroll left">
					<i class="fas fa-chevron-left"></i>
				</div>
				<div class="scroll-indicator right" title="Scroll right">
					<i class="fas fa-chevron-right"></i>
				</div>
				
				<table class="w-full resizable-table">
					<thead class="bg-gray-50">
						<tr>`;

		headers.forEach((header, index) => {
			const fieldName = `field_${index}`;
			tableHtml += `<th class="px-3 py-2 text-left text-sm font-medium text-gray-700 relative group resizable-column" style="min-width: 400px; width: 400px;">
				<div class="flex items-center justify-between pr-2">
					<span class="header-text">${header}</span>
					<div class="opacity-70 group-hover:opacity-100 transition-opacity duration-200 flex items-center z-20 relative">
						<button class="edit-header-btn ml-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-all border border-transparent hover:border-blue-200" data-field="${fieldName}" title="Edit header">
							<i class="fas fa-edit text-sm"></i>
						</button>
						<button class="remove-column-btn ml-1 text-gray-600 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all border border-transparent hover:border-red-200" data-field="${fieldName}" title="Remove column">
							<i class="fas fa-trash text-sm"></i>
						</button>
					</div>
				</div>
				<div class="column-resizer absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-500 transition-colors"></div>
			</th>`;
		});

		tableHtml += `</tr></thead><tbody class="divide-y divide-gray-200">`;

		rows.forEach(row => {
			tableHtml += `<tr class="hover:bg-gray-50">`;
			row.forEach((cell, index) => {
				let cellClass = "px-3 py-2 text-sm";

				// Apply smart styling
				if (typeof cell === 'string' && cell.match(/^\$[\d,]+\.?\d*$/)) {
					cellClass += " text-blue-600 font-medium";
				} else if (typeof cell === 'string' && cell.match(/^\d+(\.\d+)?\/\d+$/)) {
					cellClass += " text-gray-900";
				} else if (typeof cell === 'string' && cell.toLowerCase().includes('stock')) {
					if (cell.toLowerCase().includes('out')) {
						cellClass += " text-red-600 font-medium";
					} else {
						cellClass += " text-green-600 font-medium";
					}
				} else if (headers[index] && headers[index].toLowerCase().includes('name')) {
					cellClass += " text-blue-600 hover:text-blue-800 cursor-pointer";
				} else {
					cellClass += " text-gray-900";
				}

				tableHtml += `<td class="${cellClass}">${cell}</td>`;
			});
			tableHtml += `</tr>`;
		});

		tableHtml += `</tbody></table>
		</div>`;

		tableHtml += `
			<div class="p-4 border-t bg-gray-50">
				<p class="text-sm text-gray-600 text-center">Showing all ${rows.length} rows</p>
			</div>`;

		document.getElementById('hot').innerHTML = tableHtml;

		// Initialize column resizing if available
		if (typeof addColumnResizing === 'function') {
			addColumnResizing();
		}
		
		// Initialize horizontal scroll handlers if available
		if (typeof addHorizontalScrollHandlers === 'function') {
			addHorizontalScrollHandlers();
		}
	}

	// Function to check next page existence (for use in scraping workflow)
	window.checkNextPageExists = function(callback) {
		console.log('🔍 Checking if next page exists (from index-page.js)...');
		
		// Get current next selector value
		const nextSelectorValue = nextSelectorInput ? nextSelectorInput.value.trim() : '';
		
		if (!nextSelectorValue) {
			console.log('❌ No next selector configured');
			callback(false);
			return;
		}
		
		// Check if infinite scroll is enabled
		const paginationInfinite = document.getElementById('paginationInfinite');
		if (paginationInfinite && paginationInfinite.checked) {
			console.log('✅ Infinite scroll enabled - assuming next page exists');
			callback(true);
			return;
		}
		
		// Check if next button/link exists on the current page
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error querying tabs:', chrome.runtime.lastError);
					console.error('❌ Error details:', chrome.runtime.lastError.message);
					// Fallback - assume no next page
					console.log('⚠️ Tab query failed, assuming no next page');
					callback(false);
					return;
				}
				
				if (tabs && tabs[0]) {
					console.log('🔍 Checking next page with selector:', nextSelectorValue, 'on tab:', tabs[0].id);
					
					chrome.tabs.sendMessage(tabs[0].id, {
						action: "checkNextPageExists",
						selector: nextSelectorValue
					}, function (response) {
						if (chrome.runtime.lastError) {
							console.warn('Next-page check skipped — content script not reachable on tab', tabs[0].id, '-', chrome.runtime.lastError.message);
							callback(false);
							return;
						}
						
						console.log('📡 Response from content script:', response);
						
						if (response && response.exists) {
							console.log('✅ Next page exists');
							callback(true);
						} else {
							console.log('❌ No next page found');
							callback(false);
						}
					});
				} else {
					console.error('❌ No active tab found');
					// Fallback - assume no next page
					callback(false);
				}
			});
		} else {
			console.error('❌ Chrome tabs API not available');
			// Fallback - assume no next page
			callback(false);
		}
	};
})();


