import { vercelPreset } from "@vercel/react-router/vite";

// Vercel sets VERCEL=1 during its builds. Outside Vercel (local, Docker) keep
// the default build so `react-router-serve ./build/server/index.js` still works.
export default {
  ssr: true,
  presets: process.env.VERCEL ? [vercelPreset()] : [],
};
