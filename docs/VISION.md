# Project Vision: Cargo Port Idle Tycoon (working title)

> This document is the source of truth for what we are building. A new session
> should be able to read only this file and understand the full project.
> The name is not decided yet. Use "working title" until the owner picks one.

## 1. One-line pitch

A **side-view, pixel-art idle tycoon game** that runs in the browser. You own
cargo ports. Ships arrive and cranes unload them on their own. You spend the
money you earn on more and better ships, cranes, docks, storage and trucks or
trains, and you unlock new ports in new places, each with its own cargo.

## 2. Genre and core feel

- **Genre:** idle / incremental tycoon.
- **Play style:** mostly automatic. The player does not click to unload cargo.
  Cargo moves through the port by itself. The player's job is to **choose
  what to buy and upgrade next** and to watch the port grow.
- **Length:** endless. There is no final win screen and no hard ending.
- **No prestige/reset system.** Progress comes from upgrading and unlocking
  new ports.

## 3. Core loop

1. Ships arrive at the dock carrying cargo.
2. Cranes unload the cargo onto the dock.
3. The cargo goes into docks/storage (warehouses or a container yard).
4. Trucks or trains carry it away, and it is **sold automatically**.
5. Money comes in. The player buys or upgrades:
   - **Ships:** more ships, bigger capacity, faster arrival.
   - **Cranes:** more cranes, faster swings, bigger loads.
   - **Docks & storage:** more dock slots, bigger storage.
   - **Trucks / trains:** more vehicles and faster hauling out of the port.
6. The port speeds up, earns more, and the player buys the next upgrade.

Each link in the chain (ship → crane → storage → truck/train) can become a
bottleneck. Upgrading whichever link is slowest is the main source of
interesting choices.

## 4. Cargo and economy

- There are **several cargo types**, each with its own value.
- **Prices go up and down** over time, so the market feels alive.
- **The player does not control this.** Cargo arrives and sells
  automatically at whatever the current price is. The changing prices add
  variety and visual interest (for example a price ticker), not a trading
  minigame.
- Each port specializes in its own cargo types (see section 5).

## 5. Ports (first full version: 3)

| # | Port | Setting | Cargo types |
|---|------|---------|-------------|
| 1 | Harbor | Small harbor town | Crates, grain |
| 2 | Tropical | Tropical island | Fruit, coffee |
| 3 | Arctic | Arctic port | Oil, fish |

- Ports unlock in order, each costing more than the last.
- Each port has its **own look and its own cargo**. The mechanics are the
  same in every port, with no special rules per port.
- Later ports have bigger numbers (costs and earnings).
- **Every owned port keeps running at the same time.** Total income is the
  sum of all ports. The player switches between ports to look at them and
  buy upgrades.
- More ports may be added after the first version.

## 6. Time and saving

- **No offline earnings.** The game only earns while it is open.
- **Browser autosave** on the player's device: no accounts, no server.
  Progress stays on that browser and device.

## 7. Presentation

- **View:** side view everywhere. Water at the bottom, ships pulling up to
  the dock, cranes swinging containers, storage and trucks/trains on land.
  Like a diorama.
- **Art style:** pixel art that is **blocky but not too blocky, and
  detailed**. A medium pixel size, so it reads clearly as retro pixel art
  while ships, cranes and containers still have recognizable detail. The
  owner described the level of detail as "300 by 400". Sprites stay crisp
  when scaled up, never blurry.
- **Art source:** Claude draws original pixel art, and gaps are filled with
  **free-licensed asset packs** (prefer CC0/public domain). Every outside
  asset is listed with its license in a credits file. No art, sound or music
  is copied from existing commercial games.
- **Audio:** sound effects (crane clanks, ship horns, a cash "cha-ching" and
  so on) **plus background music**, with mute toggles for each.

## 8. Platforms

- Plays in the browser on **desktop and phone/tablet**.
- Works with mouse and with touch.
- The layout adapts to the screen size. *(The exact layout and orientation
  will be decided during the technical decisions.)*

## 9. Out of scope (for now)

- Accounts, cloud save, or progress across devices
- Offline/away earnings
- Prestige / reset systems
- Player-controlled trading or choosing cargo
- Special rules or hazards per port
- Multiplayer and leaderboards
- Monetization (ads or purchases): not discussed, so assume none

## 10. Open items

- Game name (owner: "decide later")
- Screen layout and orientation (part of the technical decisions)
- Exact numbers, costs and balance (worked out during the build)
