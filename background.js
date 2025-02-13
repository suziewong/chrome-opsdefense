// 当扩展安装或更新时
chrome.runtime.onInstalled.addListener(() => {
  console.log('网页内容检查插件已安装/更新');
});

// 当用户点击扩展图标时，打开侧边栏
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});