const btnTranslate = document.getElementById('capture-btn');
const btnTable = document.getElementById('capture-table-btn');
const status = document.getElementById('status');
const mainTitle = document.getElementById('main-title');
const languageSelect = document.getElementById('language-select');
const supportText = document.getElementById('support-text');

const translations = {
    'zh-CN': {
        title: '📸 截图翻译与表格',
        captureBtn: '🖱️ 截图并翻译',
        tableBtn: '📊 截取表格转Excel',
        supportText: '如果这个插件对你有帮助，欢迎支持一下。',
        statusLoading: '⏳ 正在启动截图模式...',
        statusErrorPrefix: '❌ 错误：',
        errorNoTab: '无法获取当前标签页',
        errorInternalPage: '无法在浏览器内部页面使用此功能'
    },
    'en-US': {
        title: '📸 Screenshot Translate & Table',
        captureBtn: '🖱️ Screenshot & Translate',
        tableBtn: '📊 Capture Table to Excel',
        supportText: 'If this extension helps you, consider supporting via PayPal.',
        statusLoading: '⏳ Starting screenshot mode...',
        statusErrorPrefix: '❌ Error: ',
        errorNoTab: 'Unable to get current tab',
        errorInternalPage: 'Cannot use on browser internal pages'
    },
    'de-DE': {
        title: '📸 Screenshot Übersetzung & Tabelle',
        captureBtn: '🖱️ Screenshot & Übersetzen',
        tableBtn: '📊 Tabelle erfassen & zu Excel',
        supportText: 'Wenn diese Erweiterung hilfreich ist, unterstütze mich bitte via PayPal.',
        statusLoading: '⏳ Screenshot-Modus wird gestartet...',
        statusErrorPrefix: '❌ Fehler: ',
        errorNoTab: 'Aktueller Tab kann nicht abgerufen werden',
        errorInternalPage: 'Funktioniert nicht auf internen Browser-Seiten'
    },
    'fr-FR': {
        title: '📸 Traduction & Table par Capture',
        captureBtn: '🖱️ Capturer & Traduire',
        tableBtn: '📊 Capturer Table vers Excel',
        supportText: 'Si cette extension vous aide, soutenez-moi via PayPal.',
        statusLoading: '⏳ Démarrage du mode capture...',
        statusErrorPrefix: '❌ Erreur: ',
        errorNoTab: 'Impossible d\'obtenir l\'onglet actuel',
        errorInternalPage: 'Ne fonctionne pas sur les pages internes du navigateur'
    },
    'es-ES': {
        title: '📸 Captura, Traducción & Tabla',
        captureBtn: '🖱️ Capturar y Traducir',
        tableBtn: '📊 Capturar Tabla a Excel',
        supportText: 'Si esta extensión te ayuda, apóyame via PayPal.',
        statusLoading: '⏳ Iniciando modo captura...',
        statusErrorPrefix: '❌ Error: ',
        errorNoTab: 'No se puede obtener la pestaña actual',
        errorInternalPage: 'No funciona en páginas internas del navegador'
    },
    'ja-JP': {
        title: '📸 スクリーンショット翻訳 & 表',
        captureBtn: '🖱️ スクリーンショットして翻訳',
        tableBtn: '📊 表をキャプチャしてExcelに',
        supportText: 'この拡張機能が役立ったら、PayPalで支援していただけると助かります。',
        statusLoading: '⏳ スクリーンショットモードを起動中...',
        statusErrorPrefix: '❌ エラー: ',
        errorNoTab: '現在のタブを取得できません',
        errorInternalPage: 'ブラウザの内部ページでは使用できません'
    },
    'ko-KR': {
        title: '📸 스크린샷 번역 & 표',
        captureBtn: '🖱️ 스크린샷 번역',
        tableBtn: '📊 표 캡처하여 Excel로',
        supportText: '이 확장 프로그램이 도움이 되었다면 PayPal로 지원해 주세요.',
        statusLoading: '⏳ 스크린샷 모드 시작 중...',
        statusErrorPrefix: '❌ 오류: ',
        errorNoTab: '현재 탭을 가져올 수 없습니다',
        errorInternalPage: '브라우저 내부 페이지에서는 사용할 수 없습니다'
    },
    'ru-RU': {
        title: '📸 Перевод скриншотов & Таблицы',
        captureBtn: '🖱️ Скриншот & Перевод',
        tableBtn: '📊 Сохранить таблицу в Excel',
        supportText: 'Если это расширение вам помогло, поддержите меня через PayPal.',
        statusLoading: '⏳ Запуск режима скриншотов...',
        statusErrorPrefix: '❌ Ошибка: ',
        errorNoTab: 'Не удалось получить текущую вкладку',
        errorInternalPage: 'Не работает на внутренних страницах браузера'
    }
};

let currentLanguage = 'zh-CN';

function updateLanguage(lang) {
    const t = translations[lang] || translations['zh-CN'];
    currentLanguage = lang;
    mainTitle.textContent = t.title;
    btnTranslate.textContent = t.captureBtn;
    btnTable.textContent = t.tableBtn;
    supportText.textContent = t.supportText;
}

async function saveLanguage(lang) {
    try {
        await chrome.storage.local.set({ 'language': lang });
    } catch (e) {
        console.error('Failed to save language:', e);
    }
}

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

btnTranslate.addEventListener('click', () => injectAndRun('translate'));
if (btnTable) btnTable.addEventListener('click', () => injectAndRun('table'));

if (languageSelect) {
    languageSelect.addEventListener('change', async (e) => {
        const lang = e.target.value;
        updateLanguage(lang);
        await saveLanguage(lang);
    });
}

async function init() {
    const savedLang = await loadLanguage();
    languageSelect.value = savedLang;
    updateLanguage(savedLang);
}

init();
