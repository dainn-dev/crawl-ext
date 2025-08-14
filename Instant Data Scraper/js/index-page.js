(function () {
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

	// Event listeners
	menuToggle.addEventListener('click', openSidebar);
	closeSidebar.addEventListener('click', closeSidebarMenu);
	sidebarOverlay.addEventListener('click', closeSidebarMenu);
	openSettings.addEventListener('click', openSettingsModal);
	closeSettings.addEventListener('click', closeSettingsModal);
	cancelSettings.addEventListener('click', closeSettingsModal);
	settingsOverlay.addEventListener('click', closeSettingsModal);
	addSelector.addEventListener('click', addNewSelector);
	oauthRadio.addEventListener('change', switchAuthMethod);
	serviceRadio.addEventListener('change', switchAuthMethod);
	paginationNone.addEventListener('change', toggleCSSSelector);
	paginationCSS.addEventListener('change', toggleCSSSelector);
	paginationInfinite.addEventListener('change', toggleCSSSelector);
	privateKeyFile.addEventListener('change', function (e) {
		const file = e.target.files[0];
		fileName.textContent = file ? file.name : 'No file chosen';
	});
	saveSettings.addEventListener('click', function () {
		console.log('Settings saved!');
		closeSettingsModal();
	});
	document.addEventListener('click', function (e) {
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
			if (!settingsModal.classList.contains('hidden')) {
				closeSettingsModal();
			} else if (!sidebarMenu.classList.contains('-translate-x-full')) {
				closeSidebarMenu();
			}
		}
	});
	document.addEventListener('click', function (e) {
		if (e.target.classList.contains('fa-times') && e.target.closest('.crawl-history-remove')) {
			const historyItem = e.target.closest('.p-3.bg-gray-50.rounded-lg');
			if (historyItem) {
				historyItem.remove();
			}
		}
	});
	autoUploadDrive.addEventListener('change', toggleAuthMethodSection);
	enableWebhooks.addEventListener('change', toggleWebhookSettingsContent);
	document.addEventListener('DOMContentLoaded', function () {
		updateSelectorSuggestions();
	});
})();


