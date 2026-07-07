import React, { useState, useEffect, useCallback } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import type { TodoBoardData, TodoColumn as TodoColType, TodoTask, MessageResponse, AppSettings } from "@/shared/types";

export function useTodoState(settings?: AppSettings, t?: any) {
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
    const newColumn: TodoColType = {
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

  const deleteColumn = useCallback(async (colId: string, showConfirm: any) => {
    if (!data) return;
    const col = data.columns[colId];
    if (col.taskIds.length > 0) {
      const confirmed = await showConfirm(
        (t && t("deleteColumnConfirm")) || "Delete this list?",
        "Delete",
        "Cancel",
        "warn"
      );
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
  }, [data, saveData, t]);

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

  const deleteTask = useCallback(async (taskId: string, colId: string, showConfirm: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!data) return;
    const confirmed = await showConfirm(
      (t && t("deleteTaskConfirm")) || "Delete this task?",
      "Delete",
      "Cancel",
      "warn"
    );
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
  }, [data, saveData, t]);

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
  }, []);

  const saveTaskModal = useCallback((updatedTask: TodoTask) => {
    if (!data || !editingTask) return;
    saveData({
      ...data,
      tasks: {
        ...data.tasks,
        [editingTask.id]: updatedTask
      }
    });
    setEditingTask(null);
  }, [data, editingTask, saveData]);

  return {
    data,
    loading,
    activeSettings,
    editingColumnId,
    setEditingColumnId,
    editColumnTitle,
    setEditColumnTitle,
    addingTaskToCol,
    setAddingTaskToCol,
    newTaskContent,
    setNewTaskContent,
    showColorPickerForCol,
    setShowColorPickerForCol,
    editingTask,
    setEditingTask,
    
    // Handlers
    handleDragEnd,
    addColumn,
    deleteColumn,
    saveColumnTitle,
    changeColumnColor,
    addTask,
    deleteTask,
    toggleTaskCompletion,
    openTaskModal,
    saveTaskModal,
  };
}
