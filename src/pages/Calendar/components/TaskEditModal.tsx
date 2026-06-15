import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Check, 
  Trash2, 
  Clock, 
  AlertCircle, 
  AlignLeft, 
  CheckSquare, 
  Tag, 
  Calendar,
  CheckCircle2,
  Circle
} from "lucide-react";
import type { TodoTask } from "@/shared/types";
import ReactMarkdown from "react-markdown";
import { FolderIcon } from "@/components/DynamicIcon";
import { IconPicker } from "@/components/IconPicker";
import {
  TASK_BG_COLORS,
  TASK_SOLID_COLORS,
  timeOptions,
  REMINDER_OPTIONS,
  formatDateStr
} from "../calendar-utils";

interface TaskEditModalProps {
  task: TodoTask;
  onClose: () => void;
  onSave: (updatedTask: TodoTask) => void;
  onDelete: (taskId: string) => void;
  t: (key: string) => string;
}

export default function TaskEditModal({
  task,
  onClose,
  onSave,
  onDelete,
  t
}: TaskEditModalProps) {
  // Local state initialized with task data
  const [title, setTitle] = useState(task.content);
  const [icon, setIcon] = useState<string | undefined>(task.icon);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [description, setDescription] = useState(task.description || "");
  const [isDescEditing, setIsDescEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [progress, setProgress] = useState(task.progress || 0);
  const [completed, setCompleted] = useState(!!task.completed);
  const [color, setColor] = useState<string>(task.color || "default");
  const [startDate, setStartDate] = useState<string | undefined>(task.startDate);
  const [dueDate, setDueDate] = useState<string | undefined>(task.dueDate);
  const [dueTime, setDueTime] = useState<string | undefined>(task.dueTime || "12:00");
  const [reminder, setReminder] = useState<string | undefined>(task.reminder || "none");
  const [recurrence, setRecurrence] = useState<TodoTask["recurrence"]>(task.recurrence || "none");
  const [type, setType] = useState<"todo" | "event" | "holiday">(task.type || (task.isHoliday ? "holiday" : "todo"));
  const [location, setLocation] = useState(task.location || "");
  const [checklist, setChecklist] = useState<any[]>(task.checklist || []);
  const [checklistInput, setChecklistInput] = useState("");

  // Sync state if task changes
  useEffect(() => {
    setTitle(task.content);
    setIcon(task.icon);
    setShowIconPicker(false);
    setDescription(task.description || "");
    setIsDescEditing(false);
    setTags(task.tags || []);
    setTagInput("");
    setProgress(task.progress || 0);
    setCompleted(!!task.completed);
    setColor(task.color || "default");
    setStartDate(task.startDate);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || "12:00");
    setReminder(task.reminder || "none");
    setRecurrence(task.recurrence || "none");
    setType(task.type || (task.isHoliday ? "holiday" : "todo"));
    setLocation(task.location || "");
    setChecklist(task.checklist || []);
    setChecklistInput("");
  }, [task]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    let finalProgress = progress;
    if (completed) {
      finalProgress = 100;
    } else if (finalProgress === 100 && !completed) {
      finalProgress = 0;
    }

    const updatedTask: TodoTask = {
      ...task,
      content: trimmedTitle,
      icon: icon || undefined,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      checklist: checklist,
      progress: finalProgress,
      completed,
      color: color === "default" ? undefined : color,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      dueTime,
      reminder: reminder as any,
      recurrence: recurrence === "none" ? undefined : recurrence,
      type,
      location: type === "event" ? location.trim() || undefined : undefined,
      isHoliday: type === "holiday" ? true : undefined,
    };
    onSave(updatedTask);
  };

  // Checklist Helpers
  const addChecklistItem = () => {
    const text = checklistInput.trim();
    if (!text) return;
    const item = {
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      completed: false,
    };
    const next = [...checklist, item];
    setChecklist(next);
    setChecklistInput("");

    // Recalculate progress
    const completedCount = next.filter((c) => c.completed).length;
    const totalCount = next.length;
    if (totalCount > 0) {
      const percentage = Math.round((completedCount / totalCount) * 100);
      setProgress(percentage);
      setCompleted(percentage === 100);
    }
  };

  const toggleCheckItem = (itemId: string) => {
    const next = checklist.map((c) =>
      c.id === itemId ? { ...c, completed: !c.completed } : c
    );
    setChecklist(next);

    const completedCount = next.filter((c) => c.completed).length;
    const totalCount = next.length;
    if (totalCount > 0) {
      const percentage = Math.round((completedCount / totalCount) * 100);
      setProgress(percentage);
      setCompleted(percentage === 100);
    }
  };

  const removeCheckItem = (itemId: string) => {
    const next = checklist.filter((c) => c.id !== itemId);
    setChecklist(next);

    const totalCount = next.length;
    if (totalCount > 0) {
      const completedCount = next.filter((c) => c.completed).length;
      setProgress(Math.round((completedCount / totalCount) * 100));
    } else {
      setProgress(0);
    }
  };

  // Tag Helpers
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700/60 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200/60 dark:border-surface-800/80 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full">
            TASK EDITOR
          </span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none scrollbar-thin">
          
          {/* Task Title */}
          <div className="flex items-center gap-3 relative">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-surface-800 border border-gray-200 dark:border-surface-700/66 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-surface-700 transition-all shadow-sm"
                title="일정 아이콘 설정"
              >
                {icon ? (
                  <FolderIcon iconName={icon} size={20} className="text-indigo-500 dark:text-indigo-400" />
                ) : (
                  <Plus size={16} className="text-gray-400 dark:text-gray-500" />
                )}
              </button>
              {showIconPicker && (
                <IconPicker
                  onSelect={(selectedIcon) => {
                    setIcon(selectedIcon);
                    setShowIconPicker(false);
                  }}
                  onClose={() => setShowIconPicker(false)}
                  className="left-0 mt-1.5 w-[220px]"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 py-1"
                placeholder={type === "holiday" ? (t("holidayNameLabel") || "휴일명 입력...") : (t("taskContentPlaceholder") || "Enter task...")}
              />
            </div>
          </div>

          {/* Task Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              {t("taskTypeLabel") || "일정 종류"}
            </label>
            <div className="flex bg-gray-100/60 dark:bg-surface-800/60 p-0.5 rounded-xl border border-gray-200/20 dark:border-white/5">
              {(["todo", "event", "holiday"] as const).map((tType) => {
                const isSelected = type === tType;
                return (
                  <button
                    key={tType}
                    type="button"
                    onClick={() => {
                      setType(tType);
                      if (tType === "holiday") {
                        const dateVal = startDate || dueDate || formatDateStr(new Date());
                        setStartDate(dateVal);
                        setDueDate(dateVal);
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {tType === "todo" && (
                      <CheckSquare size={13} className={isSelected ? "text-emerald-500" : "text-gray-400"} />
                    )}
                    {tType === "event" && (
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center text-[7px] text-white font-black ${
                        isSelected ? "bg-indigo-500" : "bg-gray-400"
                      }`}>E</span>
                    )}
                    {tType === "holiday" && (
                      <Calendar size={13} className={isSelected ? "text-rose-500" : "text-gray-400"} />
                    )}
                    <span>
                      {tType === "todo" ? t("taskTypeTodo") : tType === "event" ? t("taskTypeEvent") : t("taskTypeHoliday")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Color Setup */}
          {type === "holiday" ? (
            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  휴일 날짜
                </label>
                <input
                  type="date"
                  value={startDate || ""}
                  onChange={(e) => {
                    setStartDate(e.target.value || undefined);
                    setDueDate(e.target.value || undefined);
                  }}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  {t("holidayColorLabel") || "휴일 색상"}
                </label>
                <div className="flex gap-2 py-1 items-center">
                  {Object.keys(TASK_BG_COLORS).map((colorKey) => {
                    const isActive = color === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setColor(colorKey)}
                        className={`w-6 h-6 rounded-full ${TASK_SOLID_COLORS[colorKey]} shadow transition-transform hover:scale-115 flex items-center justify-center
                          ${isActive ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-900 scale-110" : ""}
                        `}
                      >
                        {isActive && <Check size={12} className="text-white font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  {t("datepickerStartDate") || "시작일"}
                </label>
                <input
                  type="date"
                  value={startDate || ""}
                  onChange={(e) => setStartDate(e.target.value || undefined)}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  {t("datepickerDueDate") || "기한"}
                </label>
                <input
                  type="date"
                  value={dueDate || ""}
                  onChange={(e) => setDueDate(e.target.value || undefined)}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Time & Reminders & Event Location */}
          {type !== "holiday" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} />
                  마감 시간
                </label>
                <select
                  value={dueTime || "12:00"}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={12} />
                  {t("reminderLabel") || "리마인드"}
                </label>
                <select
                  value={reminder || "none"}
                  onChange={(e) => setReminder(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {type === "event" && (
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    {t("locationLabel") || "장소"}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t("locationPlaceholder") || "장소를 입력하세요..."}
                    className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Recurrence Setup */}
          {type !== "holiday" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} />
                  {t("recurrenceLabel") || "반복 일정"}
                </label>
                <select
                  value={recurrence || "none"}
                  onChange={(e) => setRecurrence(e.target.value as any)}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="none">{t("recurrenceNone") || "반복 없음"}</option>
                  <option value="daily">{t("recurrenceDaily") || "매일"}</option>
                  <option value="weekly">{t("recurrenceWeekly") || "매주"}</option>
                  <option value="monthly">{t("recurrenceMonthly") || "매월"}</option>
                </select>
              </div>
            </div>
          )}

          {/* Color Card Selection (Non-Holiday tasks) */}
          {type !== "holiday" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                카드 색상
              </label>
              <div className="flex gap-2.5">
                {Object.keys(TASK_BG_COLORS).map((colorKey) => {
                  const isActive = color === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setColor(colorKey)}
                      className={`w-6 h-6 rounded-full ${TASK_SOLID_COLORS[colorKey]} shadow transition-transform hover:scale-115 flex items-center justify-center
                        ${isActive ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-900 scale-110" : ""}
                      `}
                    >
                      {isActive && <Check size={12} className="text-white font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <AlignLeft size={13} />
                설명 (Markdown 지원)
              </label>
              <button
                type="button"
                onClick={() => setIsDescEditing(!isDescEditing)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {isDescEditing ? "Preview" : "Edit"}
              </button>
            </div>

            {isDescEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="상세 정보를 기입하세요 (마크다운 포맷 지원)"
                className="w-full bg-gray-50 dark:bg-surface-800 text-xs border border-gray-200/60 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 resize-y min-h-[60px] max-h-[200px] font-sans"
              />
            ) : (
              <div className="w-full min-h-[60px] max-h-[180px] overflow-auto resize-y bg-gray-50/30 dark:bg-surface-800/20 border border-gray-200/50 dark:border-surface-800/60 rounded-xl p-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed scrollbar-thin">
                {description.trim() ? (
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none text-xs leading-normal">
                    {description}
                  </ReactMarkdown>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 italic text-[11px]">설명이 비어 있습니다.</span>
                )}
              </div>
            )}
          </div>

          {/* Checklist Section */}
          {type === "todo" && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={13} />
                체크리스트
              </label>

              {/* Progress indicator */}
              <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-surface-800 p-2.5 rounded-xl border border-gray-200/10">
                <div className="w-full bg-gray-200 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 w-8 text-right">
                  {progress}%
                </span>
              </div>

              {/* Checklist items */}
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between group/check p-2 hover:bg-gray-50/50 dark:hover:bg-surface-800 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCheckItem(item.id)}
                        className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      >
                        {item.completed ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <Circle size={16} />
                        )}
                      </button>
                      <span className={`text-sm truncate ${item.completed ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-200"}`}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCheckItem(item.id)}
                      className="opacity-0 group-hover/check:opacity-100 p-1 hover:text-red-500 transition-all text-gray-400 rounded-md hover:bg-red-50 dark:hover:bg-red-955/20"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Input Add */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checklistInput}
                  onChange={(e) => setChecklistInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                  placeholder="체크 아이템 추가..."
                  className="flex-1 bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm hover:shadow-indigo-500/10 transition-all font-semibold text-xs active:scale-95 flex items-center justify-center"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Tag size={12} />
              태그
            </label>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-5/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold tracking-wider rounded-md border border-indigo-100/30 dark:border-indigo-900/30"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="새 태그 (Enter로 추가)..."
                className="flex-1 bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm hover:shadow-indigo-500/10 transition-all font-semibold text-xs active:scale-95 flex items-center justify-center"
              >
                Add
              </button>
            </div>
          </div>

          {/* Completion Switch Row */}
          {type === "todo" && (
            <div className="flex items-center justify-between bg-gray-100/70 dark:bg-surface-800 p-4 rounded-2xl border border-gray-200/10">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">완료 상태</h4>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">이 작업이 모두 완료되었는지 지정합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setCompleted(!completed)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                  ${completed ? "bg-emerald-500" : "bg-gray-200 dark:bg-surface-700"}
                `}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${completed ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200/60 dark:border-surface-800/80 bg-gray-50/60 dark:bg-surface-900/50 flex items-center justify-between shrink-0">
          <button
            onClick={() => onDelete(task.id)}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 px-3 py-2 rounded-xl transition-all"
          >
            <Trash2 size={13} />
            Delete Task
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-150 disabled:text-gray-400 dark:disabled:bg-surface-800 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/10 active:scale-95"
            >
              Save Task
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
