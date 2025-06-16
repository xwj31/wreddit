import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset,
  images: [
    "public/apple-touch-icon.svg",
    "public/favicon-svg.svg",
    "public/maskable-icon.svg",
    "public/pwa-icon-192.svg",
    "public/pwa-icon-512.svg",
  ],
});
