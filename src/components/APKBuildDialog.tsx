import { useState, useEffect } from "react";
import { 
  Smartphone, Copy, Check, ExternalLink, ChevronRight, Package, 
  Terminal, Loader2, Lightbulb, AlertCircle, Rocket, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useBuildProgress } from "@/hooks/useBuildProgress";
import { APKInstruction } from "@/hooks/useAPKBuilder";
import { cn } from "@/lib/utils";

interface APKBuildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructions: APKInstruction[];
}

export const APKBuildDialog = ({ open, onOpenChange, instructions }: APKBuildDialogProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedTips, setExpandedTips] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { progress, startBuild, updateStep } = useBuildProgress();
  const currentStep = progress?.current_step || 0;

  useEffect(() => {
    if (open && !progress) {
      startBuild("apk", instructions.length);
    }
  }, [open, progress, startBuild, instructions.length]);

  const copyCommand = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    toast({ title: "Copied!", description: "Command copied to clipboard" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStepComplete = async (stepIndex: number) => {
    if (stepIndex === currentStep) {
      await updateStep(stepIndex + 1);
    }
  };

  const toggleTip = (index: number) => {
    setExpandedTips(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const progressPercentage = instructions.length > 0 
    ? Math.round((currentStep / instructions.length) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-ai flex items-center justify-center shadow-lg shadow-primary/20">
              <Smartphone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Build Android APK
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Complete guide to convert your web app to a native Android application
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{progressPercentage}%</div>
              <div className="text-xs text-muted-foreground">Progress</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 relative h-2 rounded-full bg-muted/50 overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-4">
            {/* Prerequisites Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Prerequisites
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Android Studio", desc: "IDE for building" },
                  { name: "Node.js v18+", desc: "Runtime environment" },
                  { name: "Git", desc: "Version control" }
                ].map((prereq, i) => (
                  <div key={i} className="p-3 rounded-xl bg-background/50 border border-border/30">
                    <div className="text-sm font-medium">{prereq.name}</div>
                    <div className="text-xs text-muted-foreground">{prereq.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {instructions.map((instruction, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const hasTip = !!instruction.tip;

                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-300",
                      isCompleted && "bg-green-500/5 border-green-500/30",
                      isCurrent && "bg-primary/5 border-primary/30 ring-2 ring-primary/20 shadow-lg shadow-primary/5",
                      !isCompleted && !isCurrent && "bg-muted/20 border-border/30 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Number */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold transition-all",
                        isCompleted && "bg-green-500 text-white shadow-lg shadow-green-500/30",
                        isCurrent && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                        !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Step Title */}
                        <div>
                          <h5 className={cn(
                            "font-semibold text-base",
                            isCompleted && "text-green-600 dark:text-green-400"
                          )}>
                            {instruction.step}
                          </h5>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {instruction.details}
                          </p>
                        </div>

                        {/* Command Block */}
                        {instruction.command && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(240_25%_8%)] border border-primary/20">
                            <Terminal className="h-4 w-4 text-primary flex-shrink-0" />
                            <code className="flex-1 text-sm font-mono text-primary/90 overflow-x-auto">
                              {instruction.command}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCommand(instruction.command!, index)}
                              className="flex-shrink-0 h-8 w-8 p-0 hover:bg-primary/20"
                            >
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Tip */}
                        {hasTip && (
                          <button
                            onClick={() => toggleTip(index)}
                            className="flex items-start gap-2 text-left w-full"
                          >
                            <div className={cn(
                              "flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all",
                              expandedTips.has(index) 
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                : "text-muted-foreground hover:bg-muted/50"
                            )}>
                              <Lightbulb className="h-3.5 w-3.5" />
                              <span className={expandedTips.has(index) ? "" : "line-clamp-1"}>
                                {instruction.tip}
                              </span>
                            </div>
                          </button>
                        )}

                        {/* Mark Complete Button */}
                        {isCurrent && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStepComplete(index)}
                            className="mt-2"
                          >
                            Mark as Complete
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Success Card */}
            {currentStep >= instructions.length && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400">Build Complete!</h4>
                    <p className="text-sm text-muted-foreground">Your APK is ready to install on Android devices</p>
                  </div>
                </div>
              </div>
            )}

            {/* Output Location */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Package className="h-5 w-5" />
                APK Output Location
              </h4>
              <code className="text-sm bg-background px-4 py-3 rounded-xl block font-mono border border-border/50">
                android/app/build/outputs/apk/debug/app-debug.apk
              </code>
            </div>

            {/* Help Link */}
            <a
              href="https://docs.lovable.dev/tips-tricks/mobile-development"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30"
            >
              <Info className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Read the full mobile development guide</span>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-muted/20">
          <Button onClick={() => onOpenChange(false)} className="w-full" size="lg">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
