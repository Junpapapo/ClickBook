import type { SpringNote } from "@/shared/types";

const DB_NAME = "clickbook_spring_note_db";
const STORE_NAME = "images";
const NOTES_STORE_NAME = "notes";
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(NOTES_STORE_NAME)) {
        db.createObjectStore(NOTES_STORE_NAME);
      }
    };
  });
}

/**
 * IndexedDB에 이미지 Blob 데이터를 저장합니다.
 */
export async function saveSpringNoteImage(imageId: string, blob: Blob): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, imageId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB에서 특정 이미지 Blob 데이터를 불러옵니다.
 */
export async function getSpringNoteImage(imageId: string): Promise<Blob | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(imageId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB에서 특정 이미지 데이터를 삭제합니다.
 */
export async function deleteSpringNoteImage(imageId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(imageId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB에 스프링 노트(Notebook) 데이터를 저장합니다.
 */
export async function saveSpringNote(note: SpringNote): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE_NAME], "readwrite");
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.put(note, note.id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB에서 특정 스프링 노트 데이터를 조회합니다.
 */
export async function getSpringNote(noteId: string): Promise<SpringNote | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE_NAME], "readonly");
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.get(noteId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB에서 전체 스프링 노트(Notebooks) 목록을 가져옵니다.
 */
export async function getAllSpringNotes(): Promise<SpringNote[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE_NAME], "readonly");
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB에서 특정 스프링 노트를 삭제합니다.
 */
export async function deleteSpringNote(noteId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE_NAME], "readwrite");
    const store = transaction.objectStore(NOTES_STORE_NAME);
    const request = store.delete(noteId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 특정 태스크/ID에 연동된 스프링 노트가 존재하는지 신속히 점검합니다.
 */
export async function checkSpringNoteExists(noteId: string): Promise<boolean> {
  try {
    const note = await getSpringNote(noteId);
    if (!note) return false;
    return note.pages.some((p) => p.text.trim().length > 0 || p.objects.length > 0);
  } catch (e) {
    console.warn("Failed to check spring note existence:", e);
    return false;
  }
}
