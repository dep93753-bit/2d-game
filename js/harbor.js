// The Harbor port scene: background, water, dock, gantry crane and yard props.
// All coordinates are in game pixels on the 576x324 canvas.

export const VIEW_W = 576;
export const VIEW_H = 324;

const TILE = 32;
const DECK_Y = 236;     // top of the dock surface
const DOCK_X = 232;     // where the dock starts (sea is to the left)
const WATER_Y = 252;    // water surface line
const CRANE_X = 236;    // left edge of the gantry sprite frame
const CRANE_Y = DECK_Y - 160;
const BOOM_LEFT = 16;   // boom sticks out over the water to here
const BEAM_H = 32;          // height of the girder rows in the gantry sprite
const GANTRY_TEXT_X = 50;   // gantry sprite: the girder's painted label starts here
const GANTRY_BEAM_X = 58;   // gantry sprite: plain girder (past the left end cap) from here
const BEAM_CAP_W = 18;      // width of the end cap at the left of beam-end.png

// Cart travel range (sprite frame x) and rope lengths for the idle demo.
const CART_MIN_X = BOOM_LEFT + 8;
const CART_MAX_X = CRANE_X + 200;
const ROPE_MIN = 20;
const ROPE_MAX = 110;

export function createHarbor(img) {
  const state = { time: 0 };

  function update(dt) {
    state.time += dt;
  }

  function drawTile(ctx, col, row, x, y) {
    ctx.drawImage(img.tileset, col * TILE, row * TILE, TILE, TILE, x, y, TILE, TILE);
  }

  function drawBackground(ctx) {
    for (const key of ["bg0", "bg1", "bg2", "bg3", "bg4", "bg5"]) {
      ctx.drawImage(img[key], 0, 0);
    }
  }

  function drawWater(ctx) {
    const w = img.water.width;
    const h = VIEW_H - WATER_Y;
    const offset = Math.floor((state.time * 6) % w);
    for (let x = -offset; x < VIEW_W; x += w) {
      ctx.drawImage(img.water, 0, 0, w, h, x, WATER_Y, w, h);
    }
  }

  function drawDock(ctx) {
    for (let y = DECK_Y, row = 0; y < VIEW_H; y += TILE, row++) {
      for (let x = DOCK_X, col = 0; x < VIEW_W; x += TILE, col++) {
        const tileCol = col === 0 ? 0 : 1;
        const tileRow = row === 0 ? 0 : 1;
        drawTile(ctx, tileCol, tileRow, x, y);
      }
    }
  }

  function drawYard(ctx) {
    const base = DECK_Y + 6;
    const c = (key, x, level) => {
      const s = img[key];
      ctx.drawImage(s, x, base - s.height * (level + 1) + level * 2);
    };
    // Container stacks between the crane legs.
    c("container2", 312, 0);
    c("container6", 312, 1);
    c("container14", 404, 0);
    c("container1", 400, 1);
    c("container9", 448, 1);
    // Small props at the dock edge and by the road.
    ctx.drawImage(img.barrier1, DOCK_X + 4, base - img.barrier1.height);
    ctx.drawImage(img.box1, 506, base - img.box1.height);
    ctx.drawImage(img.box3, 530, base - img.box3.height);
    ctx.drawImage(img.box2, 518, base - img.box3.height - img.box2.height + 2);
  }

  function drawRope(ctx, frameX, top, bottom) {
    const piece = img.rope.height;
    for (let y = top; y < bottom; y += piece) {
      const h = Math.min(piece, bottom - y);
      ctx.drawImage(img.rope, 0, 0, img.rope.width, h, frameX + 32, y, img.rope.width, h);
    }
  }

  function drawBoom(ctx) {
    // Extends the gantry's girder out over the water. It runs under the
    // gantry's left end cap so the cap's outline is replaced by plain girder.
    const endX = CRANE_X + GANTRY_BEAM_X;
    ctx.drawImage(img.beamEnd, 0, 0, BEAM_CAP_W, img.beamEnd.height, BOOM_LEFT, CRANE_Y + 1, BEAM_CAP_W, img.beamEnd.height);
    for (let x = BOOM_LEFT + BEAM_CAP_W; x < endX; x += TILE) {
      const w = Math.min(TILE, endX - x);
      ctx.drawImage(img.beam, 0, 0, w, TILE, x, CRANE_Y, w, TILE);
    }
  }

  function drawGantry(ctx) {
    // Legs and wheels, then the girder minus its left end cap. Between
    // GANTRY_TEXT_X and GANTRY_BEAM_X only the girder's inner rows are kept,
    // because the cap's flange overlaps its top and bottom edges there.
    const g = img.gantry;
    const part = (sx, sy, w, h) => ctx.drawImage(g, sx, sy, w, h, CRANE_X + sx, CRANE_Y + sy, w, h);
    part(0, BEAM_H, g.width, g.height - BEAM_H);
    part(GANTRY_TEXT_X, 2, GANTRY_BEAM_X - GANTRY_TEXT_X, 28);
    part(GANTRY_BEAM_X, 1, g.width - GANTRY_BEAM_X, BEAM_H - 1);
  }

  function drawCrane(ctx) {
    // Idle demo motion: the cart glides along the boom while the spreader bobs.
    const t = state.time;
    const travel = (Math.sin(t * 0.35) + 1) / 2;
    const cartX = Math.round(CART_MIN_X + (CART_MAX_X - CART_MIN_X) * travel);
    const rope = Math.round(ROPE_MIN + (ROPE_MAX - ROPE_MIN) * ((Math.sin(t * 0.9) + 1) / 2));

    const cartY = CRANE_Y + 1 - img.cart.height;     // wheels sit on top of the beam
    const ropeTop = cartY + img.cart.height;
    const spreaderY = CRANE_Y + 30 + rope;

    drawRope(ctx, cartX, ropeTop, spreaderY);
    ctx.drawImage(img.spreader, cartX, spreaderY);
    drawBoom(ctx);
    drawGantry(ctx);
    ctx.drawImage(img.cart, cartX, cartY);
  }

  function render(ctx) {
    drawBackground(ctx);
    drawWater(ctx);
    drawDock(ctx);
    drawYard(ctx);
    drawCrane(ctx);
  }

  return { update, render };
}
