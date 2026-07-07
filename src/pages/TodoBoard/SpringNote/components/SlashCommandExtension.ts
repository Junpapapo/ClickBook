import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface SlashCommandState {
  active: boolean;
  query: string;
  range: { from: number; to: number };
  rect: DOMRect | null;
}

export const SLASH_PLUGIN_KEY = new PluginKey<SlashCommandState>("slashCommand");

export type SlashCommandHandler = (state: SlashCommandState) => void;

export const SlashCommandExtension = Extension.create<{ onStateChange: SlashCommandHandler }>({
  name: "slashCommand",

  addOptions() {
    return {
      onStateChange: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onStateChange } = this.options;

    return [
      new Plugin({
        key: SLASH_PLUGIN_KEY,

        state: {
          init(): SlashCommandState {
            return { active: false, query: "", range: { from: 0, to: 0 }, rect: null };
          },
          apply(tr, prev): SlashCommandState {
            const meta = tr.getMeta(SLASH_PLUGIN_KEY);
            if (meta !== undefined && meta !== null) return meta;
            if (prev.active && tr.docChanged) {
              try {
                const newFrom = tr.mapping.map(prev.range.from);
                const newTo = tr.mapping.map(prev.range.to);
                return { ...prev, range: { from: newFrom, to: newTo } };
              } catch {
                return { active: false, query: "", range: { from: 0, to: 0 }, rect: null };
              }
            }
            return prev;
          },
        },

        props: {
          handleKeyDown(view, event) {
            const pluginState = SLASH_PLUGIN_KEY.getState(view.state);
            if (event.key === "Escape" && pluginState?.active) {
              view.dispatch(
                view.state.tr.setMeta(SLASH_PLUGIN_KEY, {
                  active: false, query: "", range: { from: 0, to: 0 }, rect: null,
                })
              );
              return true;
            }
            if (pluginState?.active && (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter")) {
              document.dispatchEvent(new CustomEvent("slashMenuKey", { detail: event.key }));
              return true;
            }
            return false;
          },

          handleTextInput(view, _from, _to, text) {
            const pluginState = SLASH_PLUGIN_KEY.getState(view.state);

            if (text === "/") {
              setTimeout(() => {
                const pos = view.state.selection.from;
                const domPos = view.coordsAtPos(pos);
                const rect = new DOMRect(domPos.left, domPos.bottom, 0, 0);
                view.dispatch(
                  view.state.tr.setMeta(SLASH_PLUGIN_KEY, {
                    active: true, query: "", range: { from: pos - 1, to: pos }, rect,
                  })
                );
              }, 0);
              return false;
            }

            if (pluginState?.active) {
              if (text === " " || text === "\n") {
                view.dispatch(
                  view.state.tr.setMeta(SLASH_PLUGIN_KEY, {
                    active: false, query: "", range: { from: 0, to: 0 }, rect: null,
                  })
                );
                return false;
              }
              setTimeout(() => {
                const { state } = view;
                const current = SLASH_PLUGIN_KEY.getState(state);
                if (!current?.active) return;
                const curPos = state.selection.from;
                const sliceText = state.doc.textBetween(current.range.from, curPos, "");
                const query = sliceText.startsWith("/") ? sliceText.slice(1) : sliceText;
                const domPos = view.coordsAtPos(curPos);
                const rect = new DOMRect(domPos.left, domPos.bottom, 0, 0);
                view.dispatch(
                  state.tr.setMeta(SLASH_PLUGIN_KEY, {
                    active: true, query, range: { from: current.range.from, to: curPos }, rect,
                  })
                );
              }, 0);
              return false;
            }
            return false;
          },
        },

        view(_editorView) {
          return {
            update(view) {
              const state = SLASH_PLUGIN_KEY.getState(view.state);
              if (state) onStateChange(state);
            },
          };
        },
      }),
    ];
  },
});
