document.addEventListener('DOMContentLoaded', () => {
  // 建立与background script的连接
  const port = chrome.runtime.connect({ name: 'sidepanel' });

  // 监听来自background script的消息
  port.onMessage.addListener((message) => {
    if (message.type === 'UPDATE_CONTENT') {
      selectorInput.value = message.xpath;
      contentDisplay.value = message.content;
      showStatus('已自动更新选择器和内容', 'success');
    }
  });

  const collapseBtn = document.querySelector('.collapse-btn');
  const container = document.querySelector('.container');
  const checkButton = document.getElementById('checkButton');
  const ruleInput = document.getElementById('ruleInput');
  const statusMessage = document.getElementById('statusMessage');
  const extractButton = document.getElementById('extractButton');
  const selectorInput = document.getElementById('selectorInput');
  const contentDisplay = document.getElementById('contentDisplay');
  const selectorType = document.getElementById('selectorType');

  // 折叠/展开功能
  collapseBtn.addEventListener('click', () => {
    container.style.display = container.style.display === 'none' ? 'flex' : 'none';
  });

  // 提取内容按钮点击事件
  extractButton.addEventListener('click', async () => {
    const selector = selectorInput.value.trim();
    if (!selector) {
      showStatus('请输入选择器', 'error');
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
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (error) {
        if (error.message.includes('Cannot access contents of url')) {
          showStatus('无法在此页面执行内容提取', 'error');
          return;
        }
      }

      // 添加重试机制
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'GET_ELEMENT_BY_XPATH',
            xpath: selector
          });

          if (response.success) {
            contentDisplay.value = response.content;
            showStatus(`成功获取${response.elementType}元素的内容`, 'success');
            return;
          } else {
            showStatus(response.error, 'error');
            contentDisplay.value = '';
            return;
          }
        } catch (error) {
          retries--;
          if (retries === 0) {
            showStatus('内容提取失败，请确保页面已加载完成', 'error');
            contentDisplay.value = '';
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      showStatus('内容提取失败：' + error.message, 'error');
      contentDisplay.value = '';
    }
  });

  // 检查按钮点击事件
  checkButton.addEventListener('click', async () => {
    const rule = ruleInput.value.trim();
    const content = contentDisplay.value.trim();

    if (!rule) {
      showStatus('请输入检查规则', 'error');
      return;
    }

    if (!content) {
      showStatus('请先提取需要检查的内容', 'error');
      return;
    }

    try {
      // 处理正则表达式
      let regex;
      try {
        // 提取正则表达式的标志
        const flags = rule.match(/\/([gimuy]*)$/)?.[1] || '';
        // 提取正则表达式的模式部分
        const pattern = rule.replace(/^\/|\/[gimuy]*$/g, '');
        regex = new RegExp(pattern, flags);
      } catch (e) {
        showStatus('无效的正则表达式：' + e.message, 'error');
        return;
      }

      // 检查内容是否匹配规则
      const matches = content.match(regex);
      if (matches) {
        showStatus(`发现违规内容！找到 ${matches.length} 处匹配：${matches.join(', ')}`, 'error');
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