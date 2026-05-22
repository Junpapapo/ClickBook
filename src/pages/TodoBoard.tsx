import React, { useState, useEffect, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import { Plus, X, Pencil, Check, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import type { TodoBoardData, TodoColumn, TodoTask, MessageResponse } from "@/shared/types";
import { useLang } from "@/shared/LanguageContext";
import { useDialog } from "@/shared/useDialog";

import ReactMarkdown from "react-markdown";

// --- Types ---
type PartialData = Omit<TodoBoardData, "tasks"> & { tasks: Record<string, TodoTask> };

export default function TodoBoard() {
  const { t } = useLang();
  const { showConfirm, DialogEl } = useDialog();

  const [data, setData] = useState<TodoBoardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Focus management
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnTitle, setEditColumnTitle] = useState("");
  const [addingTaskToCol, setAddingTaskToCol] = useState<string | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = (await chrome.runtime.sendMessage({ type: "GET_TODO_BOARD" })) as MessageResponse;
    if (res.success && res.data) {
      setData(res.data as TodoBoardData);
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

  const saveColumnTitle = useCallback(() => {
    if (!data || !editingColumnId) return;
    const title = editColumnTitle.trim() || "Untitled List";
    const column = data.columns[editingColumnId];
    saveData({
      ...data,
      columns: {
        ...data.columns,
        [editingColumnId]: { ...column, title },
      },
    });
    setEditingColumnId(null);
  }, [data, editingColumnId, editColumnTitle, saveData]);

  const addTask = useCallback((colId: string) => {
    if (!data) return;
    const content = newTaskContent.trim();
    if (!content) {
      setAddingTaskToCol(null);
      return;
    }

    const taskId = `task-${Date.now()}`;
    const newTask: TodoTask = {
      id: taskId,
      content,
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
  }, [data, newTaskContent, saveData]);

  const deleteTask = useCallback(async (taskId: string, colId: string) => {
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
      <div className="h-full flex flex-col">
        <div className="mb-6 shrink-0 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-lg">✓</span>
            {t("todoBoardTitle") || "TODO Board"}
          </h1>
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus size={16} />
            {t("addTodoColumn") || "Add List"}
          </button>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
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
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                            className="bg-gray-100 dark:bg-surface-800 rounded-xl w-72 shrink-0 flex flex-col max-h-full border border-gray-200 dark:border-surface-700 shadow-sm"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="p-3 flex items-center justify-between group/col"
                            >
                              {editingColumnId === column.id ? (
                                <div className="flex items-center gap-1 w-full bg-white dark:bg-surface-900 rounded border border-indigo-500 px-1 py-0.5">
                                  <input
                                    autoFocus
                                    value={editColumnTitle}
                                    onChange={(e) => setEditColumnTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveColumnTitle();
                                      if (e.key === "Escape") setEditingColumnId(null);
                                    }}
                                    className="flex-1 bg-transparent text-sm font-semibold outline-none text-gray-800 dark:text-gray-200"
                                    placeholder={t("columnTitlePlaceholder") || "List Title"}
                                  />
                                  <button onClick={saveColumnTitle} className="text-emerald-500 p-0.5 hover:bg-emerald-50 dark:hover:bg-surface-800 rounded">
                                    <Check size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <h3
                                    onClick={() => {
                                      setEditingColumnId(column.id);
                                      setEditColumnTitle(column.title);
                                    }}
                                    className="font-semibold text-gray-700 dark:text-gray-200 cursor-pointer flex-1 truncate px-1"
                                  >
                                    {column.title}
                                  </h3>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => deleteColumn(column.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            <Droppable droppableId={column.id} type="task">
                              {(provided: DroppableProvided, snapshot) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className={`flex-1 overflow-y-auto px-2 min-h-[40px] transition-colors ${
                                    snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                                  }`}
                                >
                                  {tasks.map((task, index) => (
                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                      {(provided: DraggableProvided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`group/task relative bg-white dark:bg-surface-900 p-3 rounded-lg shadow-sm mb-2 border border-gray-200 dark:border-surface-700
                                            ${snapshot.isDragging ? "shadow-md ring-2 ring-indigo-500/50 rotate-2" : "hover:border-gray-300 dark:hover:border-surface-500"}
                                            transition-all
                                          `}
                                        >
                                          <div className="text-sm text-gray-800 dark:text-gray-200 markdown-body">
                                            <ReactMarkdown
                                              components={{
                                                p: ({ node, ...props }) => <p className="whitespace-pre-wrap mb-2 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 last:mb-0" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 last:mb-0" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-indigo-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />
                                              }}
                                            >
                                              {task.content}
                                            </ReactMarkdown>
                                          </div>
                                          
                                          <div className="absolute top-2 right-2 opacity-0 group-hover/task:opacity-100 transition-opacity flex gap-1">
                                            <button
                                              onClick={() => deleteTask(task.id, column.id)}
                                              className="p-1 bg-white dark:bg-surface-800 shadow-sm border border-gray-200 dark:border-surface-600 rounded text-gray-400 hover:text-red-500"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  
                                  {addingTaskToCol === column.id && (
                                    <div className="bg-white dark:bg-surface-900 p-2 rounded-lg shadow-sm mb-2 border border-indigo-500 flex flex-col gap-2">
                                      <textarea
                                        autoFocus
                                        value={newTaskContent}
                                        onChange={(e) => setNewTaskContent(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            addTask(column.id);
                                          }
                                          if (e.key === "Escape") setAddingTaskToCol(null);
                                        }}
                                        placeholder={t("taskContentPlaceholder") || "Enter task..."}
                                        className="w-full text-sm bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 min-h-[60px]"
                                      />
                                      <div className="flex gap-1 justify-end">
                                        <button onClick={() => setAddingTaskToCol(null)} className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                                        <button onClick={() => addTask(column.id)} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium">Add</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Droppable>

                            {addingTaskToCol !== column.id && (
                              <div className="p-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setAddingTaskToCol(column.id);
                                    setNewTaskContent("");
                                  }}
                                  className="w-full flex items-center gap-1.5 p-2 rounded text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-surface-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </>
  );
}