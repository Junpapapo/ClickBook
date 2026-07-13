import type { BuddyConfig as SharedBuddyConfig, MemoColor } from "@/shared/types";

export type BuddyConfig = SharedBuddyConfig;

export interface BuddyManifestEntry {
  id: string;
  name: Record<string, string>;
  frameCount: number;
  defaultInterval: number;
  format: "webp" | "png";
  category: string;
}

export interface BuddyManifest {
  buddies: BuddyManifestEntry[];
}

export type CardType = "translate" | "memo" | "settings" | "summary" | "chat" | "timer";

export interface RadialMenuItem {
  id: string;
  icon: string;       // SVG 문자열
  labelKey: string;   // i18n 키 참조
  cardType?: CardType;
  immediate?: boolean;
}

export type RadialDirection = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type BuddyLang = "en" | "ko" | "ja";

export type BuddyActionStatus = "idle" | "loading" | "success" | "error";
export type BuddyDict = Record<string, string>;
