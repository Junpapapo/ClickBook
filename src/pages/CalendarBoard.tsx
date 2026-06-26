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
  Edit,
  Printer
} from "lucide-react";
import type { TodoBoardData, TodoTask, Bookmark, BookmarkMemo, MemoColor, MessageResponse, AppSettings } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";
import ReactMarkdown from "react-markdown";
import { FolderIcon } from "@/components/DynamicIcon";
import { IconPicker } from "@/components/IconPicker";
import TaskEditModal from "./Calendar/components/TaskEditModal";
import MemoEditModal from "./Calendar/components/MemoEditModal";
import MonthView from "./Calendar/components/MonthView";
import WeekView from "./Calendar/components/WeekView";
import DayView from "./Calendar/components/DayView";
import {
  TASK_BG_COLORS,
  TASK_SOLID_COLORS,
  MEMO_COLORS,
  TASK_CELL_BG_COLORS,
  TASK_TEXT_COLORS,
  REMINDER_OPTIONS,
  timeOptions,
  formatDateStr,
  getCalendarGrid
} from "./Calendar/calendar-utils";

interface Props {
  settings?: AppSettings;
  bookmarks: Bookmark[];
  memos: Record<string, BookmarkMemo>;
  onRefresh: () => void;
}

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
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Bookmark memo modal (supports Bookmark | null for standalone memos)
  const [editingMemo, setEditingMemo] = useState<{ bookmark: Bookmark | null; memo: BookmarkMemo } | null>(null);

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

  const handlePrint = () => {
    const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    window.open(`index.html?mode=print&start=${startStr}&end=${startStr}`, "_blank");
  };

  // Open TODO task editor
  const openTaskEditor = (task: TodoTask) => {
    setEditingTask(task);
  };

  // Open New TODO task editor
  const openNewTaskEditor = (date?: Date) => {
    const targetDateStr = date ? formatDateStr(date) : formatDateStr(new Date());
    const newTempTask: TodoTask = {
      id: `task-${Date.now()}`,
      content: "",
      description: "",
      tags: [],
      checklist: [],
      progress: 0,
      completed: false,
      color: "default",
      startDate: targetDateStr,
      dueDate: targetDateStr,
      dueTime: "12:00",
      reminder: "none",
      recurrence: "none",
      type: "todo",
      createdAt: Date.now()
    };
    
    setEditingTask(newTempTask);
  };

  // Save TODO task changes
  const saveTaskChanges = async (updatedTask: TodoTask) => {
    if (!todoBoard) return;
    const title = updatedTask.content.trim();
    if (!title) return;

    const updatedTasks = {
      ...todoBoard.tasks,
      [updatedTask.id]: updatedTask,
    };

    const nextColumns = { ...todoBoard.columns };
    // If it is a new task, append it to the first column
    if (!todoBoard.tasks[updatedTask.id]) {
      const firstColId = todoBoard.columnOrder[0] || "col-1";
      const column = todoBoard.columns[firstColId] || { id: firstColId, title: "To Do", taskIds: [] };
      if (!column.taskIds.includes(updatedTask.id)) {
        nextColumns[firstColId] = {
          ...column,
          taskIds: [...column.taskIds, updatedTask.id],
        };
      }
    }

    const nextBoard: TodoBoardData = {
      ...todoBoard,
      tasks: updatedTasks,
      columns: nextColumns,
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
  };

  // Save Bookmark Memo changes
  const saveMemoChanges = async (content: string, color: MemoColor) => {
    if (!editingMemo) return;

    await chrome.runtime.sendMessage({
      type: "SAVE_MEMO",
      bookmarkId: editingMemo.memo.bookmarkId,
      content,
      color,
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



  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {DialogEl}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/70 dark:bg-surface-900/70 backdrop-blur border border-gray-200/50 dark:border-surface-700/50 p-4 sm:p-5 rounded-2xl shadow-sm">
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
        </div>

        {/* View Mode Switcher & Print Control */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100/60 dark:bg-surface-800/60 p-0.5 rounded-xl border border-gray-200/20 dark:border-white/5">
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

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all shadow-sm active:scale-95"
            title={t("printCalendar") || "인쇄"}
          >
            <Printer size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="hidden sm:inline">{t("printCalendar") || "인쇄"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Side: Calendar Grid */}
        <div className="col-span-12 xl:col-span-8 flex flex-col bg-white/70 dark:bg-surface-900/70 backdrop-blur border border-gray-200/50 dark:border-surface-700/50 p-4 rounded-3xl shadow-sm overflow-hidden xl:h-[calc(100vh-250px)] xl:min-h-[500px]">
          {viewMode === "month" ? (
            <MonthView
              gridCells={gridCells}
              tasksByDate={tasksByDate}
              memosByDate={memosByDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              holidayMap={holidayMap}
              manualHolidays={manualHolidays}
              onTaskDrop={handleTaskDrop}
              onOpenTaskEditor={openTaskEditor}
              onOpenMemoEditor={openMemoEditor}
            />
          ) : viewMode === "week" ? (
            <WeekView
              tasksByDate={tasksByDate}
              memosByDate={memosByDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              holidayMap={holidayMap}
              manualHolidays={manualHolidays}
              getSelectedWeekDays={getSelectedWeekDays}
              onTaskDrop={handleTaskDrop}
              onOpenTaskEditor={openTaskEditor}
              onOpenMemoEditor={openMemoEditor}
            />
          ) : (
            <DayView
              selectedDate={selectedDate}
              tasksByDate={tasksByDate}
              memosByDate={memosByDate}
              onTaskHourDrop={handleTaskHourDrop}
              onOpenTaskEditor={openTaskEditor}
              onOpenMemoEditor={openMemoEditor}
            />
          )}
        </div>

        {/* Right Side: Day Details & Event Lists */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6 xl:h-[calc(100vh-250px)] xl:min-h-[500px]">
          <div className="bg-white/70 dark:bg-surface-900/70 backdrop-blur border border-gray-200/50 dark:border-surface-700/50 p-5 rounded-3xl shadow-sm flex flex-col flex-1 min-h-[460px]">
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
              <button
                onClick={() => openNewTaskEditor(selectedDate || new Date())}
                className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl hover:bg-gray-150 dark:hover:bg-surface-800/50 transition-colors"
                title={t("addNewTask") || "새 일정 추가"}
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Events Scroller */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin max-h-[500px] xl:max-h-none">
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
                                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                  <div className={`flex items-start gap-1.5 ${(!isEvent && task.completed) ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                                    {task.icon && <FolderIcon iconName={task.icon} size={14} className="shrink-0 mt-[9px]" />}
                                    <textarea
                                      readOnly
                                      value={task.content}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-full text-xs font-semibold bg-gray-100/50 dark:bg-surface-900/50 p-2 rounded-lg border border-gray-200/10 resize-y min-h-[42px] max-h-[150px] focus:outline-none ${
                                        (!isEvent && task.completed) ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200"
                                      }`}
                                    />
                                  </div>
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
                              <textarea
                                readOnly
                                value={item.memo.content}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-100/50 dark:bg-surface-900/50 p-2 rounded-lg border border-gray-200/10 resize-y min-h-[80px] max-h-[300px] focus:outline-none"
                              />
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
                  {t("taskTypeTodo")}
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
                  {t("taskTypeEvent")}
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
                  {t("taskTypeHoliday")}
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
                  {t("quickAddMemoTab")}
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
                      ? t("quickAddTodoPlaceholder").replace("{date}", String(selectedDate ? selectedDate.getDate() : ""))
                      : quickAddType === "event"
                      ? t("quickAddEventPlaceholder").replace("{date}", String(selectedDate ? selectedDate.getDate() : ""))
                      : quickAddType === "holiday"
                      ? t("quickAddHolidayPlaceholder").replace("{date}", String(selectedDate ? selectedDate.getDate() : ""))
                      : t("quickAddMemoPlaceholder").replace("{date}", String(selectedDate ? selectedDate.getDate() : ""))
                  }
                  className="flex-1 bg-white dark:bg-surface-800 text-xs border border-gray-200/60 dark:border-surface-700/65 rounded-xl px-3 py-2.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 shadow-sm placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={!quickAddInput.trim()}
                  className="px-4 py-2.5 bg-indigo-550 hover:bg-indigo-600 disabled:bg-gray-150 disabled:text-gray-400 dark:disabled:bg-surface-800 text-white rounded-xl font-bold text-xs transition-all shadow hover:shadow-indigo-500/10 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 shrink-0"
                >
                  {t("quickAddRegister")}
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
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={saveTaskChanges}
          onDelete={deleteTaskFromCal}
          t={t}
        />
      )}

      {/* ============================================================ */}
      {/* 📌 Bookmark Memo Details / Editor Dialog                     */}
      {/* ============================================================ */}
      {editingMemo && (
        <MemoEditModal
          item={editingMemo}
          onClose={() => setEditingMemo(null)}
          onSave={saveMemoChanges}
          onDelete={deleteMemoFromCal}
          t={t}
        />
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
