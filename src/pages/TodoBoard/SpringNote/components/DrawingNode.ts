import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import DrawingComponent from "./DrawingComponent";

export default Node.create({
  name: "drawing",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      lines: {
        default: [],
      },
      color: {
        default: "#6366f1",
      },
      size: {
        default: 4,
      },
      backgroundColor: {
        default: "transparent",
      },
      align: {
        default: "center", // left, center, right
      },
      width: {
        default: "max-w-xl", // max-w-md, max-w-lg, max-w-xl, max-w-full
      },
      height: {
        default: 256, // 기본 높이: 256px
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="drawing"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "drawing" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingComponent);
  },
});
