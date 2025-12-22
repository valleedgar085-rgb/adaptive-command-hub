import { Keyboard, Command } from "lucide-react";
import { formatShortcut } from "@/hooks/useSQLBuilderKeyboard";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

interface SQLKeyboardShortcutsPanelProps {
  shortcuts: Shortcut[];
}

export const SQLKeyboardShortcutsPanel = ({ shortcuts }: SQLKeyboardShortcutsPanelProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-muted/30 rounded-xl border border-border/50">
      <div className="col-span-full flex items-center gap-2 pb-3 border-b border-border/50 mb-2">
        <Keyboard className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm text-foreground">Keyboard Shortcuts</span>
      </div>
      {shortcuts.map((shortcut, i) => (
        <div key={i} className="flex items-center justify-between gap-2 text-xs py-1.5">
          <span className="text-muted-foreground truncate">{shortcut.description}</span>
          <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-background/80 border border-border/50 rounded-md font-mono text-[10px] text-primary whitespace-nowrap shadow-sm">
            {shortcut.ctrl && <Command className="h-2.5 w-2.5" />}
            {formatShortcut(shortcut)}
          </kbd>
        </div>
      ))}
    </div>
  );
};
