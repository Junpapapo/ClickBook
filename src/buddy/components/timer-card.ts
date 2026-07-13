import { t } from "../i18n";
import { getBuddyState, updateBuddyState, addBuddyXp } from "../buddy-state";
import { triggerTimerCompleteEffect } from "./timer-effect";
import { isContextInvalidated, playCharacterSound } from "../buddy-utils";

// Module-level persistent timer state (acts as cache)
let timerIntervalId: any = null;
let remainingSeconds = 0;
let totalSeconds = 0;
let timerStatus: "idle" | "running" | "paused" = "idle";
let timerMessage = "";
let savedMinutesInput = 25; // Default preset
let focusDurationMinutes = 25; // User configured focus minutes
let isPomodoroMode = false;
let isReversePomodoro = false; // 뽀모도로 리버스 모드 활성화 여부
let savedTimerGoal = ""; // 집중 목표 원본 텍스트 보존 캐시
let isSoundEnabled = true;
let isDndMode = false;
let asmrType: "off" | "rain" | "metronome" = "off";
let asmrSourceNode: AudioBufferSourceNode | null = null;
let asmrContext: AudioContext | null = null;
let pomodoroPhase: "focus" | "break" | "none" = "none";
let timerCompleteTheme: "night" | "forest" | "ocean" | "fireplace" | "sunset" | "random" = "night";
let cachedShadowRoot: ShadowRoot | null = null;

// Callbacks to update UI when panel is active
let currentTickCallback: (() => void) | null = null;
let currentCompleteCallback: (() => void) | null = null;

// Web Audio API Sound Synthesizer
function playChimeSound(type: "complete" | "break"): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "complete") {
      // 맑은 C코드 아르페지오 (C4, E4, G4, C5)
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.8);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.85);
      });
    } else {
      // 휴식 완료: 부드럽고 가벼운 알림 (E4, A4)
      const notes = [329.63, 440.00];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.6);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.65);
      });
    }
  } catch (e) {
    console.warn("[Timer Sound] AudioContext failed to initialize or play:", e);
  }
}

