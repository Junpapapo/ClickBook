import React from "react";
import { Draggable, Droppable, DraggableProvided, DroppableProvided } from "@hello-pangea/dnd";
import { Check, Palette, Trash2, Plus } from "lucide-react";
import type { TodoColumn, TodoTask } from "@/shared/types";
import TodoCard from "./TodoCard";

const COLUMN_BG_COLORS: Record<string, string> = {
  default: "bg-slate-100/80 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800/80",
  blue: "bg-blue-50/50 dark:bg-slate-900/70 border-blue-200/70 dark:border-blue-900/40",
  emerald: "bg-emerald-50/50 dark:bg-slate-900/70 border-emerald-200/70 dark:border-emerald-900/40",
  amber: "bg-amber-50/50 dark:bg-slate-900/70 border-amber-200/70 dark:border-amber-900/40",
  rose: "bg-rose-50/50 dark:bg-slate-900/70 border-rose-200/70 dark:border-rose-900/40",
  purple: "bg-purple-50/50 dark:bg-slate-900/70 border-purple-200/70 dark:border-purple-900/40",
};

const COLOR_BTN_BG: Record<string, string> = {
  default: "bg-slate-300 dark:bg-slate-600",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  purple: "bg-purple-500",
};

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
  onOpenSpringNote: (taskId: string, e: React.MouseEvent) => void;
  t: any;
}

export default React.memo(function TodoColumn({
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
  onOpenSpringNote,
  t,
}: TodoColumnViewProps) {
  const currentBgClass = COLUMN_BG_COLORS[column.color || "default"];

  return (
    <Draggable key={column.id} draggableId={column.id} index={index}>
      {(provided: DraggableProvided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className={`${currentBgClass} rounded-xl w-[85vw] sm:w-[320px] shrink-0 flex flex-col max-h-full border shadow-xs relative overflow-hidden transition-all duration-150 backdrop-blur-xs`}
        >
          <div
            {...provided.dragHandleProps}
            className="px-3.5 pt-3.5 pb-2.5 flex items-center justify-between group/col"
          >
            {editingColumnId === column.id ? (
              <div className="flex items-center gap-1.5 w-full bg-white dark:bg-slate-800 rounded-lg border border-indigo-500 px-2.5 py-1 shadow-xs">
                <input
                  autoFocus
                  value={editColumnTitle}
                  onChange={(e) => setEditColumnTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveColumnTitle(column.id, editColumnTitle);
                    if (e.key === "Escape") setEditingColumnId(null);
                  }}
                  className="flex-1 bg-transparent text-xs font-semibold outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  placeholder={t("columnTitlePlaceholder") || "List Title"}
                />
                <button
                  onClick={() => onSaveColumnTitle(column.id, editColumnTitle)}
                  className="text-indigo-600 dark:text-indigo-400 p-0.5 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                  <h3
                    onClick={() => {
                      setEditingColumnId(column.id);
                      setEditColumnTitle(column.title);
                    }}
                    className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer truncate text-sm tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {column.title}
                  </h3>
                  <span className="bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                    {tasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setShowColorPickerForCol(showColorPickerForCol === column.id ? null : column.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors"
                    title={t("changeColor") || "Change Color"}
                  >
                    <Palette size={13} />
                  </button>
                  <button
                    onClick={() => deleteColumn(column.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                    title={t("delete") || "Delete"}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </>
            )}
          </div>

          {showColorPickerForCol === column.id && (
            <div className="px-3.5 pb-2.5 flex gap-1.5 justify-end animate-in fade-in slide-in-from-top-1 duration-150">
              {Object.keys(COLUMN_BG_COLORS).map((colorKey) => {
                const isActive = column.color === colorKey || (!column.color && colorKey === "default");
                return (
                  <button
                    key={colorKey}
                    onClick={() => changeColumnColor(column.id, colorKey)}
                    className={`w-4 h-4 rounded-full ${COLOR_BTN_BG[colorKey]} shadow-2xs transition-transform hover:scale-115 flex items-center justify-center ${
                      isActive ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 scale-110" : ""
                    }`}
                  >
                    {isActive && <Check size={9} strokeWidth={3} className="text-white drop-shadow" />}
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
                className={`flex-1 overflow-y-auto px-2.5 pb-2 min-h-[40px] space-y-2 transition-colors scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 ${
                  snapshot.isDraggingOver ? "bg-indigo-50/40 dark:bg-indigo-950/20 rounded-lg" : ""
                }`}
              >
                {tasks.map((task, index) => (
                  <TodoCard
                    key={task.id}
                    task={task}
                    index={index}
                    columnId={column.id}
                    onToggleComplete={onToggleComplete}
                    onOpenModal={onOpenModal}
                    onDeleteTask={onDeleteTask}
                    onOpenSpringNote={onOpenSpringNote}
                  />
                ))}
                {provided.placeholder}

                {addingTaskToCol === column.id && (
                  <div className="bg-white dark:bg-slate-800/95 p-2.5 rounded-lg shadow-sm border border-indigo-500/80 dark:border-indigo-500 ring-2 ring-indigo-500/10 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
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
                      className="w-full text-xs bg-transparent outline-none resize-none text-slate-800 dark:text-slate-100 min-h-[64px] placeholder:text-slate-400 font-medium leading-relaxed"
                    />
                    <div className="flex gap-1.5 justify-end items-center pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                      <button
                        onClick={() => setAddingTaskToCol(null)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      >
                        {t("cancelBtn")}
                      </button>
                      <button
                        disabled={!newTaskContent.trim()}
                        onClick={() => addTask(column.id, newTaskContent)}
                        className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-md font-semibold transition-colors shadow-xs cursor-pointer"
                      >
                        {t("addTodoTask")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {addingTaskToCol !== column.id && (
            <div className="p-2 shrink-0 pt-0.5">
              <button
                onClick={() => {
                  setAddingTaskToCol(column.id);
                  setNewTaskContent("");
                }}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/60 hover:shadow-xs transition-all cursor-pointer"
              >
                <Plus size={14} />
                {t("addTodoTask")}
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});
