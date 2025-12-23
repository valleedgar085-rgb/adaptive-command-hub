import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-sql";
import { Copy, Check, Download, Database, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface SQLCodeViewerProps {
  sql: string;
  showLineNumbers?: boolean;
  onExecute?: (sql: string) => void;
  className?: string;
}

export function SQLCodeViewer({ 
  sql, 
  showLineNumbers = true,
  onExecute,
  className = ""
}: SQLCodeViewerProps) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (codeRef.current && sql) {
      Prism.highlightElement(codeRef.current);
    }
  }, [sql]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "SQL copied to clipboard" });
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "SQL file saved" });
  };

  const lines = sql.split("\n");

  if (!sql) {
    return (
      <div className={`h-full flex flex-col items-center justify-center text-center p-8 space-y-4 ${className}`}>
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-sql-accent/20 flex items-center justify-center">
          <Database className="h-10 w-10 text-primary/60" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">No SQL Generated</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add tables and click "Generate SQL" to create your schema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col overflow-hidden rounded-xl border-2 border-border/50 bg-[hsl(var(--sql-bg))] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 via-muted/30 to-sql-accent/10 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70 hover:bg-destructive transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-sql-keyword" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              SQL Schema
            </span>
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">
              {lines.length} lines
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onExecute && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExecute(sql)}
              className="h-8 gap-2 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            >
              <Play className="h-3.5 w-3.5" />
              Execute
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 gap-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            .sql
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={`h-8 gap-2 text-xs transition-all ${copied ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : ""}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Code Content with Syntax Highlighting */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="relative">
          {showLineNumbers && (
            <div 
              className="absolute left-0 top-0 w-14 bg-muted/5 flex flex-col items-end pr-4 py-4 text-xs text-muted-foreground/40 font-mono select-none border-r border-border/20"
              aria-hidden="true"
            >
              {lines.map((_, i) => (
                <div key={i} className="leading-6 h-6">{i + 1}</div>
              ))}
            </div>
          )}
          <pre className={`p-4 ${showLineNumbers ? "pl-16" : "pl-4"} overflow-x-auto`}>
            <code
              ref={codeRef}
              className="language-sql text-sm font-mono leading-6 sql-highlighted"
            >
              {sql}
            </code>
          </pre>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="shrink-0 h-1 bg-gradient-to-r from-sql-keyword/50 via-sql-string/50 to-sql-function/50" />
    </div>
  );
}