function cleanupTimerInterval(): void {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

export function renderTimerCard(parent: HTMLElement, shadow: ShadowRoot): void {
  cachedShadowRoot = shadow;
  parent.innerHTML = "";

  // Sync module local variables with global state in case of panel reopened
  const s = getBuddyState();
  timerStatus = s.timerStatus;
  remainingSeconds = s.timerRemaining;
  totalSeconds = s.timerTotal;
  timerMessage = s.timerMessage;
  isPomodoroMode = s.isPomodoroMode ?? false;
  isReversePomodoro = s.isReversePomodoro ?? false;
  isSoundEnabled = s.isSoundEnabled ?? true;
  pomodoroPhase = s.pomodoroPhase ?? "none";
  let focusRandomTheme = s.focusRandomTheme ?? false;
  if (s.config) {
    if (s.config.isPomodoroMode !== undefined) isPomodoroMode = s.config.isPomodoroMode;
    if (s.config.isReversePomodoro !== undefined) isReversePomodoro = s.config.isReversePomodoro;
    if (s.config.isSoundEnabled !== undefined) isSoundEnabled = s.config.isSoundEnabled;
    if (s.config.isDndMode !== undefined) isDndMode = s.config.isDndMode;
    if (s.config.asmrType !== undefined) asmrType = s.config.asmrType;
    if (s.config.timerCompleteTheme !== undefined) timerCompleteTheme = s.config.timerCompleteTheme;
    if (s.config.focusRandomTheme !== undefined) focusRandomTheme = s.config.focusRandomTheme;
  }

  if (focusRandomTheme) {
    timerCompleteTheme = "random";
  }

  // 전체 컨테이너 생성
  const container = document.createElement("div");
  container.id = "timer-card-container";
  container.className = "timer-card-container";
  parent.appendChild(container);

  // 통계 사이드 패널 생성
  const statsPanel = document.createElement("div");
  statsPanel.className = "timer-stats-drawer";
  container.appendChild(statsPanel);

  // 타이머 메인 뷰 영역 컨테이너 생성
  const mainView = document.createElement("div");
  mainView.className = "timer-main-view";
  container.appendChild(mainView);

  // Define UI update callbacks
  currentTickCallback = () => {
    if (!mainView.isConnected) return; // Skip if card DOM was unmounted
    updateExecutionUI(mainView);
  };

  currentCompleteCallback = () => {
    if (!mainView.isConnected) return;
    renderSetupView(mainView, shadow, statsPanel);
  };

  // Dispatch initial view based on persistent state
  if (timerStatus === "idle") {
    renderSetupView(mainView, shadow, statsPanel);
  } else {
    renderExecutionView(mainView, shadow, statsPanel);
  }

  // 사이드 패널 초기화 렌더링
  renderStatsPanel(statsPanel, parent);
}

// 1. SETUP VIEW
function renderSetupView(container: HTMLElement, shadow: ShadowRoot, statsPanel: HTMLElement): void {
  container.innerHTML = "";

  // Title / Target Message input
  const inputGroup = document.createElement("div");
  inputGroup.className = "timer-input-group";

  const messageInput = document.createElement("input");
  messageInput.type = "text";
  messageInput.className = "timer-message-input";
  messageInput.placeholder = t("timerPlaceholder") || "Write your focus goal...";
  messageInput.value = timerMessage;
  messageInput.maxLength = 50;
  messageInput.addEventListener("input", () => {
    timerMessage = messageInput.value;
    updateBuddyState({ timerMessage });
  });
  inputGroup.appendChild(messageInput);
  container.appendChild(inputGroup);

  // Presets (Quick select chips)
  const presetsGroup = document.createElement("div");
  presetsGroup.className = "timer-presets-group";

  const presets = [5, 10, 25, 50];
  presets.forEach((mins) => {
    const chip = document.createElement("button");
    chip.className = `timer-preset-chip ${savedMinutesInput === mins ? "active" : ""}`;
    chip.textContent = `${mins}${t("timerQuickMinutes") || "m"}`;
    chip.addEventListener("click", () => {
      savedMinutesInput = mins;
      // Update UI selection state
      presetsGroup.querySelectorAll(".timer-preset-chip").forEach((btn) => {
        btn.classList.remove("active");
      });
      chip.classList.add("active");
      
      // Sync slider & numerical input
      const slider = container.querySelector(".timer-range-slider") as HTMLInputElement;
      const numInput = container.querySelector(".timer-number-input") as HTMLInputElement;
      if (slider) slider.value = String(mins);
      if (numInput) numInput.value = String(mins);

      // 동적 라벨 업데이트
      updatePomodoroCheckboxLabel(container);
    });
    presetsGroup.appendChild(chip);
  });
  container.appendChild(presetsGroup);

  // Manual Time Input with synced Slider and Input (1m to 180m)
  const manualGroup = document.createElement("div");
  manualGroup.className = "timer-manual-group slider-mode";

  const rangeSlider = document.createElement("input");
  rangeSlider.type = "range";
  rangeSlider.className = "timer-range-slider";
  rangeSlider.min = "1";
  rangeSlider.max = "180";
  rangeSlider.value = String(savedMinutesInput);

  const numInputWrapper = document.createElement("div");
  numInputWrapper.className = "timer-number-wrapper";

  const numberInput = document.createElement("input");
  numberInput.type = "number";
  numberInput.className = "timer-number-input";
  numberInput.min = "1";
  numberInput.max = "180";
  numberInput.value = String(savedMinutesInput);

  const labelSuffix = document.createElement("span");
  labelSuffix.className = "timer-manual-suffix";
  labelSuffix.textContent = t("timerManualMinutes") || "min";

  numInputWrapper.appendChild(numberInput);
  numInputWrapper.appendChild(labelSuffix);

  manualGroup.appendChild(rangeSlider);
  manualGroup.appendChild(numInputWrapper);
  container.appendChild(manualGroup);

  // 뽀모도로 옵션 텍스트 동적 치환 함수
  const updatePomodoroCheckboxLabel = (cardContainer: HTMLElement) => {
    const span = cardContainer.querySelector("#timer-opt-pomodoro-text");
    if (span) {
      span.textContent = (t("timerPomodoro" as any) || "Pomodoro").replace("{time}", String(savedMinutesInput));
    }
    const reverseSpan = cardContainer.querySelector("#timer-opt-reverse-text");
    if (reverseSpan) {
      reverseSpan.textContent = (t("timerPomodoroReverse" as any) || "Reverse Pomodoro").replace("{time}", String(savedMinutesInput));
    }
  };

  // Synchronization Logic
  const syncValuesFromSlider = () => {
    const val = parseInt(rangeSlider.value, 10) || 1;
    numberInput.value = String(val);
    savedMinutesInput = val;
    updateChipSelectionState(val);
    updatePomodoroCheckboxLabel(container);
  };

  const syncValuesFromInput = () => {
    let val = parseInt(numberInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 180) val = 180;
    numberInput.value = String(val);
    rangeSlider.value = String(val);
    savedMinutesInput = val;
    updateChipSelectionState(val);
    updatePomodoroCheckboxLabel(container);
  };

  const updateChipSelectionState = (val: number) => {
    presetsGroup.querySelectorAll(".timer-preset-chip").forEach((btn) => {
      const matchText = `${val}${t("timerQuickMinutes") || "m"}`;
      if (btn.textContent === matchText) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  };

  rangeSlider.addEventListener("input", syncValuesFromSlider);
  numberInput.addEventListener("input", syncValuesFromInput);
  numberInput.addEventListener("change", syncValuesFromInput);
  numberInput.addEventListener("blur", syncValuesFromInput);

  // Options Group (Pomodoro & Sound)
  const optionsGroup = document.createElement("div");
  optionsGroup.className = "timer-options-group";
  optionsGroup.style.display = "flex";
  optionsGroup.style.flexDirection = "column";
  optionsGroup.style.gap = "8px";
  optionsGroup.style.width = "calc(100% - 8px)";
  optionsGroup.style.margin = "0 auto 12px";
  optionsGroup.style.boxSizing = "border-box";
  optionsGroup.style.padding = "8px 5px";
  optionsGroup.style.background = "rgba(0, 0, 0, 0.12)";
  optionsGroup.style.borderRadius = "8px";

  // Pomodoro Option
  const pomodoroLabel = document.createElement("label");
  pomodoroLabel.className = "timer-option-label";
  pomodoroLabel.style.display = "flex";
  pomodoroLabel.style.alignItems = "center";
  pomodoroLabel.style.gap = "6px";
  pomodoroLabel.style.cursor = "pointer";
  pomodoroLabel.style.fontSize = "11px";
  pomodoroLabel.style.whiteSpace = "nowrap";
  pomodoroLabel.style.color = "var(--text-main)";

  const pomodoroCheckbox = document.createElement("input");
  pomodoroCheckbox.type = "checkbox";
  pomodoroCheckbox.id = "timer-opt-pomodoro";
  pomodoroCheckbox.checked = isPomodoroMode;
  pomodoroCheckbox.style.margin = "0";

  const pomodoroSpan = document.createElement("span");
  pomodoroSpan.id = "timer-opt-pomodoro-text";
  pomodoroSpan.textContent = (t("timerPomodoro" as any) || "Pomodoro").replace("{time}", String(savedMinutesInput));
  pomodoroLabel.appendChild(pomodoroCheckbox);
  pomodoroLabel.appendChild(pomodoroSpan);

  // Reverse Pomodoro Option (Break first) - 뽀모도로 밑에 동급 옵션으로 추가
  const reverseLabel = document.createElement("label");
  reverseLabel.id = "timer-opt-reverse-wrapper";
  reverseLabel.className = "timer-option-label";
  reverseLabel.style.display = "flex";
  reverseLabel.style.alignItems = "center";
  reverseLabel.style.gap = "6px";
  reverseLabel.style.cursor = "pointer";
  reverseLabel.style.fontSize = "11px";
  reverseLabel.style.whiteSpace = "nowrap";
  reverseLabel.style.color = "var(--text-main)";

  const reverseCheckbox = document.createElement("input");
  reverseCheckbox.type = "checkbox";
  reverseCheckbox.id = "timer-opt-reverse";
  reverseCheckbox.checked = isReversePomodoro;
  reverseCheckbox.style.margin = "0";

  const reverseSpan = document.createElement("span");
  reverseSpan.id = "timer-opt-reverse-text"; // ID 추가
  reverseSpan.textContent = (t("timerPomodoroReverse" as any) || "Reverse Pomodoro").replace("{time}", String(savedMinutesInput));

  reverseLabel.appendChild(reverseCheckbox);
  reverseLabel.appendChild(reverseSpan);

  // Sound Option
  const soundLabel = document.createElement("label");
  soundLabel.className = "timer-option-label";
  soundLabel.style.display = "flex";
  soundLabel.style.alignItems = "center";
  soundLabel.style.gap = "6px";
  soundLabel.style.cursor = "pointer";
  soundLabel.style.fontSize = "11px";
  soundLabel.style.whiteSpace = "nowrap";
  soundLabel.style.color = "var(--text-main)";

  const soundCheckbox = document.createElement("input");
  soundCheckbox.type = "checkbox";
  soundCheckbox.id = "timer-opt-sound";
  soundCheckbox.checked = isSoundEnabled;
  soundCheckbox.style.margin = "0";

  const soundSpan = document.createElement("span");
  soundSpan.textContent = t("timerSound" as any) || "Play Sound";
  soundLabel.appendChild(soundCheckbox);
  soundLabel.appendChild(soundSpan);

  // ASMR Option
  const asmrLabel = document.createElement("label");
  asmrLabel.className = "timer-option-label";
  asmrLabel.style.display = "flex";
  asmrLabel.style.alignItems = "center";
  asmrLabel.style.gap = "6px";
  asmrLabel.style.fontSize = "11px";
  asmrLabel.style.whiteSpace = "nowrap";
  asmrLabel.style.color = "var(--text-main)";

  const asmrSelect = document.createElement("select");
  asmrSelect.id = "timer-opt-asmr";
  asmrSelect.className = "buddy-select";
  asmrSelect.style.padding = "2px 6px";
  asmrSelect.style.fontSize = "11px";
  asmrSelect.style.height = "24px";
  asmrSelect.style.width = "auto";
  asmrSelect.style.background = "var(--bg-panel)";
  asmrSelect.style.color = "var(--text-main)";
  asmrSelect.style.borderRadius = "6px";
  asmrSelect.style.border = "1px solid var(--border-color)";
  asmrSelect.style.outline = "none";
  asmrSelect.style.cursor = "pointer";

  const opts = [
    { value: "off", label: t("asmrOff" as any) || "ASMR Off" },
    { value: "rain", label: t("asmrRain" as any) || "ASMR Rain" },
    { value: "metronome", label: t("asmrMetronome" as any) || "ASMR Metronome" },
  ];
  opts.forEach(o => {
    const optEl = document.createElement("option");
    optEl.value = o.value;
    optEl.textContent = o.label;
    if (asmrType === o.value) optEl.selected = true;
    asmrSelect.appendChild(optEl);
  });

  const asmrSpan = document.createElement("span");
  asmrSpan.textContent = "ASMR:";
  asmrLabel.appendChild(asmrSpan);
  asmrLabel.appendChild(asmrSelect);

  optionsGroup.appendChild(pomodoroLabel);
  optionsGroup.appendChild(reverseLabel); // 추가
  optionsGroup.appendChild(soundLabel);
  optionsGroup.appendChild(asmrLabel);

  // Complete Themes Option
  const themeLabel = document.createElement("label");
  themeLabel.className = "timer-option-label";
  themeLabel.style.display = "flex";
  themeLabel.style.alignItems = "center";
  themeLabel.style.justifyContent = "space-between";
  themeLabel.style.gap = "6px";
  themeLabel.style.fontSize = "11px";
  themeLabel.style.color = "var(--text-main)";
  themeLabel.style.marginTop = "4px";

  const themeTitleSpan = document.createElement("span");
  themeTitleSpan.textContent = t("timerCompleteThemeLabel" as any) || "Effect Theme:";
  themeLabel.appendChild(themeTitleSpan);

  const themePickerRow = document.createElement("div");
  themePickerRow.className = "timer-complete-theme-picker-row";
  themePickerRow.style.display = "flex";
  themePickerRow.style.flexWrap = "nowrap"; // 강제 한 줄 유지
  themePickerRow.style.gap = "3px";
  themePickerRow.style.alignItems = "center";
  themePickerRow.style.justifyContent = "flex-end";

  // 성공 스토리 서브 로우 생성
  const episodeLabel = document.createElement("label");
  episodeLabel.className = "timer-option-label success-story-episode-label";
  episodeLabel.style.display = (timerCompleteTheme || "night").startsWith("comic") ? "flex" : "none";
  episodeLabel.style.alignItems = "center";
  episodeLabel.style.justifyContent = "space-between";
  episodeLabel.style.gap = "4px";
  episodeLabel.style.fontSize = "10px";
  episodeLabel.style.color = "var(--text-main)";
  episodeLabel.style.marginTop = "6px";

  const episodeTitleSpan = document.createElement("span");
  episodeTitleSpan.textContent = t("successStoryLabel" as any) || "Episode:";
  episodeTitleSpan.style.whiteSpace = "nowrap";
  episodeLabel.appendChild(episodeTitleSpan);

  const episodePickerRow = document.createElement("div");
  episodePickerRow.className = "timer-complete-episode-picker-row";
  episodePickerRow.style.display = "flex";
  episodePickerRow.style.flexWrap = "wrap"; // 2줄 배치 허용
  episodePickerRow.style.gap = "4px";
  episodePickerRow.style.alignItems = "center";
  episodePickerRow.style.justifyContent = "flex-end";

  const completeThemes = [
    { id: "night", icon: "🌠", name: t("themeNightName" as any) || "Starry Night" },
    { id: "forest", icon: "🌿", name: t("themeForestName" as any) || "Deep Forest" },
    { id: "ocean", icon: "🌊", name: t("themeOceanName" as any) || "Calm Ocean" },
    { id: "fireplace", icon: "🔥", name: t("themeFireplaceName" as any) || "Cozy Fireplace" },
    { id: "sunset", icon: "🌅", name: t("themeSunsetName" as any) || "Soft Sunset" },
    { id: "yoga", icon: "🧘‍♀️", name: t("themeYogaName" as any) || "Zen Yoga" },
    { id: "comic_random", icon: "📚", name: t("themeComicRandomName" as any) || "Success Story" },
    { id: "random", icon: "🔀", name: t("themeRandomName" as any) || "Random" }
  ];

  const episodes = [
    { id: "comic_random", icon: "🎲", name: "Random Episode" },
    { id: "comic1", icon: "1", name: "Episode 1" },
    { id: "comic2", icon: "2", name: "Episode 2" },
    { id: "comic3", icon: "3", name: "Episode 3" },
    { id: "comic4", icon: "4", name: "Episode 4" },
    { id: "comic5", icon: "5", name: "Episode 5" },
    { id: "comic6", icon: "6", name: "Episode 6" },
    { id: "comic7", icon: "7", name: "Episode 7" },
    { id: "comic8", icon: "8", name: "Episode 8" },
    { id: "comic9", icon: "9", name: "Episode 9" },
    { id: "comic10", icon: "10", name: "Episode 10" },
    { id: "comic11", icon: "11", name: "Episode 11" },
    { id: "comic12", icon: "12", name: "Episode 12" },
    { id: "comic13", icon: "13", name: "Episode 13" },
    { id: "comic14", icon: "14", name: "Episode 14" },
    { id: "comic15", icon: "15", name: "Episode 15" },
    { id: "comic16", icon: "16", name: "Episode 16" },
    { id: "comic17", icon: "17", name: "Episode 17" },
    { id: "comic18", icon: "18", name: "Episode 18" }
  ];

  // 1. 대분류 완료 테마 렌더링 및 이벤트 연결
  completeThemes.forEach(thm => {
    const chip = document.createElement("button");
    chip.type = "button";
    
    const isSelected = (timerCompleteTheme === thm.id) || 
                       (thm.id === "comic_random" && (timerCompleteTheme || "night").startsWith("comic") && timerCompleteTheme !== "random");
    
    chip.className = `timer-theme-chip ${isSelected ? "active" : ""}`;
    chip.textContent = thm.icon;
    chip.title = thm.name;
    chip.style.background = isSelected ? "var(--accent-color)" : "rgba(255, 255, 255, 0.08)";
    chip.style.border = isSelected ? "1px solid var(--accent-color)" : "1px solid rgba(255, 255, 255, 0.15)";
    chip.style.borderRadius = "3px";
    chip.style.width = "22px";
    chip.style.height = "22px";
    chip.style.cursor = "pointer";
    chip.style.display = "flex";
    chip.style.alignItems = "center";
    chip.style.justifyContent = "center";
    chip.style.fontSize = "13px";
    chip.style.padding = "0";
    chip.style.transition = "all 0.2s";

    chip.addEventListener("click", () => {
      let nextTheme = thm.id as any;
      
      if (nextTheme === "comic_random") {
        episodeLabel.style.display = "flex";
        // 에피소드 서브 리스트 중 기본값 comic_random 활성화
        episodePickerRow.querySelectorAll(".timer-episode-chip").forEach((btn: any) => {
          const isRandom = btn.dataset.episode === "comic_random";
          btn.classList.toggle("active", isRandom);
          btn.style.background = isRandom ? "var(--accent-color)" : "rgba(255, 255, 255, 0.08)";
          btn.style.border = isRandom ? "1px solid var(--accent-color)" : "1px solid rgba(255, 255, 255, 0.15)";
        });
      } else {
        episodeLabel.style.display = "none";
      }

      timerCompleteTheme = nextTheme;
      themePickerRow.querySelectorAll(".timer-theme-chip").forEach((btn: any, idx) => {
        const selected = completeThemes[idx].id === timerCompleteTheme || 
                          (completeThemes[idx].id === "comic_random" && timerCompleteTheme.startsWith("comic"));
        btn.classList.toggle("active", selected);
        btn.style.background = selected ? "var(--accent-color)" : "rgba(255, 255, 255, 0.08)";
        btn.style.border = selected ? "1px solid var(--accent-color)" : "1px solid rgba(255, 255, 255, 0.15)";
      });
      saveTimerOptions();
    });

    themePickerRow.appendChild(chip);
  });

  // 2. 소분류 성공스토리 에피소드 렌더링 및 이벤트 연결
  episodes.forEach(ep => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.dataset.episode = ep.id;
    
    const isSelected = timerCompleteTheme === ep.id || (ep.id === "comic_random" && timerCompleteTheme === "comic_random");
    
    chip.className = `timer-episode-chip ${isSelected ? "active" : ""}`;
    chip.textContent = ep.icon;
    chip.title = ep.name;
    chip.style.background = isSelected ? "var(--accent-color)" : "rgba(255, 255, 255, 0.08)";
    chip.style.border = isSelected ? "1px solid var(--accent-color)" : "1px solid rgba(255, 255, 255, 0.15)";
    chip.style.borderRadius = "3px";
    chip.style.width = "18px";
    chip.style.height = "18px";
    chip.style.cursor = "pointer";
    chip.style.display = "flex";
    chip.style.alignItems = "center";
    chip.style.justifyContent = "center";
    chip.style.fontSize = "9px";
    chip.style.fontWeight = "bold";
    chip.style.padding = "0";
    chip.style.transition = "all 0.2s";

    chip.addEventListener("click", () => {
      timerCompleteTheme = ep.id as any;
      episodePickerRow.querySelectorAll(".timer-episode-chip").forEach((btn: any) => {
        const selected = btn.dataset.episode === timerCompleteTheme;
        btn.classList.toggle("active", selected);
        btn.style.background = selected ? "var(--accent-color)" : "rgba(255, 255, 255, 0.08)";
        btn.style.border = selected ? "1px solid var(--accent-color)" : "1px solid rgba(255, 255, 255, 0.15)";
      });

      // 대분류에서 성공스토리 📚 활성화 유지
      themePickerRow.querySelectorAll(".timer-theme-chip").forEach((btn: any, idx) => {
        const selected = completeThemes[idx].id === "comic_random";
        btn.classList.toggle("active", selected);
        btn.style.background = selected ? "var(--accent-color)" : "rgba(255, 255, 255, 0.08)";
        btn.style.border = selected ? "1px solid var(--accent-color)" : "1px solid rgba(255, 255, 255, 0.15)";
      });
      saveTimerOptions();
    });

    episodePickerRow.appendChild(chip);
  });

  episodeLabel.appendChild(episodePickerRow);
  themeLabel.appendChild(themePickerRow);
  optionsGroup.appendChild(themeLabel);
  optionsGroup.appendChild(episodeLabel);
  container.appendChild(optionsGroup);

  const saveTimerOptions = () => {
    isPomodoroMode = pomodoroCheckbox.checked;
    isReversePomodoro = reverseCheckbox.checked;
    isSoundEnabled = soundCheckbox.checked;
    asmrType = asmrSelect.value as any;
    const isFocusRandom = (timerCompleteTheme === "random");
    
    updateBuddyState({
      isPomodoroMode,
      isReversePomodoro,
      isSoundEnabled,
      asmrType,
      timerCompleteTheme,
      focusRandomTheme: isFocusRandom
    });

    const s = getBuddyState();
    if (s.config) {
      const nextConfig = {
        ...s.config,
        isPomodoroMode,
        isReversePomodoro,
        isSoundEnabled,
        asmrType,
        timerCompleteTheme,
        focusRandomTheme: isFocusRandom
      };
      if (isContextInvalidated()) return;
      chrome.runtime.sendMessage({
        type: "SAVE_BUDDY_CONFIG",
        config: nextConfig,
      }).catch((err) => console.warn("[Timer Options] Save settings failed:", err));
    }
  };

  pomodoroCheckbox.addEventListener("change", () => {
    if (pomodoroCheckbox.checked) {
      reverseCheckbox.checked = false;
      isReversePomodoro = false;
    }
    isPomodoroMode = pomodoroCheckbox.checked;
    saveTimerOptions();
  });
  reverseCheckbox.addEventListener("change", () => {
    if (reverseCheckbox.checked) {
      pomodoroCheckbox.checked = false;
      isPomodoroMode = false;
    }
    isReversePomodoro = reverseCheckbox.checked;
    saveTimerOptions();
  });
  soundCheckbox.addEventListener("change", saveTimerOptions);
  asmrSelect.addEventListener("change", saveTimerOptions);

  // Start Button
  const startBtn = document.createElement("button");
  startBtn.className = "timer-start-btn";
  startBtn.textContent = t("timerStart") || "Start";
  startBtn.addEventListener("click", () => {
    syncValuesFromInput();
    focusDurationMinutes = savedMinutesInput; // 집중 시간 백업
    savedTimerGoal = timerMessage; // 원본 집중 목표 백업

    if (isReversePomodoro) {
      // 리버스 뽀모도로: 5분 휴식으로 시작
      const breakMsg = `${timerMessage ? timerMessage + " " : ""}(${t("timerStatusBreak" as any) || "Break"})`;
      startTimerEngine(5, breakMsg, shadow, "break");
    } else {
      startTimerEngine(savedMinutesInput, timerMessage, shadow, isPomodoroMode ? "focus" : "none");
    }
  });
  container.appendChild(startBtn);

  // 집중 통계 대시보드 생성 및 추가
  const statsBoard = document.createElement("div");
  statsBoard.className = "timer-stats-dashboard";
  statsBoard.style.marginTop = "14px";
  statsBoard.style.padding = "10px";
  statsBoard.style.background = "rgba(0, 0, 0, 0.15)";
  statsBoard.style.border = "1px solid var(--border-color)";
  statsBoard.style.borderRadius = "8px";
  statsBoard.style.display = "flex";
  statsBoard.style.flexDirection = "column";
  statsBoard.style.gap = "4px";

  statsBoard.innerHTML = `
    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--text-main);">
      <span>📊 ${t("timerStatsTitle" as any) || "Today's Focus"}</span>
      <span id="timer-stats-cycles-label" style="color: var(--accent-color); font-weight: 700;">-</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-sub);">
      <span id="timer-stats-time-label">-</span>
      <span>Goal: 120m</span>
    </div>
    <div style="width: 100%; height: 5px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; overflow: hidden; margin-top: 2px; margin-bottom: 6px;">
      <div id="timer-stats-progress-bar" style="width: 0%; height: 100%; background: var(--accent-color); border-radius: 3px; transition: width 0.5s ease;"></div>
    </div>
    <button id="timer-stats-detail-btn" style="background: none; border: none; padding: 0; color: var(--accent-color); font-size: 10px; font-weight: bold; cursor: pointer; text-align: left; align-self: flex-start; outline: none; transition: opacity 0.2s;">
      ${t("timerStatsGoalTitle" as any) || "View Stats by Goal"} &rarr;
    </button>
  `;
  container.appendChild(statsBoard);

  const detailBtn = statsBoard.querySelector("#timer-stats-detail-btn");
  if (detailBtn) {
    detailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const panelBody = container.parentElement?.parentElement;
      if (panelBody) {
        toggleStatsPanel(true, panelBody);
        renderStatsPanel(statsPanel, panelBody);
      }
    });
  }

  // 비동기로 오늘의 집중 통계 수신 및 적용
  if (isContextInvalidated()) return;
  chrome.runtime.sendMessage({ type: "BUDDY_GET_TIMER_STATS" }).then((res: any) => {
    if (res && res.success && res.data) {
      const stats = res.data;
      const cyclesLabel = statsBoard.querySelector("#timer-stats-cycles-label");
      const timeLabel = statsBoard.querySelector("#timer-stats-time-label");
      const progressBar = statsBoard.querySelector("#timer-stats-progress-bar");
      
      if (cyclesLabel) {
        cyclesLabel.textContent = (t("timerStatsCycle" as any) || "Cycles: {N}").replace("{N}", String(stats.cycles));
      }
      if (timeLabel) {
        timeLabel.textContent = (t("timerStatsTime" as any) || "Focus Time: {N}m").replace("{N}", String(stats.totalMinutes));
      }
      if (progressBar) {
        const percent = Math.min(100, Math.round((stats.totalMinutes / 120) * 100));
        (progressBar as HTMLElement).style.width = `${percent}%`;
      }
    }
  }).catch((err) => console.warn("[Timer Dashboard] Load stats failed:", err));
}

