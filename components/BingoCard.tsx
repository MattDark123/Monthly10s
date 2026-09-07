"use client";

import { useEffect, useRef, useState } from "react";
import { Category, ListItem } from "@/lib/types";
import { CATEGORIES, categoryOf } from "@/lib/categories";
import {
  Tile,
  layoutCard,
  isTicked,
  completedLines,
  isFullHouse,
  lineMessage,
  fullHouseMessage,
} from "@/lib/bingo";
import { CheckIcon, PlusIcon } from "./Icons";
import ListItemRow from "./ListItemRow";

function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}

type Editing = { kind: "new" } | { kind: "item"; id: string } | null;

export default function BingoCard({
  items,
  mode,
  full,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  onCategory,
}: {
  items: ListItem[];
  mode: "current" | "plan";
  full: boolean;
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onCategory: (id: string, category: Category | undefined) => void;
}) {
  const { tiles, overflow } = layoutCard(items);
  const [editing, setEditing] = useState<Editing>(null);
  const [celebration, setCelebration] = useState<{ text: string; house: boolean; key: number } | null>(
    null
  );
  const [litLine, setLitLine] = useState<number[]>([]);

  // Celebrate only when something *new* happens: the line count rises past
  // the best seen so far, or the whole month (card and any overflow) is
  // done for the first time. Loading a month or re-ticking stays quiet.
  const bestLines = useRef<number | null>(null);
  const houseSeen = useRef<boolean>(false);
  const lines = completedLines(tiles);
  const house = mode === "current" && isFullHouse(tiles) && overflow.every((i) => i.done);

  useEffect(() => {
    if (mode !== "current") return;
    const n = lines.length;
    if (bestLines.current === null) {
      bestLines.current = n;
      houseSeen.current = house;
      return;
    }
    const seed = Date.now();
    if (house && !houseSeen.current) {
      houseSeen.current = true;
      bestLines.current = n;
      setCelebration({ text: fullHouseMessage(seed), house: true, key: seed });
      setLitLine(tiles.map((_, i) => i));
      haptic(30);
    } else if (n > bestLines.current) {
      bestLines.current = n;
      setCelebration({ text: lineMessage(seed), house: false, key: seed });
      setLitLine(lines[lines.length - 1]);
      haptic(15);
    }
    if (!house) houseSeen.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length, house, mode]);

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => {
      setCelebration(null);
      setLitLine([]);
    }, celebration.house ? 4500 : 3000);
    return () => clearTimeout(t);
  }, [celebration]);

  const editingItem =
    editing?.kind === "item" ? items.find((i) => i.id === editing.id) ?? null : null;

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2 select-none" style={{ WebkitTouchCallout: "none" }}>
        {tiles.map((tile, pos) => (
          <BingoTile
            key={tile.kind === "item" ? tile.item.id : `${tile.kind}-${pos}`}
            tile={tile}
            mode={mode}
            lit={litLine.includes(pos)}
            selected={
              (tile.kind === "item" && editing?.kind === "item" && editing.id === tile.item.id) ||
              (tile.kind === "empty" && editing?.kind === "new")
            }
            onTap={() => {
              if (tile.kind === "free") return;
              if (tile.kind === "empty") {
                if (!full) setEditing({ kind: "new" });
                return;
              }
              if (mode === "plan") {
                setEditing({ kind: "item", id: tile.item.id });
                return;
              }
              haptic();
              onToggle(tile.item.id);
            }}
            onHold={() => {
              if (tile.kind === "item") setEditing({ kind: "item", id: tile.item.id });
              else if (tile.kind === "empty" && !full) setEditing({ kind: "new" });
            }}
          />
        ))}
      </div>

      {celebration?.house && <Burst key={celebration.key} />}

      <div className="min-h-[2.5rem] pt-3" aria-live="polite">
        {celebration ? (
          <p
            key={celebration.key}
            className={`animate-fade-up text-center font-medium ${
              celebration.house ? "text-[17px] text-fg" : "text-[15px] text-accent"
            }`}
          >
            {celebration.text}
          </p>
        ) : (
          items.length > 0 &&
          !editing && (
            <p className="text-center text-xs text-muted">
              {mode === "current" ? "Tap to tick. Hold to edit." : "Tap a tile to edit it."}
            </p>
          )
        )}
      </div>

      {editing && (
        <TileEditor
          key={editing.kind === "item" ? editing.id : "new"}
          item={editingItem}
          onSave={(text) => {
            if (editing.kind === "new") onAdd(text);
            else if (text !== editingItem?.text) onEdit(editing.id, text);
            setEditing(null);
          }}
          onDelete={() => {
            if (editing.kind === "item") onDelete(editing.id);
            setEditing(null);
          }}
          onCategory={(c) => editing.kind === "item" && onCategory(editing.id, c)}
          onCancel={() => setEditing(null)}
        />
      )}

      {overflow.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Also this month</p>
          <ul className="mt-1 border-t border-line">
            {overflow.map((item, i) => (
              <ListItemRow
                key={item.id}
                item={item}
                index={tiles.length - 1 + i}
                mode={mode}
                onToggle={() => onToggle(item.id)}
                onEdit={(text) => onEdit(item.id, text)}
                onDelete={() => onDelete(item.id)}
                onCategory={(c) => onCategory(item.id, c)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BingoTile({
  tile,
  mode,
  lit,
  selected,
  onTap,
  onHold,
}: {
  tile: Tile;
  mode: "current" | "plan";
  lit: boolean;
  selected: boolean;
  onTap: () => void;
  onHold: () => void;
}) {
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);

  function startHold() {
    held.current = false;
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      haptic(12);
      onHold();
    }, 450);
  }
  function cancelHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  const ticked = isTicked(tile);
  const base =
    "relative flex aspect-square items-center justify-center rounded-2xl p-2 text-center transition-all duration-200 active:scale-[0.97]";

  if (tile.kind === "free") {
    return (
      <div
        className={`${base} border border-line bg-fg/[0.03] ${lit ? "animate-pop" : ""}`}
        aria-label="Free square"
      >
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">Free</span>
      </div>
    );
  }

  if (tile.kind === "empty") {
    return (
      <button
        type="button"
        onClick={onTap}
        aria-label="Add an item here"
        className={`${base} border border-dashed text-fg/25 ${
          selected ? "border-fg/40 text-fg/50" : "border-line"
        }`}
      >
        <PlusIcon size={20} />
      </button>
    );
  }

  const done = mode === "current" && ticked;
  return (
    <button
      type="button"
      aria-pressed={mode === "current" ? done : undefined}
      aria-label={tile.item.text}
      onPointerDown={startHold}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        onTap();
      }}
      className={`${base} border ${
        done
          ? "border-accent bg-accent text-white"
          : selected
            ? "border-fg/40 bg-card"
            : "border-line bg-card"
      } ${lit ? "animate-pop" : ""}`}
    >
      <span
        className={`line-clamp-4 text-[13px] leading-snug ${done ? "font-medium" : "text-fg"}`}
      >
        {tile.item.text}
      </span>
      {done && (
        <span className="absolute right-1.5 top-1.5 text-white/80">
          <CheckIcon size={12} />
        </span>
      )}
    </button>
  );
}

