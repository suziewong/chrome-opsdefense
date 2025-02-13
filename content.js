// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkContent') {
    const rule = request.rule;
    const pageContent = document.body.innerText;
    
    // 检查页面内容是否包含违规内容
    const hasViolation = pageContent.includes(rule);
    
    // 如果发现违规内容，显示提醒
    if (hasViolation) {
      // 创建提醒框
      const alertDiv = document.createElement('div');
      alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px;
        background-color: #fce8e6;
        color: #d93025;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 9999;
        font-family: -apple-system, system-ui, sans-serif;
      `;
      alertDiv.textContent = '违反检查规则';
      
      // 添加到页面
      document.body.appendChild(alertDiv);
      
      // 3秒后自动移除提醒
      setTimeout(() => {
        alertDiv.remove();
      }, 3000);
    }
    
    // 返回检查结果
    sendResponse({ violations: hasViolation });
    return true; // 保持消息通道开放
  }
});