// 2. EXECUTION VIEW
function renderExecutionView(container: HTMLElement, shadow: ShadowRoot, statsPanel: HTMLElement): void {
  container.innerHTML = "";

  // Pomodoro Phase Badge
  if (isPomodoroMode && pomodoroPhase !== "none") {
    const badgeEl = document.createElement("div");
    badgeEl.className = `timer-phase-badge ${pomodoroPhase}`;
    badgeEl.textContent = pomodoroPhase === "focus" 
      ? `🎯 ${t("timerStatusFocus" as any) || "Focus"}`
      : `☕ ${t("timerStatusBreak" as any) || "Break"}`;
    container.appendChild(badgeEl);
  }

  // Target message display
  if (timerMessage && timerMessage.trim()) {
    const msgEl = document.createElement("div");
    msgEl.className = "timer-running-message";
    msgEl.textContent = timerMessage.trim();
    container.appendChild(msgEl);
  }

  // Circular gauge container
  const gaugeWrapper = document.createElement("div");
  gaugeWrapper.className = "timer-gauge-wrapper";

  // SVG Circular Ring: r=54 -> Perimeter = 2 * PI * r = 339.3
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "timer-svg-ring");
  svg.setAttribute("width", "128");
  svg.setAttribute("height", "128");
  svg.setAttribute("viewBox", "0 0 128 128");

  const bgCircle = document.createElementNS(svgNS, "circle");
  bgCircle.setAttribute("class", "timer-ring-bg");
  bgCircle.setAttribute("cx", "64");
  bgCircle.setAttribute("cy", "64");
  bgCircle.setAttribute("r", "54");
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke-width", "5");

  const barCircle = document.createElementNS(svgNS, "circle");
  barCircle.setAttribute("class", "timer-ring-bar");
  barCircle.setAttribute("cx", "64");
  barCircle.setAttribute("cy", "64");
  barCircle.setAttribute("r", "54");
  barCircle.setAttribute("fill", "none");
  barCircle.setAttribute("stroke-width", "5");
  barCircle.setAttribute("stroke-dasharray", "339.3");
  barCircle.setAttribute("stroke-dashoffset", "0");
  barCircle.setAttribute("stroke-linecap", "round");

  svg.appendChild(bgCircle);
  svg.appendChild(barCircle);
  gaugeWrapper.appendChild(svg);

  // Time Text inside gauge
  const timeText = document.createElement("div");
  timeText.className = "timer-time-text";
  timeText.textContent = formatTime(remainingSeconds);
  gaugeWrapper.appendChild(timeText);

  container.appendChild(gaugeWrapper);

  // Control Buttons Group
  const controlsGroup = document.createElement("div");
  controlsGroup.className = "timer-controls-group";

  const playPauseBtn = document.createElement("button");
  playPauseBtn.className = "timer-ctrl-btn play-pause";
  playPauseBtn.textContent = timerStatus === "running" ? (t("timerPause") || "Pause") : (t("timerResume") || "Resume");
  
  if (timerStatus === "paused") {
    playPauseBtn.classList.add("paused");
  }

  playPauseBtn.addEventListener("click", () => {
    togglePauseResume();
    if (timerStatus === "running") {
      playPauseBtn.textContent = t("timerPause") || "Pause";
      playPauseBtn.classList.remove("paused");
    } else {
      playPauseBtn.textContent = t("timerResume") || "Resume";
      playPauseBtn.classList.add("paused");
    }
  });

  const resetBtn = document.createElement("button");
  resetBtn.className = "timer-ctrl-btn reset";
  resetBtn.textContent = t("timerReset") || "Reset";
  resetBtn.addEventListener("click", () => {
    stopTimerEngine();
    renderSetupView(container, shadow);
  });

  controlsGroup.appendChild(playPauseBtn);
  controlsGroup.appendChild(resetBtn);
  container.appendChild(controlsGroup);

  // Run initial UI gauge update
  updateExecutionUI(container);
}

