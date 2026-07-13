import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { BuddySelector } from "./BuddySelector";
import type { BuddyConfig, MessageResponse } from "@/shared/types";
import { t, setLang } from "@/buddy/i18n";
import { useLang } from "@/shared/LanguageContext";

interface BuddySettingsPanelProps {
  config: BuddyConfig;
  onChange: (newConfig: BuddyConfig) => void;
  onClose: () => void;
}

const RANDOM_NAMES = [
  "Coco", "Lulu", "Mochi", "Pico", "Bella", 
  "Toby", "Milo", "Cookie", "Buddy", "Lucky", 
  "Joy", "Penny", "Daisy", "Teddy", "Rocky"
];

export const BuddySettingsPanel: React.FC<BuddySettingsPanelProps> = ({ config, onChange, onClose }) => {
  const { lang } = useLang();
  // 언어셋을 팝업의 현재 다국어 설정 언어와 동기화
  setLang(lang as any);

  const [size, setSize] = useState(config.size);
  const [interval, setIntervalVal] = useState(config.animationInterval);
  const [opacity, setOpacity] = useState(config.opacity);
  const [hiddenSites, setHiddenSites] = useState<string[]>(config.hiddenSites || []);

  useEffect(() => {
    setSize(config.size);
    setIntervalVal(config.animationInterval);
    setOpacity(config.opacity);
    setHiddenSites(config.hiddenSites || []);
  }, [config]);

  const handleUpdate = (updates: Partial<BuddyConfig>) => {
    const nextConfig = { ...config, ...updates };
    if (updates.buddyName !== undefined) {
      nextConfig.revealHidden = updates.buddyName === "superadmin";
    }
    onChange(nextConfig);
  };

  const handleRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    handleUpdate({ buddyName: random });
  };

  const handleRemoveHiddenSite = async (domain: string) => {
    try {
      const res = (await chrome.runtime.sendMessage({
        type: "BUDDY_UNHIDE_SITE",
        domain,
      })) as MessageResponse;

      if (res.success) {
        const nextSites = hiddenSites.filter((d) => d !== domain);
        setHiddenSites(nextSites);
        handleUpdate({ hiddenSites: nextSites });
      }
    } catch (e) {
      console.warn("Failed to unhide domain:", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-start justify-center p-3 pt-4">
      {/* 팝업창 크기를 가로 w-[320px], 세로를 calc(100%-20px) 및 max-h-[500px]로 확장 */}
      <div className="bg-slate-900/95 border border-slate-700/50 rounded-2xl p-4 shadow-2xl w-[320px] max-h-[500px] h-[calc(100%-20px)] flex flex-col relative text-slate-200 font-sans">
        
        {/* 모달 헤더 - 스크롤에서 제외 고정 */}
        <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80 mb-3 shrink-0">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 select-none">
            <img 
              src={chrome.runtime.getURL(`buddies/characters/${config.buddyId}/frame_01.webp`)} 
              alt={config.buddyId} 
              className="w-5 h-5 object-contain" 
            />
            <span className="truncate max-w-[180px]">{config.buddyName || t("settingsBuddyName" as any)}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
            title={t("settingsClose" as any)}
          >
            <X size={16} />
          </button>
        </div>

        {/* 세로 스크롤 가능 영역 */}
        <div className="flex-1 overflow-y-auto -mr-4 pr-3.5 space-y-3.5 min-h-0 custom-scrollbar">
          
          {/* 버디 이름 입력 및 주사위 랜덤 버튼 */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-medium">{t("settingsBuddyName" as any)}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.buddyName || ""}
                onChange={(e) => handleUpdate({ buddyName: e.target.value })}
                placeholder="예: Coco, Lulu..."
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleRandomName}
                className="px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 rounded-lg text-slate-200 text-xs transition-colors flex items-center justify-center shrink-0"
                title={t("themeRandomName")}
              >
                🎲
              </button>
            </div>
          </div>

          {/* 버디 캐릭터 선택 (캐러셀) */}
          <div>
            <BuddySelector 
              selectedId={config.buddyId} 
              onSelect={(id, type) => handleUpdate({ buddyId: id, buddyType: type })} 
              unlockedBuddies={config.unlockedBuddies}
            />
          </div>

          {/* 테마 설정 섹션 (2줄 그리드 배치) */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-medium font-bold">{t("settingsTheme")}</label>
            <div className="grid grid-cols-4 gap-1.5 w-full">
              {[
                { id: "midnight", name: "Midnight", color: "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750" },
                { id: "cozy", name: "Cozy", color: "bg-[#fefbf4] text-[#3b3a36] border-[#8b5c1a]/20 hover:bg-[#fcf8ec]" },
                { id: "sky", name: "Sky", color: "bg-[#f0f9ff] text-[#0c4a6e] border-sky-200 hover:bg-[#e0f2fe]" },
                { id: "sweet", name: "Sweet", color: "bg-[#fff1f2] text-[#881337] border-rose-200 hover:bg-[#ffe4e6]" },
                { id: "fresh", name: "Fresh", color: "bg-[#f0fdf4] text-[#14532d] border-emerald-200 hover:bg-[#dcfce7]" },
                { id: "carbon", name: "Carbon", color: "bg-[#121212] text-slate-200 border-slate-800 hover:bg-[#1a1a1a]" },
                { id: "cyber", name: "Cyber", color: "bg-[#0d0a18] text-[#00ffff] border-[#00ffff]/20 hover:bg-[#150f29]" },
              ].map((t) => {
                const isSelected = (config.theme || "midnight") === t.id;
                // 4열 격자에 맞게 텍스트 축약
                let displayName = t.name;
                if (t.id === "midnight") displayName = "Mid";
                else if (t.id === "carbon") displayName = "Carb";
                else if (t.id === "cyber") displayName = "Cybr";
                
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleUpdate({ theme: t.id as any })}
                    className={`px-1 py-1 rounded-full text-[9px] font-bold border transition-all text-center truncate ${t.color} ${
                      isSelected ? "ring-1.5 ring-indigo-500 border-transparent scale-105" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 기본 번역 언어 & 드래그 메뉴 온오프 (가로 병렬 배치) */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] text-slate-400 block mb-1 font-medium">{t("settingsTargetLang")}</label>
              <select
                value={config.targetLanguage || "ko"}
                onChange={(e) => handleUpdate({ targetLanguage: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="ko">Korean (한국어)</option>
                <option value="en">English (영어)</option>
                <option value="ja">Japanese (일본어)</option>
                <option value="zh">Chinese (중국어)</option>
                <option value="es">Spanish (스ペイン어)</option>
                <option value="fr">French (프랑스어)</option>
                <option value="de">German (독일어)</option>
                <option value="it">Italian (이탈리아어)</option>
                <option value="ru">Russian (러시아어)</option>
                <option value="vi">Vietnamese (베트남어)</option>
                <option value="th">Thai (태국어)</option>
                <option value="id">Indonesian (인도네시아어)</option>
              </select>
            </div>
            
            <div className="w-[45%] shrink-0 pb-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-slate-400 font-medium h-[32px]">
                <input
                  type="checkbox"
                  checked={config.showDragMenu !== false}
                  onChange={(e) => handleUpdate({ showDragMenu: e.target.checked })}
                  className="rounded bg-slate-950/60 border-slate-850 text-indigo-600 focus:ring-indigo-500/30 w-3.5 h-3.5 cursor-pointer accent-indigo-500"
                />
                <span className="truncate">{t("settingsShowDragMenu")}</span>
              </label>
            </div>
          </div>

          {/* 크기 설정 슬라이더 */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-medium">
              <span>{t("settingsSize")}</span>
              <span className="text-indigo-400 font-semibold">{size}px</span>
            </div>
            <input
              type="range"
              min="64"
              max="192"
              step="8"
              value={size}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSize(val);
                handleUpdate({ size: val });
              }}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* 타이머 완료 효과 테마 설정 */}
          <div className="space-y-1.5">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-medium font-bold">{t("settingsRestThemeLabel" as any)}</label>
              <div className="flex flex-wrap gap-1 items-center py-0.5">
                {[
                  { id: "night", icon: "🌠", name: t("themeNightName" as any) || "별이 빛나는 밤" },
                  { id: "forest", icon: "🌿", name: t("themeForestName" as any) || "깊은 숲 속" },
                  { id: "ocean", icon: "🌊", name: t("themeOceanName" as any) || "잔잔한 바다" },
                  { id: "fireplace", icon: "🔥", name: t("themeFireplaceName" as any) || "아늑한 벽난로" },
                  { id: "sunset", icon: "🌅", name: t("themeSunsetName" as any) || "차분한 노을" },
                  { id: "yoga", icon: "🧘‍♀️", name: t("themeYogaName" as any) || "마음의 평온 (요가)" },
                  { id: "gallery", icon: "🖼️", name: t("themeGalleryName" as any) || "명화 갤러리" },
                  { id: "breath", icon: "🌬️", name: t("themeBreathName" as any) || "호흡 명상" },
                  { id: "comic_random", icon: "📚", name: t("themeComicRandomName" as any) || "성공 스토리 랜덤 📚" },
                  { id: "random", icon: "🔀", name: t("themeRandomName" as any) || "랜덤" }
                ].map((thm) => {
                  const isSelected = thm.id === "random"
                    ? config.restRandomTheme === true
                    : (config.restRandomTheme !== true && (
                        (config.timerCompleteTheme || "night") === thm.id || 
                        (thm.id === "comic_random" && (config.timerCompleteTheme || "night").startsWith("comic"))
                      ));
                  return (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => {
                        if (thm.id === "random") {
                          handleUpdate({ restRandomTheme: true });
                        } else {
                          const nextTheme = thm.id === "comic_random" ? "comic_random" : thm.id;
                          handleUpdate({ restRandomTheme: false, timerCompleteTheme: nextTheme as any });
                        }
                      }}
                      className={`w-[23px] h-[23px] rounded text-sm transition-all flex items-center justify-center border ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-500 text-white scale-105" 
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900"
                      }`}
                      title={thm.name}
                    >
                      {thm.icon}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 명화 갤러리 오프라인 전용 토글 체크박스 */}
            {(config.restRandomTheme !== true && config.timerCompleteTheme === "gallery") && (
              <div className="pt-0.5 select-none">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 font-medium">
                  <input
                    type="checkbox"
                    checked={config.galleryOfflineMode === true}
                    onChange={(e) => handleUpdate({ galleryOfflineMode: e.target.checked })}
                    className="rounded bg-slate-950/60 border-slate-850 text-indigo-600 focus:ring-indigo-500/30 w-3.5 h-3.5 cursor-pointer accent-indigo-500"
                  />
                  <span>{t("settingsGalleryOffline" as any)}</span>
                </label>
              </div>
            )}

            {/* 성공스토리 상세 에피소드 피커 (만화 선택 시에만 노출) */}
            {(config.restRandomTheme !== true && (config.timerCompleteTheme || "night").startsWith("comic")) && (
              <div className="pt-1.5 border-t border-slate-800/40">
                <label className="text-[10px] text-slate-400 block mb-1 font-medium font-bold">{t("successStoryLabel" as any)}</label>
                <div className="flex flex-wrap gap-1 items-center py-0.5">
                  {[
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
                  ].map((ep) => {
                    const isSelected = config.restRandomTheme !== true && ((config.timerCompleteTheme || "night") === ep.id || (ep.id === "comic_random" && config.timerCompleteTheme === "comic_random"));
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => handleUpdate({ restRandomTheme: false, timerCompleteTheme: ep.id as any })}
                        className={`w-[20px] h-[20px] rounded text-[10px] font-bold transition-all flex items-center justify-center border ${
                          isSelected 
                            ? "bg-indigo-600 border-indigo-500 text-white scale-105" 
                            : "bg-slate-950/70 border-slate-600 text-slate-100 hover:bg-slate-900 hover:border-slate-500 font-extrabold"
                        }`}
                        title={ep.name}
                      >
                        {ep.icon}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 가로 병렬 배치: 타이머 숫자 크기 & 타이머 숫자 색상 */}
          <div className="flex gap-4 items-start">
            {/* 타이머 숫자 크기 (50%) */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-medium">
                <span>{t("settingsTimerSizeLabel" as any)}</span>
                <span className="text-indigo-400 font-semibold">{config.timerSize || "L"}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={config.timerSize === "S" ? 1 : config.timerSize === "M" ? 2 : 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const sizeLabel = val === 1 ? "S" : val === 2 ? "M" : "L";
                  handleUpdate({ timerSize: sizeLabel });
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[8px] text-slate-500 px-1 mt-0.5 select-none">
                <span>S</span>
                <span>M</span>
                <span>L</span>
              </div>
            </div>

            {/* 타이머 숫자 색상 팔레트 (50%) */}
            <div className="w-[50%] shrink-0">
              <label className="text-[10px] text-slate-400 block mb-1 font-medium">{t("settingsTimerColorLabel" as any)}</label>
              <div className="flex flex-wrap gap-1 items-center justify-start py-0.5">
                {[
                  { id: "default", bg: "bg-gradient-to-tr from-slate-400 via-slate-200 to-white border border-slate-700/60", title: t("themeRandomName") },
                  { id: "purple", bg: "bg-purple-500", title: "Purple" },
                  { id: "blue", bg: "bg-blue-500", title: "Blue" },
                  { id: "mint", bg: "bg-emerald-400", title: "Mint" },
                  { id: "rose", bg: "bg-rose-500", title: "Rose" },
                  { id: "yellow", bg: "bg-yellow-400", title: "Yellow" },
                  { id: "orange", bg: "bg-orange-500", title: "Orange" },
                  { id: "white", bg: "bg-white border border-slate-700", title: "White" },
                ].map((c) => {
                  const isSelected = (config.timerColor || "default") === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleUpdate({ timerColor: c.id as any })}
                      className={`w-[14px] h-[14px] rounded-full transition-all shrink-0 ${c.bg} ${
                        isSelected 
                          ? "ring-1.5 ring-offset-1 ring-offset-slate-900 ring-indigo-400 scale-125 z-10" 
                          : "opacity-80 hover:opacity-100 hover:scale-110"
                      }`}
                      title={c.title}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 집중 완료 효과 랜덤 토글 */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 mt-1 select-none">
            <span className="text-[10px] text-slate-400 font-medium">{t("settingsFocusRandomTooltip" as any) || "집중 완료 시 효과 랜덤 적용"}</span>
            <button
              type="button"
              onClick={() => handleUpdate({ focusRandomTheme: !(config.focusRandomTheme === true) })}
              className={`w-[23px] h-[23px] rounded text-sm transition-all flex items-center justify-center border ${
                config.focusRandomTheme === true
                  ? "bg-indigo-600 border-indigo-500 text-white scale-105"
                  : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900"
              }`}
              title={t("settingsFocusRandomTooltip" as any) || "Random"}
            >
              🔀
            </button>
          </div>

          {/* 3:7 가로 병렬 배치: 애니메이션 주기(초 단위 키입력) & 투명도(슬라이더) */}
          <div className="flex gap-4 items-end">
            {/* 애니메이션 주기 (30%) */}
            <div className="w-[30%] shrink-0">
              <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">{t("settingsInterval")}</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={(interval / 1000).toFixed(1)}
                onChange={(e) => {
                  const val = Math.max(0.5, parseFloat(e.target.value) || 0.5);
                  const ms = Math.round(val * 1000);
                  setIntervalVal(ms);
                  handleUpdate({ animationInterval: ms });
                }}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 text-center"
              />
            </div>

            {/* 투명도 (70%) */}
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-medium">
                <span>{t("settingsOpacity")}</span>
                <span className="text-indigo-400 font-semibold">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setOpacity(val);
                  handleUpdate({ opacity: val });
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* 제외 사이트 관리 */}
          {hiddenSites.length > 0 && (
            <div className="border-t border-slate-850 pt-2.5">
              <label className="text-[10px] text-slate-400 block mb-1 font-medium">{t("settingsHiddenSites" as any)}</label>
              <div className="max-h-20 overflow-y-auto space-y-1.5 pr-1">
                {hiddenSites.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between bg-slate-950/40 border border-slate-900 rounded-md px-2 py-0.5 text-xs text-slate-300"
                  >
                    <span className="truncate flex-1 mr-2 text-[10px]" title={domain}>
                      {domain}
                    </span>
                    <button
                      onClick={() => handleRemoveHiddenSite(domain)}
                      className="text-rose-400 hover:text-rose-300 font-semibold px-1 py-0.5 rounded hover:bg-rose-500/10 transition-colors text-[9px]"
                    >
                      {t("settingsRestore" as any)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
