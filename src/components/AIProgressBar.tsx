import { useState, useEffect } from "react";
import { Brain, Sparkles, Cpu, Zap, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIProgressBarProps {
  isActive: boolean;
  stage?: "thinking" | "analyzing" | "generating" | "complete";
  estimatedTime?: number;
}

const stages = [
  { id: "thinking", label: "Thinking...", icon: Brain, progress: 25 },
  { id: "analyzing", label: "Analyzing context...", icon: Cpu, progress: 50 },
  { id: "generating", label: "Generating response...", icon: Zap, progress: 75 },
  { id: "complete", label: "Complete", icon: CheckCircle2, progress: 100 }
];

export const AIProgressBar = ({ isActive, stage = "thinking", estimatedTime = 5 }: AIProgressBarProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setCurrentStage(0);
      setElapsedTime(0);
      return;
    }

    const stageIndex = stages.findIndex(s => s.id === stage);
    if (stageIndex >= 0) {
      setCurrentStage(stageIndex);
    }

    // Smooth progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const targetProgress = stages[stageIndex]?.progress || 0;
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 1) return targetProgress;
        return prev + (diff * 0.1);
      });
    }, 50);

    // Time counter
    const timeInterval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, [isActive, stage]);

  if (!isActive) return null;

  const CurrentIcon = stages[currentStage]?.icon || Brain;
  const currentLabel = stages[currentStage]?.label || "Processing...";

  return (
    <div className="w-full space-y-3 animate-fade-in">
      {/* Stage Indicators */}
      <div className="flex items-center justify-between px-1">
        {stages.slice(0, -1).map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx <= currentStage;
          const isCurrent = idx === currentStage;
          
          return (
            <div 
              key={s.id}
              className={`flex items-center gap-2 transition-all duration-500 ${
                isActive ? "opacity-100" : "opacity-30"
              }`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                ${isCurrent 
                  ? "bg-[hsl(217,91%,60%)] shadow-lg shadow-[hsl(217,91%,60%)]/30 scale-110" 
                  : isActive 
                    ? "bg-[hsl(217,91%,50%)]/30" 
                    : "bg-muted/30"
                }
              `}>
                <Icon className={`h-4 w-4 ${isCurrent ? "text-white animate-pulse" : isActive ? "text-[hsl(217,91%,60%)]" : "text-muted-foreground"}`} />
              </div>
              {idx < stages.length - 2 && (
                <div className={`w-8 sm:w-16 h-0.5 transition-all duration-500 ${
                  idx < currentStage ? "bg-[hsl(217,91%,60%)]" : "bg-muted/30"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={progress} 
          className="h-2 bg-muted/30"
        />
        <div 
          className="absolute inset-0 h-2 rounded-full overflow-hidden"
          style={{
            background: `linear-gradient(90deg, 
              hsl(217, 91%, 60%) 0%, 
              hsl(217, 91%, 70%) ${progress}%, 
              transparent ${progress}%
            )`,
            boxShadow: "0 0 20px hsl(217, 91%, 60%, 0.3)"
          }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <CurrentIcon className="h-4 w-4 text-[hsl(217,91%,60%)]" />
            <div className="absolute inset-0 animate-ping">
              <CurrentIcon className="h-4 w-4 text-[hsl(217,91%,60%)] opacity-50" />
            </div>
          </div>
          <span className="text-[hsl(217,91%,70%)] font-medium">{currentLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>{elapsedTime.toFixed(1)}s</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