// 3. UI STATE UPDATER (Tick based)
function updateExecutionUI(container: HTMLElement): void {
  const timeText = container.querySelector(".timer-time-text");
  if (timeText) {
    timeText.textContent = formatTime(remainingSeconds);
  }

  const barCircle = container.querySelector(".timer-ring-bar");
  if (barCircle) {
    const totalCircumference = 339.3;
    const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) : 0;
    const offset = totalCircumference * (1 - progress);
    barCircle.setAttribute("stroke-dashoffset", String(offset));
  }
}

// 4. TIMER ENGINE LOGIC
function startTimerEngine(minutes: number, msg: string, shadow: ShadowRoot, initialPhase: "focus" | "break" | "none" = "none"): void {
  cleanupTimerInterval();

  // 방어 코드: background 복구 등의 경우에 원본 목표가 유실되었다면 파라미터 msg로부터 복구
  if (!savedTimerGoal && msg && !msg.includes(`(${t("timerStatusBreak" as any) || "Break"})`)) {
    savedTimerGoal = msg;
  }

  if (initialPhase === "focus") {
    if (isDndMode) applyDndEffect(true);
    startAsmrSound();
  } else {
    applyDndEffect(false);
    stopAsmrSound();
  }

  totalSeconds = minutes * 60;
  remainingSeconds = totalSeconds;
  timerMessage = msg;
  timerStatus = "running";
  cachedShadowRoot = shadow;
  pomodoroPhase = initialPhase;

  // Sync to global state
  updateBuddyState({
    timerStatus: "running",
    timerRemaining: remainingSeconds,
    timerTotal: totalSeconds,
    timerMessage: timerMessage,
    pomodoroPhase: pomodoroPhase,
    activePanel: null // Close the panel immediately on start
  });

  // Redraw UI container to execution mode
  const container = shadow.getElementById("timer-card-container");
  if (container) {
    const mainView = container.querySelector(".timer-main-view") as HTMLElement;
    const statsPanel = container.querySelector(".timer-stats-drawer") as HTMLElement;
    if (mainView && statsPanel) {
      renderExecutionView(mainView, shadow, statsPanel);
    }
  }

  timerIntervalId = setInterval(() => {
    if (isContextInvalidated()) {
      cleanupTimerInterval();
      return;
    }
    if (timerStatus === "running") {
      remainingSeconds--;

      // Sync updated tick state to global state
      updateBuddyState({
        timerRemaining: remainingSeconds
      });

      // 틱마다 메트로놈 소리 재생 시도
      if (timerStatus === "running" && pomodoroPhase === "focus" && asmrType === "metronome") {
        playMetronomeTick();
      }

      // Update panel UI if card is visible
      if (currentTickCallback) {
        currentTickCallback();
      }

      if (remainingSeconds <= 0) {
        cleanupTimerInterval();
        if (isContextInvalidated()) return;

        // 집중/휴식 타이머 완료 경험치 지급 (집중 완료: +100 XP, 휴식 완료: +30 XP, 일반 타이머 완료: +50 XP)
        if (pomodoroPhase === "focus") {
          addBuddyXp(100);
        } else if (pomodoroPhase === "break") {
          addBuddyXp(30);
        } else {
          addBuddyXp(50);
        }

        // 1. Play synthesizer alert chime if enabled
        if (isSoundEnabled) {
          playChimeSound(pomodoroPhase === "break" ? "break" : "complete");
          const s = getBuddyState();
          if (s.config) {
            playCharacterSound(s.config.buddyId);
          }
        }

        // 2. Add celebration class to the character container for visual effect
        const buddyContainer = shadow.getElementById("buddy-container");
        if (buddyContainer) {
          buddyContainer.classList.add("timer-complete-celebrate");
          // Celebratory effects will trigger celebration particles in buddy-character.ts
          // Wait 3.5 seconds, then clean it up
          setTimeout(() => {
            buddyContainer.classList.remove("timer-complete-celebrate");
          }, 3500);
        }

        // 3. Handle Pomodoro Auto-cycling
        if (isPomodoroMode || isReversePomodoro) {
          if (pomodoroPhase === "focus") {
            // 집중 완료 통계 누적 (사이클 1 증가 및 시간 누적)
            chrome.runtime.sendMessage({
              type: "BUDDY_ADD_TIMER_STATS",
              minutes: focusDurationMinutes,
              addCycle: true,
              goal: savedTimerGoal
            }).catch(() => {});

            pomodoroPhase = "break";
            updateBuddyState({ pomodoroPhase: "break" });
            const breakMsg = `${savedTimerGoal ? savedTimerGoal + " " : ""}(${t("timerStatusBreak" as any) || "Break"})`;
            startTimerEngine(5, breakMsg, shadow, "break");
            return;
          } else if (pomodoroPhase === "break") {
            pomodoroPhase = "focus";
            updateBuddyState({ pomodoroPhase: "focus" });
            startTimerEngine(focusDurationMinutes, savedTimerGoal, shadow, "focus");
            return;
          }
        }

        // Standard Timer Completion (No Pomodoro)
        // 일반 타이머 집중 완료 통계 누적 (시간만 누적)
        chrome.runtime.sendMessage({
          type: "BUDDY_ADD_TIMER_STATS",
          minutes: focusDurationMinutes,
          addCycle: false,
          goal: savedTimerGoal
        }).catch(() => {});

        timerStatus = "idle";
        pomodoroPhase = "none";
        applyDndEffect(false);
        stopAsmrSound();

        updateBuddyState({
          timerStatus: "idle",
          timerRemaining: 0,
          timerTotal: 0,
          pomodoroPhase: "none"
        });

        // Trigger fullscreen completion overlay
        if (cachedShadowRoot) {
          const state = getBuddyState();
          const focusRandom = state.config?.focusRandomTheme === true;
          triggerTimerCompleteEffect(cachedShadowRoot, timerMessage, false, focusRandom ? "random" : undefined);
        }

        // Notify complete callback to restore setup view
        if (currentCompleteCallback) {
          currentCompleteCallback();
        }
      }
    }
  }, 1000);
}

