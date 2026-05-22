import React from "react";
import {
  Folder, Briefcase, Code2, Palette, Tv, FlaskConical, Trophy, Plane,
  Heart, Star, Music, Camera, Gamepad2, Book, GraduationCap, Map,
  Coffee, ShoppingBag, Car, PlaneTakeoff, Shield, User, Users,
  Home, Building, Cloud, Sun, Moon, Zap, Smile, CheckCircle,
  Lightbulb, Rocket, Monitor, Smartphone, Lock, Search, Bookmark,
  Tag, Gift, Key, Rainbow, Battery, Anchor, Bell, Compass, Cpu
} from "lucide-react";

export const LUCIDE_ICONS_MAP: Record<string, React.FC<any>> = {
  Folder, Briefcase, Code2, Palette, Tv, FlaskConical, Trophy, Plane,
  Heart, Star, Music, Camera, Gamepad2, Book, GraduationCap, Map,
  Coffee, ShoppingBag, Car, PlaneTakeoff, Shield, User, Users,
  Home, Building, Cloud, Sun, Moon, Zap, Smile, CheckCircle,
  Lightbulb, Rocket, Monitor, Smartphone, Lock, Search, Bookmark,
  Tag, Gift, Key, Rainbow, Battery, Anchor, Bell, Compass, Cpu
};

export const AVAILABLE_ICON_NAMES = Object.keys(LUCIDE_ICONS_MAP);

export function isEmoji(s: string) {
  return !!s && !/^[A-Za-z0-9_]+$/.test(s);
}

interface Props {
  iconName?: string | null;
  className?: string;
  size?: number;
  fallbackColorClass?: string;
}

export function FolderIcon({ iconName, className = "", size = 14, fallbackColorClass = "bg-gray-400" }: Props) {
  if (!iconName) {
    return <span className={`w-2 h-2 rounded-full shrink-0 ${fallbackColorClass}`} />;
  }
  
  if (isEmoji(iconName)) {
    return <span className={`text-sm leading-none shrink-0 ${className}`}>{iconName}</span>;
  }

  const IconComponent = LUCIDE_ICONS_MAP[iconName];
  if (IconComponent) {
    return <IconComponent size={size} className={`shrink-0 ${className}`} />;
  }

  // Fallback if not an emoji and not found in lucide map
  return <span className={`w-2 h-2 rounded-full shrink-0 ${fallbackColorClass}`} />;
}
