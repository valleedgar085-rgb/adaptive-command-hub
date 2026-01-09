import { useState, useRef, useCallback, useEffect } from "react";
import { 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  Trash2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  History,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CommandOutput {
  id: string;
  command: string;
  output: string;
  status: "success" | "error" | "running" | "info";
  timestamp: Date;
  duration?: number;
}

interface IntegratedTerminalProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onExecuteScript?: (command: string) => Promise<string>;
  onCommandOutput?: (output: string) => void;
}

export const IntegratedTerminal = ({ 
  isOpen = true, 
  onToggle,
  onExecuteScript,
  onCommandOutput
}: IntegratedTerminalProps) => {
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom on new output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Simulated command execution
  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    const commandId = Date.now().toString();
    const startTime = Date.now();

    // Add running command
    setHistory(prev => [...prev, {
      id: commandId,
      command,
      output: "",
      status: "running",
      timestamp: new Date()
    }]);

    setIsExecuting(true);

    try {
      let output = "";
      let status: "success" | "error" | "info" = "success";

      // Handle built-in commands
      if (command === "clear" || command === "cls") {
        setHistory([]);
        setIsExecuting(false);
        return;
      }

      if (command === "help") {
        output = `Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  clear, cls     - Clear terminal
  help           - Show this help message
  history        - Show command history
  version        - Show version info
  build          - Start build process
  test           - Run test suite
  lint           - Run linter
  deploy         - Deploy to production
  status         - Check system status
  
PWA Commands:
  pwa:status     - Check PWA readiness
  pwa:manifest   - Generate manifest
  pwa:sw         - Setup service worker
  pwa:icons      - Generate PWA icons
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        status = "info";
      }

      else if (command === "history") {
        output = history
          .map((h, i) => `${i + 1}. ${h.command}`)
          .join("\n") || "No command history";
        status = "info";
      }

      else if (command === "version") {
        output = `Elite Code Assistant v2.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• React v18.3.1
• TypeScript v5.0
• Vite v5.0
• Tailwind CSS v3.4
• Capacitor v7.4 (Android/iOS)`;
        status = "info";
      }

      else if (command === "status") {
        output = `System Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Database: Connected
✓ AI Service: Online
✓ Storage: Available
✓ Auth: Active
⚡ Performance: Optimal`;
        status = "success";
      }

      else if (command === "build") {
        output = `Building production bundle...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/4] Compiling TypeScript...
[2/4] Bundling modules...
[3/4] Optimizing assets...
[4/4] Generating output...

✓ Build completed successfully!
  Output: dist/
  Size: 1.2 MB (gzipped: 380 KB)`;
        status = "success";
      }

      else if (command === "test") {
        output = `Running test suite...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ utils.test.ts (3 tests passed)
✓ components.test.ts (12 tests passed)
✓ hooks.test.ts (5 tests passed)

All 20 tests passed!`;
        status = "success";
      }

      else if (command === "lint") {
        output = `Running ESLint...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checked 45 files

✓ No errors or warnings found!`;
        status = "success";
      }

      else if (command === "deploy") {
        output = `Deploying to production...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Building assets...
[2/3] Uploading to CDN...
[3/3] Updating DNS...

✓ Deployment successful!
  URL: https://your-app.lovable.app`;
        status = "success";
      }

      else if (command === "pwa:status") {
        output = `PWA Readiness Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ HTTPS enabled
✓ Service Worker registered
✓ Web Manifest present
✓ Icons configured
✓ Offline support ready

📱 Your app is PWA-ready!`;
        status = "success";
      }

      else if (command === "pwa:manifest") {
        output = `Generating PWA Manifest...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "name": "Elite Code Assistant",
  "short_name": "ECA",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#7c3aed",
  "background_color": "#0f0f14"
}

✓ Manifest generated at public/manifest.json`;
        status = "success";
      }

      else if (command === "pwa:sw") {
        output = `Service Worker Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating service-worker.js...
Configuring caching strategies...
Setting up offline fallback...

✓ Service Worker configured!
  - Cache-first for static assets
  - Network-first for API calls
  - Offline page ready`;
        status = "success";
      }

      else if (command === "pwa:icons") {
        output = `Generating PWA Icons...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 72x72 icon generated
✓ 96x96 icon generated
✓ 128x128 icon generated
✓ 144x144 icon generated
✓ 152x152 icon generated
✓ 192x192 icon generated
✓ 384x384 icon generated
✓ 512x512 icon generated

All icons saved to public/icons/`;
        status = "success";
      }

      else if (onExecuteScript) {
        try {
          output = await onExecuteScript(command);
        } catch (err) {
          output = `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
          status = "error";
        }
      }

      else {
        output = `Command not found: ${command}
Type 'help' for available commands.`;
        status = "error";
      }

      const duration = Date.now() - startTime;

      // Notify parent of command output
      if (onCommandOutput && output) {
        onCommandOutput(output);
      }

      setHistory(prev => prev.map(h => 
        h.id === commandId 
          ? { ...h, output, status, duration }
          : h
      ));

    } catch (err) {
      setHistory(prev => prev.map(h => 
        h.id === commandId 
          ? { 
              ...h, 
              output: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
              status: "error",
              duration: Date.now() - startTime
            }
          : h
      ));
    } finally {
      setIsExecuting(false);
    }
  }, [onExecuteScript, history, onCommandOutput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isExecuting) {
      executeCommand(currentCommand);
      setCurrentCommand("");
      setHistoryIndex(-1);
    }

    // Navigate history with arrow keys
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const commandHistory = history.filter(h => h.status !== "running").map(h => h.command);
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const commandHistory = history.filter(h => h.status !== "running").map(h => h.command);
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setCurrentCommand("");
      }
    }
  };

  const copyOutput = async (output: string, id: string) => {
    await navigator.clipboard.writeText(output);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const getStatusIcon = (status: CommandOutput["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      case "running":
        return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
      case "info":
        return <Zap className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <div 
      className={cn(
        "bg-card/95 backdrop-blur-xl transition-all duration-300 h-full flex flex-col",
        !isOpen && onToggle ? "h-10" : ""
      )}
    >
      {/* Terminal Header - only show if toggle function provided */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="w-full h-10 px-4 flex items-center justify-between bg-gradient-to-r from-muted/50 to-transparent hover:bg-muted/30 transition-colors border-b border-border/50 flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-semibold text-foreground">Terminal</span>
            <Badge variant="outline" className="h-5 text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              2.0
            </Badge>
            {history.some(h => h.status === "running") && (
              <Badge variant="outline" className="h-5 text-[10px] bg-primary/10 text-primary border-primary/30 animate-pulse">
                Running...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setHistory([]);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      )}

      {/* Terminal Body */}
      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Output Area */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            <div className="space-y-3 font-mono text-sm">
              {history.length === 0 ? (
                <div className="text-muted-foreground text-xs">
                  Welcome to Elite Terminal 2.0. Type <span className="text-primary">'help'</span> for available commands.
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="space-y-1">
                    {/* Command Line */}
                    <div className="flex items-center gap-2 text-xs">
                      {getStatusIcon(item.status)}
                      <span className="text-emerald-500">❯</span>
                      <span className="text-foreground font-medium">{item.command}</span>
                      {item.duration && (
                        <span className="text-muted-foreground/60 ml-auto">
                          {item.duration}ms
                        </span>
                      )}
                    </div>
                    
                    {/* Output */}
                    {item.output && (
                      <div className="relative group">
                        <pre 
                          className={cn(
                            "text-xs p-3 rounded-lg whitespace-pre-wrap break-words",
                            item.status === "error" 
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : item.status === "info"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-muted/50 text-foreground/80 border border-border/50"
                          )}
                        >
                          {item.output}
                        </pre>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyOutput(item.output, item.id)}
                        >
                          {copied === item.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/50 p-3 flex items-center gap-2 bg-background/80 flex-shrink-0">
            <span className="text-emerald-500 font-mono text-sm pl-2">❯</span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type 'help' for commands..."
              disabled={isExecuting}
              autoFocus
              className="flex-1 h-9 bg-muted/50 border border-border/50 focus:border-emerald-500/50 focus-visible:ring-1 focus-visible:ring-emerald-500/30 font-mono text-sm placeholder:text-muted-foreground/50 rounded-lg"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                executeCommand(currentCommand);
                setCurrentCommand("");
              }}
              disabled={isExecuting || !currentCommand.trim()}
              className="h-7 px-2"
            >
              {isExecuting ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
