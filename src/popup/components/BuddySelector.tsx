import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Crown, Sparkles, HelpCircle } from "lucide-react";

interface BuddySelectorProps {
  selectedId: string;
  onSelect: (id: string, type: "basic" | "premium" | "hidden") => void;
  disabled?: boolean;
  unlockedBuddies?: string[];
  revealHidden?: boolean;
}

const BASIC_BUDDIES = [
  { id: "bsprout",   name: "Baby Sprout" },
  { id: "bydragon",  name: "Yellow Dino" },
  { id: "cat",       name: "Basic Cat" },
  { id: "cotton",    name: "Cotton Ball" },
  { id: "curobot",   name: "Cute Robot" },
  { id: "fox",       name: "Basic Fox" },
  { id: "owl",       name: "Basic Owl" },
  { id: "penguin",   name: "Basic Penguin" },
  { id: "rabbit",    name: "Basic Bunny" },
  { id: "shroom",    name: "Shroomy" },
  { id: "star",      name: "Star Fairy" },
  { id: "xcafe",     name: "Cafe Chick" },
  { id: "xcloud",    name: "Cloud Fairy" }
];

const PREMIUM_BUDDIES = [
  { id: "astrobot",  name: "Space Bot" },
  { id: "p_cat",     name: "Premium Cat" },
  { id: "chef",      name: "Pastry Chef" },
  { id: "corgi",     name: "Welsh Corgi" },
  { id: "dog",       name: "Fancy Puppy" },
  { id: "dragon",    name: "Green Dragon" },
  { id: "fairy",     name: "Golden Fairy" },
  { id: "fennec",    name: "Royal Fennec" },
  { id: "p_fox",     name: "Premium Fox" },
  { id: "jellyfish", name: "Aqua Jelly" },
  { id: "nebula",    name: "Nebula Dragon" },
  { id: "p_owl",     name: "Wise Owl" },
  { id: "p_penguin", name: "Royal Penguin" },
  { id: "p_rabbit",  name: "Royal Bunny" },
  { id: "sprout",    name: "Leafy Sprite" },
  { id: "ufo",       name: "Alien UFO" },
  { id: "unicorn",   name: "Pegasus Uni" },
  { id: "wizard",    name: "Grand Wizard" }
];

const HIDDEN_BUDDIES_LIST = [
  { id: "cactus",           name: "Cactus Pot" },
  { id: "h_chef",           name: "Hidden Chef" },
  { id: "frosty",           name: "Snow Bear" },
  { id: "witchy",           name: "Witch Cat" },
  { id: "dino",             name: "Little Dino" },
  { id: "ghost",            name: "Gentle Ghost" },
  { id: "hamster",          name: "Hamster Seed" },
  { id: "hedgehog",         name: "Hedgehog Spike" },
  { id: "otter",            name: "Sea Otter" },
  { id: "panda",            name: "Panda Bear" },
  { id: "blue_dragon",      name: "Azure Dragon" },
  { id: "cloud",            name: "Rainbow Cloud" },
  { id: "cupcake",          name: "Strawberry Cupcake" },
  { id: "penguin_blue_hat", name: "Cozy Penguin" },
  { id: "red_panda",        name: "Lesser Panda" },
  { id: "sky_dragon",       name: "Sky Dragon" },
  { id: "sprout_fairy",     name: "Sprout Fairy" }
];

const LEVEL_UNLOCKABLE_BUDDIES = new Set([
  "cactus", "h_chef", "frosty", "witchy", "dino", "ghost", "hamster", "hedgehog", "otter", "panda",
  "blue_dragon", "cloud", "cupcake", "penguin_blue_hat", "red_panda", "sky_dragon", "sprout_fairy"
]);

