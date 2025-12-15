import { useState, useEffect } from "react";
import { Eye, EyeOff, Maximize2, Minimize2, RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProjectPreviewBarProps {
  url?: string;
  isLoading?: boolean;
  loadingProgress?: number;
  className?: string;
}

export const ProjectPreviewBar = ({
  url = "about:blank",
  isLoading = false,
  loadingProgress = 0,
  className
}: ProjectPreviewBarProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setProgress(0);
    setTimeout(() => {
      setProgress(100);
      setIsRefreshing(false);
    }, 1500);
  };

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px"
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm border border-border/50"
      >
        <Eye className="h-4 w-4 mr-2" />
        Show Preview
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl overflow-hidden border border-border/50 bg-background shadow-2xl transition-all duration-500",
        isFullscreen && "fixed inset-4 z-50",
        className
      )}
    >
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          
          {/* URL Bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/30 min-w-[200px]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
              {url}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {/* Device Toggle */}
          <div className="flex items-center gap-1 mr-2 p-1 rounded-lg bg-muted/50">
            <Button
              variant={deviceMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDeviceMode("mobile")}
              className="h-7 w-7 p-0"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={deviceMode === "tablet" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDeviceMode("tablet")}
              className="h-7 w-7 p-0"
            >
              <Tablet className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={deviceMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDeviceMode("desktop")}
              className="h-7 w-7 p-0"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, "_blank")}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading Progress Bar */}
      <div className="relative h-1 bg-muted/30">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        {(isLoading || isRefreshing) && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>

      {/* Preview Frame */}
      <div className="flex-1 flex items-center justify-center bg-muted/10 p-4 min-h-[400px]">
        <div
          className="relative w-full h-full rounded-lg overflow-hidden border border-border/30 bg-background transition-all duration-500 shadow-inner"
          style={{
            maxWidth: deviceWidths[deviceMode],
            aspectRatio: deviceMode === "mobile" ? "9/16" : deviceMode === "tablet" ? "4/3" : "16/9"
          }}
        >
          {(isLoading || isRefreshing) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Loading preview...</p>
            </div>
          ) : (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title="Project Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isLoading || isRefreshing ? "bg-yellow-500 animate-pulse" : "bg-green-500"
          )} />
          <span>{isLoading || isRefreshing ? "Loading..." : "Ready"}</span>
        </div>
        <span className="capitalize">{deviceMode} View</span>
      </div>
    </div>
  );
};
