document.addEventListener('DOMContentLoaded', () => {
  const toggleMultitab = document.getElementById('crx-toggle-multitab');
  const providerSelect = document.getElementById('crx-provider-select');
  const defaultKeyInput = document.getElementById('crx-default-key');
  const backupKeyInput = document.getElementById('crx-backup-key');
  const modelSelect = document.getElementById('crx-model-select');
  const toast = document.getElementById('status-toast');
  const text = document.getElementById('status-text');
  
  // Backup Key Container and Toggle Button
  const backupKeyContainer = document.getElementById('backup-key-container');
  const btnToggleBackupView = document.getElementById('btn-toggle-backup-view');

  // Eye buttons toggles
  setupEyeToggle('btn-toggle-default-key', 'crx-default-key');
  setupEyeToggle('btn-toggle-backup-key', 'crx-backup-key');

  let currentSettings = {};

  // Load from local storage
  chrome.storage.local.get([
    'multiTabEnabled',
    'aiProvider',
    'geminiDefaultKey',
    'geminiBackupKey',
    'geminiSelectedModel',
    'openrouterDefaultKey',
    'openrouterBackupKey',
    'openrouterSelectedModel'
  ], (res) => {
    currentSettings = res;
    
    // Multitab
    const multiTab = res.multiTabEnabled !== false;
    toggleMultitab.checked = multiTab;
    if (multiTab) toggleMultitab.parentElement.classList.add('checked');

    // Provider
    const provider = res.aiProvider || 'GEMINI';
    providerSelect.value = provider;

    // Load keys & models
    loadKeysAndFetchModels(provider);
  });

  // Helper to setup show/hide password
  function setupEyeToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
        } else {
          input.type = 'password';
        }
      });
    }
  }

  // Load keys from storage for current provider and fetch models list
  function loadKeysAndFetchModels(provider) {
    const defaultKey = provider === 'GEMINI' 
      ? (currentSettings.geminiDefaultKey || '') 
      : (currentSettings.openrouterDefaultKey || '');
    
    const backupKey = provider === 'GEMINI' 
      ? (currentSettings.geminiBackupKey || '') 
      : (currentSettings.openrouterBackupKey || '');

    defaultKeyInput.value = defaultKey;
    backupKeyInput.value = backupKey;

    // Check if backup key exists, show/hide container accordingly
    if (backupKey) {
      backupKeyContainer.classList.add('visible');
      btnToggleBackupView.textContent = '− Backup Key';
    } else {
      backupKeyContainer.classList.remove('visible');
      btnToggleBackupView.textContent = '+ Backup Key';
    }

    fetchModels(provider, defaultKey, backupKey);
  }

  // Fetch models list from background page
  function fetchModels(provider, defaultKey, backupKey) {
    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    
    chrome.runtime.sendMessage({
      type: 'FETCH_MODELS',
      provider: provider,
      defaultKey: defaultKey,
      backupKey: backupKey
    }, (res) => {
      modelSelect.innerHTML = '';
      
      const modelsList = res?.models || [];
      if (modelsList.length === 0) {
        modelSelect.innerHTML = '<option value="">No models available</option>';
        return;
      }

      modelsList.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
      });

      // Select active model
      const savedModel = provider === 'GEMINI' 
        ? currentSettings.geminiSelectedModel 
        : currentSettings.openrouterSelectedModel;

      if (savedModel && modelsList.includes(savedModel)) {
        modelSelect.value = savedModel;
      } else {
        // Default to first model
        modelSelect.value = modelsList[0];
        saveSelectedModel(provider, modelsList[0]);
      }
    });
  }

  function saveSelectedModel(provider, model) {
    if (provider === 'GEMINI') {
      currentSettings.geminiSelectedModel = model;
      chrome.storage.local.set({ geminiSelectedModel: model });
    } else {
      currentSettings.openrouterSelectedModel = model;
      chrome.storage.local.set({ openrouterSelectedModel: model });
    }
  }

  // Event Listeners
  toggleMultitab.addEventListener('change', () => {
    const isEnabled = toggleMultitab.checked;
    if (isEnabled) {
      toggleMultitab.parentElement.classList.add('checked');
    } else {
      toggleMultitab.parentElement.classList.remove('checked');
    }
    chrome.storage.local.set({ multiTabEnabled: isEnabled }, () => {
      showToast('Settings saved');
    });
  });

  providerSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    chrome.storage.local.set({ aiProvider: provider }, () => {
      currentSettings.aiProvider = provider;
      loadKeysAndFetchModels(provider);
      showToast('Settings saved');
    });
  });

  // Backup Key Container visibility toggle button listener
  btnToggleBackupView.addEventListener('click', () => {
    backupKeyContainer.classList.toggle('visible');
    if (backupKeyContainer.classList.contains('visible')) {
      btnToggleBackupView.textContent = '− Backup Key';
    } else {
      btnToggleBackupView.textContent = '+ Backup Key';
    }
  });

  // Save key on blur (change of focus)
  defaultKeyInput.addEventListener('blur', () => saveKeysAndRefresh());
  backupKeyInput.addEventListener('blur', () => saveKeysAndRefresh());

  function saveKeysAndRefresh() {
    const provider = providerSelect.value;
    const defVal = defaultKeyInput.value.trim();
    const backVal = backupKeyInput.value.trim();

    if (provider === 'GEMINI') {
      currentSettings.geminiDefaultKey = defVal;
      currentSettings.geminiBackupKey = backVal;
      chrome.storage.local.set({
        geminiDefaultKey: defVal,
        geminiBackupKey: backVal
      }, () => {
        fetchModels(provider, defVal, backVal);
        showToast('Settings saved');
      });
    } else {
      currentSettings.openrouterDefaultKey = defVal;
      currentSettings.openrouterBackupKey = backVal;
      chrome.storage.local.set({
        openrouterDefaultKey: defVal,
        openrouterBackupKey: backVal
      }, () => {
        fetchModels(provider, defVal, backVal);
        showToast('Settings saved');
      });
    }
  }

  modelSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    const model = modelSelect.value;
    saveSelectedModel(provider, model);
    showToast('Settings saved');
  });

  function showToast(message) {
    if (toast && text) {
      text.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2000);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'CLOSE_SIDE_PANEL') {
      window.close();
    }
  });
});
