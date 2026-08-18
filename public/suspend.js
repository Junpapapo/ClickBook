// 1. Parse Query Parameters
const params = new URLSearchParams(window.location.search);
const originalUrl = params.get('url') || 'https://google.com';

// Extract clean hostname for fallback and API requests
let domainName = '';
try {
  const urlObj = new URL(originalUrl);
  domainName = urlObj.hostname;
} catch (e) {
  domainName = originalUrl;
}

const originalTitle = params.get('title') || domainName;
const originalFavicon = params.get('favicon') || '';

// 2. 7개 국어 다국어 번역 매핑 (ClickBook 공식 지원 언어 100% 대응)
const translations = {
  en: {
    header: "Sleeping Tab | ClickBook",
    status: "This tab is sleeping to save system memory (RAM). Focus this window or click below to resume your session.",
    btn: "Resume Session",
    autoResume: "Auto resume on tab focus",
    footer: "ClickBook Premium"
  },
  ko: {
    header: "절전 모드 전환됨 | ClickBook",
    status: "이 탭은 시스템 메모리(RAM) 절약을 위해 절전 모드로 전환되었습니다. 페이지를 보려면 아래 복원 버튼을 클릭하세요.",
    btn: "세션 즉시 복원하기",
    autoResume: "탭을 선택하면 자동으로 복원",
    footer: "ClickBook Premium"
  },
  ja: {
    header: "一時停止中 | ClickBook",
    status: "このタブはシステムメモリ（RAM）を節約するため、一時停止されました。読み込むには下の復元ボタンをクリックしてください。",
    btn: "セッションを復元する",
    autoResume: "タブにフォーカスした際に自動復元",
    footer: "ClickBook Premium"
  },
  "zh-TW": {
    header: "休眠模式中 | ClickBook",
    status: "此分頁已進入休眠模式以節省系統記憶體 (RAM)。若要繼續瀏覽，請點擊下方恢復按鈕。",
    btn: "立即恢復連線",
    autoResume: "切換到此分頁時自動恢復",
    footer: "ClickBook Premium"
  },
  de: {
    header: "Ruhezustand | ClickBook",
    status: "Dieser Tab befindet sich im Ruhezustand, um Arbeitsspeicher (RAM) zu sparen. Klicken Sie unten, um die Sitzung fortzusetzen.",
    btn: "Sitzung wiederherstellen",
    autoResume: "Beim Fokussieren des Tabs automatisch fortsetzen",
    footer: "ClickBook Premium"
  },
  es: {
    header: "Pestaña en reposo | ClickBook",
    status: "Esta pestaña está en modo de ahorro para reducir el uso de memoria (RAM). Haz clic en el botón para reanudar la sesión.",
    btn: "Restaurar sesión",
    autoResume: "Reanudar automáticamente al enfocar la pestaña",
    footer: "ClickBook Premium"
  },
  fr: {
    header: "Onglet en veille | ClickBook",
    status: "Cet onglet est en veille afin d'économiser la mémoire (RAM). Cliquez ci-dessous pour reprendre votre session.",
    btn: "Restaurer la session",
    autoResume: "Reprendre automatiquement lors de la sélection",
    footer: "ClickBook Premium"
  }
};

// 3. 언어 해석 및 UI 갱신 함수
function applyLanguage(lang) {
  let langKey = lang || "en";
  if (!translations[langKey]) {
    if (langKey.startsWith("zh")) langKey = "zh-TW";
    else if (langKey.startsWith("ko")) langKey = "ko";
    else if (langKey.startsWith("ja")) langKey = "ja";
    else if (langKey.startsWith("de")) langKey = "de";
    else if (langKey.startsWith("es")) langKey = "es";
    else if (langKey.startsWith("fr")) langKey = "fr";
    else langKey = "en";
  }

  const t = translations[langKey] || translations.en;

  document.title = `${originalTitle} (${t.header})`;
  const titleEl = document.getElementById('title');
  if (titleEl) titleEl.textContent = originalTitle;

  const urlEl = document.getElementById('url');
  if (urlEl) {
    urlEl.textContent = originalUrl;
    urlEl.title = originalUrl;
  }

  const statusEl = document.getElementById('status-desc');
  if (statusEl) statusEl.textContent = t.status;

  const btnTextEl = document.getElementById('btn-text');
  if (btnTextEl) btnTextEl.textContent = t.btn;

  const autoResumeTextEl = document.getElementById('auto-resume-text');
  if (autoResumeTextEl) autoResumeTextEl.textContent = t.autoResume;

  const footerTextEl = document.getElementById('footer-text');
  if (footerTextEl) footerTextEl.textContent = t.footer;
}

// 4. 초기 언어 로드 (URL 파라미터 -> chrome.storage -> localStorage -> navigator.language 순서)
let initialLang = params.get('lang') || '';
if (!initialLang) {
  try {
    initialLang = localStorage.getItem('clickbook_lang') || '';
  } catch (e) {}
}

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get('clickbook_lang', (res) => {
    const activeLang = res.clickbook_lang || initialLang || (navigator.language || 'en');
    applyLanguage(activeLang);
  });
} else {
  applyLanguage(initialLang || (navigator.language || 'en'));
}

// 5. 파비콘 렌더링
if (originalFavicon) {
  document.getElementById('favicon').src = originalFavicon;
} else {
  try {
    document.getElementById('favicon').src = `https://www.google.com/s2/favicons?domain=${domainName}&sz=64`;
  } catch(e) {}
}

// 6. 복원(Resume) 함수
function resumeTab() {
  window.location.replace(originalUrl);
}

const resumeBtn = document.getElementById('resume-btn');
if (resumeBtn) {
  resumeBtn.addEventListener('click', resumeTab);
}

// 7. 자동 복원(Auto-Resume) 환경설정
const autoResumeCheckbox = document.getElementById('auto-resume');

if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get('clickbook_auto_resume', (res) => {
    if (autoResumeCheckbox) {
      autoResumeCheckbox.checked = res.clickbook_auto_resume === true;
    }
  });
} else {
  try {
    const stored = localStorage.getItem('clickbook_auto_resume');
    if (autoResumeCheckbox) {
      autoResumeCheckbox.checked = stored === 'true';
    }
  } catch (e) {}
}

if (autoResumeCheckbox) {
  autoResumeCheckbox.addEventListener('change', () => {
    const isChecked = autoResumeCheckbox.checked;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ clickbook_auto_resume: isChecked });
    } else {
      try {
        localStorage.setItem('clickbook_auto_resume', isChecked);
      } catch (e) {}
    }
  });
}

// 8. 탭 포커스 시 자동 복원
window.addEventListener('focus', () => {
  if (autoResumeCheckbox && autoResumeCheckbox.checked) {
    setTimeout(resumeTab, 100);
  }
});

// 9. 실시간 스토리지 변경 동기화 (언어 변경 및 자동복원 토글 즉각 반영)
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.clickbook_lang && changes.clickbook_lang.newValue) {
        applyLanguage(changes.clickbook_lang.newValue);
      }
      if (changes.clickbook_auto_resume && autoResumeCheckbox) {
        autoResumeCheckbox.checked = changes.clickbook_auto_resume.newValue === true;
      }
    }
  });
}

