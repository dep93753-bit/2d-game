// Loads every image the game uses before the first frame is drawn.

const PACK = "assets/craftpix-seaport/";

const MANIFEST = {
  bg0: "background/day-0.png",
  bg1: "background/day-1.png",
  bg2: "background/day-2.png",
  bg3: "background/day-3.png",
  bg4: "background/day-4.png",
  bg5: "background/day-5.png",
  tileset: "tiles/tileset.png",
  water: "tiles/water.png",
  gantry: "crane/gantry.png",
  beamEnd: "crane/beam-end.png",
  beam: "crane/beam.png",
  cart: "crane/cart.png",
  rope: "crane/rope.png",
  spreaderFrames: "crane/spreader-frames.png",
  container1: "cargo/container-1.png",
  container5: "cargo/container-5.png",
  container9: "cargo/container-9.png",
  container13: "cargo/container-13.png",
  container17: "cargo/container-17.png",
  barrier1: "props/barrier-1.png",
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export async function loadAssets() {
  const entries = Object.entries(MANIFEST);
  const images = await Promise.all(entries.map(([, path]) => loadImage(PACK + path)));
  return Object.fromEntries(entries.map(([key], i) => [key, images[i]]));
}