export function stopTimerEngine(): void {
  cleanupTimerInterval();
  applyDndEffect(false);
  stopAsmrSound();
  timerStatus = "idle";
  remainingSeconds = 0;
  totalSeconds = 0;
  pomodoroPhase = "none";
  savedTimerGoal = ""; // 정지 시 초기화

  updateBuddyState({
    timerStatus: "idle",
    timerRemaining: 0,
    timerTotal: 0,
    timerMessage: "",
    pomodoroPhase: "none"
  });
}

export function togglePauseResume(): void {
  if (timerStatus === "running") {
    timerStatus = "paused";
    updateBuddyState({ timerStatus: "paused" });
    applyDndEffect(false);
    stopAsmrSound();
  } else if (timerStatus === "paused") {
    timerStatus = "running";
    updateBuddyState({ timerStatus: "running" });
    if (pomodoroPhase === "focus") {
      if (isDndMode) applyDndEffect(true);
      startAsmrSound();
    }
  }
}

// 5. HELPER
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

const DND_STYLE_ID = "clickbook-buddy-dnd-style";

function applyDndEffect(apply: boolean): void {
  const existing = document.getElementById(DND_STYLE_ID);
  if (existing) {
    existing.remove();
  }

  if (!apply) return;

  const styleEl = document.createElement("style");
  styleEl.id = DND_STYLE_ID;
  styleEl.textContent = `
    iframe,
    [class*="ad-"],
    [id*="ad-"],
    ins.adsbygoogle,
    [class*="banner"],
    aside,
    .sidebar {
      filter: blur(8px) grayscale(90%) !important;
      opacity: 0.25 !important;
      pointer-events: none !important;
      transition: filter 0.5s ease, opacity 0.5s ease !important;
    }
  `;
  document.head.appendChild(styleEl);
}

