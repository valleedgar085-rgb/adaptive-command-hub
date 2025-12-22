import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

interface UseSQLBuilderKeyboardProps {
  isOpen: boolean;
  shortcuts: KeyboardShortcut[];
}

export const useSQLBuilderKeyboard = ({ isOpen, shortcuts }: UseSQLBuilderKeyboardProps) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          return;
        }
      }
    },
    [isOpen, shortcuts]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);
};

export const SHORTCUT_LABELS = {
  ctrl: navigator.platform.includes("Mac") ? "⌘" : "Ctrl",
  alt: navigator.platform.includes("Mac") ? "⌥" : "Alt",
  shift: "⇧",
};

export const formatShortcut = (shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push(SHORTCUT_LABELS.ctrl);
  if (shortcut.alt) parts.push(SHORTCUT_LABELS.alt);
  if (shortcut.shift) parts.push(SHORTCUT_LABELS.shift);
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
};
