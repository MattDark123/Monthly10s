import { ListItem, CARD_SLOTS } from "./types";

/** Grid position (0..8, row-major) of the free square. */
export const FREE = 4;

/** Every winning line on a 3x3 card, as grid positions. */
export const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export type Tile = { kind: "free" } | { kind: "empty" } | { kind: "item"; item: ListItem };

/** Lay the first eight items around the free centre; anything beyond is
 * returned separately so it still shows (as a short list under the card). */
export function layoutCard(items: ListItem[]): { tiles: Tile[]; overflow: ListItem[] } {
  const onCard = items.slice(0, CARD_SLOTS);
  const tiles: Tile[] = [];
  let i = 0;
  for (let pos = 0; pos < 9; pos++) {
    if (pos === FREE) {
      tiles.push({ kind: "free" });
      continue;
    }
    const item = onCard[i++];
    tiles.push(item ? { kind: "item", item } : { kind: "empty" });
  }
  return { tiles, overflow: items.slice(CARD_SLOTS) };
}

export function isTicked(tile: Tile): boolean {
  return tile.kind === "free" || (tile.kind === "item" && tile.item.done);
}

/** Positions of every completed line. */
export function completedLines(tiles: Tile[]): number[][] {
  return LINES.filter((line) => line.every((pos) => isTicked(tiles[pos])));
}

export function isFullHouse(tiles: Tile[]): boolean {
  return tiles.every(isTicked);
}

const LINE_MESSAGES = [
  "Three in a row. Lovely.",
  "That's a line.",
  "A line. Look at that.",
  "Row done. No rush on the rest.",
  "A tidy little line.",
];

const FULL_HOUSE_MESSAGES = [
  "Full house. Every last one.",
  "The whole card. What a month.",
  "Full house. Nothing left to tick.",
];

export function lineMessage(seed: number): string {
  return LINE_MESSAGES[seed % LINE_MESSAGES.length];
}

export function fullHouseMessage(seed: number): string {
  return FULL_HOUSE_MESSAGES[seed % FULL_HOUSE_MESSAGES.length];
}