// 틱마다 동작하는 메트로놈 똑 소리 (짧은 800Hz 사인파 펄스)
function playMetronomeTick(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.03, ctx.currentTime); // 매우 자그맣게 출력
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}

// Web Audio API 갈색 노이즈 기반 빗소리 발생 및 루프
function startAsmrSound(): void {
  stopAsmrSound();
  if (timerStatus !== "running" || pomodoroPhase !== "focus" || asmrType === "off") return;
  
  if (asmrType === "rain") {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      asmrContext = new AudioContextClass();
      
      const bufferSize = asmrContext.sampleRate * 2;
      const buffer = asmrContext.createBuffer(1, bufferSize, asmrContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // 갈색 잡음 적분 필터링 수식
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      
      asmrSourceNode = asmrContext.createBufferSource();
      asmrSourceNode.buffer = buffer;
      asmrSourceNode.loop = true;
      
      const filter = asmrContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, asmrContext.currentTime); // 고주파 걸러서 먹먹한 빗소리 연출
      
      const gainNode = asmrContext.createGain();
      gainNode.gain.setValueAtTime(0.08, asmrContext.currentTime); // 잔잔하게 0.08 볼륨 지정
      
      asmrSourceNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(asmrContext.destination);
      
      asmrSourceNode.start(0);
    } catch (e) {
      console.warn("[ASMR Sound] Rain generator failure:", e);
    }
  }
}

