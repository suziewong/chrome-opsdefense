document.addEventListener('DOMContentLoaded', () => {
  const collapseBtn = document.querySelector('.collapse-btn');
  const container = document.querySelector('.container');
  const checkButton = document.getElementById('checkButton');
  const ruleInput = document.getElementById('ruleInput');
  const statusMessage = document.getElementById('statusMessage');

  // 折叠/展开功能
  collapseBtn.addEventListener('click', () => {
    container.style.display = container.style.display === 'none' ? 'flex' : 'none';
  });

  // 检查按钮点击事件
  checkButton.addEventListener('click', async () => {
    const rule = ruleInput.value.trim();
    if (!rule) {
      showStatus('请输入检查规则', 'error');
      return;
    }

    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        showStatus('无法获取当前标签页', 'error');
        return;
      }

      // 确保content script已注入
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      // 发送消息给content script进行内容检查
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'checkContent',
        rule: rule
      });


      if (response.violations) {
        showStatus('发现违规内容！', 'error');
      } else {
        showStatus('未发现违规内容', 'success');
      }
    } catch (error) {
      showStatus('检查过程出错：' + error.message, 'error');
    }
  });

  // 显示状态信息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
  }
});