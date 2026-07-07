import { useState } from "react";
import { 
  X, 
  Briefcase, 
  BarChart3, 
  Calendar, 
  FileText, 
  Scale, 
  BookOpen, 
  Target, 
  Lightbulb, 
  GitFork, 
  GitCommit, 
  Network,
  PlusCircle,
  ArrowDown,
  ArrowRight,
  GitBranch
} from "lucide-react";
import { useLang } from "@/shared/LanguageContext";
import type { TemplateId } from "../mindmap-types";

interface TemplateItem {
  id: TemplateId;
  title: string;
  desc: string;
  colorClass: string;
  icon: React.ComponentType<any>;
}

const TEMPLATES: TemplateItem[] = [
  { id: "blank", title: "Blank Map", desc: "Start with only a single root node.", colorClass: "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-slate-600 dark:text-slate-400", icon: PlusCircle },
  { id: "brainstorm", title: "Brainstorm", desc: "A blank canvas to dump ideas.", colorClass: "border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/10 text-purple-600 dark:text-purple-400", icon: Lightbulb },
  { id: "swot", title: "SWOT Analysis", desc: "Strengths, weaknesses, opportunities, threats.", colorClass: "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400", icon: BarChart3 },
  { id: "project_plan", title: "Project Plan", desc: "Goals, scope, timeline, team, risks.", colorClass: "border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400", icon: Briefcase },
  { id: "weekly_planner", title: "Weekly Planner", desc: "Plan your week, day by day.", colorClass: "border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400", icon: Calendar },
  { id: "meeting_notes", title: "Meeting Notes", desc: "Agenda, decisions, action items.", colorClass: "border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10 text-amber-600 dark:text-amber-400", icon: FileText },
  { id: "pros_cons", title: "Pros & Cons", desc: "Weigh a decision.", colorClass: "border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400", icon: Scale },
  { id: "study_notes", title: "Study Notes", desc: "Concepts, definitions, examples.", colorClass: "border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/10 text-teal-600 dark:text-teal-400", icon: BookOpen },
  { id: "okrs", title: "OKRs", desc: "Objectives and key results.", colorClass: "border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/40 dark:bg-cyan-950/10 text-cyan-600 dark:text-cyan-400", icon: Target },
  { id: "fishbone", title: "Fishbone", desc: "Cause & Effect diagram — the classic 6 M's.", colorClass: "border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/10 text-sky-600 dark:text-sky-400", icon: GitFork },
  { id: "timeline", title: "Timeline", desc: "A left-to-right sequence of milestones.", colorClass: "border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400", icon: GitCommit },
  { id: "org_chart", title: "Org Chart", desc: "A top-down reporting hierarchy.", colorClass: "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 text-slate-600 dark:text-slate-400", icon: Network }
];

interface Props {
  onSelect: (templateId: TemplateId, title: string) => void;
  onClose: () => void;
}

// 정렬 방향 매핑 헬퍼 함수
const getDirInfo = (templateId: TemplateId): { label: string; icon: React.ComponentType<any>; color: string } => {
  if (templateId === "org_chart") {
    return { 
      label: "Vertical", 
      icon: ArrowDown, 
      color: "text-blue-500 bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/30" 
    };
  }
  if (templateId === "timeline" || templateId === "fishbone") {
    return { 
      label: "Horizontal", 
      icon: ArrowRight, 
      color: "text-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30" 
    };
  }
  return { 
    label: "Balanced", 
    icon: GitBranch, 
    color: "text-purple-500 bg-purple-50/80 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-900/30" 
  };
};

export default function TemplateSelector({ onSelect, onClose }: Props) {
  const { t } = useLang();
  const [mapName, setMapName] = useState("");

  const handleSelect = (templateId: TemplateId, defaultTitle: string) => {
    const finalTitle = mapName.trim() || defaultTitle;
    onSelect(templateId, finalTitle);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/60 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              🚀 Start from a template
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("mindmapSelectTemplateDesc")}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Name Input Area (커스텀 입력 창) */}
        <div className="px-6 py-4 bg-white dark:bg-slate-950 border-b border-gray-150 dark:border-slate-800 shrink-0">
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            💡 {t("mindmapNameInput")}
          </label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder={t("mindmapNamePlaceholder")}
            className="w-full px-4 py-2.5 !bg-slate-100 dark:!bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm !text-slate-900 dark:!text-slate-100 placeholder-gray-400 dark:placeholder-gray-600 transition-all outline-none"
            autoFocus
          />
        </div>

        {/* Content Area - Rich cards */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 scrollbar-thin">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                onClick={() => handleSelect(tpl.id, tpl.title)}
                className={`relative flex items-start gap-3.5 p-4 border rounded-2xl transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] group ${tpl.colorClass}`}
              >
                {/* 정렬 방향 배지 */}
                {(() => {
                  const dirInfo = getDirInfo(tpl.id);
                  const DirIcon = dirInfo.icon;
                  return (
                    <span 
                      className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border flex items-center gap-0.5 shadow-sm ${dirInfo.color}`}
                      title={`기본 정렬: ${dirInfo.label}`}
                    >
                      <DirIcon size={9} />
                      <span>{dirInfo.label}</span>
                    </span>
                  );
                })()}

                <span className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm shrink-0">
                  <Icon size={18} className="transition-transform group-hover:scale-110 duration-200" />
                </span>
                <div className="min-w-0 pr-12 text-left">
                  <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200 block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tpl.title}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block leading-relaxed line-clamp-2">
                    {tpl.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100/50 dark:bg-slate-800/30 border-t border-gray-200/60 dark:border-slate-800 flex justify-end shrink-0 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
