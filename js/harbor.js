// The Harbor port: scene drawing plus the cargo loop
// (ship arrives -> crane unloads into the yard -> truck hauls it away -> money).
// All coordinates are in game pixels on the 576x324 canvas.

import {
  makeShipSprite, makeTruckSprite, flipSprite,
  SHIP_W, SHIP_DECK_Y, SHIP_SLOTS,
  TRUCK_W, TRUCK_H, TRUCK_BED_Y, TRUCK_LOAD_X,
} from "./sprites.js";

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

const CONTAINER_W = 47;
const CONTAINER_H = 48;
const CONTAINER_KEYS = ["container1", "container5", "container9", "container13", "container17"];

// Ship berth: the ship's left edge when moored, and its deck height in the world.
const SHIP_BERTH_X = 16;
const SHIP_DECK = 240;
const SHIP_Y = SHIP_DECK - SHIP_DECK_Y;
const SHIP_OFFSCREEN_X = -SHIP_W - 20;

// Yard storage slots (container left edges) between the gantry legs.
const YARD_SLOTS = [304, 356, 408];
const YARD_BASE = DECK_Y + 6;               // containers stand on the deck here

// Spreader geometry: the claws grip a container whose top is this far below the spreader top.
const GRIP_Y = 34;
const GRIP_X = 24;                          // spreader frame x = container x - GRIP_X
const SPREADER_W = 96;
const SPREADER_H = 64;
const SPREADER_RAISED = CRANE_Y + BEAM_H - 1;
const SPREADER_PICK = SHIP_DECK - CONTAINER_H - GRIP_Y;
const SPREADER_DROP = YARD_BASE - CONTAINER_H - GRIP_Y;
const CLAW_CLOSED = 0;
const CLAW_OPEN = 1;

// Truck lane: it backs in from the right, loads, and drives off to the right.
const TRUCK_Y = DECK_Y + 26 - TRUCK_H;
const TRUCK_PARK_X = 468;
const TRUCK_OFFSCREEN_X = VIEW_W + 10;

// Tunable numbers. Stage 3 upgrades will change these.
export const HARBOR_CONFIG = {
  shipCapacity: SHIP_SLOTS.length,
  shipSpeed: 70,          // px/s
  shipTurnaround: 2.5,    // seconds between a ship leaving and the next arriving
  cartSpeed: 80,          // px/s along the boom
  hoistSpeed: 60,         // px/s up/down
  gripTime: 0.3,          // seconds to grab or release
  truckSpeed: 70,         // px/s
  truckLoadTime: 0.7,
  truckTurnaround: 1.0,
  containerValue: 10,     // $ per container sold
};

const approach = (value, target, step) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step);

const randomContainer = () => CONTAINER_KEYS[Math.floor(Math.random() * CONTAINER_KEYS.length)];