function TileEditor({
  item,
  onSave,
  onDelete,
  onCategory,
  onCancel,
}: {
  item: ListItem | null;
  onSave: (text: string) => void;
  onDelete: () => void;
  onCategory: (category: Category | undefined) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(item?.text ?? "");
  const effective = item ? categoryOf(item) : null;

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    else if (item) onCancel();
    else onCancel();
  }

  return (
    <div className="animate-fade-up mt-1 rounded-2xl border border-line bg-card p-4">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={(e) => {
          const next = e.relatedTarget as HTMLElement | null;
          if (next?.dataset.keepEditing) return;
          commit();
        }}
        enterKeyHint="done"
        placeholder="Something small"
        aria-label={item ? "Edit item" : "New item"}
        className="w-full bg-transparent text-[17px] leading-snug outline-none"
      />

      {item && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {CATEGORIES.map((c) => {
            const selected = c.id === effective;
            return (
              <button
                key={c.id}
                type="button"
                data-keep-editing
                onClick={() => {
                  if (selected && item.category) onCategory(undefined);
                  else onCategory(c.id);
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected ? "bg-fg text-bg" : "bg-fg/5 text-muted"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {item ? (
          <button
            type="button"
            data-keep-editing
            onClick={onDelete}
            className="text-sm font-medium text-muted active:text-accent"
          >
            Remove
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          data-keep-editing
          onClick={commit}
          className="rounded-full bg-fg px-4 py-1.5 text-sm font-semibold text-bg active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/** A brief, library-free burst of accent particles from the card's centre.
 * Hidden entirely under prefers-reduced-motion (see globals.css). */
function Burst() {
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const dist = 90 + Math.random() * 90;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,
      r: Math.round((Math.random() - 0.5) * 360),
      size: 5 + Math.round(Math.random() * 4),
      delay: Math.round(Math.random() * 80),
      accent: i % 3 !== 0,
    };
  });
  return (
    <div className="burst pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className={`absolute left-1/2 top-1/2 block rounded-sm ${p.accent ? "bg-accent" : "bg-fg"}`}
          style={
            {
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              animation: `burst 900ms cubic-bezier(0.2, 0.8, 0.3, 1) ${p.delay}ms forwards`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--r": `${p.r}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
