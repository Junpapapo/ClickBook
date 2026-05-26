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

// 2. Localized Text mapping
const translations = {
  en: {
    header: "Sleeping Tab | ClickBook",
    status: "This tab is sleeping to save system memory (RAM). Focus this window or click below to resume your session.",
    btn: "Resume Session",
    autoResume: "Auto resume on tab focus",
    footer: "Back to ClickBook"
  },
  ko: {
    header: "절전 모드 전환됨 | ClickBook",
    status: "이 탭은 시스템 메모리(RAM) 절약을 위해 절전 모드로 전환되었습니다. 페이지를 보려면 아래 복원 버튼을 클릭하세요.",
    btn: "세션 즉시 복원하기",
    autoResume: "탭을 선택하면 자동으로 복원",
    footer: "ClickBook 대시보드로 이동"
  },
  ja: {
    header: "一時停止中 | ClickBook",
    status: "このタブはシステムメモリ（RAM）を節約するため、一時停止されました。読み込むには下の復元ボタンをクリックしてください。",
    btn: "セッションを復元する",
    autoResume: "タブにフォーカスした際に自動復元",
    footer: "ClickBookダッシュボードへ"
  }
};

// 3. Language Detection
const langCode = (navigator.language || 'en').slice(0, 2);
const t = translations[langCode] || translations.en;

// Apply Localized Texts
document.title = `${originalTitle} (${t.header})`;
document.getElementById('title').textContent = originalTitle;

const urlEl = document.getElementById('url');
urlEl.textContent = originalUrl;
urlEl.title = originalUrl; // Tooltip for full URL

document.getElementById('status-desc').textContent = t.status;
document.getElementById('btn-text').textContent = t.btn;
document.getElementById('auto-resume-text').textContent = t.autoResume;

if (originalFavicon) {
  document.getElementById('favicon').src = originalFavicon;
} else {
  // Fallback favicon generator if possible
  try {
    document.getElementById('favicon').src = `https://www.google.com/s2/favicons?domain=${domainName}&sz=64`;
  } catch(e) {}
}

// 4. Resume function
function resumeTab() {
  window.location.replace(originalUrl);
}

document.getElementById('resume-btn').addEventListener('click', resumeTab);

// 5. Handle preferences (Auto-Resume)
const autoResumeCheckbox = document.getElementById('auto-resume');

// Load preference from chrome storage if available, fallback to local storage
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get('clickbook_auto_resume', (res) => {
    autoResumeCheckbox.checked = res.clickbook_auto_resume === true; // Default to false!
  });
} else {
  const stored = localStorage.getItem('clickbook_auto_resume');
  autoResumeCheckbox.checked = stored === 'true'; // Default to false!
}

autoResumeCheckbox.addEventListener('change', () => {
  const isChecked = autoResumeCheckbox.checked;
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ clickbook_auto_resume: isChecked });
  } else {
    localStorage.setItem('clickbook_auto_resume', isChecked);
  }
});

// 6. Focus event listener for auto-resume
window.addEventListener('focus', () => {
  if (autoResumeCheckbox.checked) {
    // Debounce slightly to allow UI rendering
    setTimeout(resumeTab, 100);
  }
});

// 7. Sync storage changes in real-time
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.clickbook_auto_resume) {
      autoResumeCheckbox.checked = changes.clickbook_auto_resume.newValue === true;
    }
  });
}

