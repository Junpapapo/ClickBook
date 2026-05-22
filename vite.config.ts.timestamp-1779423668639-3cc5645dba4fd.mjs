// vite.config.ts
import { defineConfig } from "file:///C:/00_Workspace/ClickBook/node_modules/vite/dist/node/index.js";
import react from "file:///C:/00_Workspace/ClickBook/node_modules/@vitejs/plugin-react/dist/index.js";
import webExtension from "file:///C:/00_Workspace/ClickBook/node_modules/vite-plugin-web-extension/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\00_Workspace\\ClickBook";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: "./manifest.json",
      additionalInputs: [
        "src/newtab/index.html"
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFwwMF9Xb3Jrc3BhY2VcXFxcQ2xpY2tCb29rXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFwwMF9Xb3Jrc3BhY2VcXFxcQ2xpY2tCb29rXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi8wMF9Xb3Jrc3BhY2UvQ2xpY2tCb29rL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB3ZWJFeHRlbnNpb24gZnJvbSBcInZpdGUtcGx1Z2luLXdlYi1leHRlbnNpb25cIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHdlYkV4dGVuc2lvbih7XG4gICAgICBtYW5pZmVzdDogXCIuL21hbmlmZXN0Lmpzb25cIixcbiAgICAgIGFkZGl0aW9uYWxJbnB1dHM6IFtcbiAgICAgICAgXCJzcmMvbmV3dGFiL2luZGV4Lmh0bWxcIixcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtUSxTQUFTLG9CQUFvQjtBQUNoUyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxrQkFBa0I7QUFDekIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxNQUNYLFVBQVU7QUFBQSxNQUNWLGtCQUFrQjtBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