export function createHarbor(img, { onSell }) {
  const cfg = HARBOR_CONFIG;
  const shipSprite = makeShipSprite();
  const shipSpriteLeaving = flipSprite(shipSprite);
  const truckSprite = makeTruckSprite();

  const state = {
    time: 0,
    ship: { x: SHIP_OFFSCREEN_X, phase: "arriving", timer: 0, slots: [] },
    crane: {
      x: YARD_SLOTS[0] - GRIP_X, y: SPREADER_RAISED, phase: "idle",
      timer: 0, carrying: null, pick: -1, drop: -1, claw: CLAW_CLOSED,
    },
    yard: YARD_SLOTS.map(() => ({ container: null, reserved: false })),
    truck: { x: TRUCK_OFFSCREEN_X, phase: "arriving", timer: 0, cargo: null, load: null },
    popups: [],
  };
  loadNewShip();

  function loadNewShip() {
    const ship = state.ship;
    ship.slots = SHIP_SLOTS.map((_, i) => (i < cfg.shipCapacity ? randomContainer() : null));
    ship.x = SHIP_OFFSCREEN_X;
    ship.phase = "arriving";
  }

  // ---- Simulation -------------------------------------------------------

  function updateShip(dt) {
    const ship = state.ship;
    if (ship.phase === "arriving") {
      // Glide in and ease off near the berth.
      const speed = Math.min(cfg.shipSpeed, (SHIP_BERTH_X - ship.x) * 1.5 + 6);
      ship.x = approach(ship.x, SHIP_BERTH_X, speed * dt);
      if (ship.x === SHIP_BERTH_X) ship.phase = "docked";
    } else if (ship.phase === "docked") {
      const empty = ship.slots.every((s) => s === null);
      const craneBusyOverShip = ["lowerPick", "grab"].includes(state.crane.phase);
      if (empty && !craneBusyOverShip) ship.phase = "departing";
    } else if (ship.phase === "departing") {
      const speed = Math.min(cfg.shipSpeed, (ship.x - SHIP_OFFSCREEN_X) * 1.5 + 10);
      ship.x = approach(ship.x, SHIP_OFFSCREEN_X, Math.max(speed, 10) * dt);
      if (ship.x === SHIP_OFFSCREEN_X) {
        ship.phase = "away";
        ship.timer = cfg.shipTurnaround;
      }
    } else if (ship.phase === "away") {
      ship.timer -= dt;
      if (ship.timer <= 0) loadNewShip();
    }
  }

  function updateCrane(dt) {
    const crane = state.crane;
    const ship = state.ship;
    const moveX = (target) => { crane.x = approach(crane.x, target, cfg.cartSpeed * dt); return crane.x === target; };
    const moveY = (target) => { crane.y = approach(crane.y, target, cfg.hoistSpeed * dt); return crane.y === target; };

    switch (crane.phase) {
      case "idle": {
        moveY(SPREADER_RAISED);
        if (ship.phase !== "docked") break;
        // Unload from the slot nearest the dock first.
        let pick = -1;
        for (let i = ship.slots.length - 1; i >= 0; i--) if (ship.slots[i]) { pick = i; break; }
        const drop = state.yard.findIndex((s) => !s.container && !s.reserved);
        if (pick < 0 || drop < 0 || crane.y !== SPREADER_RAISED) break;
        crane.pick = pick;
        crane.drop = drop;
        state.yard[drop].reserved = true;
        crane.phase = "toPick";
        break;
      }
      case "toPick":
        if (moveX(SHIP_BERTH_X + SHIP_SLOTS[crane.pick] - GRIP_X)) { crane.phase = "lowerPick"; crane.claw = CLAW_OPEN; }
        break;
      case "lowerPick":
        if (moveY(SPREADER_PICK)) { crane.phase = "grab"; crane.timer = cfg.gripTime; }
        break;
      case "grab":
        crane.timer -= dt;
        if (crane.timer <= 0) {
          crane.carrying = ship.slots[crane.pick];
          ship.slots[crane.pick] = null;
          crane.claw = CLAW_CLOSED;
          crane.phase = "raisePick";
        }
        break;
      case "raisePick":
        if (moveY(SPREADER_RAISED)) crane.phase = "toDrop";
        break;
      case "toDrop":
        if (moveX(YARD_SLOTS[crane.drop] - GRIP_X)) crane.phase = "lowerDrop";
        break;
      case "lowerDrop":
        if (moveY(SPREADER_DROP)) { crane.phase = "release"; crane.timer = cfg.gripTime; }
        break;
      case "release":
        crane.timer -= dt;
        if (crane.timer <= 0) {
          const slot = state.yard[crane.drop];
          slot.container = crane.carrying;
          slot.reserved = false;
          crane.carrying = null;
          crane.claw = CLAW_OPEN;
          crane.phase = "raiseDrop";
        }
        break;
      case "raiseDrop":
        if (moveY(SPREADER_RAISED)) { crane.claw = CLAW_CLOSED; crane.phase = "idle"; }
        break;
    }
  }

  function updateTruck(dt) {
    const truck = state.truck;
    const drive = (target) => { truck.x = approach(truck.x, target, cfg.truckSpeed * dt); return truck.x === target; };

    if (truck.phase === "arriving") {
      if (drive(TRUCK_PARK_X)) truck.phase = "waiting";
    } else if (truck.phase === "waiting") {
      // Take the stored container closest to the truck.
      for (let i = state.yard.length - 1; i >= 0; i--) {
        const slot = state.yard[i];
        if (slot.container) {
          truck.load = { key: slot.container, fromX: YARD_SLOTS[i], fromY: YARD_BASE - CONTAINER_H };
          slot.container = null;
          truck.timer = cfg.truckLoadTime;
          truck.phase = "loading";
          break;
        }
      }
    } else if (truck.phase === "loading") {
      truck.timer -= dt;
      if (truck.timer <= 0) {
        truck.cargo = truck.load.key;
        truck.load = null;
        truck.phase = "leaving";
      }
    } else if (truck.phase === "leaving") {
      if (drive(TRUCK_OFFSCREEN_X)) {
        const value = cfg.containerValue;
        onSell(value);
        state.popups.push({ text: `+$${value}`, x: VIEW_W - 40, y: TRUCK_Y - 6, age: 0 });
        truck.cargo = null;
        truck.phase = "away";
        truck.timer = cfg.truckTurnaround;
      }
    } else if (truck.phase === "away") {
      truck.timer -= dt;
      if (truck.timer <= 0) truck.phase = "arriving";
    }
  }

  function update(dt) {
    state.time += dt;
    updateShip(dt);
    updateCrane(dt);
    updateTruck(dt);
    for (const p of state.popups) p.age += dt;
    state.popups = state.popups.filter((p) => p.age < 1.6);
  }

  // ---- Drawing ----------------------------------------------------------

  function drawTile(ctx, col, row, x, y) {
    ctx.drawImage(img.tileset, col * TILE, row * TILE, TILE, TILE, x, y, TILE, TILE);
  }

  function drawBackground(ctx) {
    for (const key of ["bg0", "bg1", "bg2", "bg3", "bg4", "bg5"]) {
      ctx.drawImage(img[key], 0, 0);
    }
  }

  function drawShip(ctx) {
    const ship = state.ship;
    if (ship.phase === "away") return;
    const x = Math.round(ship.x);
    // Gentle bob while moored or sailing.
    const bob = Math.round(Math.sin(state.time * 1.6) * 0.6);
    const y = SHIP_Y + bob;
    if (ship.phase === "departing") {
      ctx.drawImage(shipSpriteLeaving, x, y);
      return;
    }
    ctx.drawImage(shipSprite, x, y);
    ship.slots.forEach((key, i) => {
      if (key) ctx.drawImage(img[key], x + SHIP_SLOTS[i], y + SHIP_DECK_Y - CONTAINER_H);
    });
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
    ctx.drawImage(img.barrier1, DOCK_X + 4, YARD_BASE - img.barrier1.height);
    state.yard.forEach((slot, i) => {
      if (slot.container) ctx.drawImage(img[slot.container], YARD_SLOTS[i], YARD_BASE - CONTAINER_H);
    });
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
    const crane = state.crane;
    const cartX = Math.round(crane.x);
    const spreaderY = Math.round(crane.y);
    const cartY = CRANE_Y + 1 - img.cart.height;     // wheels sit on top of the beam

    drawRope(ctx, cartX, cartY + img.cart.height, spreaderY);
    if (crane.carrying) ctx.drawImage(img[crane.carrying], cartX + GRIP_X, spreaderY + GRIP_Y);
    ctx.drawImage(img.spreaderFrames, crane.claw * SPREADER_W, 0, SPREADER_W, SPREADER_H,
      cartX, spreaderY, SPREADER_W, SPREADER_H);
    drawBoom(ctx);
    drawGantry(ctx);
    ctx.drawImage(img.cart, cartX, cartY);
  }

  function drawTruck(ctx) {
    const truck = state.truck;
    if (truck.phase === "away") return;
    const x = Math.round(truck.x);
    const loadX = x + TRUCK_LOAD_X;
    const loadY = TRUCK_Y + TRUCK_BED_Y - CONTAINER_H;
    if (truck.cargo) ctx.drawImage(img[truck.cargo], loadX, loadY);
    ctx.drawImage(truckSprite, x, TRUCK_Y);
    if (truck.load) {
      // Container slides from the yard onto the trailer with a small lift.
      const k = 1 - Math.max(truck.timer, 0) / cfg.truckLoadTime;
      const ease = k * k * (3 - 2 * k);
      const cx = truck.load.fromX + (loadX - truck.load.fromX) * ease;
      const cy = truck.load.fromY + (loadY - truck.load.fromY) * ease - Math.sin(k * Math.PI) * 10;
      ctx.drawImage(img[truck.load.key], Math.round(cx), Math.round(cy));
    }
  }

  function drawPopups(ctx) {
    ctx.font = '600 10px "Pixelify Sans", monospace';
    ctx.textAlign = "center";
    for (const p of state.popups) {
      const y = Math.round(p.y - p.age * 18);
      ctx.globalAlpha = Math.max(0, 1 - p.age / 1.6);
      ctx.fillStyle = "#141a2e";
      ctx.fillText(p.text, p.x + 1, y + 1);
      ctx.fillStyle = "#f4c84a";
      ctx.fillText(p.text, p.x, y);
    }
    ctx.globalAlpha = 1;
  }

  function render(ctx) {
    drawBackground(ctx);
    drawShip(ctx);
    drawWater(ctx);
    drawDock(ctx);
    drawYard(ctx);
    drawCrane(ctx);
    drawTruck(ctx);
    drawPopups(ctx);
  }

  return { update, render };
}
