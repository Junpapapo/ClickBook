import { DICT } from "@/shared/i18n";
import { getEffectiveLanguage } from "./lang-helper";

export async function injectToast(tabId: number, localeKey: string, replacement?: string) {
  try {
    const lang = await getEffectiveLanguage();
    const dict = DICT[lang] ?? DICT.en;
    let message = dict[localeKey as keyof typeof DICT.en] ?? dict.toastHighlightSaved;
    if (replacement) {
      message = message.replace("{domain}", replacement);
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      args: [message],
      func: (msg) => {
        let toast = document.getElementById("clickbook-snip-toast");
        if (!toast) {
          toast = document.createElement("div");
          toast.id = "clickbook-snip-toast";
          
          Object.assign(toast.style, {
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "rgba(15, 12, 30, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
            boxShadow: "0 10px 30px -3px rgba(139, 92, 246, 0.25), 0 4px 6px -2px rgba(139, 92, 246, 0.1)",
            borderRadius: "12px",
            padding: "14px 20px",
            color: "#ffffff",
            fontSize: "14px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: "500",
            zIndex: "999999999",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: "translateY(100px) scale(0.9)",
            opacity: "0",
          });

          const icon = document.createElement("div");
          icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`;
          toast.appendChild(icon);

          const textSpan = document.createElement("span");
          textSpan.id = "clickbook-snip-toast-text";
          toast.appendChild(textSpan);

          document.body.appendChild(toast);
        }

        const textSpan = toast.querySelector("#clickbook-snip-toast-text");
        if (textSpan) {
          textSpan.textContent = msg;
        }

        setTimeout(() => {
          if (toast) {
            toast.style.transform = "translateY(0) scale(1)";
            toast.style.opacity = "1";
          }
        }, 10);

        const timeoutId = (toast as any)._timeoutId;
        if (timeoutId) clearTimeout(timeoutId);

        (toast as any)._timeoutId = setTimeout(() => {
          if (toast) {
            toast.style.transform = "translateY(50px) scale(0.95)";
            toast.style.opacity = "0";
            setTimeout(() => {
              toast?.remove();
            }, 400);
          }
        }, 4000);
      }
    });
  } catch (err) {
    console.warn("Failed to inject toast:", err);
  }
}
