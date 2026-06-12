import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Calendar, 
  Clock, 
  StickyNote, 
  Link as LinkIcon, 
  CheckCircle2, 
  Circle, 
  Tag, 
  Palette, 
  CheckSquare, 
  AlignLeft, 
  AlertCircle,
  Edit
} from "lucide-react";
import type { TodoBoardData, TodoTask, Bookmark, BookmarkMemo, MemoColor, MessageResponse, AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import ReactMarkdown from "react-markdown";

interface Props {
  settings?: AppSettings;
  bookmarks: Bookmark[];
  memos: Record<string, BookmarkMemo>;
  onRefresh: () => void;
}

const TASK_BG_COLORS: Record<string, string> = {
  default: "bg-indigo-50/40 border-indigo-200 dark:bg-[#1C2331] dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  blue: "bg-blue-50/40 border-blue-200 dark:bg-[#1C2331] dark:border-blue-900/40 text-blue-700 dark:text-blue-300",
  emerald: "bg-emerald-50/40 border-emerald-200 dark:bg-[#1D2A24] dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-50/40 border-amber-200 dark:bg-[#2D281E] dark:border-amber-900/40 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-50/40 border-rose-200 dark:bg-[#2D1E22] dark:border-rose-900/40 text-rose-700 dark:text-rose-300",
  purple: "bg-purple-50/40 border-purple-200 dark:bg-[#251E2D] dark:border-purple-900/40 text-purple-700 dark:text-purple-300",
};

const TASK_SOLID_COLORS: Record<string, string> = {
  default: "bg-indigo-600 dark:bg-indigo-500 text-white",
  blue: "bg-blue-600 dark:bg-blue-500 text-white",
  emerald: "bg-emerald-600 dark:bg-emerald-500 text-white",
  amber: "bg-amber-600 dark:bg-amber-500 text-white",
  rose: "bg-rose-600 dark:bg-rose-500 text-white",
  purple: "bg-purple-600 dark:bg-purple-500 text-white",
};

const MEMO_COLORS: Record<MemoColor, string> = {
  yellow: "bg-amber-50/40 border-amber-200 dark:bg-[#2D281E] dark:border-amber-900/40 text-amber-700 dark:text-amber-300",
  pink: "bg-rose-50/40 border-rose-200 dark:bg-[#2D1E22] dark:border-rose-900/40 text-rose-700 dark:text-rose-300",
  blue: "bg-blue-50/40 border-blue-200 dark:bg-[#1C2331] dark:border-blue-900/40 text-blue-700 dark:text-blue-300",
  green: "bg-emerald-50/40 border-emerald-200 dark:bg-[#1D2A24] dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  purple: "bg-purple-50/40 border-purple-200 dark:bg-[#251E2D] dark:border-purple-900/40 text-purple-700 dark:text-purple-300",
};

const TASK_CELL_BG_COLORS: Record<string, string> = {
  default: "bg-indigo-50/15 dark:bg-indigo-950/5 border-indigo-200/40 dark:border-indigo-900/20",
  blue: "bg-blue-50/15 dark:bg-blue-950/5 border-blue-200/40 dark:border-blue-900/20",
  emerald: "bg-emerald-50/15 dark:bg-emerald-950/5 border-emerald-200/40 dark:border-emerald-900/20",
  amber: "bg-amber-50/15 dark:bg-amber-950/5 border-amber-200/40 dark:border-amber-900/20",
  rose: "bg-rose-50/15 dark:bg-rose-950/5 border-rose-200/40 dark:border-rose-900/20",
  purple: "bg-purple-50/15 dark:bg-purple-950/5 border-purple-200/40 dark:border-purple-900/20",
};

const TASK_TEXT_COLORS: Record<string, string> = {
  default: "text-indigo-600 dark:text-indigo-400",
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  purple: "text-purple-600 dark:text-purple-400",
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

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getCalendarGrid = (year: number, month: number) => {
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ...
  const mondayFirstIndex = (firstDayIndex + 6) % 7; // Convert to Monday-first: 0 = Mon, 6 = Sun

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const grid: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  // Previous month cells
  for (let i = mondayFirstIndex - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    grid.push({
      date: prevDate,
      isCurrentMonth: false,
      key: `prev-${daysInPrevMonth - i}`,
    });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    grid.push({
      date: currDate,
      isCurrentMonth: true,
      key: `curr-${d}`,
    });
  }

  // Next month cells
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

export default function CalendarBoard({ settings, bookmarks, memos, onRefresh }: Props) {
  const { t, lang } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  const [todoBoard, setTodoBoard] = useState<TodoBoardData | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [holidayMap, setHolidayMap] = useState<Record<string, string>>({});

  // Load Holidays using Nager.Date API and cache in local storage
  const loadHolidays = useCallback(async (year: number, countryOpt?: string) => {
    if (countryOpt === "off") {
      setHolidayMap({});
      return;
    }

    let countryCode = "KR"; // default
    if (!countryOpt || countryOpt === "auto") {
      if (lang === "ko") countryCode = "KR";
      else if (lang === "ja") countryCode = "JP";
      else countryCode = "US";
    } else {
      countryCode = countryOpt;
    }

    const cacheKey = `cached_holidays_${year}_${countryCode}`;
    
    try {
      // Try local storage first
      const stored = await chrome.storage.local.get(cacheKey);
      if (stored[cacheKey]) {
        setHolidayMap(stored[cacheKey]);
        return;
      }

      // Fetch from Nager.Date API
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
      if (res.ok) {
        const data = await res.json() as any[];
        const map: Record<string, string> = {};
        data.forEach((h) => {
          map[h.date] = h.localName || h.name;
        });
        
        // Save to cache
        await chrome.storage.local.set({ [cacheKey]: map });
        setHolidayMap(map);
      } else {
        console.warn("Failed to fetch holidays from API:", res.statusText);
      }
    } catch (err) {
      console.error("Error loading holidays:", err);
    }
  }, [lang]);

  useEffect(() => {
    loadHolidays(currentYear, settings?.holidayCountry);
  }, [currentYear, settings?.holidayCountry, loadHolidays]);

  // Selected date events & click display
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  // Quick Add states
  const [quickAddType, setQuickAddType] = useState<"todo" | "event" | "holiday" | "memo">("todo");
  const [quickAddInput, setQuickAddInput] = useState("");

  // Modals management
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskTags, setEditTaskTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isDescEditing, setIsDescEditing] = useState(false);
  const [editTaskChecklist, setEditTaskChecklist] = useState<any[]>([]);
  const [checklistInput, setChecklistInput] = useState("");
  const [editTaskProgress, setEditTaskProgress] = useState(0);
  const [editTaskCompleted, setEditTaskCompleted] = useState(false);
  const [editTaskColor, setEditTaskColor] = useState<string>("default");
  const [editTaskStartDate, setEditTaskStartDate] = useState<string | undefined>(undefined);
  const [editTaskDueDate, setEditTaskDueDate] = useState<string | undefined>(undefined);
  const [editTaskDueTime, setEditTaskDueTime] = useState<string | undefined>(undefined);
  const [editTaskReminder, setEditTaskReminder] = useState<string | undefined>("none");
  const [editTaskRecurrence, setEditTaskRecurrence] = useState<TodoTask["recurrence"]>("none");
  const [editTaskType, setEditTaskType] = useState<"todo" | "event" | "holiday">("todo");
  const [editTaskLocation, setEditTaskLocation] = useState("");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Bookmark memo modal (supports Bookmark | null for standalone memos)
  const [editingMemo, setEditingMemo] = useState<{ bookmark: Bookmark | null; memo: BookmarkMemo } | null>(null);
  const [editMemoContent, setEditMemoContent] = useState("");
  const [editMemoColor, setEditMemoColor] = useState<MemoColor>("yellow");

  // Load TODO board
  const loadTodoBoard = useCallback(async () => {
    const res = (await chrome.runtime.sendMessage({ type: "GET_TODO_BOARD" })) as MessageResponse;
    if (res.success && res.data) {
      setTodoBoard(res.data as TodoBoardData);
    }
  }, []);

  useEffect(() => {
    loadTodoBoard();
  }, [loadTodoBoard]);

  // Sync state if external changes happen
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes["clickbook_todo_board"]) {
        const nextVal = changes["clickbook_todo_board"].newValue;
        if (nextVal) {
          setTodoBoard(nextVal);
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Format month and year label
  const monthLabel = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    const options: Intl.DateTimeFormatOptions = { month: "long" };
    return date.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", options);
  }, [currentYear, currentMonth, lang]);

  const gridCells = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Map manual holidays to dates
  const manualHolidays = useMemo(() => {
    if (!todoBoard || !todoBoard.tasks) return {};
    const map: Record<string, TodoTask> = {};
    Object.values(todoBoard.tasks).forEach((task) => {
      if (task.isHoliday || task.type === "holiday") {
        const dateStr = task.startDate || task.dueDate || formatDateStr(new Date(task.createdAt));
        map[dateStr] = task;
      }
    });
    return map;
  }, [todoBoard]);

  // Map tasks to dates (including recurrence)
  const tasksByDate = useMemo(() => {
    if (!todoBoard || !todoBoard.tasks || gridCells.length < 42) return {};
    const map: Record<string, TodoTask[]> = {};

    const gridStart = gridCells[0].date;
    const gridEnd = gridCells[41].date;

    Object.values(todoBoard.tasks).forEach((task) => {
      // Filter out holiday tasks from showing as regular task cards on cells
      if (task.isHoliday || task.type === "holiday") return;

      // 1. Recurrent tasks
      if (task.recurrence && task.recurrence !== "none") {
        const anchorStr = task.startDate || task.dueDate || formatDateStr(new Date(task.createdAt));
        const anchorDate = new Date(anchorStr);
        anchorDate.setHours(0, 0, 0, 0);

        let temp = new Date(gridStart);
        temp.setHours(0, 0, 0, 0);

        while (temp <= gridEnd) {
          if (temp >= anchorDate) {
            let match = false;
            if (task.recurrence === "daily") {
              match = true;
            } else if (task.recurrence === "weekly") {
              match = temp.getDay() === anchorDate.getDay();
            } else if (task.recurrence === "monthly") {
              match = temp.getDate() === anchorDate.getDate();
            }

            if (match) {
              const dStr = formatDateStr(temp);
              if (!map[dStr]) map[dStr] = [];
              if (!map[dStr].some(t => t.id === task.id)) {
                map[dStr].push(task);
              }
            }
          }
          temp.setDate(temp.getDate() + 1);
        }
      } else {
        // 2. Normal tasks
        if (task.startDate && task.dueDate) {
          let start = new Date(task.startDate);
          const end = new Date(task.dueDate);
          
          let iterations = 0;
          while (start <= end && iterations < 365) {
            const dStr = formatDateStr(start);
            if (!map[dStr]) map[dStr] = [];
            if (!map[dStr].some(t => t.id === task.id)) {
              map[dStr].push(task);
            }
            start.setDate(start.getDate() + 1);
            iterations++;
          }
        } else if (task.dueDate) {
          const dStr = task.dueDate;
          if (!map[dStr]) map[dStr] = [];
          map[dStr].push(task);
        } else if (task.startDate) {
          const dStr = task.startDate;
          if (!map[dStr]) map[dStr] = [];
          map[dStr].push(task);
        }
      }
    });

    return map;
  }, [todoBoard, gridCells]);

  // Map memos to dates (including standalone memos without bookmark)
  const memosByDate = useMemo(() => {
    const map: Record<string, { bookmark: Bookmark | null; memo: BookmarkMemo }[]> = {};

    Object.values(memos).forEach((memo) => {
      if (!memo.updatedAt) return;
      const dStr = formatDateStr(new Date(memo.updatedAt));
      const bm = bookmarks.find((b) => b.id === memo.bookmarkId) || null;
      
      // standalone memo or bound memo
      if (memo.bookmarkId.startsWith("standalone_") || bm) {
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push({ bookmark: bm, memo });
      }
    });

    return map;
  }, [memos, bookmarks]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const setToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(today);
  };

  // Open TODO task editor
  const openTaskEditor = (task: TodoTask) => {
    setEditingTask(task);
    setEditTaskTitle(task.content);
    setEditTaskDesc(task.description || "");
    setEditTaskTags(task.tags || []);
    setEditTaskChecklist(task.checklist || []);
    setEditTaskProgress(task.progress || 0);
    setEditTaskCompleted(!!task.completed);
    setEditTaskColor(task.color || "default");
    setEditTaskStartDate(task.startDate);
    setEditTaskDueDate(task.dueDate);
    setEditTaskDueTime(task.dueTime || "12:00");
    setEditTaskReminder(task.reminder || "none");
    setEditTaskRecurrence(task.recurrence || "none");
    const initialType = task.type || (task.isHoliday ? "holiday" : "todo");
    setEditTaskType(initialType);
    setEditTaskLocation(task.location || "");
    setIsDescEditing(false);
  };

  // Save TODO task changes
  const saveTaskChanges = async () => {
    if (!todoBoard || !editingTask) return;
    const title = editTaskTitle.trim();
    if (!title) return;

    let progress = editTaskProgress;
    if (editTaskCompleted) {
      progress = 100;
    } else if (progress === 100 && !editTaskCompleted) {
      progress = 0;
    }

    const updatedTask: TodoTask = {
      ...editingTask,
      content: title,
      description: editTaskDesc.trim() || undefined,
      tags: editTaskTags.length > 0 ? editTaskTags : undefined,
      checklist: editTaskChecklist,
      progress,
      completed: editTaskCompleted,
      color: editTaskColor === "default" ? undefined : editTaskColor,
      startDate: editTaskStartDate || undefined,
      dueDate: editTaskDueDate || undefined,
      dueTime: editTaskDueTime,
      reminder: editTaskReminder as any,
      recurrence: editTaskRecurrence === "none" ? undefined : editTaskRecurrence,
      type: editTaskType,
      location: editTaskType === "event" ? editTaskLocation.trim() || undefined : undefined,
      isHoliday: editTaskType === "holiday" ? true : undefined,
    };

    const updatedTasks = {
      ...todoBoard.tasks,
      [editingTask.id]: updatedTask,
    };

    const nextBoard: TodoBoardData = {
      ...todoBoard,
      tasks: updatedTasks,
    };

    setTodoBoard(nextBoard);
    await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: nextBoard });
    setEditingTask(null);
    onRefresh();
  };

  // Delete TODO task from calendar
  const deleteTaskFromCal = async (taskId: string) => {
    if (!todoBoard) return;
    const confirmed = await showConfirm(t("deleteTaskConfirm") || "Delete this task?", "Delete", "Cancel", "warn");
    if (!confirmed) return;

    const newTasks = { ...todoBoard.tasks };
    delete newTasks[taskId];

    const newColumns = { ...todoBoard.columns };
    Object.keys(newColumns).forEach((colId) => {
      newColumns[colId] = {
        ...newColumns[colId],
        taskIds: newColumns[colId].taskIds.filter((id) => id !== taskId),
      };
    });

    const nextBoard: TodoBoardData = {
      ...todoBoard,
      tasks: newTasks,
      columns: newColumns,
    };

    setTodoBoard(nextBoard);
    await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: nextBoard });
    setEditingTask(null);
    onRefresh();
  };

  // Handle dragging TODO task into calendar day cell
  const handleTaskDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (!todoBoard) return;
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const task = todoBoard.tasks[taskId];
    if (!task) return;

    const dropDateStr = formatDateStr(targetDate);
    const updatedTask = { ...task };

    if (task.startDate && task.dueDate) {
      const start = new Date(task.startDate);
      const end = new Date(task.dueDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const newStart = new Date(targetDate);
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + diffDays);

      updatedTask.startDate = formatDateStr(newStart);
      updatedTask.dueDate = formatDateStr(newEnd);
    } else {
      updatedTask.startDate = dropDateStr;
      updatedTask.dueDate = dropDateStr;
    }

    const nextBoard: TodoBoardData = {
      ...todoBoard,
      tasks: {
        ...todoBoard.tasks,
        [taskId]: updatedTask,
      },
    };

    setTodoBoard(nextBoard);
    await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: nextBoard });
    onRefresh();
  };

  // Open Bookmark Memo editor
  const openMemoEditor = (item: { bookmark: Bookmark | null; memo: BookmarkMemo }) => {
    setEditingMemo(item);
    setEditMemoContent(item.memo.content);
    setEditMemoColor(item.memo.color);
  };

  // Save Bookmark Memo changes
  const saveMemoChanges = async () => {
    if (!editingMemo) return;
    const content = editMemoContent.trim();
    if (!content) return;

    await chrome.runtime.sendMessage({
      type: "SAVE_MEMO",
      bookmarkId: editingMemo.memo.bookmarkId,
      content,
      color: editMemoColor,
    });

    setEditingMemo(null);
    onRefresh();
  };

  // Delete Bookmark Memo from calendar
  const deleteMemoFromCal = async (bookmarkId: string) => {
    const confirmed = await showConfirm(t("deleteMemoTooltip") || "Delete memo?", "Delete", "Cancel", "warn");
    if (!confirmed) return;

    await chrome.runtime.sendMessage({
      type: "DELETE_MEMO",
      bookmarkId,
    });

    setEditingMemo(null);
    onRefresh();
  };

  // Quick Add Action
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentText = quickAddInput.trim();
    if (!contentText || !selectedDate) return;

    const targetDateStr = formatDateStr(selectedDate);

    if (quickAddType === "todo" || quickAddType === "event" || quickAddType === "holiday") {
      // 1. Quick Add Todo/Event/Holiday
      const board = todoBoard || {
        tasks: {},
        columns: {
          "col-1": { id: "col-1", title: "To Do", taskIds: [] },
        },
        columnOrder: ["col-1"],
      };

      const taskId = `task-${Date.now()}`;
      const newTask: TodoTask = {
        id: taskId,
        content: contentText,
        startDate: targetDateStr,
        dueDate: targetDateStr,
        createdAt: Date.now(),
        type: quickAddType,
        isHoliday: quickAddType === "holiday" ? true : undefined,
      };

      // Set default color
      if (quickAddType === "holiday") {
        newTask.color = "rose";
      } else if (quickAddType === "event") {
        newTask.color = "blue";
      }

      // Add to first column
      const firstColId = board.columnOrder[0] || "col-1";
      const column = board.columns[firstColId] || { id: firstColId, title: "To Do", taskIds: [] };

      const nextBoard: TodoBoardData = {
        ...board,
        tasks: {
          ...board.tasks,
          [taskId]: newTask,
        },
        columns: {
          ...board.columns,
          [firstColId]: {
            ...column,
            taskIds: [...column.taskIds, taskId],
          },
        },
      };

      setTodoBoard(nextBoard);
      await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: nextBoard });
      setQuickAddInput("");
      onRefresh();
    } else {
      // 2. Quick Add Standalone Memo
      const standaloneId = `standalone_${Date.now()}`;
      
      // Calculate timestamp based on selected date plus current time
      const now = new Date();
      const memoDate = new Date(selectedDate);
      memoDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      const memoTimestamp = memoDate.getTime();

      await chrome.runtime.sendMessage({
        type: "SAVE_MEMO",
        bookmarkId: standaloneId,
        content: contentText,
        color: "yellow",
      });

      setQuickAddInput("");
      onRefresh();
    }
  };

  // Helper checklist item modifications
  const addChecklistItem = () => {
    const text = checklistInput.trim();
    if (!text) return;
    const item = {
      id: `check-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text,
      completed: false,
    };
    setEditTaskChecklist([...editTaskChecklist, item]);
    setChecklistInput("");
  };

  const toggleCheckItem = (itemId: string) => {
    const next = editTaskChecklist.map((c) =>
      c.id === itemId ? { ...c, completed: !c.completed } : c
    );
    setEditTaskChecklist(next);

    const completedCount = next.filter((c) => c.completed).length;
    const totalCount = next.length;
    if (totalCount > 0) {
      const percentage = Math.round((completedCount / totalCount) * 100);
      setEditTaskProgress(percentage);
      if (percentage === 100) {
        setEditTaskCompleted(true);
      } else {
        setEditTaskCompleted(false);
      }
    }
  };

  const removeCheckItem = (itemId: string) => {
    const next = editTaskChecklist.filter((c) => c.id !== itemId);
    setEditTaskChecklist(next);

    const totalCount = next.length;
    if (totalCount > 0) {
      const completedCount = next.filter((c) => c.completed).length;
      setEditTaskProgress(Math.round((completedCount / totalCount) * 100));
    } else {
      setEditTaskProgress(0);
    }
  };

  const addTag = () => {
    const text = tagInput.trim().toUpperCase();
    if (text && !editTaskTags.includes(text)) {
      setEditTaskTags([...editTaskTags, text]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setEditTaskTags(editTaskTags.filter((t) => t !== tag));
  };

  // Selected date elements
  const selectedDateStr = selectedDate ? formatDateStr(selectedDate) : "";
  const selectedDateTasks = useMemo(() => {
    return tasksByDate[selectedDateStr] || [];
  }, [tasksByDate, selectedDateStr]);

  const selectedDateMemos = useMemo(() => {
    return memosByDate[selectedDateStr] || [];
  }, [memosByDate, selectedDateStr]);

  const handlePrev = () => {
    if (viewMode === "month") {
      prevMonth();
    } else if (viewMode === "week") {
      const d = new Date(selectedDate || new Date());
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    } else {
      const d = new Date(selectedDate || new Date());
      d.setDate(d.getDate() - 1);
      setSelectedDate(d);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      nextMonth();
    } else if (viewMode === "week") {
      const d = new Date(selectedDate || new Date());
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    } else {
      const d = new Date(selectedDate || new Date());
      d.setDate(d.getDate() + 1);
      setSelectedDate(d);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  };

  const getDateHeaderLabel = () => {
    if (viewMode === "month") {
      return `${monthLabel} ${currentYear}`;
    }
    const base = selectedDate || new Date();
    if (viewMode === "day") {
      return base.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric" });
    }
    const currentDay = base.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const opt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const mStr = monday.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", opt);
    const sStr = sunday.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", opt);
    return `${mStr} - ${sStr}, ${monday.getFullYear()}`;
  };

  const getSelectedWeekDays = () => {
    const base = selectedDate || new Date();
    const currentDay = base.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - distanceToMonday);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  // Handle dropping task on a specific hour row in Day View
  const handleTaskHourDrop = async (e: React.DragEvent, hourStr: string) => {
    e.preventDefault();
    if (!todoBoard || !selectedDate) return;
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const task = todoBoard.tasks[taskId];
    if (!task) return;

    const targetDateStr = formatDateStr(selectedDate);
    const updatedTask: TodoTask = {
      ...task,
      startDate: targetDateStr,
      dueDate: targetDateStr,
      dueTime: hourStr || undefined,
    };

    const nextBoard: TodoBoardData = {
      ...todoBoard,
      tasks: {
        ...todoBoard.tasks,
        [taskId]: updatedTask,
      },
    };

    setTodoBoard(nextBoard);
    await chrome.runtime.sendMessage({ type: "SAVE_TODO_BOARD", data: nextBoard });
    onRefresh();
  };

  const renderWeekView = () => {
    const weekDays = getSelectedWeekDays();
    return (
      <div className="grid grid-cols-7 gap-2.5 h-full min-h-[480px] select-none">
        {weekDays.map((day) => {
          const dStr = formatDateStr(day);
          const dayTasks = tasksByDate[dStr] || [];
          const dayMemos = memosByDate[dStr] || [];
          const holidayName = holidayMap[dStr];
          const manualHoliday = manualHolidays[dStr];
          const displayHolidayName = holidayName || (manualHoliday ? manualHoliday.content : undefined);
          const isTodayCell = formatDateStr(new Date()) === dStr;
          const isSelected = selectedDate && formatDateStr(selectedDate) === dStr;
          const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const dayName = dayNames[day.getDay()];

          let cellBgClass = "";
          if (isTodayCell) {
            cellBgClass = "ring-2 ring-indigo-500/60 bg-indigo-5/10 dark:bg-indigo-950/10";
          } else if (manualHoliday) {
            cellBgClass = TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default;
          } else if (holidayName) {
            cellBgClass = "bg-rose-50/30 dark:bg-rose-950/15";
          } else {
            cellBgClass = "bg-white/40 dark:bg-surface-900/30";
          }

          let borderClass = "";
          if (isSelected) {
            borderClass = "border-indigo-500 dark:border-indigo-500/80 shadow-sm";
          } else if (manualHoliday) {
            borderClass = "border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-400/50";
          } else if (holidayName) {
            borderClass = "border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400/50";
          } else {
            borderClass = "border-gray-200/60 dark:border-surface-800/80 hover:border-indigo-400/50";
          }

          return (
            <div
              key={dStr}
              onClick={() => setSelectedDate(day)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleTaskDrop(e, day)}
              className={`flex flex-col gap-2 p-2 rounded-xl border transition-all h-full min-h-[450px]
                ${cellBgClass}
                ${borderClass}
              `}
            >
              {/* Day Header */}
              <div className="pb-1.5 border-b border-gray-150 dark:border-surface-850 flex flex-col items-center">
                <span className={`text-[9px] font-black tracking-wider ${
                  day.getDay() === 0 ? "text-red-500" : day.getDay() === 6 ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
                }`}>
                  {dayName}
                </span>
                <span className={`text-xs font-bold mt-0.5 ${
                  day.getDay() === 0 || holidayName 
                    ? "text-red-500" 
                    : (manualHoliday 
                        ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] || "text-indigo-600 dark:text-indigo-400"
                        : (day.getDay() === 6 ? "text-blue-500" : "text-gray-700 dark:text-gray-300"))
                }`}>
                  {day.getDate()}
                </span>
                {displayHolidayName && (
                  <span className={`text-[8px] font-bold mt-0.5 truncate max-w-full ${manualHoliday ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] : "text-red-500 dark:text-red-400"}`} title={displayHolidayName}>
                    {displayHolidayName}
                  </span>
                )}
              </div>

              {/* Day Items List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[380px] scrollbar-thin pr-0.5">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openTaskEditor(task);
                    }}
                    className={`text-[9px] cursor-grab active:cursor-grabbing font-bold p-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex flex-col gap-0.5
                      ${task.completed 
                        ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                        : TASK_BG_COLORS[task.color || "default"]
                      }
                    `}
                  >
                    <span className="truncate" title={task.content}>{task.content}</span>
                    {task.dueTime && <span className="text-[7px] font-medium opacity-75">{task.dueTime}</span>}
                  </div>
                ))}

                {dayMemos.map((item) => (
                  <div
                    key={item.memo.bookmarkId}
                    onClick={(e) => {
                      e.stopPropagation();
                      openMemoEditor(item);
                    }}
                    className={`text-[9px] font-bold p-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex flex-col gap-0.5
                      ${MEMO_COLORS[item.memo.color || "yellow"]}
                    `}
                  >
                    <div className="flex items-center gap-1">
                      <StickyNote size={8} className="shrink-0" />
                      <span className="truncate" title={item.bookmark ? item.bookmark.title : "일반 메모"}>
                        {item.bookmark ? item.bookmark.title : "일반 메모"}
                      </span>
                    </div>
                  </div>
                ))}

                {dayTasks.length === 0 && dayMemos.length === 0 && (
                  <div className="text-[8px] text-gray-400 dark:text-gray-600 text-center py-6 italic select-none">
                    No events
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    if (!selectedDate) return null;
    const dStr = formatDateStr(selectedDate);
    const dayTasks = tasksByDate[dStr] || [];
    const dayMemos = memosByDate[dStr] || [];

    // All Day: Tasks with no dueTime + Memos
    const allDayTasks = dayTasks.filter((t) => !t.dueTime);
    
    // Hourly Tasks mapping (00:00 to 23:00)
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0") + ":00");

    return (
      <div className="flex flex-col gap-4.5 h-full min-h-[480px] select-none text-xs">
        {/* All Day Banner Row */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleTaskHourDrop(e, "")} // Drop to clear dueTime
          className="p-3.5 bg-gray-50/50 dark:bg-surface-800/40 border border-gray-200/50 dark:border-surface-850 rounded-2xl flex flex-col gap-2"
        >
          <div className="font-bold text-[9px] text-gray-400 uppercase tracking-wider">All Day / Memos</div>
          <div className="flex flex-wrap gap-2">
            {allDayTasks.map((task) => {
              const isEvent = task.type === "event";
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  onClick={(e) => openTaskEditor(task)}
                  className={`text-[9px] cursor-grab active:cursor-grabbing font-bold px-2.5 py-1.5 rounded-lg border shadow-sm transition-all hover:scale-102
                    ${(!isEvent && task.completed)
                      ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                      : TASK_BG_COLORS[task.color || "default"]
                    }
                  `}
                >
                  {task.content}
                </div>
              );
            })}
            {dayMemos.map((item) => (
              <div
                key={item.memo.bookmarkId}
                onClick={(e) => openMemoEditor(item)}
                className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg border shadow-sm transition-all hover:scale-102 flex items-center gap-1
                  ${MEMO_COLORS[item.memo.color || "yellow"]}
                `}
              >
                <StickyNote size={9} className="shrink-0" />
                <span className="truncate max-w-[120px]">{item.bookmark ? item.bookmark.title : "일반 메모"}</span>
              </div>
            ))}
            {allDayTasks.length === 0 && dayMemos.length === 0 && (
              <span className="text-[9px] text-gray-400 dark:text-gray-500 italic">일정이 없습니다.</span>
            )}
          </div>
        </div>

        {/* Hourly Agenda */}
        <div className="flex-1 overflow-y-auto max-h-[360px] divide-y divide-gray-100 dark:divide-surface-800/60 border border-gray-200/50 dark:border-surface-800/60 rounded-2xl bg-white/30 dark:bg-surface-900/10 scrollbar-thin">
          {hours.map((hour) => {
            const hourPrefix = hour.split(":")[0];
            const hourlyTasks = dayTasks.filter((t) => t.dueTime && t.dueTime.startsWith(hourPrefix));

            return (
              <div
                key={hour}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleTaskHourDrop(e, hour)}
                className="flex items-start p-2.5 min-h-[48px] hover:bg-gray-50/30 dark:hover:bg-surface-800/20 transition-colors"
              >
                <div className="w-12 text-[10px] font-bold text-gray-400 tabular-nums self-center">{hour}</div>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {hourlyTasks.map((task) => {
                    const isEvent = task.type === "event";
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                        onClick={(e) => openTaskEditor(task)}
                        className={`text-[9px] cursor-grab active:cursor-grabbing font-bold px-2 py-1 rounded-lg border shadow-sm transition-all hover:scale-102 flex items-center gap-1.5
                          ${(!isEvent && task.completed) 
                            ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                            : TASK_BG_COLORS[task.color || "default"]
                          }
                        `}
                      >
                        <span className="truncate max-w-[150px]">{task.content}</span>
                        <span className="text-[8px] font-normal opacity-75">{task.dueTime}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {DialogEl}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 dark:bg-surface-900/70 backdrop-blur border border-gray-200/50 dark:border-surface-700/50 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {t("calendarBoardTitle") || "Calendar"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              할 일 일정과 북마크에 작성한 메모를 캘린더에서 직관적으로 파악하고 관리합니다.
            </p>
          </div>
        </div>

        {/* Month/Week/Day Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all"
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="px-4 py-2 font-bold text-gray-800 dark:text-gray-200 min-w-[150px] text-center select-none text-sm sm:text-base bg-gray-100/50 dark:bg-surface-800/50 rounded-xl border border-gray-200/20 dark:border-white/5">
            {getDateHeaderLabel()}
          </div>
          <button
            onClick={handleNext}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all"
            title="Next"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={setToday}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm hover:shadow-indigo-500/10 transition-all ml-1.5 active:scale-95"
          >
            Today
          </button>

          {/* View Mode Switcher Tabs */}
          <div className="flex bg-gray-100/60 dark:bg-surface-800/60 p-0.5 rounded-xl border border-gray-200/20 dark:border-white/5 ml-2">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === mode
                    ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {mode === "month" ? t("viewMonth") : mode === "week" ? t("viewWeek") : t("viewDay")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Calendar Grid */}
        <div className="col-span-12 xl:col-span-8 flex flex-col bg-white/70 dark:bg-surface-900/70 backdrop-blur border border-gray-200/50 dark:border-surface-700/50 p-4 rounded-3xl shadow-sm overflow-hidden">
          {viewMode === "month" ? (
            <>
              {/* Weekday Titles */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-400 dark:text-gray-500 select-none pb-2 border-b border-gray-100 dark:border-surface-800">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div className="text-blue-500">SAT</div>
                <div className="text-red-500">SUN</div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[480px]">
                {gridCells.map((cell) => {
                  const dStr = formatDateStr(cell.date);
                  const dayTasks = tasksByDate[dStr] || [];
                  const dayMemos = memosByDate[dStr] || [];
                  const isSelected = selectedDate && formatDateStr(selectedDate) === dStr;
                  
                  const holidayName = holidayMap[dStr];
                  const manualHoliday = manualHolidays[dStr];
                  const displayHolidayName = holidayName || (manualHoliday ? manualHoliday.content : undefined);
                  const isHoliday = !!displayHolidayName;
                  const isTodayCell = formatDateStr(new Date()) === dStr;

                  let cellBgClass = "";
                  if (cell.isCurrentMonth) {
                    if (manualHoliday) {
                      cellBgClass = TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default;
                    } else if (holidayName) {
                      cellBgClass = "bg-rose-50/25 dark:bg-rose-950/10 border-rose-150/50 dark:border-rose-900/30";
                    } else {
                      cellBgClass = "bg-white/40 dark:bg-surface-900/30 border-gray-200/60 dark:border-surface-800/80";
                    }
                  } else {
                    if (manualHoliday) {
                      cellBgClass = `${TASK_CELL_BG_COLORS[manualHoliday.color || "rose"] || TASK_CELL_BG_COLORS.default} opacity-45`;
                    } else if (holidayName) {
                      cellBgClass = "bg-rose-50/10 dark:bg-rose-950/5 border-rose-100/30 dark:border-rose-900/20 opacity-45";
                    } else {
                      cellBgClass = "bg-gray-100/20 dark:bg-surface-950/10 border-gray-100/50 dark:border-surface-900/20 opacity-45";
                    }
                  }

                  // Grid items
                  return (
                    <div
                      key={cell.key}
                      onClick={() => setSelectedDate(cell.date)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleTaskDrop(e, cell.date)}
                      className={`min-h-[85px] p-2 flex flex-col justify-between rounded-2xl border transition-all duration-150 relative cursor-pointer group/cell
                        ${cellBgClass}
                        ${isTodayCell ? "ring-2 ring-indigo-500/60 bg-indigo-5/10 dark:bg-indigo-950/10" : ""}
                        ${isSelected 
                          ? "border-indigo-500 dark:border-indigo-500/80 shadow-inner bg-indigo-50/5 dark:bg-indigo-950/5 ring-1 ring-indigo-500/20" 
                          : (manualHoliday 
                              ? "hover:border-indigo-400/50 hover:opacity-100" 
                              : (holidayName 
                                  ? "hover:border-rose-400/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/15" 
                                  : "hover:border-indigo-400/50 hover:bg-white dark:hover:bg-surface-800/40")
                            )
                        }
                      `}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between select-none">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`text-xs font-bold ${
                            cell.date.getDay() === 0 || holidayName 
                              ? "text-red-500" 
                              : (manualHoliday 
                                  ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] || "text-indigo-600 dark:text-indigo-400"
                                  : (cell.date.getDay() === 6 ? "text-blue-500" : "text-gray-700 dark:text-gray-300"))
                          } ${isTodayCell ? "text-white bg-indigo-500 rounded-full h-5 w-5 flex items-center justify-center font-black" : ""}`}>
                            {cell.date.getDate()}
                          </span>
                          {displayHolidayName && (
                            <span className={`text-[9px] font-medium truncate max-w-[50px] ${manualHoliday ? TASK_TEXT_COLORS[manualHoliday.color || "rose"] : "text-red-500 dark:text-red-400"}`} title={displayHolidayName}>
                              {displayHolidayName}
                            </span>
                          )}
                        </div>
                        
                        {/* Indicators dot */}
                        {(dayTasks.length > 0 || dayMemos.length > 0) && (
                          <div className="flex gap-1">
                            {dayTasks.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                            {dayMemos.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                          </div>
                        )}
                      </div>

                      {/* Preview Cards */}
                      <div className="flex flex-col gap-1 mt-1.5 overflow-hidden flex-1 max-h-[70px]">
                        {/* Render up to 2 items in cell */}
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", task.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openTaskEditor(task);
                            }}
                            className={`text-[9px] cursor-grab active:cursor-grabbing font-bold px-1.5 py-0.5 rounded border truncate shadow-sm transition-all hover:scale-102
                              ${task.completed 
                                ? "bg-gray-100 dark:bg-surface-800 text-gray-400 dark:text-gray-500 border-gray-200/50 line-through font-normal" 
                                : TASK_BG_COLORS[task.color || "default"]
                              }
                            `}
                            title={task.content}
                          >
                            {task.content}
                          </div>
                        ))}

                        {dayMemos.slice(0, Math.max(0, 2 - dayTasks.slice(0, 2).length)).map((item) => (
                          <div
                            key={item.memo.bookmarkId}
                            onClick={(e) => {
                              e.stopPropagation();
                              openMemoEditor(item);
                            }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate shadow-sm transition-all hover:scale-102 flex items-center gap-0.5
                              ${MEMO_COLORS[item.memo.color || "yellow"]}
                            `}
                            title={`[메모] ${item.bookmark ? item.bookmark.title : "일반 메모"}`}
                          >
                            <StickyNote size={8} className="shrink-0" />
                            <span className="truncate">{item.bookmark ? item.bookmark.title : "일반 메모"}</span>
                          </div>
                        ))}

                        {/* More count */}
                        {(dayTasks.length + dayMemos.length) > 2 && (
                          <div className="text-[8px] font-bold text-gray-400 text-right pr-1 select-none">
                            +{dayTasks.length + dayMemos.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : viewMode === "week" ? (
            renderWeekView()
          ) : (
            renderDayView()
          )}
        </div>

        {/* Right Side: Day Details & Event Lists */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white/70 dark:bg-surface-900/70 backdrop-blur border border-gray-200/50 dark:border-surface-700/50 p-5 rounded-3xl shadow-sm flex flex-col min-h-[460px]">
            <div className="pb-3 border-b border-gray-200/50 dark:border-surface-800/80 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center flex-wrap gap-2">
                <Calendar size={15} className="text-indigo-500 shrink-0" />
                <span>
                  {selectedDate ? selectedDate.toLocaleDateString(lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US", { weekday: "long", month: "long", day: "numeric" }) : ""}
                </span>
                {selectedDate && (holidayMap[formatDateStr(selectedDate)] || manualHolidays[formatDateStr(selectedDate)]) && (
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      manualHolidays[formatDateStr(selectedDate)]
                        ? `${TASK_TEXT_COLORS[manualHolidays[formatDateStr(selectedDate)].color || "rose"]} bg-gray-50/50 dark:bg-surface-800 border-indigo-150/50 dark:border-indigo-900/30`
                        : "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-100/50 dark:border-red-900/30"
                    }`}>
                      {holidayMap[formatDateStr(selectedDate)] || manualHolidays[formatDateStr(selectedDate)].content}
                    </span>
                    {manualHolidays[formatDateStr(selectedDate)] && (
                      <button
                        onClick={() => openTaskEditor(manualHolidays[formatDateStr(selectedDate)]!)}
                        className="p-1 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                        title="휴일 편집"
                      >
                        <Edit size={12} />
                      </button>
                    )}
                  </div>
                )}
              </h2>
            </div>

            {/* Events Scroller */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin max-h-[300px]">
              {selectedDateTasks.length === 0 && selectedDateMemos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-gray-500 select-none">
                  <AlertCircle size={28} className="opacity-40 mb-2" />
                  <p className="text-xs font-semibold">{t("calendarNoEvents") || "이 날짜에 예정된 일정이 없습니다."}</p>
                </div>
              ) : (
                <>
                  {/* Tasks Section */}
                  {selectedDateTasks.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckSquare size={12} className="text-emerald-500" />
                        {t("calendarTasks") || "일정"} ({selectedDateTasks.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedDateTasks.map((task) => {
                          const isEvent = task.type === "event";
                          return (
                            <div
                              key={task.id}
                              onClick={() => openTaskEditor(task)}
                              className={`p-3 rounded-xl border border-gray-200/80 dark:border-white/5 cursor-pointer hover:shadow-sm hover:scale-101 active:scale-99 transition-all
                                ${(!isEvent && task.completed) ? "bg-gray-100/60 dark:bg-surface-950/20 opacity-70" : "bg-white dark:bg-surface-800"}
                              `}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="mt-[3px]">
                                  {isEvent ? (
                                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 shrink-0 mt-0.5 flex items-center justify-center text-[7px] text-white font-bold">E</span>
                                  ) : task.completed ? (
                                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                                  ) : (
                                    <Circle size={15} className="text-gray-400 shrink-0" />
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${(!isEvent && task.completed) ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                                    {task.content}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                    {task.dueDate && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                        <Clock size={10} />
                                        기한: {formatDateKorean(task.dueDate)} {task.dueTime || ""}
                                      </span>
                                    )}
                                    {isEvent && task.location && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                                        장소: {task.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Memos Section */}
                  {selectedDateMemos.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <StickyNote size={12} className="text-amber-500" />
                        {t("calendarMemos") || "메모"} ({selectedDateMemos.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedDateMemos.map((item) => (
                          <div
                            key={item.memo.bookmarkId}
                            onClick={() => openMemoEditor(item)}
                            className="p-3 rounded-xl border border-gray-200/80 dark:border-white/5 bg-white dark:bg-surface-800 cursor-pointer hover:shadow-sm hover:scale-101 active:scale-99 transition-all"
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                {item.bookmark ? (
                                  <>
                                    <img
                                      src={item.bookmark.favicon}
                                      alt=""
                                      className="w-3.5 h-3.5 rounded shrink-0 bg-white"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate flex-1">
                                      {item.bookmark.title}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1 truncate flex-1">
                                    <StickyNote size={11} />
                                    일반 메모 (독립형)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed bg-gray-100/50 dark:bg-surface-900/50 p-2 rounded-lg border border-gray-200/10">
                                {item.memo.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Add Interface Panel */}
            <div className="pt-4 border-t border-gray-200/50 dark:border-surface-800/80 mt-auto shrink-0 space-y-3 bg-gray-50/10 dark:bg-transparent rounded-2xl">
              {/* Type Switch Tabs */}
              <div className="flex bg-gray-100/60 dark:bg-surface-800/60 p-0.5 rounded-xl border border-gray-200/20 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setQuickAddType("todo")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all
                    ${quickAddType === "todo" 
                      ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10" 
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }
                  `}
                >
                  <CheckSquare size={11} className="text-emerald-500 shrink-0" />
                  할 일
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddType("event")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all
                    ${quickAddType === "event" 
                      ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10" 
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }
                  `}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 flex items-center justify-center text-[7px] text-white font-bold">E</span>
                  이벤트
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddType("holiday")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all
                    ${quickAddType === "holiday" 
                      ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10" 
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }
                  `}
                >
                  <Calendar size={11} className="text-rose-500 shrink-0" />
                  휴일
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddType("memo")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg transition-all
                    ${quickAddType === "memo" 
                      ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10" 
                      : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }
                  `}
                >
                  <StickyNote size={11} className="text-amber-500 shrink-0" />
                  메모
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleQuickAdd} className="flex gap-2">
                <input
                  type="text"
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  placeholder={
                    quickAddType === "todo"
                      ? `${selectedDate ? selectedDate.getDate() : ""}일에 빠른 할 일 추가...`
                      : quickAddType === "event"
                      ? `${selectedDate ? selectedDate.getDate() : ""}일에 빠른 이벤트 일정 추가...`
                      : quickAddType === "holiday"
                      ? `${selectedDate ? selectedDate.getDate() : ""}일에 빠른 휴일 추가...`
                      : `${selectedDate ? selectedDate.getDate() : ""}일에 일반 메모 남기기...`
                  }
                  className="flex-1 bg-white dark:bg-surface-800 text-xs border border-gray-200/60 dark:border-surface-700/65 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 shadow-sm placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!quickAddInput.trim()}
                  className="px-4 py-2.5 bg-indigo-550 hover:bg-indigo-600 disabled:bg-gray-150 disabled:text-gray-400 dark:disabled:bg-surface-800 text-white rounded-xl font-bold text-xs transition-all shadow hover:shadow-indigo-500/10 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 shrink-0"
                >
                  등록
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📝 TODO Task Edit Modal Dialog                               */}
      {/* ============================================================ */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700/60 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200/60 dark:border-surface-800/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full">
                TASK EDITOR
              </span>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none scrollbar-thin">
              {/* Task Title */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full text-lg font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 py-1"
                  placeholder={editTaskType === "holiday" ? (t("holidayNameLabel") || "휴일명 입력...") : (t("taskContentPlaceholder") || "Enter task...")}
                />
              </div>

              {/* Task Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  {t("taskTypeLabel") || "일정 종류"}
                </label>
                <div className="flex bg-gray-100/60 dark:bg-surface-800/60 p-0.5 rounded-xl border border-gray-200/20 dark:border-white/5">
                  {(["todo", "event", "holiday"] as const).map((type) => {
                    const isSelected = editTaskType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setEditTaskType(type);
                          if (type === "holiday") {
                            const dateVal = editTaskStartDate || editTaskDueDate || formatDateStr(new Date());
                            setEditTaskStartDate(dateVal);
                            setEditTaskDueDate(dateVal);
                          }
                        }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-white dark:bg-surface-900 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200/10"
                            : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                        }`}
                      >
                        {type === "todo" && (
                          <CheckSquare size={13} className={isSelected ? "text-emerald-500" : "text-gray-400"} />
                        )}
                        {type === "event" && (
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center text-[7px] text-white font-black ${
                            isSelected ? "bg-indigo-500" : "bg-gray-400"
                          }`}>E</span>
                        )}
                        {type === "holiday" && (
                          <Calendar size={13} className={isSelected ? "text-rose-500" : "text-gray-400"} />
                        )}
                        <span>
                          {type === "todo" ? t("taskTypeTodo") : type === "event" ? t("taskTypeEvent") : t("taskTypeHoliday")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Color Setup */}
              {editTaskType === "holiday" ? (
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                      휴일 날짜
                    </label>
                    <input
                      type="date"
                      value={editTaskStartDate || ""}
                      onChange={(e) => {
                        setEditTaskStartDate(e.target.value || undefined);
                        setEditTaskDueDate(e.target.value || undefined);
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
                        const isActive = editTaskColor === colorKey;
                        return (
                          <button
                            key={colorKey}
                            type="button"
                            onClick={() => setEditTaskColor(colorKey)}
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
                      value={editTaskStartDate || ""}
                      onChange={(e) => setEditTaskStartDate(e.target.value || undefined)}
                      className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                      {t("datepickerDueDate") || "기한"}
                    </label>
                    <input
                      type="date"
                      value={editTaskDueDate || ""}
                      onChange={(e) => setEditTaskDueDate(e.target.value || undefined)}
                      className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Time & Reminders & Event Location */}
              {editTaskType !== "holiday" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={12} />
                      마감 시간
                    </label>
                    <select
                      value={editTaskDueTime || "12:00"}
                      onChange={(e) => setEditTaskDueTime(e.target.value)}
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
                      value={editTaskReminder || "none"}
                      onChange={(e) => setEditTaskReminder(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {REMINDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {editTaskType === "event" && (
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        {t("locationLabel") || "장소"}
                      </label>
                      <input
                        type="text"
                        value={editTaskLocation}
                        onChange={(e) => setEditTaskLocation(e.target.value)}
                        placeholder={t("locationPlaceholder") || "장소를 입력하세요..."}
                        className="w-full bg-gray-100 dark:bg-surface-800 text-sm border border-gray-200 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Recurrence Setup */}
              {editTaskType !== "holiday" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} />
                      {t("recurrenceLabel") || "반복 일정"}
                    </label>
                    <select
                      value={editTaskRecurrence || "none"}
                      onChange={(e) => setEditTaskRecurrence(e.target.value as any)}
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
              {editTaskType !== "holiday" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    카드 색상
                  </label>
                  <div className="flex gap-2.5">
                    {Object.keys(TASK_BG_COLORS).map((colorKey) => {
                      const isActive = editTaskColor === colorKey;
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setEditTaskColor(colorKey)}
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
                    value={editTaskDesc}
                    onChange={(e) => setEditTaskDesc(e.target.value)}
                    rows={3}
                    placeholder="상세 정보를 기입하세요 (마크다운 포맷 지원)"
                    className="w-full bg-gray-50 dark:bg-surface-800 text-xs border border-gray-200/60 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 resize-y min-h-[60px] max-h-[200px] font-sans"
                  />
                ) : (
                  <div className="w-full min-h-[60px] max-h-[180px] overflow-auto resize-y bg-gray-50/30 dark:bg-surface-800/20 border border-gray-200/50 dark:border-surface-800/60 rounded-xl p-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed scrollbar-thin">
                    {editTaskDesc.trim() ? (
                      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none text-xs leading-normal">
                        {editTaskDesc}
                      </ReactMarkdown>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic text-[11px]">설명이 비어 있습니다.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist Section */}
              {editTaskType === "todo" && (
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
                        style={{ width: `${editTaskProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 w-8 text-right">
                      {editTaskProgress}%
                    </span>
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                    {editTaskChecklist.map((item) => (
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
                  {editTaskTags.map((tag) => (
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
              {editTaskType === "todo" && (
                <div className="flex items-center justify-between bg-gray-100/70 dark:bg-surface-800 p-4 rounded-2xl border border-gray-200/10">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">완료 상태</h4>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">이 작업이 모두 완료되었는지 지정합니다.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditTaskCompleted(!editTaskCompleted)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                      ${editTaskCompleted ? "bg-emerald-500" : "bg-gray-200 dark:bg-surface-700"}
                    `}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${editTaskCompleted ? "translate-x-5" : "translate-x-0"}
                      `}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200/60 dark:border-surface-800/80 bg-gray-50/60 dark:bg-surface-900/50 flex items-center justify-between shrink-0">
              <button
                onClick={() => deleteTaskFromCal(editingTask.id)}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 size={13} />
                Delete Task
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTaskChanges}
                  disabled={!editTaskTitle.trim()}
                  className="px-5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-150 disabled:text-gray-400 dark:disabled:bg-surface-800 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/10 active:scale-95"
                >
                  Save Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 📌 Bookmark Memo Details / Editor Dialog                     */}
      {/* ============================================================ */}
      {editingMemo && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-700/60 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4.5 py-3.5 border-b border-gray-200/60 dark:border-surface-800/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-amber-550 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <StickyNote size={12} />
                MEMO EDITOR
              </span>
              <button
                onClick={() => setEditingMemo(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-surface-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4.5 space-y-3.5 select-none">
              {/* Linked Bookmark Card (Only if bookmark is not null) */}
              {editingMemo.bookmark ? (
                <div className="flex gap-2.5 bg-gray-100/50 dark:bg-surface-800 p-2.5 rounded-2xl border border-gray-200/20 dark:border-white/5 relative group/card">
                  <img
                    src={editingMemo.bookmark.favicon}
                    alt=""
                    className="w-6 h-6 rounded-lg bg-white shrink-0 shadow-sm self-center"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-snug">
                      {editingMemo.bookmark.title}
                    </h4>
                    <a
                      href={editingMemo.bookmark.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-indigo-500 hover:underline flex items-center gap-0.5 mt-0.5 truncate max-w-full font-mono"
                    >
                      <LinkIcon size={8} />
                      {editingMemo.bookmark.url}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-250/20 dark:border-amber-900/30 rounded-2xl flex items-center gap-2">
                  <StickyNote size={14} className="text-amber-500" />
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    독립형 일반 메모 (연결된 북마크 없음)
                  </span>
                </div>
              )}

              {/* Memo Color picker */}
              <div className="flex items-center justify-between bg-gray-50/50 dark:bg-surface-800/40 p-2.5 rounded-2xl border border-gray-200/10">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  메모 색상
                </label>
                <div className="flex gap-2">
                  {(["yellow", "pink", "blue", "green", "purple"] as MemoColor[]).map((col) => {
                    const isActive = editMemoColor === col;
                    let dotBg = "bg-yellow-400";
                    if (col === "pink") dotBg = "bg-rose-400";
                    if (col === "blue") dotBg = "bg-blue-400";
                    if (col === "green") dotBg = "bg-emerald-400";
                    if (col === "purple") dotBg = "bg-purple-400";

                    return (
                      <button
                        key={col}
                        onClick={() => setEditMemoColor(col)}
                        className={`w-5 h-5 rounded-full ${dotBg} shadow transition-transform hover:scale-115 flex items-center justify-center
                          ${isActive ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-surface-900 scale-110" : ""}
                        `}
                      >
                        {isActive && <Check size={10} className="text-white font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Memo input box */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  메모 내용
                </label>
                <textarea
                  value={editMemoContent}
                  onChange={(e) => setEditMemoContent(e.target.value)}
                  rows={8}
                  placeholder={t("memoPlaceholder") || "Enter memo..."}
                  className="w-full bg-gray-100 dark:bg-surface-800 text-xs border border-gray-200/60 dark:border-surface-700/65 rounded-xl px-3 py-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4.5 py-3.5 border-t border-gray-200/60 dark:border-surface-800/80 bg-gray-50/60 dark:bg-surface-900/50 flex items-center justify-between shrink-0">
              <button
                onClick={() => deleteMemoFromCal(editingMemo.memo.bookmarkId)}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-955/20 px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 size={13} />
                Delete Memo
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingMemo(null)}
                  className="px-4 py-2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMemoChanges}
                  disabled={!editMemoContent.trim()}
                  className="px-5 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-150 disabled:text-gray-400 dark:disabled:bg-surface-800 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/10 active:scale-95"
                >
                  Save Memo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Date Format Helper for Korea
const formatDateKorean = (dateStr?: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${m}월 ${d}일`;
};
