import { useState } from "react";
import { Smartphone, Copy, Check, ExternalLink, ChevronRight, Package, Terminal, Loader2 } from "lucide-react";
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

interface APKBuildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructions: string[];
}

export const APKBuildDialog = ({ open, onOpenChange, instructions }: APKBuildDialogProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const commands = [
    { step: 2, command: "git clone <your-repo-url>" },
    { step: 3, command: "npm install" },
    { step: 4, command: "npx cap add android" },
    { step: 5, command: "npm run build" },
    { step: 6, command: "npx cap sync android" },
    { step: 7, command: "npx cap open android" },
  ];

  const copyCommand = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    toast({ title: "Copied!", description: "Command copied to clipboard" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStepComplete = (stepIndex: number) => {
    if (stepIndex === currentStep) {
      setCurrentStep(prev => Math.min(prev + 1, instructions.length - 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-ai flex items-center justify-center shadow-lg">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Build Android APK</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Follow these steps to convert your app to an Android APK
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-4">
            {/* Prerequisites */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Prerequisites
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Android Studio installed</li>
                <li>• Node.js and npm installed</li>
                <li>• Git installed</li>
              </ul>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {instructions.map((instruction, index) => {
                const command = commands.find(c => c.step === index + 1);
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all ${
                      isCompleted 
                        ? "bg-green-500/10 border-green-500/30" 
                        : isCurrent 
                          ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20" 
                          : "bg-muted/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isCurrent 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCompleted ? "text-green-600 dark:text-green-400" : ""}`}>
                          {instruction.replace(/^\d+\.\s*/, "")}
                        </p>
                        
                        {command && (
                          <div className="mt-2 flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-background rounded-lg text-xs font-mono border border-border/50 overflow-x-auto">
                              <Terminal className="h-3 w-3 inline mr-2 text-muted-foreground" />
                              {command.command}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCommand(command.command, index)}
                              className="flex-shrink-0 h-8 w-8 p-0"
                            >
                              {copiedIndex === index ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        )}

                        {isCurrent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStepComplete(index)}
                            className="mt-3 text-xs"
                          >
                            Mark as Complete
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final output location */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                APK Output Location
              </h4>
              <code className="text-xs bg-background px-3 py-2 rounded-lg block font-mono border border-border/50">
                android/app/build/outputs/apk/debug/app-debug.apk
              </code>
            </div>

            {/* Help link */}
            <a
              href="https://docs.lovable.dev/tips-tricks/mobile-development"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Read the full mobile development guide
            </a>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 bg-muted/20">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
