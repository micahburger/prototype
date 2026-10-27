import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 4176 is the folio's dev server; this one sits next to it so both can
    // run at once (handy when testing the folio inside the viewer locally).
    port: 4177,
    strictPort: true,
  },
});
