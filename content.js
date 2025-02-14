// 获取元素的XPath路径，优化后的算法
function getXPath(element) {
    if (!element) return '';
    
    // 如果元素有id，直接返回id路径
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }
    
    // 如果元素有特定的class，使用class路径，但要确保是唯一的
    if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ').filter(c => c);
        if (classes.length > 0) {
            const elements = document.getElementsByClassName(classes[0]);
            if (elements.length === 1) {
                return `//*[contains(@class, "${classes[0]}")]`;
            }
        }
    }
    
    // 如果是body元素，直接返回body路径
    if (element === document.body) {
        return '/html/body';
    }

    // 获取元素在同类型兄弟节点中的位置
    let path = '';
    let current = element;
    while (current && current.parentNode) {
        let index = 1;
        let hasId = false;
        
        // 检查父元素是否有id
        if (current.parentNode.id) {
            path = `//*[@id="${current.parentNode.id}"]/${current.tagName.toLowerCase()}[${index}]`;
            break;
        }
        
        // 计算同类型节点的索引
        for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeType === 1 && sibling.tagName === current.tagName) {
                index++;
            }
        }
        
        const tagName = current.tagName.toLowerCase();
        path = `/${tagName}[${index}]${path}`;
        current = current.parentNode;
    }
    return path;
}

// 获取元素内容的函数
function getElementContent(element) {
    if (!element) return '';
    
    // 处理输入框和文本域
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        return element.value.trim();
    }
    
    // 处理下拉选择框
    if (element instanceof HTMLSelectElement) {
        return element.options[element.selectedIndex]?.text.trim() || '';
    }
    
    // 处理其他元素，返回文本内容
    return element.textContent.trim();
}

// 监听页面点击事件
document.addEventListener('click', function(event) {
    const element = event.target;
    const xpath = getXPath(element);
    const content = getElementContent(element);

    // 建立与background script的长连接
    let port = null;
    const connectToBackground = () => {
        try {
            port = chrome.runtime.connect({ name: 'content-script' });
            console.log('已建立与background的连接');

            port.onDisconnect.addListener(() => {
                console.log('与background的连接已断开，尝试重新连接...');
                port = null;
                setTimeout(connectToBackground, 1000);
            });
        } catch (error) {
            console.log('连接background失败:', error);
            setTimeout(connectToBackground, 1000);
        }
    };

    // 发送消息到background
    const sendMessage = () => {
        if (port) {
            port.postMessage({
                type: 'UPDATE_CONTENT',
                xpath: xpath,
                content: content
            });
            console.log('消息已发送到background');
        } else {
            console.log('连接未就绪，尝试重新建立连接...');
            connectToBackground();
        }
    };

    sendMessageWithRetry();

    // 只有在点击了输入框或按钮时才阻止默认行为
    if (element.tagName === 'INPUT' || element.tagName === 'BUTTON' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        event.preventDefault();
    }
}, true);

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ELEMENT_BY_XPATH') {
        try {
            // 验证XPath表达式的格式
            if (!message.xpath || !message.xpath.startsWith('/')) {
                sendResponse({
                    success: false,
                    error: '请输入有效的XPath表达式，以"/"开头'
                });
                return true;
            }

            const result = document.evaluate(
                message.xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            const element = result.singleNodeValue;
            
            if (element) {
                let content = '';
                // 根据元素类型获取内容
                if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                    content = element.value.trim();
                } else if (element instanceof HTMLSelectElement) {
                    content = element.options[element.selectedIndex]?.text.trim() || '';
                } else {
                    content = element.textContent.trim();
                }

                sendResponse({
                    success: true,
                    content: content,
                    elementType: element.tagName.toLowerCase(),
                    hasValue: element instanceof HTMLInputElement || 
                             element instanceof HTMLTextAreaElement || 
                             element instanceof HTMLSelectElement
                });
            } else {
                sendResponse({
                    success: false,
                    error: '未找到匹配的元素，请检查XPath路径是否正确'
                });
            }
        } catch (error) {
            sendResponse({
                success: false,
                error: `XPath表达式解析错误: ${error.message}`
            });
        }
    } else if (message.action === 'checkContent') {
        try {
            const rule = message.rule;
            let regex;
            try {
                // 处理特殊的正则表达式字符串
                const processedRule = rule.replace(/\\\//g, '/').replace(/^\/|\/$/, '');
                regex = new RegExp(processedRule);
            } catch (e) {
                sendResponse({
                    success: false,
                    error: '无效的正则表达式：' + e.message
                });
                return true;
            }

            // 获取页面所有文本内容
            const textNodes = document.evaluate(
                '//text()',
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );

            let violations = false;
            for (let i = 0; i < textNodes.snapshotLength; i++) {
                const node = textNodes.snapshotItem(i);
                const text = node.textContent.trim();
                if (text && regex.test(text)) {
                    violations = true;
                    break;
                }
            }

            sendResponse({
                success: true,
                violations: violations
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: '检查内容时发生错误：' + error.message
            });
        }
        return true;
    }
    return true;
});