import { useState, useCallback, useRef, useEffect } from "react";
import type { TaskItem, TaskCategory, TaskStatus } from "./types";

// ── Task Queue Hook ──────────────────────────────────
// Manages background task lifecycle: queued → running → completed/failed
// AI tasks are limited to 1 concurrent (Concurrency Guard)
// ─────────────────────────────────────────────────────

const AI_CATEGORIES: TaskCategory[] = ["ai-organize", "ai-tag", "ai-clean"];
const AUTO_REMOVE_DELAY = 3000; // 3초 후 완료 작업 자동 제거

export function useTaskQueue() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const nextIdRef = useRef(0);
  const timerMapRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── 대기 중 작업 자동 시작 ──
  useEffect(() => {
    const busy = tasks.some(
      (t) => AI_CATEGORIES.includes(t.category) && t.status === "running"
    );
    if (busy) return;

    const nextQueued = tasks.find(
      (t) => AI_CATEGORIES.includes(t.category) && t.status === "queued"
    );
    if (nextQueued) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === nextQueued.id
            ? { ...t, status: "running" as TaskStatus, startedAt: Date.now() }
            : t
        )
      );
    }
  }, [tasks]);

  // ── 완료된 작업 자동 제거 (3초) ──
  const completedIds = tasks
    .filter((t) => t.status === "completed")
    .map((t) => t.id)
    .join(",");

  useEffect(() => {
    const completedTasks = tasks.filter((t) => t.status === "completed");
    
    completedTasks.forEach((t) => {
      if (timerMapRef.current[t.id]) return; // 이미 등록됨 → 스킵

      const elapsed = Date.now() - (t.completedAt ?? Date.now());
      const remaining = Math.max(0, AUTO_REMOVE_DELAY - elapsed);
      
      timerMapRef.current[t.id] = setTimeout(() => {
        setTasks((prev) => prev.filter((p) => p.id !== t.id));
        delete timerMapRef.current[t.id];
      }, remaining);
    });

    // Cleanup: cancel timers for tasks that are no longer in the completed list (e.g. cancelled/dismissed manually)
    const completedSet = new Set(completedTasks.map(t => t.id));
    Object.keys(timerMapRef.current).forEach((id) => {
      if (!completedSet.has(id)) {
        clearTimeout(timerMapRef.current[id]);
        delete timerMapRef.current[id];
      }
    });
  }, [completedIds]);

  // ── 작업 등록 ──
  const addTask = useCallback(
    (
      category: TaskCategory,
      name: string
    ): string => {
      const id = `task-${++nextIdRef.current}-${Date.now()}`;
      const isAI = AI_CATEGORIES.includes(category);

      setTasks((prev) => {
        const aiBusy = prev.some(
          (t) => AI_CATEGORIES.includes(t.category) && t.status === "running"
        );

        const newTask: TaskItem = {
          id,
          category,
          name,
          status: isAI && aiBusy ? "queued" : "running",
          progress: 0,
          startedAt: isAI && aiBusy ? undefined : Date.now(),
        };
        return [...prev, newTask];
      });

      return id;
    },
    []
  );

  // ── 진행률 업데이트 ──
  const updateProgress = useCallback(
    (taskId: string, progress: number, detail?: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, progress, detail } : t
        )
      );
    },
    []
  );

  // ── 작업 완료 ──
  const completeTask = useCallback(
    (taskId: string, summary: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "completed" as TaskStatus,
                progress: 100,
                completedAt: Date.now(),
                result: { summary },
              }
            : t
        )
      );
    },
    []
  );

  // ── 작업 실패 ──
  const failTask = useCallback((taskId: string, error: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: "failed" as TaskStatus,
              error,
              completedAt: Date.now(),
            }
          : t
      )
    );
  }, []);

  // ── 작업 취소 ──
  const cancelTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // ── 실패 작업 닫기 ──
  const dismissTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // ── Concurrency Guard 상태 ──
  const aiRunningCount = tasks.filter(
    (t) => AI_CATEGORIES.includes(t.category) && t.status === "running"
  ).length;
  const aiQueuedCount = tasks.filter(
    (t) => AI_CATEGORIES.includes(t.category) && t.status === "queued"
  ).length;

  return {
    tasks,
    addTask,
    updateProgress,
    completeTask,
    failTask,
    cancelTask,
    dismissTask,
    aiRunningCount,
    aiQueuedCount,
  };
}
