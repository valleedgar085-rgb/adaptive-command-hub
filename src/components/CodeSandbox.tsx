import { useState, useCallback } from "react";
import { Play, Square, Trash2, AlertTriangle, CheckCircle2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CodeSandboxProps {
  initialCode?: string;
  language?: "javascript" | "typescript";
  onClose?: () => void;
}

interface ExecutionResult {
  type: "log" | "error" | "warn" | "result";
  content: string;
  timestamp: number;
}

export const CodeSandbox = ({ 
  initialCode = "// Write your JavaScript/TypeScript code here\nconsole.log('Hello, World!');", 
  language = "javascript",
  onClose 
}: CodeSandboxProps) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<ExecutionResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const executeCode = useCallback(() => {
    setIsRunning(true);
    setOutput([]);

    const results: ExecutionResult[] = [];
    const timestamp = Date.now();

    // Create custom console object to capture logs
    const customConsole = {
      log: (...args: unknown[]) => {
        results.push({
          type: "log",
          content: args.map(arg => 
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(" "),
          timestamp: Date.now() - timestamp
        });
      },
      error: (...args: unknown[]) => {
        results.push({
          type: "error",
          content: args.map(arg => String(arg)).join(" "),
          timestamp: Date.now() - timestamp
        });
      },
      warn: (...args: unknown[]) => {
        results.push({
          type: "warn",
          content: args.map(arg => String(arg)).join(" "),
          timestamp: Date.now() - timestamp
        });
      }
    };

    try {
      // Create a sandboxed function
      const sandboxedCode = `
        (function(console) {
          "use strict";
          ${code}
        })
      `;
      
      // Execute the code with custom console
      const fn = eval(sandboxedCode);
      const result = fn(customConsole);
      
      if (result !== undefined) {
        results.push({
          type: "result",
          content: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result),
          timestamp: Date.now() - timestamp
        });
      }

      if (results.length === 0) {
        results.push({
          type: "log",
          content: "Code executed successfully (no output)",
          timestamp: 0
        });
      }
    } catch (error) {
      results.push({
        type: "error",
        content: error instanceof Error ? error.message : String(error),
        timestamp: Date.now() - timestamp
      });
    }

    setOutput(results);
    setIsRunning(false);
  }, [code]);

  const clearOutput = () => {
    setOutput([]);
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

  const getOutputIcon = (type: ExecutionResult["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />;
      case "warn":
        return <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />;
      case "result":
        return <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />;
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
      default:
        return "text-foreground";
    }
  };

  return (
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
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            onClick={executeCode}
            disabled={isRunning}
            size="sm"
            className="h-8 bg-primary hover:bg-primary/90"
          >
            {isRunning ? (
              <Square className="h-3 w-3 mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

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
          <div className="max-h-48 overflow-auto p-3 space-y-1">
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
  );
};
