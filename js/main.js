import { loadAssets } from "./assets.js";
import { createHarbor, VIEW_W, VIEW_H } from "./harbor.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const view = document.getElementById("view");
const loading = document.getElementById("loading");

// The game is drawn at a whole-number multiple of 576x324 (so every art pixel
// is a clean square), then the canvas is shown as large as fits. When the fit
// is not a whole number the browser shrinks the sharp image slightly, which
// stays crisp instead of producing uneven pixels.
function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const style = getComputedStyle(view);
  const availW = view.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const portrait = window.matchMedia("(max-aspect-ratio: 1/1)").matches;
  // In the upright layout the view sizes itself to the canvas, so cap by width only
  // (and leave at least ~45% of the screen for the panel).
  const availH = portrait
    ? window.innerHeight * 0.55
    : view.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

  const fit = Math.min((availW * dpr) / VIEW_W, (availH * dpr) / VIEW_H);
  const exact = Number.isInteger(fit);
  const renderScale = Math.max(1, Math.ceil(fit));
  canvas.width = VIEW_W * renderScale;
  canvas.height = VIEW_H * renderScale;
  canvas.style.width = `${(VIEW_W * fit) / dpr}px`;
  canvas.style.height = `${(VIEW_H * fit) / dpr}px`;
  canvas.classList.toggle("exact", exact);
  // Resizing a canvas resets its drawing state.
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

async function start() {
  const images = await loadAssets();
  const port = createHarbor(images);

  loading.classList.add("hidden");
  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1); // clamp after tab switches
    last = now;
    port.update(dt);
    port.render(ctx);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

start().catch((err) => {
  loading.textContent = "Could not load the game. Please refresh.";
  console.error(err);
});
