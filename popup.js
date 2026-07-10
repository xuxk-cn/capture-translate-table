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
const mainTitle = document.getElementById('main-title');
const languageSelect = document.getElementById('language-select');
const supportText = document.querySelector('.support-text');

// 多语言翻译数据
const translations = {
    'zh-CN': {
        title: '📸 截图翻译与表格',
        captureBtn: '🖱️ 截图并翻译',
        tableBtn: '📊 截取表格转Excel',
        donateBtn: '☕ 请作者喝杯咖啡',
        donateBtnCollapse: '🙌 收起打赏码',
        supportText: '如果这个插件对你有帮助，欢迎扫码支持一下，能让我继续把它打磨得更顺手。',
        wechat: '微信',
        alipay: '支付宝',
        wechatTitle: '微信扫码打赏',
        wechatTip: '打开手机扫一扫即可',
        alipayTitle: '支付宝扫码打赏',
        alipayTip: '支持支付宝扫码赞助',
        statusLoading: '⏳ 正在启动截图模式...',
        statusErrorPrefix: '❌ 错误：',
        errorNoTab: '无法获取当前标签页',
        errorInternalPage: '无法在浏览器内部页面使用此功能'
    },
    'en-US': {
        title: '📸 Screenshot Translate & Table',
        captureBtn: '🖱️ Screenshot & Translate',
        tableBtn: '📊 Capture Table to Excel',
        donateBtn: '☕ Buy Me a Coffee',
        donateBtnCollapse: '🙌 Hide QR Code',
        supportText: 'If this extension helps you, please consider supporting me with a QR code to keep improving it.',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'WeChat QR Code',
        wechatTip: 'Scan with WeChat',
        alipayTitle: 'Alipay QR Code',
        alipayTip: 'Scan with Alipay',
        statusLoading: '⏳ Starting screenshot mode...',
        statusErrorPrefix: '❌ Error: ',
        errorNoTab: 'Unable to get current tab',
        errorInternalPage: 'Cannot use on browser internal pages'
    },
    'de-DE': {
        title: '📸 Screenshot Übersetzung & Tabelle',
        captureBtn: '🖱️ Screenshot & Übersetzen',
        tableBtn: '📊 Tabelle erfassen & zu Excel',
        donateBtn: '☕ Kaffee spendieren',
        donateBtnCollapse: '🙌 QR-Code ausblenden',
        supportText: 'Wenn diese Erweiterung hilfreich ist, unterstütze mich bitte mit einem QR-Code, um sie weiter zu verbessern.',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'WeChat QR-Code',
        wechatTip: 'Mit WeChat scannen',
        alipayTitle: 'Alipay QR-Code',
        alipayTip: 'Mit Alipay scannen',
        statusLoading: '⏳ Screenshot-Modus wird gestartet...',
        statusErrorPrefix: '❌ Fehler: ',
        errorNoTab: 'Aktueller Tab kann nicht abgerufen werden',
        errorInternalPage: 'Funktioniert nicht auf internen Browser-Seiten'
    },
    'fr-FR': {
        title: '📸 Traduction & Table par Capture',
        captureBtn: '🖱️ Capturer & Traduire',
        tableBtn: '📊 Capturer Table vers Excel',
        donateBtn: '☕ Offrir un café',
        donateBtnCollapse: '🙌 Cacher le QR code',
        supportText: 'Si cette extension vous aide, soutenez-moi avec un QR code pour l\'améliorer.',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'QR Code WeChat',
        wechatTip: 'Scanner avec WeChat',
        alipayTitle: 'QR Code Alipay',
        alipayTip: 'Scanner avec Alipay',
        statusLoading: '⏳ Démarrage du mode capture...',
        statusErrorPrefix: '❌ Erreur: ',
        errorNoTab: 'Impossible d\'obtenir l\'onglet actuel',
        errorInternalPage: 'Ne fonctionne pas sur les pages internes du navigateur'
    },
    'es-ES': {
        title: '📸 Captura, Traducción & Tabla',
        captureBtn: '🖱️ Capturar y Traducir',
        tableBtn: '📊 Capturar Tabla a Excel',
        donateBtn: '☕ Invitar un café',
        donateBtnCollapse: '🙌 Ocultar QR',
        supportText: 'Si esta extensión te ayuda, apóyame con un código QR para seguir mejorándola.',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'QR de WeChat',
        wechatTip: 'Escanea con WeChat',
        alipayTitle: 'QR de Alipay',
        alipayTip: 'Escanea con Alipay',
        statusLoading: '⏳ Iniciando modo captura...',
        statusErrorPrefix: '❌ Error: ',
        errorNoTab: 'No se puede obtener la pestaña actual',
        errorInternalPage: 'No funciona en páginas internas del navegador'
    },
    'ja-JP': {
        title: '📸 スクリーンショット翻訳 & 表',
        captureBtn: '🖱️ スクリーンショットして翻訳',
        tableBtn: '📊 表をキャプチャしてExcelに',
        donateBtn: '☕ コーヒーをおごる',
        donateBtnCollapse: '🙌 QRコードを隠す',
        supportText: 'この拡張機能が役立ったら、QRコードで支援していただけると開発が続けられます。',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'WeChat QRコード',
        wechatTip: 'WeChatでスキャン',
        alipayTitle: 'Alipay QRコード',
        alipayTip: 'Alipayでスキャン',
        statusLoading: '⏳ スクリーンショットモードを起動中...',
        statusErrorPrefix: '❌ エラー: ',
        errorNoTab: '現在のタブを取得できません',
        errorInternalPage: 'ブラウザの内部ページでは使用できません'
    },
    'ko-KR': {
        title: '📸 스크린샷 번역 & 표',
        captureBtn: '🖱️ 스크린샷 번역',
        tableBtn: '📊 표 캡처하여 Excel로',
        donateBtn: '☕ 커피 사주기',
        donateBtnCollapse: '🙌 QR 코드 숨기기',
        supportText: '이 확장 프로그램이 도움이 되었다면, QR 코드로 지원해 주시면 계속 개선할 수 있습니다.',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'WeChat QR 코드',
        wechatTip: 'WeChat으로 스캔',
        alipayTitle: 'Alipay QR 코드',
        alipayTip: 'Alipay로 스캔',
        statusLoading: '⏳ 스크린샷 모드 시작 중...',
        statusErrorPrefix: '❌ 오류: ',
        errorNoTab: '현재 탭을 가져올 수 없습니다',
        errorInternalPage: '브라우저 내부 페이지에서는 사용할 수 없습니다'
    },
    'ru-RU': {
        title: '📸 Перевод скриншотов & Таблицы',
        captureBtn: '🖱️ Скриншот & Перевод',
        tableBtn: '📊 Сохранить таблицу в Excel',
        donateBtn: '☕ Купить кофе',
        donateBtnCollapse: '🙌 Скрыть QR код',
        supportText: 'Если это расширение вам помогло, поддержите меня QR кодом, чтобы я мог и дальше улучшать его.',
        wechat: 'WeChat',
        alipay: 'Alipay',
        wechatTitle: 'QR код WeChat',
        wechatTip: 'Сканировать в WeChat',
        alipayTitle: 'QR код Alipay',
        alipayTip: 'Сканировать в Alipay',
        statusLoading: '⏳ Запуск режима скриншотов...',
        statusErrorPrefix: '❌ Ошибка: ',
        errorNoTab: 'Не удалось получить текущую вкладку',
        errorInternalPage: 'Не работает на внутренних страницах браузера'
    }
};

