import { useState } from "react";
import { FolderIcon, LUCIDE_ICONS_MAP, AVAILABLE_ICON_NAMES } from "./DynamicIcon";

const FOLDER_ICONS = [
  // Office & Documents
  "📁","📂","🗂️","💼","📋","📊","📈","📉","📆","📅","📇","✂️","📌","📎","🗑️",
  // Reading & Writing
  "📚","📖","📝","🖊️","🖋️","🖍️","🎓","📜","🔖",
  // Tech & Science
  "💻","🖥️","📱","⌚","🔋","🔌","🔬","🔭","📡","🚀","🛸","🤖","🧬","🧪",
  // Tools & Objects
  "🔧","🔨","🛠️","⚙️","💡","🔑","🗝️","🔒","🔓","🛡️","🧲","⚖️","🛒","🛍️",
  // Entertainment & Arts
  "🎮","🎲","🧩","🎨","🎵","🎶","🎬","📷","📹","🎯","🎳","🎸","🎹","🎺",
  // Travel & Places
  "🏠","🏡","🏢","🏫","🏥","🏭","🌐","🗺️","✈️","🚗","🚕","🚙","🚌","🚎",
  "🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲",
  // Nature & Space
  "🌲","🌳","🌴","🌱","🌿","☘️","🍀","🍄","🌍","🌎","🌏","🌙","⭐","🌟",
  "✨","⚡","🔥","💧","❄️","🌈","☀️","☁️","⛅","⛈️","🌤️","🌥️","🌦️","🌧️",
  // Animals
  "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷",
  "🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅",
  "🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰",
  // Food & Drink
  "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭",
  "🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🌽","🥕","🫒",
  "🍔","🍕","🌭","🥪","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲",
  "☕","🍵","🥤","🧃","🧉","🥛","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🍾",
  // Symbols & Shapes
  "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓",
  "💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️",
  "✅","✔️","❌","✖️","❓","❔","❕","❗","⭕","🚫","💯","💢","💬","👁️‍🗨️",
  // Faces & People
  "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇",
  "🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝",
  "🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥",
  "👤","👥","🫂","🗣️","👶","👧","🧒","👦","👩","🧑","👨","👩‍🦱","🧑‍🦱","👨‍🦱",
];

interface Props {
  onSelect: (icon: string) => void;
  className?: string;
}

export function IconPicker({ onSelect, className = "" }: Props) {
  const [tab, setTab] = useState<"emoji" | "icon">("emoji");
  
  return (
    <div className={`absolute top-full mt-1 z-50 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-600 rounded-lg p-2 shadow-xl w-[200px] ${className}`}>
      <div className="flex gap-1 mb-2 border-b border-gray-100 dark:border-surface-700 pb-2">
        <button
          onClick={() => setTab("emoji")}
          className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${tab === "emoji" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-surface-700"}`}
        >
          Emoji
        </button>
        <button
          onClick={() => setTab("icon")}
          className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${tab === "icon" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-surface-700"}`}
        >
          Icon
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {tab === "emoji" && FOLDER_ICONS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => onSelect(ic)}
            className="text-sm leading-none p-1.5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors"
          >
            {ic}
          </button>
        ))}
        {tab === "icon" && AVAILABLE_ICON_NAMES.map((name) => {
          const IconComp = LUCIDE_ICONS_MAP[name];
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className="p-1.5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-surface-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <IconComp size={15} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
