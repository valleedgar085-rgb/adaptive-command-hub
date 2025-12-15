import { useState, useCallback, useRef } from "react";
import { 
  Play, 
  Square, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check,
  FolderOpen,
  Save,
  Timer,
  Globe,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PermissionDialog, PermissionType } from "./PermissionDialog";
import { ScriptManager, Script } from "./ScriptManager";

interface CodeSandboxProps {
  initialCode?: string;
  language?: "javascript" | "typescript";
  onClose?: () => void;
}

interface ExecutionResult {
  type: "log" | "error" | "warn" | "result" | "info" | "task";
  content: string;
  timestamp: number;
}

interface PendingPermission {
  type: PermissionType;
  details: string;
  resolve: (granted: boolean) => void;
}

interface TaskDefinition {
  name: string;
  fn: () => Promise<unknown> | unknown;
  status: "pending" | "running" | "completed" | "failed";
}

export const CodeSandbox = ({ 
  initialCode = "// Write your JavaScript/TypeScript code here\n// Available APIs:\n//   task(name, fn) - Run named tasks\n//   readScript(name) - Load saved scripts\n//   fetch(url) - Make network requests (requires permission)\n//   storage.get/set - Access local storage (requires permission)\n\nconsole.log('Hello, World!');", 
  language = "javascript",
  onClose 
}: CodeSandboxProps) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<ExecutionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingPermission, setPendingPermission] = useState<PendingPermission | null>(null);
  const [grantedPermissions, setGrantedPermissions] = useState<Set<PermissionType>>(new Set());
  const [showScriptManager, setShowScriptManager] = useState(false);
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const requestPermission = useCallback((type: PermissionType, details: string): Promise<boolean> => {
    if (grantedPermissions.has(type)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      setPendingPermission({ type, details, resolve });
    });
  }, [grantedPermissions]);

  const handlePermissionResponse = (granted: boolean) => {
    if (pendingPermission) {
      if (granted) {
        setGrantedPermissions(prev => new Set([...prev, pendingPermission.type]));
      }
      pendingPermission.resolve(granted);
      setPendingPermission(null);
    }
  };

  const executeCode = useCallback(async () => {
    setIsRunning(true);
    setOutput([]);
    setTasks([]);
    abortControllerRef.current = new AbortController();

    const results: ExecutionResult[] = [];
    const timestamp = Date.now();
    const taskQueue: TaskDefinition[] = [];

    const addOutput = (result: ExecutionResult) => {
      results.push(result);
      setOutput([...results]);
    };

    // Custom console
    const customConsole = {
      log: (...args: unknown[]) => {
        addOutput({
          type: "log",
          content: args.map(arg => 
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" "),
          timestamp: Date.now() - timestamp
        });
      },
      error: (...args: unknown[]) => {
        addOutput({
          type: "error",
          content: args.map(arg => String(arg)).join(" "),
          timestamp: Date.now() - timestamp
        });
      },
      warn: (...args: unknown[]) => {
        addOutput({
          type: "warn",
          content: args.map(arg => String(arg)).join(" "),
          timestamp: Date.now() - timestamp
        });
      },
      info: (...args: unknown[]) => {
        addOutput({
          type: "info",
          content: args.map(arg => String(arg)).join(" "),
          timestamp: Date.now() - timestamp
        });
      }
    };

    // Task runner API
    const task = async (name: string, fn: () => Promise<unknown> | unknown) => {
      const taskDef: TaskDefinition = { name, fn, status: "pending" };
      taskQueue.push(taskDef);
      setTasks([...taskQueue]);

      addOutput({
        type: "task",
        content: `⏳ Task "${name}" started...`,
        timestamp: Date.now() - timestamp
      });

      try {
        taskDef.status = "running";
        setTasks([...taskQueue]);
        
        const result = await fn();
        
        taskDef.status = "completed";
        setTasks([...taskQueue]);
        
        addOutput({
          type: "task",
          content: `✅ Task "${name}" completed${result !== undefined ? `: ${JSON.stringify(result)}` : ""}`,
          timestamp: Date.now() - timestamp
        });
        
        return result;
      } catch (error) {
        taskDef.status = "failed";
        setTasks([...taskQueue]);
        
        addOutput({
          type: "error",
          content: `❌ Task "${name}" failed: ${error}`,
          timestamp: Date.now() - timestamp
        });
        
        throw error;
      }
    };

    // Script reader API
    const readScript = async (name: string): Promise<string | null> => {
      const hasPermission = await requestPermission("file-read", `Reading script: "${name}"`);
      if (!hasPermission) {
        throw new Error("Permission denied: file-read");
      }

      const stored = localStorage.getItem("code-sandbox-scripts");
      if (!stored) return null;
      
      const scripts: Script[] = JSON.parse(stored);
      const script = scripts.find(s => s.name.toLowerCase() === name.toLowerCase());
      
      if (script) {
        addOutput({
          type: "info",
          content: `📄 Loaded script: "${script.name}"`,
          timestamp: Date.now() - timestamp
        });
        return script.code;
      }
      
      return null;
    };

    // Secure fetch wrapper
    const secureFetch = async (url: string, options?: RequestInit) => {
      const hasPermission = await requestPermission("network", `Fetching: ${url}`);
      if (!hasPermission) {
        throw new Error("Permission denied: network");
      }

      addOutput({
        type: "info",
        content: `🌐 Fetching: ${url}`,
        timestamp: Date.now() - timestamp
      });

      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current?.signal
      });

      return response;
    };

    // Secure storage API
    const secureStorage = {
      get: async (key: string) => {
        const hasPermission = await requestPermission("storage", `Reading storage key: "${key}"`);
        if (!hasPermission) {
          throw new Error("Permission denied: storage");
        }
        return localStorage.getItem(`sandbox-${key}`);
      },
      set: async (key: string, value: string) => {
        const hasPermission = await requestPermission("storage", `Writing storage key: "${key}"`);
        if (!hasPermission) {
          throw new Error("Permission denied: storage");
        }
        localStorage.setItem(`sandbox-${key}`, value);
        return true;
      },
      remove: async (key: string) => {
        const hasPermission = await requestPermission("storage", `Removing storage key: "${key}"`);
        if (!hasPermission) {
          throw new Error("Permission denied: storage");
        }
        localStorage.removeItem(`sandbox-${key}`);
        return true;
      }
    };

    // Timer wrappers
    const secureSetTimeout = async (fn: () => void, ms: number) => {
      const hasPermission = await requestPermission("timer", `setTimeout: ${ms}ms`);
      if (!hasPermission) {
        throw new Error("Permission denied: timer");
      }
      return setTimeout(fn, ms);
    };

    const secureSetInterval = async (fn: () => void, ms: number) => {
      const hasPermission = await requestPermission("timer", `setInterval: ${ms}ms`);
      if (!hasPermission) {
        throw new Error("Permission denied: timer");
      }
      return setInterval(fn, ms);
    };

    try {
      const sandboxedCode = `
        (async function(console, task, readScript, fetch, storage, setTimeout, setInterval) {
          "use strict";
          ${code}
        })
      `;
      
      const fn = eval(sandboxedCode);
      const result = await fn(
        customConsole, 
        task, 
        readScript, 
        secureFetch, 
        secureStorage,
        secureSetTimeout,
        secureSetInterval
      );
      
      if (result !== undefined) {
        addOutput({
          type: "result",
          content: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result),
          timestamp: Date.now() - timestamp
        });
      }

      if (results.length === 0) {
        addOutput({
          type: "log",
          content: "Code executed successfully (no output)",
          timestamp: 0
        });
      }
    } catch (error) {
      addOutput({
        type: "error",
        content: error instanceof Error ? error.message : String(error),
        timestamp: Date.now() - timestamp
      });
    }

    setIsRunning(false);
  }, [code, requestPermission]);

  const stopExecution = () => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
    toast({ title: "Execution Stopped" });
  };

  const clearOutput = () => {
    setOutput([]);
    setTasks([]);
    setGrantedPermissions(new Set());
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard"
    });
  };

  const handleSaveScript = () => {
    const name = prompt("Enter script name:");
    if (!name) return;

    const stored = localStorage.getItem("code-sandbox-scripts");
    const scripts: Script[] = stored ? JSON.parse(stored) : [];
    
    const script: Script = {
      id: crypto.randomUUID(),
      name,
      code,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    scripts.push(script);
    localStorage.setItem("code-sandbox-scripts", JSON.stringify(scripts));
    toast({ title: "Script Saved", description: `"${name}" has been saved` });
  };

  const handleLoadScript = (script: Script) => {
    setCode(script.code);
    toast({ title: "Script Loaded", description: `"${script.name}" loaded into editor` });
  };

  const handleRunScript = (script: Script) => {
    setCode(script.code);
    setTimeout(() => executeCode(), 100);
  };

  const getOutputIcon = (type: ExecutionResult["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />;
      case "warn":
        return <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />;
      case "result":
        return <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />;
      case "info":
        return <Globe className="h-3 w-3 text-blue-500 flex-shrink-0" />;
      case "task":
        return <Timer className="h-3 w-3 text-purple-500 flex-shrink-0" />;
      default:
        return <span className="text-muted-foreground text-xs flex-shrink-0">›</span>;
    }
  };

  const getOutputClass = (type: ExecutionResult["type"]) => {
    switch (type) {
      case "error":
        return "text-destructive bg-destructive/10";
      case "warn":
        return "text-yellow-500 bg-yellow-500/10";
      case "result":
        return "text-primary bg-primary/10";
      case "info":
        return "text-blue-500 bg-blue-500/10";
      case "task":
        return "text-purple-500 bg-purple-500/10";
      default:
        return "text-foreground";
    }
  };

  return (
    <>
      <div className="rounded-xl border-2 border-primary/30 bg-card/95 backdrop-blur-sm overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Code Sandbox • {language.toUpperCase()}
            </span>
            {isRunning && (
              <span className="flex items-center gap-1 text-xs text-primary animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScriptManager(true)}
              className="h-8 text-xs"
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              Scripts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveScript}
              className="h-8 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs"
            >
              {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOutput}
              className="h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            {isRunning ? (
              <Button
                onClick={stopExecution}
                size="sm"
                variant="destructive"
                className="h-8"
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={executeCode}
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90"
              >
                <Play className="h-3 w-3 mr-1" />
                Run
              </Button>
            )}
          </div>
        </div>

        {/* Granted Permissions Bar */}
        {grantedPermissions.size > 0 && (
          <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-green-500 font-medium">Granted:</span>
            {Array.from(grantedPermissions).map(perm => (
              <span key={perm} className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                {perm}
              </span>
            ))}
          </div>
        )}

        {/* Tasks Progress */}
        {tasks.length > 0 && (
          <div className="px-4 py-2 bg-purple-500/10 border-b border-purple-500/20">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-purple-400 font-medium">Tasks:</span>
              {tasks.map((t, i) => (
                <span 
                  key={i} 
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === "completed" ? "bg-green-500/20 text-green-400" :
                    t.status === "failed" ? "bg-destructive/20 text-destructive" :
                    t.status === "running" ? "bg-primary/20 text-primary animate-pulse" :
                    "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Code Editor */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-muted/20 flex flex-col items-end pr-2 py-3 text-xs text-muted-foreground font-mono select-none border-r border-border/30">
            {code.split("\n").map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full min-h-[200px] bg-transparent p-3 pl-12 font-mono text-sm text-foreground resize-none focus:outline-none leading-6"
            spellCheck={false}
            placeholder="Write your code here..."
          />
        </div>

        {/* Output Console */}
        {output.length > 0 && (
          <div className="border-t border-border/50 bg-muted/10">
            <div className="px-4 py-2 border-b border-border/30 bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Console Output
              </span>
            </div>
            <div className="max-h-64 overflow-auto p-3 space-y-1">
              {output.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded text-sm font-mono ${getOutputClass(item.type)}`}
                >
                  {getOutputIcon(item.type)}
                  <pre className="flex-1 whitespace-pre-wrap break-all text-xs">
                    {item.content}
                  </pre>
                  <span className="text-xs text-muted-foreground/50 flex-shrink-0">
                    {item.timestamp}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Permission Dialog */}
      <PermissionDialog
        open={pendingPermission !== null}
        onOpenChange={() => handlePermissionResponse(false)}
        permission={pendingPermission?.type || "network"}
        details={pendingPermission?.details}
        onAllow={() => handlePermissionResponse(true)}
        onDeny={() => handlePermissionResponse(false)}
      />

      {/* Script Manager */}
      <ScriptManager
        open={showScriptManager}
        onOpenChange={setShowScriptManager}
        onRunScript={handleRunScript}
        onLoadScript={handleLoadScript}
      />
    </>
  );
};