const donateMethods = {
    wechat: {
        src: '微信收款码.png',
        alt: '微信收款码'
    },
    alipay: {
        src: '支付宝收款码.jpg',
        alt: '支付宝收款码'
    }
};

let currentLanguage = 'zh-CN';
let donatePanelHidden = true;
let currentPayMethod = 'wechat';

// 更新界面语言
function updateLanguage(lang) {
    const t = translations[lang] || translations['zh-CN'];
    currentLanguage = lang;
    
    mainTitle.textContent = t.title;
    btnTranslate.textContent = t.captureBtn;
    btnTable.textContent = t.tableBtn;
    donateToggleBtn.textContent = donatePanelHidden ? t.donateBtn : t.donateBtnCollapse;
    supportText.textContent = t.supportText;
    wechatPayBtn.textContent = t.wechat;
    alipayPayBtn.textContent = t.alipay;
    
    updateDonateView(currentPayMethod, t);
}

// 更新打赏界面
function updateDonateView(method, t) {
    currentPayMethod = method;
    const config = donateMethods[method];
    if (!config) return;
    
    t = t || translations[currentLanguage];
    
    donateQr.src = config.src;
    donateQr.alt = config.alt;
    
    if (method === 'wechat') {
        donateTitle.textContent = t.wechatTitle;
        donateTip.textContent = t.wechatTip;
    } else {
        donateTitle.textContent = t.alipayTitle;
        donateTip.textContent = t.alipayTip;
    }
    
    wechatPayBtn.classList.toggle('active', method === 'wechat');
    alipayPayBtn.classList.toggle('active', method === 'alipay');
}

// 保存语言选择到存储
async function saveLanguage(lang) {
    try {
        await chrome.storage.local.set({ 'language': lang });
    } catch (e) {
        console.error('Failed to save language:', e);
    }
}

// 从存储读取语言选择
async function loadLanguage() {
    try {
        const result = await chrome.storage.local.get('language');
        if (result.language && translations[result.language]) {
            return result.language;
        }
    } catch (e) {
        console.error('Failed to load language:', e);
    }
    return 'zh-CN';
}

// 截图和处理逻辑
async function injectAndRun(mode) {
    const t = translations[currentLanguage];
    
    btnTranslate.disabled = true;
    if (btnTable) btnTable.disabled = true;
    status.textContent = t.statusLoading;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) throw new Error(t.errorNoTab);

        if (tab.url && (
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('https://chrome.google.com/webstore')
        )) {
            throw new Error(t.errorInternalPage);
        }

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (m) => { window.__CAPTURE_MODE = m; },
            args: [mode]
        });

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['xlsx.full.min.js', 'content.js']
        });

        window.close();
    } catch (error) {
        status.textContent = t.statusErrorPrefix + error.message;
        btnTranslate.disabled = false;
        if (btnTable) btnTable.disabled = false;
    }
}

// 事件监听
btnTranslate.addEventListener('click', () => injectAndRun('translate'));
if (btnTable) btnTable.addEventListener('click', () => injectAndRun('table'));

if (donateToggleBtn && donatePanel) {
    donateToggleBtn.addEventListener('click', () => {
        donatePanelHidden = donatePanel.classList.toggle('hidden');
        const t = translations[currentLanguage];
        donateToggleBtn.textContent = donatePanelHidden ? t.donateBtn : t.donateBtnCollapse;
    });
}

if (wechatPayBtn) {
    wechatPayBtn.addEventListener('click', () => updateDonateView('wechat'));
}

if (alipayPayBtn) {
    alipayPayBtn.addEventListener('click', () => updateDonateView('alipay'));
}

if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
        const lang = e.target.value;
        updateLanguage(lang);
        await saveLanguage(lang);
    });
}

// 初始化
async function init() {
    const savedLang = await loadLanguage();
    languageSelect.value = savedLang;
    updateLanguage(savedLang);
}

init();
