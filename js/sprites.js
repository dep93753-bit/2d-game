// Original pixel-art sprites drawn in code (the asset pack has no ship or truck).
// Each sprite is painted once onto an offscreen canvas and then reused.

const OUTLINE = "#141a2e";

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Cargo ship, bow pointing right. The deck is at y = SHIP_DECK_Y; containers
// are drawn on top of it separately. Everything below the waterline is hidden
// behind the water layer.
export const SHIP_W = 216;
export const SHIP_H = 92;
export const SHIP_DECK_Y = 60;
// Left edges (ship-relative) of the container slots on deck.
export const SHIP_SLOTS = [62, 112, 162];

export function makeShipSprite() {
  const c = makeCanvas(SHIP_W, SHIP_H);
  const g = c.getContext("2d");
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // Hull: slight slope at the stern, raked bow.
  const top = SHIP_DECK_Y;
  for (let y = top; y < SHIP_H; y++) {
    const d = y - top;
    const left = 4 + Math.floor(d / 4);
    const right = SHIP_W - 2 - Math.floor(d * 0.9);
    let col = "#2b3a66";                     // navy hull
    if (d <= 1) col = "#d7deec";             // deck rail
    else if (d === 6) col = "#e8eef8";       // white stripe
    else if (d >= 14) col = "#a8343c";       // red boot-topping (mostly under water)
    px(left, y, right - left, 1, col);
    px(left - 1, y, 1, 1, OUTLINE);
    px(right, y, 1, 1, OUTLINE);
  }
  px(3, top - 1, SHIP_W - 4, 1, OUTLINE);
  // Hull shading and plate seams.
  for (let x = 30; x < SHIP_W - 30; x += 24) px(x, top + 2, 1, 4, "#24315a");
  px(4, top + 7, SHIP_W - 20, 1, "#24315a");
  // Bow name plate and anchor.
  px(SHIP_W - 34, top + 3, 3, 2, "#e8eef8");
  px(SHIP_W - 28, top + 3, 2, 2, "#e8eef8");
  px(SHIP_W - 20, top + 8, 3, 3, "#8d9bc2");

  // Deck railing posts.
  for (let x = 56; x < SHIP_W - 8; x += 6) px(x, top - 4, 1, 3, "#8d9bc2");
  px(56, top - 4, SHIP_W - 64, 1, "#8d9bc2");

  // Superstructure at the stern.
  const sx = 10, sw = 40, sTop = 14;
  px(sx - 1, sTop - 1, sw + 2, top - sTop + 1, OUTLINE);
  px(sx, sTop, sw, top - sTop, "#e8eef8");
  px(sx + sw - 8, sTop, 8, top - sTop, "#bcc7dc");         // shaded side
  for (let y = sTop + 16; y < top - 4; y += 9) {          // window rows
    for (let x = sx + 4; x < sx + sw - 4; x += 6) px(x, y, 4, 4, "#26304a");
    px(sx + 4, y, 2, 1, "#6f86c2");
  }
  // Bridge with wings.
  px(sx - 7, sTop - 1, sw + 14, 10, OUTLINE);
  px(sx - 6, sTop, sw + 12, 8, "#f4f7fc");
  px(sx - 4, sTop + 2, sw + 8, 4, "#26304a");
  for (let x = sx - 2; x < sx + sw + 4; x += 7) px(x, sTop + 2, 2, 1, "#8fb4f0");
  px(sx - 6, sTop + 8, sw + 12, 1, "#bcc7dc");

  // Funnel.
  px(sx + 6, 0, 14, sTop - 1, OUTLINE);
  px(sx + 7, 1, 12, sTop - 2, "#c94b3c");
  px(sx + 7, 1, 12, 3, "#1e2236");
  px(sx + 7, 7, 12, 2, "#f4c84a");
  px(sx + 15, 4, 4, sTop - 5, "#a83a30");

  // Mast with a light at the bow.
  px(SHIP_W - 24, top - 26, 2, 22, OUTLINE);
  px(SHIP_W - 25, top - 28, 4, 3, "#f4c84a");

  return c;
}

// Container truck, cab on the right. It backs in to load, then drives off to the right.
export const TRUCK_W = 100;
export const TRUCK_H = 34;
export const TRUCK_BED_Y = 20;   // top of the trailer bed (containers sit here)
export const TRUCK_LOAD_X = 8;   // container left edge on the trailer

export function makeTruckSprite() {
  const c = makeCanvas(TRUCK_W, TRUCK_H);
  const g = c.getContext("2d");
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  // Trailer bed and chassis.
  px(0, TRUCK_BED_Y - 1, 70, 7, OUTLINE);
  px(1, TRUCK_BED_Y, 68, 3, "#6b7590");
  px(1, TRUCK_BED_Y + 3, 68, 2, "#454e68");
  px(66, TRUCK_BED_Y + 2, 10, 3, OUTLINE);                 // hitch

  // Cab.
  px(70, 5, 29, 23, OUTLINE);
  px(71, 6, 27, 21, "#f4c84a");
  px(71, 6, 27, 3, "#ffe08a");
  px(92, 6, 6, 21, "#d6a92e");                           // front shading
  px(84, 9, 12, 8, "#26304a");                            // windshield
  px(85, 10, 4, 2, "#8fb4f0");
  px(73, 9, 8, 7, "#26304a");                             // side window
  px(74, 10, 3, 2, "#8fb4f0");
  px(71, 20, 27, 2, "#d6a92e");
  px(97, 23, 3, 4, "#e8eef8");                            // bumper
  px(96, 18, 3, 3, "#fff4b8");                            // headlight
  px(72, 1, 3, 5, OUTLINE);                               // exhaust stack
  px(73, 2, 1, 3, "#8d9bc2");

  // Wheels.
  for (const wx of [6, 16, 56, 76, 90]) {
    px(wx - 1, 25, 9, 9, OUTLINE);
    px(wx, 26, 7, 7, "#2a2f45");
    px(wx + 2, 28, 3, 3, "#8d9bc2");
  }
  return c;
}

// Mirror a sprite horizontally (used for the ship sailing away).
export function flipSprite(src) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext("2d");
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}
