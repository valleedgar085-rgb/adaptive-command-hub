import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  Terminal,
  Clock,
  Copy,
  Check,
  RotateCcw,
  FileCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScriptCommand {
  id: string;
  command: string;
  description: string;
  type: "shell" | "info" | "action";
}

interface CommandExecution {
  id: string;
  command: string;
  status: "pending" | "running" | "success" | "error" | "skipped";
  output?: string;
  duration?: number;
  startTime?: number;
}

interface ScriptExecutorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scriptName: string;
  commands: ScriptCommand[];
}

export const ScriptExecutor = ({
  open,
  onOpenChange,
  scriptName,
  commands
}: ScriptExecutorProps) => {
  const [executions, setExecutions] = useState<CommandExecution[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeExecutions = useCallback(() => {
    setExecutions(commands.map(cmd => ({
      id: cmd.id,
      command: cmd.command,
      status: "pending"
    })));
    setCurrentIndex(-1);
    setIsRunning(false);
    setIsPaused(false);
  }, [commands]);

  const simulateExecution = async (command: ScriptCommand, index: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      setExecutions(prev => prev.map((exec, i) => 
        i === index 
          ? { ...exec, status: "running", startTime }
          : exec
      ));

      // Simulate execution time based on command type
      const delay = command.type === "shell" 
        ? 1500 + Math.random() * 2000 
        : command.type === "action" 
        ? 3000 + Math.random() * 2000
        : 500;

      setTimeout(() => {
        const duration = Date.now() - startTime;
        const isSuccess = Math.random() > 0.1; // 90% success rate for demo
        
        let output = "";
        if (command.type === "shell") {
          output = isSuccess 
            ? `✓ Command executed successfully\n  ${command.description}`
            : `✗ Command failed: Permission denied or resource not found`;
        } else if (command.type === "action") {
          output = `⚡ Action completed: ${command.description}`;
        } else {
          output = `ℹ ${command.description}`;
        }

        setExecutions(prev => prev.map((exec, i) => 
          i === index 
            ? { 
                ...exec, 
                status: isSuccess ? "success" : "error",
                output,
                duration
              }
            : exec
        ));

        resolve();
      }, delay);
    });
  };

  const runScript = async () => {
    if (executions.length === 0) {
      initializeExecutions();
    }

    setIsRunning(true);
    setIsPaused(false);

    for (let i = currentIndex + 1; i < commands.length; i++) {
      if (isPaused) break;
      
      setCurrentIndex(i);
      await simulateExecution(commands[i], i);

      // Check if execution failed and stop
      const execution = executions[i];
      if (execution?.status === "error") {
        toast({
          title: "Script execution stopped",
          description: `Error at step ${i + 1}: ${commands[i].command}`,
          variant: "destructive"
        });
        break;
      }
    }

    setIsRunning(false);
  };

  const pauseScript = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const stopScript = () => {
    setIsRunning(false);
    setIsPaused(false);
    
    // Mark remaining as skipped
    setExecutions(prev => prev.map((exec, i) => 
      i > currentIndex && exec.status === "pending"
        ? { ...exec, status: "skipped" }
        : exec
    ));
  };

  const resetScript = () => {
    initializeExecutions();
  };

  const copyCommand = async (command: string, id: string) => {
    await navigator.clipboard.writeText(command);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Command copied" });
  };

  const completedCount = executions.filter(e => e.status === "success").length;
  const errorCount = executions.filter(e => e.status === "error").length;
  const progress = commands.length > 0 
    ? ((completedCount + errorCount) / commands.length) * 100 
    : 0;

  const getStatusIcon = (status: CommandExecution["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "skipped":
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-border" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <FileCode className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{scriptName}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {commands.length} commands
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                  {completedCount} completed
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                  {errorCount} failed
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Commands List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {commands.map((command, index) => {
              const execution = executions[index];
              const isActive = index === currentIndex && isRunning;
              
              return (
                <div
                  key={command.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-300",
                    isActive 
                      ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                      : execution?.status === "success"
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : execution?.status === "error"
                      ? "bg-destructive/5 border-destructive/20"
                      : "bg-card border-border/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="mt-0.5">
                      {getStatusIcon(execution?.status || "pending")}
                    </div>
                    
                    {/* Command Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          Step {index + 1}
                        </span>
                        <Badge variant="outline" className="h-4 text-[10px] capitalize">
                          {command.type}
                        </Badge>
                        {execution?.duration && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                            <Clock className="h-3 w-3" />
                            {(execution.duration / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                      
                      <code className="text-sm font-mono text-foreground block truncate">
                        {command.command}
                      </code>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {command.description}
                      </p>
                      
                      {/* Execution Output */}
                      {execution?.output && (
                        <pre className="mt-2 p-2 rounded bg-muted/50 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                          {execution.output}
                        </pre>
                      )}
                    </div>

                    {/* Copy Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => copyCommand(command.command, command.id)}
                    >
                      {copied === command.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-border/50 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={resetScript}
            disabled={isRunning}
            className="h-9"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
          
          <div className="flex-1" />
          
          {isRunning ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={pauseScript}
                className="h-9"
              >
                <Pause className="h-4 w-4 mr-1.5" />
                Pause
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={stopScript}
                className="h-9"
              >
                <Square className="h-4 w-4 mr-1.5" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={runScript}
              className="h-9 bg-gradient-to-r from-primary to-primary/80"
            >
              <Play className="h-4 w-4 mr-1.5" />
              {executions.length > 0 && currentIndex >= 0 ? "Resume" : "Run Script"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