function stopAsmrSound(): void {
  if (asmrSourceNode) {
    try {
      asmrSourceNode.stop();
    } catch {}
    asmrSourceNode = null;
  }
  if (asmrContext) {
    try {
      asmrContext.close();
    } catch {}
    asmrContext = null;
  }
}

// ── Focus Statistics Drawer Functions ───────────────────────

function toggleStatsPanel(open: boolean, panelBody: HTMLElement): void {
  const container = panelBody.querySelector("#timer-card-container");
  const floatingPanel = panelBody.parentElement; // .floating-panel
  
  if (container) {
    if (open) {
      container.classList.add("stats-open");
      if (floatingPanel) {
        floatingPanel.style.width = "640px"; // 가로폭 2배 확장
        
        // 왼쪽으로 320px 만큼 끌어당겨 확장 (버디 캐릭터 방향에 맞춰 자연스럽게 노출)
        const currentLeft = parseFloat(floatingPanel.style.left || "0");
        if (!isNaN(currentLeft) && !floatingPanel.classList.contains("stats-layout-active")) {
          floatingPanel.style.left = `${currentLeft - 320}px`;
          floatingPanel.classList.add("stats-layout-active");
        }
      }
    } else {
      container.classList.remove("stats-open");
      if (floatingPanel) {
        floatingPanel.style.width = "";
        if (floatingPanel.classList.contains("stats-layout-active")) {
          const currentLeft = parseFloat(floatingPanel.style.left || "0");
          if (!isNaN(currentLeft)) {
            floatingPanel.style.left = `${currentLeft + 320}px`;
          }
          floatingPanel.classList.remove("stats-layout-active");
        }
      }
    }
  }
}

