import { useState, useCallback, useMemo } from "react";
import { 
  Copy, 
  Check, 
  Play, 
  Download, 
  Maximize2, 
  Minimize2,
  FileCode,
  Braces,
  FileText,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-python";
import { cn } from "@/lib/utils";

interface EnhancedCodeOutputProps {
  code: string;
  language: string;
  filename?: string;
  onRunCode?: (code: string) => void;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

const LANGUAGE_ICONS: Record<string, typeof FileCode> = {
  typescript: Braces,
  javascript: Braces,
  tsx: Braces,
  jsx: Braces,
  css: FileText,
  json: FileCode,
  sql: FileCode,
  python: FileCode,
  bash: FileCode,
};

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "text-blue-400",
  javascript: "text-yellow-400",
  tsx: "text-blue-400",
  jsx: "text-yellow-400",
  css: "text-pink-400",
  json: "text-green-400",
  sql: "text-cyan-400",
  python: "text-green-400",
  bash: "text-gray-400",
};

export const EnhancedCodeOutput = ({
  code,
  language,
  filename,
  onRunCode,
  showLineNumbers = true,
  maxHeight = "400px"
}: EnhancedCodeOutputProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "raw">("code");
  const { toast } = useToast();

  const normalizedLanguage = useMemo(() => {
    const langMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      py: "python",
      sh: "bash",
      shell: "bash",
    };
    return langMap[language.toLowerCase()] || language.toLowerCase();
  }, [language]);

  const highlightedCode = useMemo(() => {
    const grammar = Prism.languages[normalizedLanguage] || Prism.languages.javascript;
    return Prism.highlight(code, grammar, normalizedLanguage);
  }, [code, normalizedLanguage]);

  const lines = code.split("\n");
  const lineCount = lines.length;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Code copied to clipboard" });
  }, [code, toast]);

  const handleDownload = useCallback(() => {
    const extension = normalizedLanguage === "typescript" ? "ts" 
      : normalizedLanguage === "javascript" ? "js"
      : normalizedLanguage === "python" ? "py"
      : normalizedLanguage;
    
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "File downloaded" });
  }, [code, normalizedLanguage, filename, toast]);

  const IconComponent = LANGUAGE_ICONS[normalizedLanguage] || FileCode;
  const colorClass = LANGUAGE_COLORS[normalizedLanguage] || "text-muted-foreground";

  const canRun = ["javascript", "typescript", "jsx", "tsx"].includes(normalizedLanguage);

  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden border-2 transition-all duration-300",
        "bg-[hsl(240,25%,6%)] border-border/50 hover:border-primary/30",
        "shadow-lg shadow-black/10"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-muted/50 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          <div className="w-px h-4 bg-border/50" />
          
          {/* Language Badge */}
          <div className="flex items-center gap-2">
            <IconComponent className={cn("h-4 w-4", colorClass)} />
            <span className={cn("text-xs font-semibold uppercase tracking-wider", colorClass)}>
              {normalizedLanguage}
            </span>
          </div>

          {filename && (
            <>
              <div className="w-px h-4 bg-border/50" />
              <span className="text-xs text-muted-foreground font-mono">
                {filename}
              </span>
            </>
          )}
          
          <Badge variant="outline" className="h-5 text-[10px] bg-background/50 text-muted-foreground border-border/50">
            {lineCount} lines
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {canRun && onRunCode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRunCode(code)}
              className="h-7 px-2.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 border border-emerald-500/30"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              "h-7 w-7 transition-colors",
              copied 
                ? "text-emerald-500 bg-emerald-500/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Tabs for Code/Raw view */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "code" | "raw")}>
        <div className="px-4 py-1.5 bg-muted/20 border-b border-border/30">
          <TabsList className="h-7 p-0.5 bg-background/50">
            <TabsTrigger value="code" className="h-6 px-3 text-xs">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Highlighted
            </TabsTrigger>
            <TabsTrigger value="raw" className="h-6 px-3 text-xs">
              <Zap className="h-3 w-3 mr-1.5" />
              Raw
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="code" className="m-0">
          <div 
            className="overflow-auto"
            style={{ maxHeight: isExpanded ? "none" : maxHeight }}
          >
            <div className="flex text-sm font-mono">
              {/* Line Numbers */}
              {showLineNumbers && (
                <div className="flex-shrink-0 select-none px-4 py-4 text-right bg-muted/10 border-r border-border/30">
                  {lines.map((_, i) => (
                    <div 
                      key={i} 
                      className="text-muted-foreground/40 text-xs leading-6 hover:text-muted-foreground transition-colors"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Code Content */}
              <pre className="flex-1 p-4 overflow-x-auto">
                <code 
                  className="text-foreground/90 leading-6"
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </pre>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="m-0">
          <div 
            className="overflow-auto p-4"
            style={{ maxHeight: isExpanded ? "none" : maxHeight }}
          >
            <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap break-words">
              {code}
            </pre>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer with Quick Actions */}
      <div className="px-4 py-2 bg-gradient-to-r from-muted/20 to-transparent border-t border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">Ctrl+C</kbd>
          <span>to copy</span>
        </div>
        
        {lineCount > 20 && !isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
          >
            Show all {lineCount} lines
          </Button>
        )}
      </div>
    </div>
  );
};
