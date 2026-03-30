// Marketing Command Center - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Marketing Command Center installed');
  
  chrome.storage.local.set({
    settings: {
      shortcuts: {
        scanAll: 'Ctrl+Shift+S',
        openPanel: 'Ctrl+Shift+M'
      },
      autoScan: false,
      notifications: true
    }
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openCommandCenter') {
    chrome.action.openPopup();
  }
  return true;
});

// Badge update
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const results = await chrome.tabs.sendMessage(activeInfo.tabId, { action: 'quickScan' });
    if (results) {
      const count = (results.ctas?.length || 0) + (results.emails?.length || 0);
      chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    }
  } catch (e) {
    chrome.action.setBadgeText({ text: '' });
  }
});
