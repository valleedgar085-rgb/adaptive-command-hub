import { useEffect } from "react";
import { Check, Circle, Loader2, X, RotateCcw, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBuildProgress } from "@/hooks/useBuildProgress";

interface BuildProgressTrackerProps {
  onStepChange?: (step: number) => void;
  showControls?: boolean;
}

export const BuildProgressTracker = ({ 
  onStepChange,
  showControls = true 
}: BuildProgressTrackerProps) => {
  const {
    progress,
    isLoading,
    updateStep,
    completeBuild,
    cancelBuild,
    resetBuild,
  } = useBuildProgress();

  useEffect(() => {
    if (progress && onStepChange) {
      onStepChange(progress.current_step);
    }
  }, [progress, onStepChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const percentage = (progress.current_step / progress.total_steps) * 100;
  const isComplete = progress.status === "completed";
  const isCancelled = progress.status === "cancelled";

  return (
    <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          ) : isCancelled ? (
            <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">
              {isComplete ? "Build Complete" : isCancelled ? "Build Cancelled" : "Build In Progress"}
            </p>
            <p className="text-xs text-muted-foreground">
              Step {progress.current_step} of {progress.total_steps}
            </p>
          </div>
        </div>

        {showControls && !isComplete && !isCancelled && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetBuild}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelBuild}
              className="h-8 text-xs text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(percentage)}% complete</span>
          <span>
            Started {new Date(progress.started_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between mt-4">
        {Array.from({ length: progress.total_steps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum <= progress.current_step;
          const isCurrent = stepNum === progress.current_step + 1;

          return (
            <button
              key={i}
              onClick={() => !isComplete && !isCancelled && updateStep(stepNum)}
              disabled={isComplete || isCancelled}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
              } ${!isComplete && !isCancelled ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-[10px] font-bold">{stepNum}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