const goldAnimStyle = `
  @keyframes gold-rotate {
    0% { border-color: #ffd700; box-shadow: 0 0 4px #ffd700, inset 0 0 2px rgba(255,215,0,0.2); }
    50% { border-color: #ffaa00; box-shadow: 0 0 12px #ffaa00, inset 0 0 6px rgba(255,170,0,0.4); }
    100% { border-color: #ffd700; box-shadow: 0 0 4px #ffd700, inset 0 0 2px rgba(255,215,0,0.2); }
  }
  .premium-glow-selected {
    animation: gold-rotate 2.5s infinite ease-in-out;
    border-width: 1.5px !important;
  }
  @keyframes special-rotate {
    0% { border-color: #ec4899; box-shadow: 0 0 6px #ec4899, inset 0 0 3px rgba(236,72,153,0.25); }
    50% { border-color: #8b5cf6; box-shadow: 0 0 16px #8b5cf6, inset 0 0 8px rgba(139,92,246,0.5); }
    100% { border-color: #ec4899; box-shadow: 0 0 6px #ec4899, inset 0 0 3px rgba(236,72,153,0.25); }
  }
  .special-glow-selected {
    animation: special-rotate 2.0s infinite ease-in-out;
    border-width: 1.5px !important;
  }
`;

export const BuddySelector: React.FC<BuddySelectorProps> = ({
  selectedId,
  onSelect,
  disabled = false,
  unlockedBuddies = [],
  revealHidden = false,
}) => {
  const [activeTab, setActiveTab] = useState<"basic" | "premium" | "hidden">("basic");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // 활성 탭에 따른 리스트 매핑
  const getBuddyList = () => {
    switch (activeTab) {
      case "basic": return BASIC_BUDDIES;
      case "premium": return PREMIUM_BUDDIES;
      case "hidden": {
        // 레벨 해금 10종만 기본적으로 노출(잠김 시 ?로 표시)하고, 
        // 번외 히든 캐릭터는 해금되었거나 revealHidden 상태일 때만 목록에 표시
        return HIDDEN_BUDDIES_LIST.filter(b => 
          LEVEL_UNLOCKABLE_BUDDIES.has(b.id) || unlockedBuddies.includes(b.id) || revealHidden
        );
      }
    }
  };

  const buddies = getBuddyList();
  const totalPages = Math.ceil(buddies.length / itemsPerPage);

  // 탭 변경 시 페이지 리셋 및 기본 탭 설정 추론
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  // 최초 로드 시 현재 선택된 buddyId를 가진 탭으로 자동 이동
  useEffect(() => {
    if (selectedId) {
      if (BASIC_BUDDIES.some(b => b.id === selectedId)) {
        setActiveTab("basic");
      } else if (PREMIUM_BUDDIES.some(b => b.id === selectedId)) {
        setActiveTab("premium");
      } else if (HIDDEN_BUDDIES_LIST.some(b => b.id === selectedId)) {
        setActiveTab("hidden");
      }
    }
  }, [selectedId]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };

  const isUnlocked = (id: string, tab: "basic" | "premium" | "hidden"): boolean => {
    if (tab !== "hidden") return true;
    if (revealHidden) return true;
    return unlockedBuddies.includes(id);
  };

  const getThumbUrl = (id: string, tab: "basic" | "premium" | "hidden"): string => {
    return chrome.runtime.getURL(`buddies/characters/${tab}/${id}/frame_01.webp`);
  };

  const currentItems = buddies.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      <style dangerouslySetInnerHTML={{ __html: goldAnimStyle }} />

      {/* 탭 카테고리 렌더링 */}
      <div className="flex items-center justify-between px-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 mx-3">
        {(["basic", "premium", "hidden"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              disabled={disabled}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-1 ${
                isActive
                  ? tab === "premium"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    : tab === "hidden"
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                    : "bg-slate-800 text-slate-100 border border-slate-700/80 shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {tab === "premium" && <Crown size={9} className={isActive ? "text-amber-400" : "text-slate-400"} />}
              {tab === "hidden" && <Sparkles size={9} className={isActive ? "text-indigo-400" : "text-slate-400"} />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* 캐러셀 뷰포트 영역 */}
      <div className="relative flex items-center w-full px-3.5 min-h-[58px]">
        {/* 왼쪽 화살표 */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={disabled || currentPage === 0}
          className="absolute left-0.5 z-10 p-0.5 rounded-full text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800/40 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* 그리드 뷰포트 */}
        <div className="w-full overflow-hidden pt-1.5 pb-3.5">
          <div className="grid grid-cols-5 gap-1.5 w-full shrink-0 px-0.5 pt-1 pb-0">
            {currentItems.map((b) => {
              const isSelected = selectedId === b.id;
              const unlocked = isUnlocked(b.id, activeTab);
              const thumbUrl = getThumbUrl(b.id, activeTab);

              // 등급 및 상태별 스타일 분기
              const getBorderColor = () => {
                if (!unlocked) return "border-slate-800 opacity-50 cursor-not-allowed";
                if (isSelected) {
                  if (activeTab === "premium") return "premium-glow-selected border-amber-400 bg-gradient-to-tr from-amber-950/40 via-yellow-950/30 to-amber-950/40";
                  if (activeTab === "hidden") return "special-glow-selected border-pink-400 bg-gradient-to-tr from-indigo-950/40 via-purple-950/30 to-pink-950/40";
                  return "border-slate-400 bg-slate-800/60 shadow-[0_0_6px_rgba(255,255,255,0.15)]";
                }
                if (activeTab === "premium") return "border-amber-600/30 hover:border-amber-500 hover:bg-slate-800 bg-gradient-to-tr from-amber-950/15 via-yellow-950/10 to-amber-950/15";
                if (activeTab === "hidden") return "border-purple-900/30 hover:border-pink-500/50 bg-gradient-to-tr from-indigo-950/20 via-purple-950/10 to-pink-950/20";
                return "border-slate-800 hover:bg-slate-800";
              };

              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={disabled || !unlocked}
                  onClick={() => unlocked && onSelect(b.id, activeTab)}
                  className={`flex items-center justify-center p-0.5 rounded-xl bg-slate-850 border transition-all aspect-square relative group !overflow-visible ${getBorderColor()}`}
                >
                  {unlocked ? (
                    <img
                      src={thumbUrl}
                      alt={b.name}
                      className="w-full h-full max-h-[42px] object-contain pointer-events-none transform group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    /* 잠긴 캐릭터 물음표 */
                    <HelpCircle size={18} className="text-slate-600" />
                  )}

                  {/* 프리미엄 뱃지 오버레이 */}
                  {unlocked && activeTab === "premium" && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-[0_1px_4px_rgba(0,0,0,0.45)] border border-amber-300 z-10">
                      <Crown size={9} className="fill-slate-950 stroke-[2]" />
                    </span>
                  )}

                  {/* 히든 반짝이 뱃지 오버레이 */}
                  {unlocked && activeTab === "hidden" && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_1px_4px_rgba(236,72,153,0.5)] border border-pink-300 z-10">
                      <Sparkles size={8} className="text-white fill-white" />
                    </span>
                  )}

                  {/* 세련된 커스텀 하단 툴팁 (마우스 오버시 표시되며, 브라우저 기본 title과 겹치지 않게 조절) */}
                  <span className="absolute top-full mt-0.5 bg-slate-950/95 border border-slate-700 text-[8px] text-slate-100 px-1.5 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[110] shadow-md">
                    {unlocked ? b.name : "🔒 Locked (Level Up)"}
                  </span>
                </button>
              );
            })}
            
            {/* 5개 미만인 경우 빈 버튼으로 패딩 */}
            {currentItems.length < itemsPerPage && 
              Array.from({ length: itemsPerPage - currentItems.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />
              ))
            }
          </div>
        </div>

        {/* 오른쪽 화살표 */}
        <button
          type="button"
          onClick={handleNext}
          disabled={disabled || currentPage === totalPages - 1 || totalPages <= 1}
          className="absolute right-0.5 z-10 p-0.5 rounded-full text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-800/40 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
