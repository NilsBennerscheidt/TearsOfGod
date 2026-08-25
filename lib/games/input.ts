"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

/**
 * The abstract actions a game reacts to, independent of the device that
 * produced them. Games switch on these rather than on key codes, so
 * adding a gamepad or an on-screen d-pad later is a change in this file
 * only.
 */
export type GameIntent = "primary" | "pause" | "left" | "right" | "up" | "down";

/**
 * Keyed by `KeyboardEvent.key`, not `code` — `key` is what a player
 * actually pressed on their own layout, so this works on QWERTZ (the
 * band's own keyboards) as well as QWERTY. The trade-off is that `key`
 * for a letter is layout-dependent; "p" for pause is duplicated in both
 * cases below rather than relying on a `.toLowerCase()` that would also
 * fold unrelated keys together.
 */
const KEY_INTENTS: Readonly<Record<string, GameIntent>> = {
  " ": "primary",
  Enter: "primary",
  Escape: "pause",
  p: "pause",
  P: "pause",
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

export function intentForKey(key: string): GameIntent | null {
  return KEY_INTENTS[key] ?? null;
}

/**
 * True for targets whose own key handling must win — a focused button
 * already turns Space/Enter into a click, and an input needs its
 * characters. Without this, pressing Space on a focused mole would fire
 * both the button's own activation and the window-level "primary"
 * intent.
 */
function targetHandlesItsOwnKeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["BUTTON", "INPUT", "TEXTAREA", "SELECT", "A"].includes(target.tagName);
}

export interface UseGameKeysOptions {
  /**
   * Intents that should fire even when a button or link has focus.
   * "pause" belongs here — Escape must work no matter what the player
   * last clicked, and no native control treats Escape as activation.
   */
  alwaysAllow?: readonly GameIntent[];
}

/**
 * Window-level keyboard → intent bridge.
 *
 * Listens on `window` rather than on a focusable game container: a
 * player who has just clicked a mole has focus on that button, and a
 * container-scoped listener would miss Escape the moment focus moved to
 * any child. The `targetHandlesItsOwnKeys` guard is what keeps that from
 * double-firing.
 *
 * Auto-repeat is dropped (`event.repeat`) so holding a key is one
 * intent, not a stream of them.
 */
export function useGameKeys(
  enabled: boolean,
  handler: (intent: GameIntent, event: KeyboardEvent) => void,
  options: UseGameKeysOptions = {},
): void {
  const handlerRef = useRef(handler);
  const alwaysAllowRef = useRef(options.alwaysAllow);

  useEffect(() => {
    handlerRef.current = handler;
    alwaysAllowRef.current = options.alwaysAllow;
  });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

      const intent = intentForKey(event.key);
      if (intent === null) return;

      const allowedAnyway = alwaysAllowRef.current?.includes(intent) ?? false;
      if (!allowedAnyway && targetHandlesItsOwnKeys(event.target)) return;

      handlerRef.current(intent, event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

export interface PressHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
}

/**
 * Handlers for "activate this element", bound to pointerdown rather than
 * click.
 *
 * In a reaction game the difference is the whole point: `click` fires on
 * pointer *up*, so a fast tap costs however long the finger stayed down,
 * and on touch some browsers still add delay on top. pointerdown fires
 * immediately and covers mouse, touch, and pen through one code path.
 *
 * Nothing here calls preventDefault on pointerdown — that would suppress
 * the element's own focus, breaking keyboard navigation for anyone who
 * mixes pointer and keyboard. The browser still dispatches a `click`
 * afterwards; since we never listen for it, there is no double fire.
 * (Space/Enter on a focused button dispatch that same unlistened click,
 * which is why keyboard activation is handled explicitly below.)
 */
export function pressHandlers(onPress: () => void): PressHandlers {
  return {
    onPointerDown: (event) => {
      // Mouse only: ignore right/middle/back buttons. Touch and pen
      // report button 0 for a normal contact, so this doesn't affect them.
      if (event.pointerType === "mouse" && event.button !== 0) return;
      onPress();
    },
    onKeyDown: (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      // Space would otherwise scroll the page out from under the game.
      event.preventDefault();
      onPress();
    },
  };
}
