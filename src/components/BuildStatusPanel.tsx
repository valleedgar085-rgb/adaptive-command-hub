import { useState, useEffect } from "react";
import { 
  Activity, CheckCircle2, Clock, AlertCircle, Loader2, 
  FileCode, Package, Cpu, Database, Shield, Rocket,
  ChevronDown, ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BuildStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "error";
  duration?: number;
  details?: string;
  icon: React.ReactNode;
}

interface BuildStatusPanelProps {
  isBuilding: boolean;
  buildType?: string;
  className?: string;
}

export const BuildStatusPanel = ({ isBuilding, buildType = "project", className }: BuildStatusPanelProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [steps, setSteps] = useState<BuildStep[]>([
    { id: "analyze", name: "Analyzing Code", status: "pending", icon: <FileCode className="h-4 w-4" />, details: "Scanning project structure and dependencies..." },
    { id: "deps", name: "Resolving Dependencies", status: "pending", icon: <Package className="h-4 w-4" />, details: "Installing and linking node modules..." },
    { id: "compile", name: "Compiling TypeScript", status: "pending", icon: <Cpu className="h-4 w-4" />, details: "Type-checking and transpiling source files..." },
    { id: "bundle", name: "Bundling Assets", status: "pending", icon: <Database className="h-4 w-4" />, details: "Optimizing and bundling JavaScript, CSS, and assets..." },
    { id: "optimize", name: "Optimizing Build", status: "pending", icon: <Shield className="h-4 w-4" />, details: "Tree-shaking, minification, and code splitting..." },
    { id: "finalize", name: "Finalizing", status: "pending", icon: <Rocket className="h-4 w-4" />, details: "Generating output files and source maps..." },
  ]);

  // Simulate build progress
  useEffect(() => {
    if (!isBuilding) {
      setCurrentStepIndex(0);
      setElapsedTime(0);
      setSteps(prev => prev.map(s => ({ ...s, status: "pending", duration: undefined })));
      return;
    }

    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= steps.length) {
          clearInterval(stepInterval);
          return prev;
        }
        
        // Update step statuses
        setSteps(current => current.map((step, i) => {
          if (i < prev) return { ...step, status: "completed" as const, duration: Math.random() * 2 + 0.5 };
          if (i === prev) return { ...step, status: "running" as const };
          return step;
        }));
        
        return prev + 1;
      });
    }, 1500);

    // Elapsed time counter
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timeInterval);
    };
  }, [isBuilding, steps.length]);

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = (completedSteps / steps.length) * 100;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getStatusIcon = (status: BuildStep["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "running": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!isBuilding && completedSteps === 0) return null;

  return (
    <div className={cn(
      "rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isBuilding ? "bg-primary/20" : completedSteps === steps.length ? "bg-green-500/20" : "bg-muted"
          )}>
            {isBuilding ? (
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            ) : completedSteps === steps.length ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {isBuilding ? `Building ${buildType}...` : completedSteps === steps.length ? "Build Complete" : "Build Status"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {completedSteps}/{steps.length} steps • {formatTime(elapsedTime)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted/50">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {isBuilding && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="p-4 space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="overflow-hidden">
            <button
              onClick={() => toggleStep(step.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                step.status === "running" && "bg-primary/10 border border-primary/30",
                step.status === "completed" && "bg-green-500/5",
                step.status === "pending" && "opacity-50"
              )}
            >
              {expandedSteps.has(step.id) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                step.status === "completed" && "bg-green-500/20 text-green-500",
                step.status === "running" && "bg-primary/20 text-primary",
                step.status === "pending" && "bg-muted text-muted-foreground"
              )}>
                {step.icon}
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "text-sm font-medium",
                  step.status === "completed" && "text-green-600 dark:text-green-400"
                )}>
                  {step.name}
                </p>
                {step.duration && (
                  <p className="text-xs text-muted-foreground">{step.duration.toFixed(1)}s</p>
                )}
              </div>
              {getStatusIcon(step.status)}
            </button>
            
            {expandedSteps.has(step.id) && step.details && (
              <div className="ml-12 mt-1 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground border-l-2 border-primary/30">
                {step.details}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
