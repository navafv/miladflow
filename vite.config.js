import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const VENDOR_CHUNKS = {
  "vendor-export-pdf": ["jspdf", "html-to-image"],
  "vendor-export-xlsx": ["xlsx"],
};

function resolveVendorChunk(id) {
  if (!id.includes("node_modules")) return undefined;
  for (const [chunkName, packages] of Object.entries(VENDOR_CHUNKS)) {
    if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
      return chunkName;
    }
  }
  return "vendor";
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  build: {
    target: "es2020",
    sourcemap: mode !== "production",
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: resolveVendorChunk,
      },
    },
  },

  esbuild: {
    legalComments: "none",
  },
}));