(function () {
	// Helper function to format working time in hh:mm:ss format
	function formatWorkingTime(seconds) {
		const totalSeconds = seconds || 0;
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const secs = totalSeconds % 60;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
	const oauthRadio = document.getElementById('oauthRadio');
	const serviceRadio = document.getElementById('serviceRadio');
	const oauthFields = document.getElementById('oauthFields');
	const serviceFields = document.getElementById('serviceFields');
	const privateKeyFile = document.getElementById('privateKeyFile');
	const fileName = document.getElementById('fileName');

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

	function addNewSelector() {
		const selectorsList = document.getElementById('selectorsList');
		const newSelector = document.createElement('div');
		newSelector.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
		newSelector.innerHTML = [
			'<input type="text" placeholder="Enter CSS selector" class="flex-1 bg-transparent text-blue-600 font-mono text-sm focus:outline-none">',
			'<button class="text-gray-400 hover:text-red-500 ml-2 selector-remove">',
			'<i class="fas fa-trash"></i>',
			'</button>'
		].join('');
		selectorsList.appendChild(newSelector);

		const input = newSelector.querySelector('input');
		const removeBtn = newSelector.querySelector('.selector-remove');
		input.focus();

		removeBtn.addEventListener('click', function () {
			newSelector.remove();
			updateSelectorSuggestions();
		});

		input.addEventListener('blur', function () {
			if (this.value.trim()) {
				const span = document.createElement('span');
				span.className = 'text-blue-600 font-mono text-sm';
				span.textContent = this.value.trim();
				newSelector.replaceChild(span, this);
				updateSelectorSuggestions();
			}
		});

		input.addEventListener('keypress', function (e) {
			if (e.key === 'Enter') {
				this.blur();
			}
		});
	}

	function switchAuthMethod() {
		if (oauthRadio.checked) {
			oauthFields.classList.remove('hidden');
			serviceFields.classList.add('hidden');
		} else if (serviceRadio.checked) {
			oauthFields.classList.add('hidden');
			serviceFields.classList.remove('hidden');
		}
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
		const selectorsList = document.getElementById('selectorsList');
		datalist.innerHTML = '';
		const selectorItems = selectorsList.querySelectorAll('.flex.items-center.justify-between');
		selectorItems.forEach(item => {
			const selectorText = (item.querySelector('span') && item.querySelector('span').textContent) || (item.querySelector('input') && item.querySelector('input').value);
			if (selectorText && selectorText.trim()) {
				const option = document.createElement('option');
				option.value = selectorText.trim();
				datalist.appendChild(option);
			}
		});
	}

	function handleStartScraping() {
		// Show stop button, hide start button
		startScrapingBtn.classList.add('hidden');
		stopScrapingBtn.classList.remove('hidden');
		
		// Update status badge to "Scraping..."
		updateStatusBadge('scraping');
		
		// Get current URL - try different methods to get the page URL
		let currentUrl = 'Unknown URL';
		let pageTitle = 'Unknown Page';
		
		// Try to get URL from Chrome tabs API if available
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				if (tabs[0]) {
					currentUrl = tabs[0].url;
					pageTitle = tabs[0].title || 'Unknown Page';
				}
				
				// Add crawl history item
				currentCrawlId = addCrawlHistoryItem(currentUrl, pageTitle);
				console.log('🚀 Started crawl session:', currentCrawlId);
			});
		} else {
			// Fallback - try to get URL from window.location if available
			try {
				currentUrl = window.location.href;
				pageTitle = document.title;
			} catch (e) {
				console.log('Could not get current URL, using fallback');
			}
			
			// Add crawl history item
			currentCrawlId = addCrawlHistoryItem(currentUrl, pageTitle);
			console.log('🚀 Started crawl session:', currentCrawlId);
		}
		
		// Show notification
		showScrapingNotification('Scraping started - added to crawl history', 'info');
		
		console.log('Start scraping clicked');
		// Here you would integrate with the actual scraping functionality from popup.js
	}
	
	function handleStopScraping() {
		// Show start button, hide stop button
		stopScrapingBtn.classList.add('hidden');
		startScrapingBtn.classList.remove('hidden');
		
		// Update status badge to "Ready"
		updateStatusBadge('ready');
		
		// Update crawl history item if we have a current crawl
		if (currentCrawlId) {
			
			// Get item count from the stats or table data
			let itemCount = getScrapedItemCount();
			updateCrawlHistoryItem(currentCrawlId, itemCount, 'completed');
			console.log('🏁 Completed crawl session:', currentCrawlId, 'with', itemCount, 'items');
			currentCrawlId = null; // Reset current crawl ID
		}
		
		// Show notification
		showScrapingNotification('Scraping stopped - history updated', 'warning');
		
		console.log('Stop scraping clicked');
		// Here you would integrate with the actual stop functionality from popup.js
	}
	
	function updateStatusBadge(status) {
		const statusBadge = document.querySelector('.bg-green-100, .bg-blue-100');
		if (statusBadge) {
			if (status === 'scraping') {
				statusBadge.className = 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mr-2';
				statusBadge.textContent = 'Scraping...';
			} else {
				statusBadge.className = 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-2';
				statusBadge.textContent = 'Ready';
			}
		}
	}
	
	// Function to handle "Use selector" functionality
	function handleUseSelectorClick() {
		console.log('🔍 Use selector clicked');
		
		const selectorValue = nextSelectorInput ? nextSelectorInput.value.trim() : '';
		
		if (!selectorValue) {
			// No selector value, activate element picker mode
			console.log('🔍 No selector value, activating element picker');
			showScrapingNotification('Click on the "Next" button or link on the webpage', 'info');
			
			// Check if we're in extension context and can communicate with content script
			if (typeof chrome !== 'undefined' && chrome.tabs) {
				// Get current active tab
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					if (tabs[0]) {
						console.log('🔍 Sending getNextButton message to tab:', tabs[0].id);
						chrome.tabs.sendMessage(tabs[0].id, { action: "getNextButton" }, function(response) {
							if (chrome.runtime.lastError) {
								console.error('❌ Error communicating with content script:', chrome.runtime.lastError);
								showScrapingNotification('Error: Could not activate element picker. Make sure you are on the page you want to scrape.', 'error');
								return;
							}
							
							if (response && response.selector) {
								console.log('✅ Got selector from content script:', response.selector);
								nextSelectorInput.value = response.selector;
								showScrapingNotification('Selector captured: ' + response.selector, 'success');
								
								// Mark the next button visually
								chrome.tabs.sendMessage(tabs[0].id, { 
									action: "markNextButton", 
									selector: response.selector 
								});
							} else {
								console.log('❌ No selector received from content script');
								showScrapingNotification('No selector received. Please try clicking on the next button.', 'warning');
							}
						});
					} else {
						console.error('❌ No active tab found');
						showScrapingNotification('Error: No active tab found', 'error');
					}
				});
			} else {
				console.error('❌ Chrome tabs API not available');
				showScrapingNotification('Error: Extension APIs not available. Make sure this is running as a Chrome extension.', 'error');
			}
		} else {
			// Selector value exists, validate it
			console.log('🔍 Validating selector:', selectorValue);
			showScrapingNotification('Validating selector: ' + selectorValue, 'info');
			
			if (typeof chrome !== 'undefined' && chrome.tabs) {
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					if (tabs[0]) {
						chrome.tabs.sendMessage(tabs[0].id, {
							action: "markNextButton",
							selector: selectorValue
						}, function(response) {
							if (chrome.runtime.lastError) {
								console.error('❌ Error validating selector:', chrome.runtime.lastError);
								showScrapingNotification('Error validating selector', 'error');
								return;
							}
							
							if (response && response.error) {
								console.error('❌ Selector validation failed:', response.error);
								showScrapingNotification('Selector validation failed: ' + response.error, 'error');
							} else {
								console.log('✅ Selector validated successfully');
								showScrapingNotification('Selector validated successfully!', 'success');
								
								// Store the selector for future use
								if (typeof localStorage !== 'undefined') {
									localStorage.setItem('nextSelector', selectorValue);
								}
							}
						});
					}
				});
			} else {
				console.error('❌ Chrome tabs API not available for validation');
				showScrapingNotification('Warning: Cannot validate selector - extension APIs not available', 'warning');
			}
		}
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
		
		const historyContainer = document.querySelector('#sidebarMenu .space-y-3');
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
	
	function saveCrawlToHistory(crawlData) {
		console.log('💾 Saving crawl to Chrome storage:', crawlData);
		
		if (chrome && chrome.storage && chrome.storage.sync) {
			// Save to Chrome storage for cross-device sync
			chrome.storage.sync.get(['crawlHistory'], function(result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error reading from Chrome storage:', chrome.runtime.lastError);
					// Fallback to localStorage
					saveToLocalStorage(crawlData);
					return;
				}
				
				const existingHistory = result.crawlHistory || [];
				existingHistory.unshift(crawlData); // Add to beginning
				
				// Keep only last 50 items
				const limitedHistory = existingHistory.slice(0, 50);
				
				chrome.storage.sync.set({ 'crawlHistory': limitedHistory }, function() {
					if (chrome.runtime.lastError) {
						console.error('❌ Error saving to Chrome storage:', chrome.runtime.lastError);
						// Fallback to localStorage
						saveToLocalStorage(crawlData);
					} else {
						console.log('✅ Crawl saved to Chrome storage successfully');
					}
				});
			});
		} else {
			// Fallback to localStorage if Chrome storage not available
			saveToLocalStorage(crawlData);
		}
	}
	
	function saveToLocalStorage(crawlData) {
		if (typeof localStorage !== 'undefined') {
			try {
				const existingHistory = JSON.parse(localStorage.getItem('crawlHistory') || '[]');
				existingHistory.unshift(crawlData); // Add to beginning
				
				// Keep only last 50 items
				const limitedHistory = existingHistory.slice(0, 50);
				localStorage.setItem('crawlHistory', JSON.stringify(limitedHistory));
				
				console.log('💾 Crawl saved to localStorage history (fallback)');
			} catch (e) {
				console.error('❌ Error saving crawl to localStorage:', e);
			}
		}
	}
	
	function updateCrawlInHistory(crawlId, updateData) {
		console.log('💾 Updating crawl in Chrome storage:', crawlId, updateData);
		
		if (chrome && chrome.storage && chrome.storage.sync) {
			chrome.storage.sync.get(['crawlHistory'], function(result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error reading from Chrome storage:', chrome.runtime.lastError);
					// Fallback to localStorage
					updateInLocalStorage(crawlId, updateData);
					return;
				}
				
				const existingHistory = result.crawlHistory || [];
				const crawlIndex = existingHistory.findIndex(item => item.id === crawlId);
				
				if (crawlIndex !== -1) {
					existingHistory[crawlIndex] = { ...existingHistory[crawlIndex], ...updateData };
					
					chrome.storage.sync.set({ 'crawlHistory': existingHistory }, function() {
						if (chrome.runtime.lastError) {
							console.error('❌ Error updating in Chrome storage:', chrome.runtime.lastError);
							// Fallback to localStorage
							updateInLocalStorage(crawlId, updateData);
						} else {
							console.log('✅ Crawl updated in Chrome storage successfully');
						}
					});
				}
			});
		} else {
			// Fallback to localStorage if Chrome storage not available
			updateInLocalStorage(crawlId, updateData);
		}
	}
	
	function updateInLocalStorage(crawlId, updateData) {
		if (typeof localStorage !== 'undefined') {
			try {
				const existingHistory = JSON.parse(localStorage.getItem('crawlHistory') || '[]');
				const crawlIndex = existingHistory.findIndex(item => item.id === crawlId);
				
				if (crawlIndex !== -1) {
					existingHistory[crawlIndex] = { ...existingHistory[crawlIndex], ...updateData };
					localStorage.setItem('crawlHistory', JSON.stringify(existingHistory));
					console.log('💾 Crawl updated in localStorage history (fallback)');
				}
			} catch (e) {
				console.error('❌ Error updating crawl in localStorage:', e);
			}
		}
	}
	
	function loadCrawlHistory() {
		console.log('📖 Loading crawl history from Chrome storage');
		
		if (chrome && chrome.storage && chrome.storage.sync) {
			// Load from Chrome storage for cross-device sync
			chrome.storage.sync.get(['crawlHistory'], function(result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error reading from Chrome storage:', chrome.runtime.lastError);
					// Fallback to localStorage
					loadFromLocalStorage();
					return;
				}
				
				const historyData = result.crawlHistory || [];
				renderCrawlHistory(historyData);
				console.log('✅ Crawl history loaded from Chrome storage:', historyData.length, 'items');
			});
		} else {
			// Fallback to localStorage if Chrome storage not available
			loadFromLocalStorage();
		}
	}
	
	function loadFromLocalStorage() {
		console.log('📖 Loading crawl history from localStorage (fallback)');
		
		if (typeof localStorage === 'undefined') {
			console.log('📖 localStorage not available, skipping history load');
			return;
		}
		
		try {
			const historyData = JSON.parse(localStorage.getItem('crawlHistory') || '[]');
			renderCrawlHistory(historyData);
			console.log('✅ Crawl history loaded from localStorage:', historyData.length, 'items');
		} catch (e) {
			console.error('❌ Error loading crawl history from localStorage:', e);
		}
	}
	
	function renderCrawlHistory(historyData) {
		const historyContainer = document.querySelector('#crawlHistoryContainer');
		
		if (!historyContainer) {
			console.error('❌ History container not found');
			return;
		}
		
		console.log('🔄 Rendering crawl history with', historyData.length, 'items');
		
		// Clear ALL existing items (both static and dynamic)
		const allItems = historyContainer.querySelectorAll('div');
		allItems.forEach(item => item.remove());
		
		// If no history data, don't add any items
		if (!historyData || historyData.length === 0) {
			console.log('📭 No crawl history data to display');
			return;
		}
		
		// Add items from storage
		historyData.slice(0, 10).forEach(crawlData => { // Show only last 10
			const historyItem = document.createElement('div');
			historyItem.className = 'p-3 bg-gray-50 rounded-lg';
			historyItem.setAttribute('data-crawl-id', crawlData.id);
			
			const date = new Date(crawlData.startTime).toISOString().split('T')[0];
			const statusClass = crawlData.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
			const statusText = crawlData.status === 'completed' ? `${crawlData.itemCount} items` : 'Crawling...';
			
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
	window.removeCrawlHistoryItem = function(crawlId) {
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
	window.testRemoveFunction = function() {
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
	
	// Helper function to get webhook triggers
	function getWebhookTriggers() {
		console.log('🔍 DEBUG: Getting webhook triggers');
		const triggers = {
			scrapingStarted: false,
			errorOccurred: false,
			scrapingCompleted: false,
			pageCompleted: false
		};
		
		// Get all checkboxes in webhook settings
		const webhookCheckboxes = document.querySelectorAll('#webhookSettingsContent input[type="checkbox"]');
		console.log('🔍 DEBUG: Found webhook checkboxes:', webhookCheckboxes.length);
		
		webhookCheckboxes.forEach((checkbox, index) => {
			const label = checkbox.nextElementSibling;
			if (label && label.textContent) {
				const labelText = label.textContent.trim();
				console.log('🔍 DEBUG: Checkbox', index, 'label:', labelText, 'checked:', checkbox.checked);
				
				if (labelText.includes('Scraping Started')) {
					triggers.scrapingStarted = checkbox.checked;
				} else if (labelText.includes('Error Occurred')) {
					triggers.errorOccurred = checkbox.checked;
				} else if (labelText.includes('Scraping Completed')) {
					triggers.scrapingCompleted = checkbox.checked;
				} else if (labelText.includes('Page Completed')) {
					triggers.pageCompleted = checkbox.checked;
				}
			}
		});
		
		console.log('🔍 DEBUG: Final triggers:', triggers);
		return triggers;
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
			
			// Authentication Method
			authMethod: document.querySelector('input[name="authMethod"]:checked')?.value || 'oauth',
			
			// OAuth 2.0 Credentials
			oauth: {
				clientId: document.querySelector('#oauthFields input[placeholder*="Client ID"]')?.value || '',
				clientSecret: document.querySelector('#oauthFields input[placeholder*="Client Secret"]')?.value || ''
			},
			
			// Service Account Credentials
			serviceAccount: {
				email: document.querySelector('#serviceFields input[type="email"]')?.value || '',
				privateKeyFile: document.getElementById('fileName')?.textContent || 'No file chosen'
			},
			
			// Webhook Settings
			webhooks: {
				enabled: document.getElementById('enableWebhooks')?.checked || false,
				url: document.querySelector('input[placeholder*="webhook"]')?.value || '',
				authentication: document.querySelector('input[name="webhookAuth"]:checked')?.value || 'none',
				triggers: getWebhookTriggers()
			},
			
			// Timestamp
			savedAt: new Date().toISOString()
		};
		
		// Collect next page selectors
		const selectorItems = document.querySelectorAll('#selectorsList .flex.items-center.justify-between');
		console.log('🔍 DEBUG: Found selector items:', selectorItems.length);
		selectorItems.forEach(item => {
			const selectorText = item.querySelector('span')?.textContent;
			if (selectorText && selectorText.trim()) {
				settings.nextPageSelectors.push(selectorText.trim());
			}
		});
		
		console.log('🔍 DEBUG: Settings object to save:', settings);
		console.log('🔍 DEBUG: Settings JSON size:', JSON.stringify(settings).length, 'bytes');
		
		// Check if we're in extension context
		if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
			console.log('🔍 DEBUG: Chrome storage API is available');
			
			// Test Chrome storage with a simple value first
			chrome.storage.sync.set({ 'testKey': 'testValue' }, function() {
				if (chrome.runtime.lastError) {
					console.error('🔍 DEBUG: Test storage failed:', chrome.runtime.lastError);
					alert('❌ Chrome storage test failed: ' + chrome.runtime.lastError.message);
					return;
				}
				
				console.log('🔍 DEBUG: Test storage successful, proceeding with settings save');
				
				// Now save the actual settings
				chrome.storage.sync.set({ 'scrapperSettings': settings }, function() {
					if (chrome.runtime.lastError) {
						console.error('❌ Error saving settings:', chrome.runtime.lastError);
						console.error('🔍 DEBUG: Full error object:', chrome.runtime.lastError);
						alert('❌ Error saving settings: ' + chrome.runtime.lastError.message);
						showScrapingNotification('Error saving settings: ' + chrome.runtime.lastError.message, 'error');
					} else {
						console.log('✅ Settings saved successfully to Chrome storage:', settings);
						
						// Verify the save by reading it back
						chrome.storage.sync.get(['scrapperSettings'], function(result) {
							console.log('🔍 DEBUG: Verification read result:', result);
							if (result.scrapperSettings) {
								console.log('✅ Settings verified successfully');
								alert('✅ Settings saved successfully!\n\nYour configuration has been saved to Chrome storage and will sync across devices.');
								showScrapingNotification('Settings saved successfully!', 'success');
							} else {
								console.error('❌ Settings verification failed - could not read back');
								alert('⚠️ Settings may not have saved correctly. Please try again.');
							}
						});
					}
				});
			});
		} else {
			console.log('⚠️ Chrome storage not available, using localStorage fallback');
			console.log('🔍 DEBUG: chrome object exists:', typeof chrome !== 'undefined');
			console.log('🔍 DEBUG: chrome.storage exists:', typeof chrome?.storage !== 'undefined');
			console.log('🔍 DEBUG: chrome.storage.sync exists:', typeof chrome?.storage?.sync !== 'undefined');
			
			// Fallback to localStorage if Chrome storage not available
			try {
				localStorage.setItem('scrapperSettings', JSON.stringify(settings));
				console.log('✅ Settings saved to localStorage:', settings);
				alert('✅ Settings saved to local storage!\n\nNote: Chrome storage not available, using local storage instead.');
				showScrapingNotification('Settings saved to local storage!', 'success');
			} catch (error) {
				console.error('❌ Error saving to localStorage:', error);
				alert('❌ Error saving to local storage: ' + error.message);
			}
		}
	}
	
	// Function to load all settings from Chrome storage
	function loadAllSettings() {
		console.log('🔄 Loading settings from storage...');
		
		if (chrome && chrome.storage) {
			chrome.storage.sync.get(['scrapperSettings'], function(result) {
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
		
		// Authentication Method
		if (settings.authMethod) {
			const authRadio = document.querySelector(`input[name="authMethod"][value="${settings.authMethod}"]`);
			if (authRadio) {
				authRadio.checked = true;
				switchAuthMethod(); // Trigger field visibility
			}
		}
		
		// OAuth Credentials
		if (settings.oauth) {
			const clientIdInput = document.querySelector('#oauthFields input[placeholder*="Client ID"]');
			const clientSecretInput = document.querySelector('#oauthFields input[placeholder*="Client Secret"]');
			if (clientIdInput) clientIdInput.value = settings.oauth.clientId || '';
			if (clientSecretInput) clientSecretInput.value = settings.oauth.clientSecret || '';
		}
		
		// Service Account Credentials
		if (settings.serviceAccount) {
			const emailInput = document.querySelector('#serviceFields input[type="email"]');
			const fileNameSpan = document.getElementById('fileName');
			if (emailInput) emailInput.value = settings.serviceAccount.email || '';
			if (fileNameSpan) fileNameSpan.textContent = settings.serviceAccount.privateKeyFile || 'No file chosen';
		}
		
		// Webhook Settings
		if (settings.webhooks) {
			const enableWebhooks = document.getElementById('enableWebhooks');
			if (enableWebhooks) {
				enableWebhooks.checked = settings.webhooks.enabled;
				toggleWebhookSettingsContent(); // Trigger visibility logic
			}
			
			const webhookUrlInput = document.querySelector('input[placeholder*="webhook"]');
			if (webhookUrlInput) webhookUrlInput.value = settings.webhooks.url || '';
			
			// Webhook Authentication
			if (settings.webhooks.authentication) {
				const authRadio = document.querySelector(`input[name="webhookAuth"][value="${settings.webhooks.authentication}"]`);
				if (authRadio) authRadio.checked = true;
			}
			
			// Event Triggers
			if (settings.webhooks.triggers) {
				const triggers = settings.webhooks.triggers;
				// Note: This is a simplified approach, you might need to adjust selectors
				document.querySelectorAll('#webhookSettingsContent input[type="checkbox"]').forEach((checkbox, index) => {
					const label = checkbox.nextElementSibling?.textContent;
					if (label?.includes('Scraping Started')) checkbox.checked = triggers.scrapingStarted;
					if (label?.includes('Error Occurred')) checkbox.checked = triggers.errorOccurred;
					if (label?.includes('Scraping Completed')) checkbox.checked = triggers.scrapingCompleted;
					if (label?.includes('Page Completed')) checkbox.checked = triggers.pageCompleted;
				});
			}
		}
		
		// Next Page Selectors
		if (settings.nextPageSelectors && settings.nextPageSelectors.length > 0) {
			const selectorsList = document.getElementById('selectorsList');
			if (selectorsList) {
				// Clear existing selectors (except default ones)
				selectorsList.innerHTML = '';
				
				// Add saved selectors
				settings.nextPageSelectors.forEach(selector => {
					const selectorDiv = document.createElement('div');
					selectorDiv.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
					selectorDiv.innerHTML = `
						<span class="text-blue-600 font-mono text-sm">${selector}</span>
						<button class="text-gray-400 hover:text-red-500">
							<i class="fas fa-trash"></i>
						</button>
					`;
					selectorsList.appendChild(selectorDiv);
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
				chrome.storage.sync.remove(['scrapperSettings'], function() {
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
		// Reset automation settings
		const autoDownloadCSV = document.getElementById('autoDownloadCSV');
		const autoUploadDrive = document.getElementById('autoUploadDrive');
		if (autoDownloadCSV) autoDownloadCSV.checked = false;
		if (autoUploadDrive) autoUploadDrive.checked = true; // Default to checked
		
		// Reset authentication method to OAuth
		const oauthRadio = document.getElementById('oauthRadio');
		if (oauthRadio) oauthRadio.checked = true;
		
		// Clear form fields
		document.querySelectorAll('#oauthFields input, #serviceFields input').forEach(input => {
			input.value = '';
		});
		
		// Reset webhook settings
		const enableWebhooks = document.getElementById('enableWebhooks');
		if (enableWebhooks) enableWebhooks.checked = true; // Default to enabled
		
		document.querySelectorAll('#webhookSettingsContent input[type="url"], #webhookSettingsContent input[type="text"]').forEach(input => {
			input.value = '';
		});
		
		// Reset webhook auth to none
		const webhookAuthNone = document.querySelector('input[name="webhookAuth"][value="none"]');
		if (webhookAuthNone) webhookAuthNone.checked = true;
		
		// Reset event triggers - keep only "Scraping Completed" checked
		document.querySelectorAll('#webhookSettingsContent input[type="checkbox"]').forEach((checkbox, index) => {
			const label = checkbox.nextElementSibling?.textContent;
			checkbox.checked = label?.includes('Scraping Completed') || false;
		});
		
		// Reset selectors list to defaults
		const selectorsList = document.getElementById('selectorsList');
		if (selectorsList) {
			selectorsList.innerHTML = `
				<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span class="text-blue-600 font-mono text-sm">a[title='Next Page']</span>
					<button class="text-gray-400 hover:text-red-500">
						<i class="fas fa-trash"></i>
					</button>
				</div>
				<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<span class="text-blue-600 font-mono text-sm">button[rel='next']</span>
					<button class="text-gray-400 hover:text-red-500">
						<i class="fas fa-trash"></i>
					</button>
				</div>
			`;
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
	if (oauthRadio) oauthRadio.addEventListener('change', switchAuthMethod);
	if (serviceRadio) serviceRadio.addEventListener('change', switchAuthMethod);
	if (paginationNone) paginationNone.addEventListener('change', toggleCSSSelector);
	if (paginationCSS) paginationCSS.addEventListener('change', toggleCSSSelector);
	if (paginationInfinite) paginationInfinite.addEventListener('change', toggleCSSSelector);
	if (privateKeyFile && fileName) {
	privateKeyFile.addEventListener('change', function (e) {
		const file = e.target.files[0];
		fileName.textContent = file ? file.name : 'No file chosen';
	});
	}
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
	document.addEventListener('click', function (e) {
		console.log('🔍 Click event detected:', e.target);
		
		// Handle crawl history remove button clicks (fallback method)
		if (e.target.classList.contains('fa-times') || e.target.classList.contains('crawl-history-remove')) {
			const removeButton = e.target.closest('.crawl-history-remove');
			if (removeButton) {
				console.log('✅ Remove button clicked via event listener!');
				const historyItem = removeButton.closest('.p-3.bg-gray-50.rounded-lg');
				
				if (historyItem) {
					const crawlId = historyItem.getAttribute('data-crawl-id');
					console.log('🔍 Crawl ID from event listener:', crawlId);
					
					if (crawlId) {
						console.log('🗑️ Removing crawl from history via event listener:', crawlId);
						removeCrawlFromHistory(crawlId);
						historyItem.remove();
						console.log('✅ History item removed from DOM via event listener');
						
						// Show success notification
						showScrapingNotification('Crawl history item removed', 'success');
					}
				}
			}
		}
		
		// Handle selector removal (existing functionality)
		if (e.target.classList.contains('fa-trash') || (e.target.closest('button') && e.target.closest('button').querySelector('.fa-trash'))) {
			const selectorItem = e.target.closest('.flex.items-center.justify-between');
			if (selectorItem && selectorItem.parentElement.id === 'selectorsList') {
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
	document.addEventListener('click', function (e) {
		console.log('🔍 Click event detected:', e.target);
		console.log('🔍 Target classes:', e.target.classList);
		console.log('🔍 Closest remove button:', e.target.closest('.crawl-history-remove'));
		
		// Check if click is on the remove button or its icon
		const removeButton = e.target.closest('.crawl-history-remove');
		const isIconClick = e.target.classList.contains('fa-times');
		const isButtonClick = e.target.classList.contains('crawl-history-remove');
		
		if ((isIconClick || isButtonClick) && removeButton) {
			console.log('✅ Remove button clicked!');
			const historyItem = e.target.closest('.p-3.bg-gray-50.rounded-lg');
			console.log('🔍 History item found:', historyItem);
			
			if (historyItem) {
				const crawlId = historyItem.getAttribute('data-crawl-id');
				console.log('🔍 Crawl ID:', crawlId);
				
				if (crawlId) {
					console.log('🗑️ Removing crawl from history:', crawlId);
					removeCrawlFromHistory(crawlId);
				}
				historyItem.remove();
				console.log('✅ History item removed from DOM');
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
		
		chrome.storage.sync.set({ [testKey]: testValue }, function() {
			if (chrome.runtime.lastError) {
				console.error('❌ Storage test write failed:', chrome.runtime.lastError);
				return false;
			}
			
			console.log('✅ Storage test write successful');
			
			// Test read
			chrome.storage.sync.get([testKey], function(result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Storage test read failed:', chrome.runtime.lastError);
					return false;
				}
				
				if (result[testKey] === testValue) {
					console.log('✅ Storage test read successful - Chrome storage is working!');
					
					// Clean up test data
					chrome.storage.sync.remove([testKey], function() {
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
	window.debugStorage = function() {
		console.log('🔧 Manual storage debug called');
		console.log('🔍 Chrome object:', chrome);
		console.log('🔍 Chrome storage:', chrome?.storage);
		console.log('🔍 Chrome storage sync:', chrome?.storage?.sync);
		
		if (chrome && chrome.storage && chrome.storage.sync) {
			// Try to save a test value
			const testData = { debugTest: 'Manual test - ' + new Date().toISOString() };
			chrome.storage.sync.set(testData, function() {
				if (chrome.runtime.lastError) {
					console.error('❌ Debug storage save failed:', chrome.runtime.lastError);
				} else {
					console.log('✅ Debug storage save successful:', testData);
					
					// Try to read it back
					chrome.storage.sync.get(['debugTest'], function(result) {
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
	window.updateCrawlProgress = function(itemCount) {
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
			chrome.storage.onChanged.addListener(function(changes, namespace) {
				if (namespace === 'sync' && changes.crawlHistory) {
					console.log('🔄 Crawl history changed in Chrome storage, updating UI...');
					
					// Reload the history to show the latest changes
					loadCrawlHistory();
					
					// Show notification about sync
					showScrapingNotification('Crawl history synced from another extension', 'info');
				}
			});
					console.log('✅ Chrome storage change listener set up');
	}
	
	// Function to remove crawl from history (moved to global scope)
	function removeCrawlFromHistory(crawlId) {
		console.log('🗑️ Removing crawl from history:', crawlId);
		
		if (chrome && chrome.storage && chrome.storage.sync) {
			chrome.storage.sync.get(['crawlHistory'], function(result) {
				if (chrome.runtime.lastError) {
					console.error('❌ Error reading from Chrome storage:', chrome.runtime.lastError);
					// Fallback to localStorage
					removeFromLocalStorage(crawlId);
					return;
				}
				
				const existingHistory = result.crawlHistory || [];
				const filteredHistory = existingHistory.filter(item => item.id !== crawlId);
				
				chrome.storage.sync.set({ 'crawlHistory': filteredHistory }, function() {
					if (chrome.runtime.lastError) {
						console.error('❌ Error removing from Chrome storage:', chrome.runtime.lastError);
						// Fallback to localStorage
						removeFromLocalStorage(crawlId);
					} else {
						console.log('✅ Crawl removed from Chrome storage successfully');
					}
				});
			});
		} else {
			// Fallback to localStorage if Chrome storage not available
			removeFromLocalStorage(crawlId);
		}
	}
	
	// Make function globally accessible
	window.removeCrawlFromHistory = removeCrawlFromHistory;
	
	function removeFromLocalStorage(crawlId) {
		if (typeof localStorage !== 'undefined') {
			try {
				const existingHistory = JSON.parse(localStorage.getItem('crawlHistory') || '[]');
				const filteredHistory = existingHistory.filter(item => item.id !== crawlId);
				localStorage.setItem('crawlHistory', JSON.stringify(filteredHistory));
				console.log('🗑️ Crawl removed from localStorage history (fallback)');
			} catch (e) {
				console.error('❌ Error removing crawl from localStorage:', e);
			}
		}
	}
	}

	document.addEventListener('DOMContentLoaded', function () {
		updateSelectorSuggestions();
		
		// Test Chrome storage functionality
		testChromeStorage();
		
		// Load saved settings from Chrome storage
		loadAllSettings();
		
		// Load saved next selector
		loadSavedNextSelector();
		
		// Load crawl history
		loadCrawlHistory();
		
		// Setup Chrome storage change listener for cross-extension sync
		setupChromeStorageListener();
		
		// Update stats display with actual data
		updateStatsDisplay();
		
		// Demo table generation for testing (remove in production)
		if (window.location.search.includes('demo=true')) {
			setTimeout(() => {
				generateDemoTable();
			}, 2000);
		}
	});
	
	// Make updateStatsDisplay globally accessible for testing
	window.updateStatsDisplay = updateStatsDisplay;
	
	// Demo function to test table generation
	function generateDemoTable() {
		// Simulate scraped data structure
		const demoData = {
			fields: ['name', 'price', 'rating', 'reviews', 'availability'],
			data: [
				['Product Alpha', '$24.99', '4.5/5', '127', 'In Stock'],
				['Product Beta', '$35.50', '3.8/5', '89', 'Out of Stock'],
				['Product Gamma', '$19.99', '4.2/5', '203', 'In Stock'],
				['Widget Pro', '$49.99', '4.8/5', '456', 'In Stock'],
				['Gadget X', '$12.75', '3.1/5', '67', 'Limited Stock']
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
		
		tableHtml += `</tbody></table>`;
		
		tableHtml += `
			<div class="p-4 border-t bg-gray-50">
				<p class="text-sm text-gray-600 text-center">Showing all ${rows.length} rows</p>
			</div>`;
		
		document.getElementById('hot').innerHTML = tableHtml;
		
		// Initialize column resizing if available
		if (typeof addColumnResizing === 'function') {
			addColumnResizing();
		}
	}
})();


