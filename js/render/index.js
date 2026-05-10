/* ─── Render Module Entry ────────────────────────────────
 * This file provides helper functions for the main Renderer.
 * The main Renderer is defined in js/renderer.js
 * ─────────────────────────────────────────────────────── */

const RenderModule = {
  init() {
    FormulaRenderer.init();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RenderModule.init();
});
