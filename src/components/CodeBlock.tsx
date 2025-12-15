import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import { Copy, Check, Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  onRunCode?: (code: string) => void;
}

export const CodeBlock = ({ 
  code, 
  language = "javascript", 
  showLineNumbers = true,
  onRunCode 
}: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Normalize language name
  const normalizedLang = language.toLowerCase().replace(/^(js|javascript)$/, "javascript")
    .replace(/^(ts|typescript)$/, "typescript")
    .replace(/^(py|python)$/, "python")
    .replace(/^(sh|shell|bash)$/, "bash");

  const isExecutable = ["javascript", "typescript", "js", "ts"].includes(normalizedLang);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, normalizedLang]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard"
    });
  };

  const lines = code.split("\n");

  return (
    <div className="relative group rounded-xl overflow-hidden border-2 border-primary/20 bg-[hsl(240_25%_8%)] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70 hover:bg-destructive transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {normalizedLang}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isExecutable && onRunCode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRunCode(code)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
            >
              <Play className="h-3 w-3 mr-1" />
              Run
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative overflow-x-auto">
        {showLineNumbers && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/10 flex flex-col items-end pr-3 py-4 text-xs text-muted-foreground/50 font-mono select-none border-r border-border/20">
            {lines.map((_, i) => (
              <div key={i} className="leading-6 h-6">{i + 1}</div>
            ))}
          </div>
        )}
        <pre className={`p-4 ${showLineNumbers ? "pl-14" : "pl-4"} overflow-x-auto`}>
          <code
            ref={codeRef}
            className={`language-${normalizedLang} text-sm font-mono leading-6`}
          >
            {code}
          </code>
        </pre>
      </div>

      {/* Footer indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50" />
    </div>
  );
};
