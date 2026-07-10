const btnTranslate = document.getElementById('capture-btn');
const btnTable = document.getElementById('capture-table-btn');
const status = document.getElementById('status');
const donateToggleBtn = document.getElementById('donate-toggle-btn');
const donatePanel = document.getElementById('donate-panel');
const donateQr = document.getElementById('donate-qr');
const donateTitle = document.getElementById('donate-title');
const donateTip = document.getElementById('donate-tip');
const wechatPayBtn = document.getElementById('wechat-pay-btn');
const alipayPayBtn = document.getElementById('alipay-pay-btn');

const donateMethods = {
    wechat: {
        src: 'drink-coffee/收款码.png',
        alt: '微信收款码',
        title: '微信扫码打赏',
        tip: '打开手机扫一扫即可'
    },
    alipay: {
        src: 'drink-coffee/支付宝收款码.jpg',
        alt: '支付宝收款码',
        title: '支付宝扫码打赏',
        tip: '支持支付宝扫码赞助'
    }
};

function updateDonateView(method) {
    const config = donateMethods[method];
    if (!config) return;

    donateQr.src = config.src;
    donateQr.alt = config.alt;
    donateTitle.textContent = config.title;
    donateTip.textContent = config.tip;

    wechatPayBtn.classList.toggle('active', method === 'wechat');
    alipayPayBtn.classList.toggle('active', method === 'alipay');
}

async function injectAndRun(mode) {
    btnTranslate.disabled = true;
    if (btnTable) btnTable.disabled = true;
    status.textContent = '⏳ 正在启动截图模式...';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) throw new Error('无法获取当前标签页');

        // NOTE: 浏览器内部页面不允许注入脚本
        if (tab.url && (
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('https://chrome.google.com/webstore')
        )) {
            throw new Error('无法在浏览器内部页面使用此功能');
        }

        // NOTE: 注入全局变量，让 content.js 知道当前是哪个按钮触发的
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (m) => { window.__CAPTURE_MODE = m; },
            args: [mode]
        });

        // NOTE: 注入 Excel 库和核心界面交互逻辑
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['xlsx.full.min.js', 'content.js']
        });

        // 注入成功后关闭 popup，用户在页面上操作
        window.close();
    } catch (error) {
        status.textContent = '❌ 错误：' + error.message;
        btnTranslate.disabled = false;
        if (btnTable) btnTable.disabled = false;
    }
}

btnTranslate.addEventListener('click', () => injectAndRun('translate'));
if (btnTable) btnTable.addEventListener('click', () => injectAndRun('table'));

if (donateToggleBtn && donatePanel) {
    donateToggleBtn.addEventListener('click', () => {
        const isHidden = donatePanel.classList.toggle('hidden');
        donateToggleBtn.textContent = isHidden ? '☕ 请作者喝杯咖啡' : '🙌 收起打赏码';
    });
}

if (wechatPayBtn) {
    wechatPayBtn.addEventListener('click', () => updateDonateView('wechat'));
}

if (alipayPayBtn) {
    alipayPayBtn.addEventListener('click', () => updateDonateView('alipay'));
}

updateDonateView('wechat');
