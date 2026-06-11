import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import { Plus, Check, Trash2, GripVertical, Loader2, X, AlignLeft, CheckSquare, Tag, CheckCircle2, Circle, Palette, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock, ChevronDown, RotateCcw, Bell } from "lucide-react";
import type { TodoBoardData, TodoColumn, TodoTask, MessageResponse, AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

import ReactMarkdown from "react-markdown";

// --- Types ---

const COLUMN_BG_COLORS: Record<string, string> = {
  default: "bg-gray-100 dark:bg-[#1A1A1C]",
  blue: "bg-blue-50/50 dark:bg-[#1A1E24]",
  emerald: "bg-emerald-50/50 dark:bg-[#1A221C]",
  amber: "bg-amber-50/50 dark:bg-[#24201A]",
  rose: "bg-rose-50/50 dark:bg-[#241A1C]",
  purple: "bg-purple-50/50 dark:bg-[#201A24]",
};

const TASK_BG_COLORS: Record<string, string> = {
  default: "bg-white dark:bg-[#2C2C2E]",
  blue: "bg-blue-50 dark:bg-[#1C2331]",
  emerald: "bg-emerald-50 dark:bg-[#1D2A24]",
  amber: "bg-amber-50 dark:bg-[#2D281E]",
  rose: "bg-rose-50 dark:bg-[#2D1E22]",
  purple: "bg-purple-50 dark:bg-[#251E2D]",
};

const COLOR_BTN_BG: Record<string, string> = {
  default: "bg-gray-300 dark:bg-gray-600",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

const REMINDER_OPTIONS = [
  { value: "none", label: "없음" },
  { value: "at_due", label: "기한 정시" },
  { value: "15m_before", label: "15분 전" },
  { value: "1h_before", label: "1시간 전" },
  { value: "3h_before", label: "3시간 전" },
  { value: "1d_before", label: "1일 전" },
];

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, "0");
    options.push(`${hh}:00`);
    options.push(`${hh}:30`);
  }
  return options;
};
const timeOptions = generateTimeOptions();

