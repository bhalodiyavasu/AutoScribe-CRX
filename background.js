chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['data.js', 'content.js'],
    });
  } catch (e) {
    console.error('[CopilotX]', e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'COPILOTX_DONE' && sender.tab?.id) {
    const count = msg.count ?? 0;
    // Set badge with fill count
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId: sender.tab.id });
    chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: sender.tab.id });

    // Auto-clear badge after 5 seconds
    if (count > 0) {
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId: sender.tab.id }).catch(() => {});
      }, 5000);
    }
  }
});