function renderStatsPanel(statsPanel: HTMLElement, panelBody: HTMLElement): void {
  statsPanel.innerHTML = "";

  // 1. 헤더 영역 (제목 + 닫기 버튼)
  const header = document.createElement("div");
  header.className = "stats-drawer-header";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "14px";
  header.style.borderBottom = "1px solid var(--border-color)";
  header.style.paddingBottom = "8px";

  const title = document.createElement("span");
  title.className = "stats-drawer-title";
  title.textContent = t("timerStatsGoalTitle" as any) || "Focus Performance by Goal";
  title.style.fontWeight = "bold";
  title.style.fontSize = "13px";
  title.style.color = "var(--text-main)";

  const closeBtn = document.createElement("button");
  closeBtn.className = "stats-drawer-close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "var(--text-sub)";
  closeBtn.style.fontSize = "18px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.padding = "0 4px";
  closeBtn.addEventListener("click", () => {
    toggleStatsPanel(false, panelBody);
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  statsPanel.appendChild(header);

  // 2. 통계 내용 영역
  const content = document.createElement("div");
  content.className = "stats-drawer-content";
  content.style.display = "flex";
  content.style.flexDirection = "column";
  content.style.gap = "12px";
  statsPanel.appendChild(content);

  if (isContextInvalidated()) return;
  chrome.runtime.sendMessage({ type: "BUDDY_GET_TIMER_STATS" }).then((res: any) => {
    if (res && res.success && res.data) {
      const stats = res.data;
      
      // 요약 카드 렌더링
      const summaryCard = document.createElement("div");
      summaryCard.className = "stats-summary-card";
      summaryCard.style.display = "grid";
      summaryCard.style.gridTemplateColumns = "1fr 1fr";
      summaryCard.style.gap = "8px";
      summaryCard.style.padding = "10px";
      summaryCard.style.background = "rgba(0, 0, 0, 0.12)";
      summaryCard.style.borderRadius = "6px";
      summaryCard.style.marginBottom = "8px";

      const timeTitleText = (t("timerStatsTime" as any) || "Time").split(":")[0];
      const cycleTitleText = (t("timerStatsCycle" as any) || "Cycles").split(":")[0];

      summaryCard.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border-color);">
          <span style="font-size: 10px; color: var(--text-sub);">${timeTitleText}</span>
          <span style="font-size: 16px; font-weight: bold; color: var(--accent-color); margin-top: 4px;">${stats.totalMinutes}m</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: 10px; color: var(--text-sub);">${cycleTitleText}</span>
          <span style="font-size: 16px; font-weight: bold; color: var(--text-main); margin-top: 4px;">${stats.cycles}</span>
        </div>
      `;
      content.appendChild(summaryCard);

      // 목표별 막대 그래프 래퍼
      const chartWrapper = document.createElement("div");
      chartWrapper.className = "stats-chart-wrapper";
      chartWrapper.style.display = "flex";
      chartWrapper.style.flexDirection = "column";
      chartWrapper.style.gap = "10px";
      chartWrapper.style.maxHeight = "180px";
      chartWrapper.style.overflowY = "auto";
      chartWrapper.style.paddingRight = "4px";

      const goals = stats.goals || {};
      const goalEntries = Object.entries(goals);

      if (goalEntries.length === 0) {
        const noDataEl = document.createElement("div");
        noDataEl.style.textAlign = "center";
        noDataEl.style.fontSize = "11px";
        noDataEl.style.color = "var(--text-sub)";
        noDataEl.style.padding = "20px 0";
        noDataEl.textContent = t("timerStatsNoData" as any) || "No focus records recorded today.";
        chartWrapper.appendChild(noDataEl);
      } else {
        const maxMinutes = Math.max(...goalEntries.map(([_, val]: any) => val.minutes), 1);

        goalEntries.forEach(([goalText, val]: any) => {
          const displayGoal = goalText ? goalText : (t("timerStatsDefaultGoal" as any) || "General Focus");
          const minutes = val.minutes;
          const cycles = val.cycles;
          const percent = Math.min(100, Math.round((minutes / maxMinutes) * 100));

          const itemEl = document.createElement("div");
          itemEl.className = "stats-chart-item";
          itemEl.style.display = "flex";
          itemEl.style.flexDirection = "column";
          itemEl.style.gap = "4px";

          itemEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-main);">
              <span class="stats-goal-name" style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;" title="${displayGoal}">${displayGoal}</span>
              <span style="color: var(--text-sub); font-weight: 600;">${minutes}m (${cycles}c)</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden;">
              <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--accent-color), rgba(255, 255, 255, 0.15)); border-radius: 4px; transition: width 0.8s ease;"></div>
            </div>
          `;
          chartWrapper.appendChild(itemEl);
        });
      }

      content.appendChild(chartWrapper);
    }
  }).catch((err) => console.warn("[Timer Stats Drawer] Load failed:", err));
}
