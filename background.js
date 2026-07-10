chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'capture-tab') {
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, (imageData) => {
            // NOTE: 在浏览器内部页面等受限环境中，截图会失败
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ imageData: imageData });
            }
        });
        return true;
    }
});