const formatDateKorean = (dateStr?: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${m}월 ${d}일`;
};

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const isToday = (date: Date) => {
  return formatDateStr(date) === formatDateStr(new Date());
};

const isBetweenDays = (date: Date, startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return false;
  const dStr = formatDateStr(date);
  return dStr > startStr && dStr < endStr;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getCalendarGrid = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ...
  const mondayFirstIndex = (firstDayIndex + 6) % 7;

  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const grid: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  for (let i = mondayFirstIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    grid.push({
      date: prevDate,
      isCurrentMonth: false,
      key: `prev-${daysInPrevMonth - i}`,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    grid.push({
      date: currDate,
      isCurrentMonth: true,
      key: `curr-${d}`,
    });
  }

  const remainingCells = 42 - grid.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    grid.push({
      date: nextDate,
      isCurrentMonth: false,
      key: `next-${d}`,
    });
  }

  return grid;
};

const getDueBadgeInfo = (task: TodoTask) => {
  if (!task.dueDate) return null;

  const todayStr = formatDateStr(new Date());
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateStr(tomorrow);

  const isCompleted = !!task.completed;
  const isOverdue = !isCompleted && task.dueDate < todayStr;
  const isDueToday = !isCompleted && task.dueDate === todayStr;
  const isDueTomorrow = !isCompleted && task.dueDate === tomorrowStr;

  const dateFormatted = formatDateKorean(task.dueDate);
  const timeFormatted = task.dueTime ? ` ${task.dueTime}` : "";
  const displayLabel = `${dateFormatted}${timeFormatted}`;

  let bgClass = "bg-gray-55 dark:bg-surface-800 text-gray-500 dark:text-gray-400 border-gray-200/50 dark:border-surface-700/50";
  let statusText = "";

  if (isCompleted) {
    bgClass = "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
    statusText = "완료";
  } else if (isOverdue) {
    bgClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 font-semibold animate-pulse";
    statusText = "지연됨";
  } else if (isDueToday) {
    bgClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 font-semibold";
    statusText = "오늘";
  } else if (isDueTomorrow) {
    bgClass = "bg-amber-50/60 dark:bg-amber-950/10 text-amber-600/90 dark:text-amber-400/90 border-amber-100/50 dark:border-amber-900/20";
    statusText = "내일";
  }

  return {
    label: displayLabel,
    bgClass,
    statusText
  };
};

interface TodoTaskCardProps {
  task: TodoTask;
  index: number;
  columnId: string;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onOpenModal: (task: TodoTask) => void;
  onDeleteTask: (taskId: string, colId: string, e?: React.MouseEvent) => void;
}

const TodoTaskCard = React.memo(function TodoTaskCard({
  task,
  index,
  columnId,
  onToggleComplete,
  onOpenModal,
  onDeleteTask,
}: TodoTaskCardProps) {
  return (
    <Draggable key={task.id} draggableId={task.id} index={index}>
      {(provided: DraggableProvided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpenModal(task)}
          className={`group/task relative ${TASK_BG_COLORS[task.color || "default"]} p-4 rounded-xl shadow-sm mb-3 border border-gray-200/80 dark:border-white/10
            ${snapshot.isDragging ? "shadow-2xl ring-2 ring-indigo-500/50 rotate-3 z-50 cursor-grabbing scale-105" : "hover:border-indigo-400/80 dark:hover:border-indigo-500/60 hover:shadow-md hover:-translate-y-0.5 cursor-pointer dark:hover:brightness-110"}
            transition-all duration-200
          `}
        >
          <div className="flex items-start gap-2 relative">
            {/* Drag Handle Affordance */}
            <div className="mt-[5px] shrink-0 text-gray-400 dark:text-gray-550 opacity-30 group-hover/task:opacity-100 transition-opacity cursor-grab">
              <GripVertical size={14} />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              {/* Checkbox & Content Row */}
              <div className="flex items-start gap-2.5">
                <button 
                  onClick={(e) => onToggleComplete(task.id, e)}
                  className="mt-[3px] text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shrink-0"
                >
                  {task.completed ? <CheckCircle2 size={16} className="text-emerald-500 animate-in zoom-in duration-200" /> : <Circle size={16} />}
                </button>
                <div className={`text-[15px] font-medium break-words leading-tight ${task.completed ? "text-gray-400 dark:text-gray-555 line-through" : "text-gray-800 dark:text-gray-100"}`}>
                  {task.content}
                </div>
              </div>

              {/* Indicators & Metadata */}
              {(task.description || (task.checklist && task.checklist.length > 0) || (task.progress !== undefined && task.progress > 0) || (task.tags && task.tags.length > 0) || task.dueDate) && (
                <div className="mt-3 flex flex-col gap-2.5">
                  {/* Description, Checklist, Due Date Badges */}
                  {(task.description || (task.checklist && task.checklist.length > 0) || task.dueDate) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {task.dueDate && (() => {
                        const badge = getDueBadgeInfo(task);
                        if (!badge) return null;
                        return (
                          <div className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-lg border ${badge.bgClass}`}>
                            <Calendar size={12} />
                            <span>{badge.label}</span>
                            {badge.statusText && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 px-1 rounded">
                                {badge.statusText}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {task.description && (
                        <div className="flex items-center text-gray-400 dark:text-gray-500 py-0.5" title="Has description">
                          <AlignLeft size={14} />
                        </div>
                      )}
                      
                      {task.checklist && task.checklist.length > 0 && (
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${task.checklist.every(c => c.completed) ? "bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-250/20 dark:border-emerald-800/20" : "bg-gray-100 dark:bg-surface-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg border border-gray-200/50 dark:border-surface-700/50"}`}>
                          <CheckSquare size={12} />
                          <span>{task.checklist.filter(c => c.completed).length}/{task.checklist.length}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {task.progress !== undefined && task.progress > 0 && (
                    <div className="mt-0.5">
                      <div className="flex justify-between items-center mb-1 text-[9px] font-bold tracking-wider text-gray-400 dark:text-gray-550">
                        <span>PROGRESS</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200/50 dark:bg-surface-800 rounded-full h-1.5 overflow-hidden border border-gray-200/20 dark:border-white/5">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${task.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {task.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100/30 dark:border-indigo-900/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Absolute Delete Button on Hover */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/task:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => onDeleteTask(task.id, columnId, e)}
              className="p-1.5 bg-white/90 dark:bg-[#3A3A3C]/90 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
});

interface TodoColumnViewProps {
  column: TodoColumn;
  index: number;
  tasks: TodoTask[];
  editingColumnId: string | null;
  editColumnTitle: string;
  setEditColumnTitle: (val: string) => void;
  setEditingColumnId: (val: string | null) => void;
  onSaveColumnTitle: (colId: string, newTitle: string) => void;
  deleteColumn: (colId: string) => void;
  showColorPickerForCol: string | null;
  setShowColorPickerForCol: (val: string | null) => void;
  changeColumnColor: (colId: string, color: string) => void;
  addingTaskToCol: string | null;
  setAddingTaskToCol: (val: string | null) => void;
  newTaskContent: string;
  setNewTaskContent: (val: string) => void;
  addTask: (colId: string, content: string) => void;
  onToggleComplete: (taskId: string, e: React.MouseEvent) => void;
  onOpenModal: (task: TodoTask) => void;
  onDeleteTask: (taskId: string, colId: string, e?: React.MouseEvent) => void;
  t: any;
}

const TodoColumnView = React.memo(function TodoColumnView({
  column,
  index,
  tasks,
  editingColumnId,
  editColumnTitle,
  setEditColumnTitle,
  setEditingColumnId,
  onSaveColumnTitle,
  deleteColumn,
  showColorPickerForCol,
  setShowColorPickerForCol,
  changeColumnColor,
  addingTaskToCol,
  setAddingTaskToCol,
  newTaskContent,
  setNewTaskContent,
  addTask,
  onToggleComplete,
  onOpenModal,
  onDeleteTask,
  t,
}: TodoColumnViewProps) {
  const colorVariants = [
    "border-t-emerald-400",
    "border-t-blue-400",
    "border-t-purple-400",
    "border-t-rose-400",
    "border-t-amber-400"
  ];
  const colColor = colorVariants[index % colorVariants.length];
  const currentBgClass = COLUMN_BG_COLORS[column.color || "default"];

  return (
    <Draggable key={column.id} draggableId={column.id} index={index}>
      {(provided: DraggableProvided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className={`${currentBgClass} rounded-2xl w-[85vw] sm:w-auto sm:flex-1 sm:min-w-[300px] sm:max-w-[400px] shrink-0 flex flex-col max-h-full border border-gray-200/60 dark:border-white/[0.05] shadow-sm relative overflow-hidden transition-colors`}
        >
          <div className={`absolute top-0 left-0 w-full h-1 ${colColor} opacity-70`} />
          <div
            {...provided.dragHandleProps}
            className="px-4 pt-5 pb-3 flex items-center justify-between group/col"
          >
            {editingColumnId === column.id ? (
              <div className="flex items-center gap-1 w-full bg-white dark:bg-surface-900 rounded-lg border-2 border-indigo-500 px-2 py-1 shadow-sm">
                <input
                  autoFocus
                  value={editColumnTitle}
                  onChange={(e) => setEditColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveColumnTitle(column.id, editColumnTitle);
                    if (e.key === "Escape") setEditingColumnId(null);
                  }}
                  className="flex-1 bg-transparent text-sm font-semibold outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  placeholder={t("columnTitlePlaceholder") || "List Title"}
                />
                <button onClick={() => onSaveColumnTitle(column.id, editColumnTitle)} className="text-indigo-500 p-0.5 hover:bg-indigo-50 dark:hover:bg-surface-800 rounded-md">
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1 truncate">
                  <h3
                    onClick={() => {
                      setEditingColumnId(column.id);
                      setEditColumnTitle(column.title);
                    }}
                    className="font-bold text-gray-900 dark:text-gray-100 cursor-pointer truncate text-[15px] tracking-tight"
                  >
                    {column.title}
                  </h3>
                  <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1 transition-opacity">
                  <button
                    onClick={() => setShowColorPickerForCol(showColorPickerForCol === column.id ? null : column.id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Palette size={14} />
                  </button>
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {showColorPickerForCol === column.id && (
            <div className="px-4 pb-3 flex gap-2 justify-end animate-in fade-in slide-in-from-top-1 duration-200">
              {Object.keys(COLUMN_BG_COLORS).map(colorKey => {
                const isActive = column.color === colorKey || (!column.color && colorKey === 'default');
                return (
                  <button
                    key={colorKey}
                    onClick={() => changeColumnColor(column.id, colorKey)}
                    className={`w-5 h-5 rounded-full ${COLOR_BTN_BG[colorKey]} shadow-sm transition-transform hover:scale-110 flex items-center justify-center ${
                      isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#1A1A1C] scale-105' : ''
                    }`}
                  >
                    {isActive && <Check size={10} className="text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          )}

          <Droppable droppableId={column.id} type="task">
            {(provided: DroppableProvided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex-1 overflow-y-auto px-3 pb-2 min-h-[60px] transition-colors scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-600 ${
                  snapshot.isDraggingOver ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                }`}
              >
                {tasks.map((task, index) => (
                  <TodoTaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    columnId={column.id}
                    onToggleComplete={onToggleComplete}
                    onOpenModal={onOpenModal}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
                {provided.placeholder}
                
                {addingTaskToCol === column.id && (
                  <div className="bg-white dark:bg-[#2C2C2E] p-3 rounded-xl shadow-md mb-2 border-2 border-indigo-500 flex flex-col gap-2 relative animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea
                      autoFocus
                      value={newTaskContent}
                      onChange={(e) => setNewTaskContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          addTask(column.id, newTaskContent);
                        }
                        if (e.key === "Escape") setAddingTaskToCol(null);
                      }}
                      placeholder={t("taskContentPlaceholder") || "Enter task..."}
                      className="w-full text-[14px] bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 min-h-[70px] placeholder-gray-400"
                    />
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => setAddingTaskToCol(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors">Cancel</button>
                      <button 
                        disabled={!newTaskContent.trim()}
                        onClick={() => addTask(column.id, newTaskContent)} 
                        className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-surface-800 dark:disabled:text-gray-550 disabled:cursor-not-allowed disabled:shadow-none rounded-lg font-medium transition-colors shadow-sm shadow-indigo-500/20 active:scale-95"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {addingTaskToCol !== column.id && (
            <div className="p-3 shrink-0 pt-1">
              <button
                onClick={() => {
                  setAddingTaskToCol(column.id);
                  setNewTaskContent("");
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-surface-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all hover:shadow-sm"
              >
                <Plus size={16} />
                {t("addTodoTask") || "Add Task"}
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});

export default function TodoBoard({ settings }: { settings?: AppSettings }) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  const [data, setData] = useState<TodoBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const activeSettings = settings || localSettings;

  // Focus management
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [addingTaskToCol, setAddingTaskToCol] = useState<string | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [showColorPickerForCol, setShowColorPickerForCol] = useState<string | null>(null);

  // Task Modal management
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [editTaskTitleModal, setEditTaskTitleModal] = useState("");
  const [editTaskDescModal, setEditTaskDescModal] = useState("");
  const [editTaskTags, setEditTaskTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [editTaskChecklist, setEditTaskChecklist] = useState<import("@/shared/types").TodoChecklistItem[]>([]);
  const [checklistInput, setChecklistInput] = useState("");
  const [editTaskProgress, setEditTaskProgress] = useState(0);
  const [editTaskCompleted, setEditTaskCompleted] = useState(false);
  const [editTaskColor, setEditTaskColor] = useState<string | undefined>(undefined);
  const [editTaskStartDate, setEditTaskStartDate] = useState<string | undefined>(undefined);
  const [editTaskDueDate, setEditTaskDueDate] = useState<string | undefined>(undefined);
  const [editTaskDueTime, setEditTaskDueTime] = useState<string | undefined>(undefined);
  const [editTaskReminder, setEditTaskReminder] = useState<string | undefined>(undefined);
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<"start" | "due">("due");
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth());

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = (await chrome.runtime.sendMessage({ type: "GET_TODO_BOARD" })) as MessageResponse;
    if (res.success && res.data) {
      setData(res.data as TodoBoardData);
    }
    const settingsRes = (await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })) as MessageResponse;
    if (settingsRes.success && settingsRes.data) {
      setLocalSettings(settingsRes.data as AppSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = useCallback(async (newData: TodoBoardData) => {
    setData(newData); // Optimistic UI update
    await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: newData });
  }, []);

  // --- Handlers ---

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!data) return;

    // Moving a column
    if (type === "column") {
      const newColumnOrder = Array.from(data.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);

      saveData({
        ...data,
        columnOrder: newColumnOrder,
      });
      return;
    }

    // Moving a task
    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    // Moving within the same column
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      saveData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });
      return;
    }

    // Moving from one column to another
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      taskIds: finishTaskIds,
    };

    saveData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  }, [data, saveData]);

  const addColumn = useCallback(() => {
    if (!data) return;
    const newColId = `col-${Date.now()}`;
    const newColumn: TodoColumn = {
      id: newColId,
      title: "New List",
      taskIds: [],
    };
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [newColId]: newColumn,
      },
      columnOrder: [...data.columnOrder, newColId],
    });
    setEditingColumnId(newColId);
    setEditColumnTitle("New List");
  }, [data, saveData]);

  const deleteColumn = useCallback(async (colId: string) => {
    if (!data) return;
    const col = data.columns[colId];
    if (col.taskIds.length > 0) {
      const confirmed = await showConfirm(t("deleteColumnConfirm") || "Delete this list?", "Delete", "Cancel", "warn");
      if (!confirmed) return;
    }

    const newColumnOrder = data.columnOrder.filter((id) => id !== colId);
    const newColumns = { ...data.columns };
    delete newColumns[colId];

    // Cleanup orphaned tasks
    const newTasks = { ...data.tasks };
    col.taskIds.forEach((taskId) => {
      delete newTasks[taskId];
    });

    saveData({
      tasks: newTasks,
      columns: newColumns,
      columnOrder: newColumnOrder,
    });
  }, [data, saveData, showConfirm, t]);

  const saveColumnTitle = useCallback((colId: string, newTitle: string) => {
    if (!data) return;
    const title = newTitle.trim() || "Untitled List";
    const column = data.columns[colId];
    if (!column) return;
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [colId]: { ...column, title },
      },
    });
    setEditingColumnId(null);
  }, [data, saveData]);

  const changeColumnColor = useCallback((colId: string, color: string) => {
    if (!data) return;
    const column = data.columns[colId];
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [colId]: { ...column, color: color === "default" ? undefined : color },
      },
    });
    setShowColorPickerForCol(null);
  }, [data, saveData]);

  const addTask = useCallback((colId: string, content: string) => {
    if (!data) return;
    const trimmed = content.trim();
    if (!trimmed) {
      setAddingTaskToCol(null);
      return;
    }

    const taskId = `task-${Date.now()}`;
    const newTask: TodoTask = {
      id: taskId,
      content: trimmed,
      createdAt: Date.now(),
    };

    const column = data.columns[colId];
    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: newTask,
      },
      columns: {
        ...data.columns,
        [colId]: {
          ...column,
          taskIds: [...column.taskIds, taskId],
        },
      },
    });
    setNewTaskContent("");
    setAddingTaskToCol(null);
  }, [data, saveData]);

  const deleteTask = useCallback(async (taskId: string, colId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!data) return;
    const confirmed = await showConfirm(t("deleteTaskConfirm") || "Delete this task?", "Delete", "Cancel", "warn");
    if (!confirmed) return;

    const column = data.columns[colId];
    const newTaskIds = column.taskIds.filter((id) => id !== taskId);

    const newTasks = { ...data.tasks };
    delete newTasks[taskId];

    saveData({
      ...data,
      tasks: newTasks,
      columns: {
        ...data.columns,
        [colId]: { ...column, taskIds: newTaskIds },
      },
    });
  }, [data, saveData, showConfirm, t]);

  const toggleTaskCompletion = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;
    const task = data.tasks[taskId];
    if (!task) return;
    
    const nextCompleted = !task.completed;
    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: {
          ...task,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : task.progress
        }
      }
    });
  }, [data, saveData]);

  const openTaskModal = useCallback((task: TodoTask) => {
    setEditingTask(task);
    setEditTaskTitleModal(task.content);
    setEditTaskDescModal(task.description || "");
    setEditTaskTags(task.tags || []);
    setTagInput("");
    setIsDescriptionEditing(false);
    setEditTaskChecklist(task.checklist || []);
    setChecklistInput("");
    setEditTaskProgress(task.progress || 0);
    setEditTaskCompleted(task.completed || false);
    setEditTaskColor(task.color);
    setEditTaskStartDate(task.startDate);
    setEditTaskDueDate(task.dueDate);
    setEditTaskDueTime(task.dueTime || "12:00");
    setEditTaskReminder(task.reminder || "none");
    setShowDatePickerPopover(false);
    
    const initDate = task.dueDate ? new Date(task.dueDate) : new Date();
    setCalYear(initDate.getFullYear());
    setCalMonth(initDate.getMonth());
  }, []);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !editTaskTags.includes(newTag)) {
        setEditTaskTags([...editTaskTags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTaskTags(editTaskTags.filter(t => t !== tagToRemove));
  };

  const handleAddChecklist = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = checklistInput.trim();
      if (text) {
        setEditTaskChecklist([...editTaskChecklist, { id: `chk-${Date.now()}`, text, completed: false }]);
        setChecklistInput("");
      }
    }
  };

  const handleToggleChecklist = (id: string) => {
    setEditTaskChecklist(editTaskChecklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemoveChecklist = (id: string) => {
    setEditTaskChecklist(editTaskChecklist.filter(item => item.id !== id));
  };

  const saveTaskModal = useCallback(() => {
    if (!data || !editingTask) return;
    const content = editTaskTitleModal.trim();
    if (!content) return; // Title is required

    const newTask = {
      ...editingTask,
      content,
      description: editTaskDescModal.trim() || undefined,
      tags: editTaskTags.length > 0 ? editTaskTags : undefined,
      checklist: editTaskChecklist.length > 0 ? editTaskChecklist : undefined,
      progress: editTaskProgress > 0 ? editTaskProgress : undefined,
      completed: editTaskCompleted,
      color: editTaskColor === "default" ? undefined : editTaskColor,
      startDate: editTaskStartDate,
      dueDate: editTaskDueDate,
      dueTime: editTaskDueDate ? editTaskDueTime : undefined,
      reminder: editTaskReminder !== "none" ? (editTaskReminder as TodoTask["reminder"]) : undefined,
    };

    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [editingTask.id]: newTask
      }
    });
    setEditingTask(null);
  }, [data, editingTask, editTaskTitleModal, editTaskDescModal, editTaskTags, editTaskChecklist, editTaskProgress, editTaskCompleted, editTaskColor, editTaskStartDate, editTaskDueDate, editTaskDueTime, editTaskReminder, saveData]);


  if (loading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <>
      {DialogEl}
      <div className="h-full flex flex-col font-sans">
        <div className="mb-6 shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Check size={16} strokeWidth={3} />
            </span>
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
              {t("todoBoardTitle") || "TODO Board"}
            </span>
          </h1>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={12} />
            {t("addTodoColumn") || "Add List"}
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-surface-600">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="all-columns" direction="horizontal" type="column">
              {(provided: DroppableProvided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex gap-4 h-full items-start"
                >
                  {data.columnOrder.map((columnId, index) => {
                    const column = data.columns[columnId];
                    if (!column) return null;
                    const tasks = column.taskIds.map((taskId) => data.tasks[taskId]).filter(Boolean);

                    return (
                      <TodoColumnView
                        key={column.id}
                        column={column}
                        index={index}
                        tasks={tasks}
                        editingColumnId={editingColumnId}
                        editColumnTitle={editColumnTitle}
                        setEditColumnTitle={setEditColumnTitle}
                        setEditingColumnId={setEditingColumnId}
                        onSaveColumnTitle={saveColumnTitle}
                        deleteColumn={deleteColumn}
                        showColorPickerForCol={showColorPickerForCol}
                        setShowColorPickerForCol={setShowColorPickerForCol}
                        changeColumnColor={changeColumnColor}
                        addingTaskToCol={addingTaskToCol}
                        setAddingTaskToCol={setAddingTaskToCol}
                        newTaskContent={newTaskContent}
                        setNewTaskContent={setNewTaskContent}
                        addTask={addTask}
                        onToggleComplete={toggleTaskCompletion}
                        onOpenModal={openTaskModal}
                        onDeleteTask={deleteTask}
                        t={t}
                      />
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Task Details Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200" onMouseDown={() => setEditingTask(null)}>
          <div className={`${TASK_BG_COLORS[editTaskColor || "default"]} transition-colors duration-300 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden`} onMouseDown={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-5 pt-4 pb-3 flex justify-between items-start gap-4 border-b border-gray-100 dark:border-white/[0.03]">
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => {
                    const nextCompleted = !editTaskCompleted;
                    setEditTaskCompleted(nextCompleted);
                    if (nextCompleted) setEditTaskProgress(100);
                  }}
                  className="mt-1 shrink-0 text-gray-400 hover:text-indigo-500 transition-colors"
                >
                  {editTaskCompleted ? <CheckCircle2 size={24} className="text-emerald-500 animate-in zoom-in duration-200" /> : <Circle size={24} />}
                </button>
                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={editTaskTitleModal}
                    onChange={(e) => setEditTaskTitleModal(e.target.value)}
                    className={`w-full text-xl font-bold ${editTaskCompleted ? "text-gray-400 dark:text-gray-555 line-through" : "text-gray-900 dark:text-gray-100"} bg-transparent outline-none resize-y overflow-y-auto hover:bg-gray-100 dark:hover:bg-surface-800 focus:bg-white dark:focus:bg-surface-900 focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-2 py-1 transition-colors min-h-[36px]`}
                    placeholder="Task Title..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 px-2 mt-1">in list <span className="underline decoration-gray-300">{data.columns[Object.keys(data.columns).find(colId => data.columns[colId].taskIds.includes(editingTask.id)) || ""]?.title}</span></p>
                </div>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Premium Split-Pane Grid */}
            <div className="p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Panel - Main Content (2/3) */}
                <div className="md:col-span-2 flex flex-col gap-5">
                  
                  {/* Description Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <AlignLeft size={18} className="text-indigo-500" />
                        Description
                      </h3>
                      {!isDescriptionEditing && (
                        <button 
                          onClick={() => setIsDescriptionEditing(true)} 
                          className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isDescriptionEditing ? (
                      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <textarea
                          autoFocus
                          value={editTaskDescModal}
                          onChange={(e) => setEditTaskDescModal(e.target.value)}
                          className="w-full min-h-[160px] p-3.5 bg-gray-50/50 dark:bg-surface-900 border-2 border-indigo-500 rounded-xl text-gray-900 dark:text-gray-100 text-[14px] leading-relaxed resize-y focus:outline-none shadow-inner"
                          placeholder="Add a more detailed description (Markdown supported)..."
                        />
                        <div className="flex gap-2 justify-start">
                          <button 
                            onClick={() => setIsDescriptionEditing(false)} 
                            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm transition-colors"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => { setIsDescriptionEditing(false); setEditTaskDescModal(editingTask?.description || ""); }} 
                            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsDescriptionEditing(true)}
                        className={`min-h-[100px] p-4 rounded-xl text-[14px] leading-relaxed cursor-text transition-colors markdown-body border border-gray-200/40 dark:border-white/5 ${
                          editTaskDescModal 
                            ? "bg-gray-50/30 dark:bg-surface-800/10 hover:bg-gray-50/60 dark:hover:bg-surface-800/20" 
                            : "bg-gray-100/50 dark:bg-surface-800/30 hover:bg-gray-150 dark:hover:bg-surface-800/50"
                        }`}
                      >
                        {editTaskDescModal ? (
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="whitespace-pre-wrap mb-2 last:mb-0 text-gray-800 dark:text-gray-200" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
                              li: ({ node, ...props }) => <li className="" {...props} />,
                              a: ({ node, ...props }) => <a className="text-indigo-500 hover:text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                              code: ({ node, ...props }) => <code className="bg-gray-200 dark:bg-surface-700 text-pink-500 px-1.5 py-0.5 rounded-md text-xs font-mono" {...props} />
                            }}
                          >
                            {editTaskDescModal}
                          </ReactMarkdown>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 font-semibold text-xs">Add a description... (supports markdown)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Checklist Section */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.03]">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CheckSquare size={18} className="text-indigo-500" />
                      Checklist
                    </h3>

                    {editTaskChecklist.length > 0 && (
                      <div className="flex items-center gap-3 w-full bg-gray-50/50 dark:bg-surface-800/20 p-2.5 rounded-xl border border-gray-150 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-500 w-8 text-right shrink-0">
                          {Math.round((editTaskChecklist.filter(c => c.completed).length / editTaskChecklist.length) * 100)}%
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden shadow-inner">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              editTaskChecklist.every(c => c.completed) ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${Math.round((editTaskChecklist.filter(c => c.completed).length / editTaskChecklist.length) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {editTaskChecklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 group/item p-1.5 hover:bg-gray-50 dark:hover:bg-surface-800/30 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleChecklist(item.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-surface-600 dark:bg-surface-800 cursor-pointer transition-all"
                          />
                          <span className={`flex-1 text-[14px] leading-tight ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                            {item.text}
                          </span>
                          <button
                            onClick={() => handleRemoveChecklist(item.id)}
                            className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded transition-all hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      
                      <div className="mt-2.5">
                        <input
                          type="text"
                          value={checklistInput}
                          onChange={(e) => setChecklistInput(e.target.value)}
                          onKeyDown={handleAddChecklist}
                          placeholder="Add an item..."
                          className="w-full bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl px-3 py-2 text-[13px] text-gray-900 dark:text-gray-100 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Panel - Sidebar Content (1/3) */}
                <div className="md:col-span-1 flex flex-col gap-5 bg-gray-50/50 dark:bg-surface-800/10 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.02] relative">
                  
                  {/* Card Color Selector */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Card Color</h4>
                    <div className="flex flex-nowrap gap-1.5">
                      {Object.keys(TASK_BG_COLORS).map(colorKey => {
                        const isActive = editTaskColor === colorKey || (!editTaskColor && colorKey === 'default');
                        return (
                          <button
                            key={colorKey}
                            onClick={() => setEditTaskColor(colorKey)}
                            className={`w-6 h-6 rounded-full ${COLOR_BTN_BG[colorKey]} shadow-sm border border-black/10 dark:border-white/10 transition-all hover:scale-110 flex items-center justify-center ${
                              isActive ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-900 scale-105' : ''
                            }`}
                            title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                          >
                            {isActive && <Check size={12} className="text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dates & Reminders Section */}
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-200/50 dark:border-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Dates & Reminders</h4>
                      {(editTaskStartDate || editTaskDueDate || editTaskDueTime || editTaskReminder !== "none") && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditTaskStartDate(undefined);
                            setEditTaskDueDate(undefined);
                            setEditTaskDueTime(undefined);
                            setEditTaskReminder("none");
                          }}
                          className="text-gray-450 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 rounded hover:bg-gray-100 dark:hover:bg-surface-800"
                          title="초기화"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {/* 날짜 선택 버튼 */}
                      <button
                        type="button"
                        onClick={() => setShowDatePickerPopover(!showDatePickerPopover)}
                        className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left shadow-sm"
                      >
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Calendar size={14} className="text-indigo-500 shrink-0" />
                          <span className="text-xs font-semibold truncate max-w-[170px]">
                            {editTaskStartDate || editTaskDueDate ? (
                              <>
                                {editTaskStartDate ? formatDate(editTaskStartDate, lang) : ""}
                                {editTaskStartDate && editTaskDueDate ? " ~ " : ""}
                                {editTaskDueDate ? formatDate(editTaskDueDate, lang) : ""}
                              </>
                            ) : (
                              t("datepickerPlaceholder") || "날짜 설정..."
                            )}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 shrink-0" />
                      </button>

                      {/* 시간 설정 (기한일이 설정된 경우에만 노출) */}
                      {editTaskDueDate && (
                        <div className="relative flex items-center w-full">
                          <Clock size={14} className="absolute left-3 text-indigo-500 shrink-0 pointer-events-none" />
                          <input
                            type="text"
                            value={editTaskDueTime || "12:00"}
                            onChange={(e) => setEditTaskDueTime(e.target.value)}
                            onFocus={() => setShowTimeDropdown(true)}
                            placeholder="12:00"
                            className="w-full text-xs bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700 rounded-xl pl-9 pr-8 py-2 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all focus:outline-none shadow-sm font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                            className="absolute right-3 text-gray-400 dark:text-gray-550 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>

                          {showTimeDropdown && (
                            <>
                              <div 
                                className="fixed inset-0 z-[95]" 
                                onClick={() => setShowTimeDropdown(false)} 
                              />
                              <div className="absolute left-0 right-0 top-full mt-1 z-[100] max-h-[160px] overflow-y-auto bg-white dark:bg-[#1E1E20] border border-gray-200/80 dark:border-white/10 rounded-xl shadow-xl py-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-surface-600">
                                {timeOptions.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      setEditTaskDueTime(t);
                                      setShowTimeDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                                      editTaskDueTime === t ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* 리마인드 알림 */}
                      {editTaskDueDate && (
                        <div className="flex flex-col w-full relative">
                          <div className="relative flex items-center w-full">
                            <Bell size={14} className={`absolute left-3 shrink-0 pointer-events-none ${(!activeSettings?.enableTodoNotifications) ? "text-gray-400 dark:text-gray-550" : "text-indigo-500"}`} />
                            <select
                              value={editTaskReminder || "none"}
                              onChange={(e) => setEditTaskReminder(e.target.value)}
                              disabled={!activeSettings?.enableTodoNotifications}
                              className="text-xs bg-white dark:bg-surface-900 border border-gray-200/80 dark:border-surface-700 rounded-xl pl-9 pr-8 py-2 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all focus:outline-none w-full shadow-sm disabled:bg-gray-100/50 dark:disabled:bg-surface-800/50 disabled:text-gray-400 dark:disabled:text-gray-550 disabled:cursor-not-allowed disabled:border-gray-100 dark:disabled:border-surface-800 appearance-none font-semibold"
                            >
                              {REMINDER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.value === "none" ? t("reminderNone") :
                                   opt.value === "at_due" ? t("reminderAtDue") :
                                   opt.value === "15m_before" ? t("reminder15m") :
                                   opt.value === "1h_before" ? t("reminder1h") :
                                   opt.value === "3h_before" ? t("reminder3h") :
                                   opt.value === "1d_before" ? t("reminder1d") : opt.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 pointer-events-none text-gray-400 dark:text-gray-555">
                              <ChevronDown size={14} />
                            </div>
                          </div>
                          {!activeSettings?.enableTodoNotifications && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 leading-tight px-1">
                              {t("todoNotificationsDisabledWarning") || "※ 설정에서 'Todo 알림 받기'를 활성화해야 알림을 수신할 수 있습니다."}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Popover */}
                    {showDatePickerPopover && (
                      <>
                        <div 
                          className="fixed inset-0 z-[80]"
                          onClick={() => setShowDatePickerPopover(false)}
                        />
                        <div 
                          style={{ right: 'calc(100% + 12px)', top: 0 }}
                          className="absolute z-[90] w-[290px] bg-white dark:bg-[#1E1E20] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-xl p-3.5 animate-in fade-in slide-in-from-left-2 duration-200 text-gray-900 dark:text-gray-100"
                        >
                          {/* Calendar View Controls */}
                          <div className="flex items-center justify-between mb-2.5 bg-gray-55 dark:bg-surface-800/30 p-1.5 rounded-xl border border-gray-100 dark:border-white/[0.02]">
                            <div className="flex gap-0.5">
                              <button 
                                type="button"
                                onClick={() => setCalYear(calYear - 1)}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-surface-800 rounded-lg transition-all"
                                title={lang === "ko" ? "이전 해" : lang === "ja" ? "前年" : "Prev Year"}
                              >
                                <ChevronsLeft size={13} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  if (calMonth === 0) {
                                    setCalMonth(11);
                                    setCalYear(calYear - 1);
                                  } else {
                                    setCalMonth(calMonth - 1);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-surface-800 rounded-lg transition-all"
                                title={lang === "ko" ? "이전 달" : lang === "ja" ? "前月" : "Prev Month"}
                              >
                                <ChevronLeft size={13} />
                              </button>
                            </div>
                            
                            <span className="text-xs font-bold text-gray-800 dark:text-white">
                              {lang === "ko" 
                                ? `${calYear}년 ${calMonth + 1}월` 
                                : lang === "ja" 
                                ? `${calYear}年 ${calMonth + 1}月` 
                                : new Date(calYear, calMonth).toLocaleDateString("en-US", { year: "numeric", month: "long" })
                              }
                            </span>
                            
                            <div className="flex gap-0.5">
                              <button 
                                type="button"
                                onClick={() => {
                                  if (calMonth === 11) {
                                    setCalMonth(0);
                                    setCalYear(calYear + 1);
                                  } else {
                                    setCalMonth(calMonth + 1);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-surface-800 rounded-lg transition-all"
                                title={lang === "ko" ? "다음 달" : lang === "ja" ? "翌月" : "Next Month"}
                              >
                                <ChevronRight size={13} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => setCalYear(calYear + 1)}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-surface-800 rounded-lg transition-all"
                                title={lang === "ko" ? "다음 해" : lang === "ja" ? "翌年" : "Next Year"}
                              >
                                <ChevronsRight size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Mode Tabs */}
                          <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-surface-800 p-0.5 rounded-xl text-[10px] mb-2.5">
                            <button
                              type="button"
                              onClick={() => setActiveTab("start")}
                              className={`py-1 rounded-lg font-semibold transition-all ${
                                activeTab === "start"
                                  ? "bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-sm"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                              }`}
                            >
                              {t("datepickerSelectStartDate") || "시작일 선택"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("due")}
                              className={`py-1 rounded-lg font-semibold transition-all ${
                                activeTab === "due"
                                  ? "bg-white dark:bg-[#2C2C2E] text-indigo-600 dark:text-indigo-400 shadow-sm"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                              }`}
                            >
                              {t("datepickerSelectDueDate") || "기한 선택"}
                            </button>
                          </div>

                          {/* Calendar Weekday Names */}
                          <div className="grid grid-cols-7 text-center text-[9px] font-bold text-gray-500 dark:text-gray-450 mb-1">
                            {(lang === "ko" 
                              ? ["월", "화", "수", "목", "금", "토", "일"] 
                              : lang === "ja" 
                              ? ["月", "火", "水", "木", "金", "土", "日"] 
                              : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
                            ).map((day, idx) => {
                              const isSat = idx === 5;
                              const isSun = idx === 6;
                              return (
                                <span key={day} className={isSat ? "text-blue-500" : isSun ? "text-red-500" : ""}>
                                  {day}
                                </span>
                              );
                            })}
                          </div>

                          {/* Calendar Days Grid */}
                          <div className="grid grid-cols-7 gap-0.5 text-center mb-2.5">
                            {getCalendarGrid(calYear, calMonth).map((day) => {
                              const dayStr = formatDateStr(day.date);
                              const isSelStart = dayStr === editTaskStartDate;
                              const isSelDue = dayStr === editTaskDueDate;
                              const isTodayDay = isToday(day.date);
                              const isBetween = isBetweenDays(day.date, editTaskStartDate, editTaskDueDate);

                              let cellBg = "hover:bg-gray-100 dark:hover:bg-surface-800 text-gray-800 dark:text-white";
                              let cellRound = "rounded-lg";

                              if (!day.isCurrentMonth) {
                                cellBg = "text-gray-400 dark:text-gray-550 hover:bg-gray-100/50 dark:hover:bg-surface-800/50";
                              }

                              if (isSelStart && isSelDue) {
                                cellBg = "bg-indigo-600 text-white font-bold";
                              } else if (isSelStart) {
                                cellBg = "bg-indigo-600 text-white font-bold";
                                if (editTaskDueDate) cellRound = "rounded-l-lg rounded-r-none";
                              } else if (isSelDue) {
                                cellBg = "bg-indigo-600 text-white font-bold";
                                if (editTaskStartDate) cellRound = "rounded-r-lg rounded-l-none";
                              } else if (isBetween) {
                                cellBg = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 rounded-none";
                              }

                              return (
                                <button
                                  key={day.key}
                                  type="button"
                                  onClick={() => {
                                    if (activeTab === "start") {
                                      setEditTaskStartDate(dayStr);
                                    } else {
                                      setEditTaskDueDate(dayStr);
                                    }
                                  }}
                                  className={`h-6 text-[10px] flex items-center justify-center transition-all relative ${cellBg} ${cellRound} ${
                                    isTodayDay ? "ring-1 ring-indigo-500 ring-offset-1 dark:ring-offset-[#1E1E20]" : ""
                                  }`}
                                >
                                  {day.date.getDate()}
                                </button>
                              );
                            })}
                          </div>

                          {/* Inputs Panel */}
                          <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-white/[0.03] pt-2.5 text-[11px]">
                            {/* Start Date Switcher */}
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!editTaskStartDate}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditTaskStartDate(editTaskStartDate || formatDateStr(new Date()));
                                      setActiveTab("start");
                                    } else {
                                      setEditTaskStartDate(undefined);
                                    }
                                  }}
                                  className="w-3 h-3 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-surface-700 dark:bg-surface-800"
                                />
                                <span>{t("datepickerStartDate") || "시작일"}</span>
                              </label>
                              {editTaskStartDate && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-surface-800 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-surface-700/50">
                                  {formatDate(editTaskStartDate, lang)}
                                </span>
                              )}
                            </div>

                            {/* Due Date Switcher */}
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!editTaskDueDate}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditTaskDueDate(editTaskDueDate || formatDateStr(new Date()));
                                      setActiveTab("due");
                                    } else {
                                      setEditTaskDueDate(undefined);
                                      setEditTaskDueTime(undefined);
                                    }
                                  }}
                                  className="w-3 h-3 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-surface-700 dark:bg-surface-800"
                                />
                                <span>{t("datepickerDueDate") || "기한"}</span>
                              </label>
                              {editTaskDueDate && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-surface-800 px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-surface-700/50">
                                  {formatDate(editTaskDueDate, lang)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Footer Apply/Reset */}
                          <div className="flex gap-1.5 justify-end border-t border-gray-100 dark:border-white/[0.03] pt-2.5 mt-2.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditTaskStartDate(undefined);
                                setEditTaskDueDate(undefined);
                                setEditTaskDueTime(undefined);
                                setEditTaskReminder("none");
                              }}
                              className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                            >
                              {t("datepickerReset") || "초기화"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDatePickerPopover(false)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all shadow-sm shadow-indigo-500/10"
                            >
                              {t("datepickerApply") || "적용"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Labels Section */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-200/50 dark:border-white/[0.03]">
                    <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Labels</h4>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {editTaskTags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 focus:outline-none p-0.5 rounded transition-colors ml-0.5">
                            <X size={10} strokeWidth={3} />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-surface-900 rounded-xl border border-gray-200 dark:border-surface-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all w-full mt-1">
                        <Tag size={12} className="text-gray-400" />
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder="Add tag..."
                          className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="flex flex-col gap-2 pt-3 border-t border-gray-200/50 dark:border-white/[0.03]">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Progress</h4>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{editTaskProgress}%</span>
                    </div>
                    <div className="relative pt-1 pb-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="25"
                        value={editTaskProgress}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditTaskProgress(val);
                          if (val === 100) setEditTaskCompleted(true);
                          else if (val < 100 && editTaskCompleted) setEditTaskCompleted(false);
                        }}
                        className="w-full h-1.5 bg-gray-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <div className="flex justify-between text-[9px] font-bold text-gray-400 mt-1.5 px-0.5">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-surface-800 flex justify-end gap-3 bg-gray-50/30 dark:bg-surface-850/30">
              <button
                onClick={saveTaskModal}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}