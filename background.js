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
    chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
  }
});
