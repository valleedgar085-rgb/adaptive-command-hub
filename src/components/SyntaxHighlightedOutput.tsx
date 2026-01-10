import { useMemo } from "react";
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
import "prismjs/components/prism-java";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-csharp";
import { cn } from "@/lib/utils";

interface SyntaxHighlightedOutputProps {
  content: string;
  className?: string;
}

// Detect code blocks in terminal output and highlight them
export const SyntaxHighlightedOutput = ({ content, className }: SyntaxHighlightedOutputProps) => {
  const processedContent = useMemo(() => {
    // Patterns to detect code-like content
    const patterns = {
      // JSON detection
      json: /^\s*[\[{][\s\S]*[\]}]\s*$/,
      // Function/method patterns
      code: /(?:function|const|let|var|class|interface|type|import|export|def|async|await|return|if|else|for|while)\s/,
      // SQL patterns
      sql: /(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|FROM|WHERE|JOIN|TABLE|INDEX)\s/i,
      // Object/config patterns
      config: /^\s*\w+\s*[=:]\s*.+$/m,
    };

    // Check if content looks like code
    const looksLikeCode = (text: string): string | null => {
      if (patterns.json.test(text)) return "json";
      if (patterns.sql.test(text)) return "sql";
      if (patterns.code.test(text)) return "typescript";
      if (patterns.config.test(text) && text.includes(":")) return "json";
      return null;
    };

    // Split content by code blocks (```lang...```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts: { type: "text" | "code"; content: string; language?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push({ type: "text", content: textBefore });
      }
      
      // Add code block
      parts.push({
        type: "code",
        content: match[2],
        language: match[1] || "typescript"
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const remaining = content.slice(lastIndex);
      const detectedLang = looksLikeCode(remaining);
      
      if (detectedLang) {
        parts.push({ type: "code", content: remaining, language: detectedLang });
      } else {
        parts.push({ type: "text", content: remaining });
      }
    }

    // If no parts, check if entire content is code
    if (parts.length === 0) {
      const detectedLang = looksLikeCode(content);
      if (detectedLang) {
        parts.push({ type: "code", content, language: detectedLang });
      } else {
        parts.push({ type: "text", content });
      }
    }

    return parts;
  }, [content]);

  return (
    <div className={cn("font-mono text-xs", className)}>
      {processedContent.map((part, index) => {
        if (part.type === "code" && part.language) {
          const grammar = Prism.languages[part.language] || Prism.languages.javascript;
          const highlighted = Prism.highlight(part.content, grammar, part.language);
          
          return (
            <pre 
              key={index} 
              className="my-1 p-2 rounded-lg bg-muted/30 border border-border/30 overflow-x-auto"
            >
              <code 
                className="text-foreground/90 leading-5"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          );
        }
        
        // Process text for inline highlighting
        return (
          <span key={index} className="whitespace-pre-wrap">
            {highlightInlineCode(part.content)}
          </span>
        );
      })}
    </div>
  );
};

// Highlight inline code patterns like paths, commands, variables
function highlightInlineCode(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  
  // Patterns for inline highlighting
  const inlinePatterns = [
    { regex: /`([^`]+)`/g, className: "px-1 py-0.5 rounded bg-primary/20 text-primary font-semibold" },
    { regex: /\b(https?:\/\/[^\s]+)/g, className: "text-blue-400 underline" },
    { regex: /\b([a-z_][a-z0-9_]*\.(?:ts|tsx|js|jsx|json|sql|py|java|kt|swift|go|rs|cs))\b/gi, className: "text-emerald-400 font-medium" },
    { regex: /\[(\d+\/\d+)\]/g, className: "text-yellow-400" },
    { regex: /(✓|✗|⚡|📱|━+)/g, className: "text-primary" },
    { regex: /\b(Error|Warning|Success|Failed|Completed)\b/gi, className: (match: string) => {
      const lower = match.toLowerCase();
      if (lower === "error" || lower === "failed") return "text-destructive font-bold";
      if (lower === "warning") return "text-yellow-400 font-bold";
      if (lower === "success" || lower === "completed") return "text-emerald-400 font-bold";
      return "";
    }},
  ];

  let remaining = text;
  let key = 0;

  // Simple approach: just apply basic highlighting
  result.push(
    <span key={key++}>
      {text.split(/(✓|✗|⚡|📱|Error|Warning|Success|Failed|Completed)/gi).map((segment, i) => {
        if (["✓", "⚡", "📱", "Success", "Completed", "success", "completed"].includes(segment)) {
          return <span key={i} className="text-emerald-400 font-medium">{segment}</span>;
        }
        if (["✗", "Error", "Failed", "error", "failed"].includes(segment)) {
          return <span key={i} className="text-destructive font-medium">{segment}</span>;
        }
        if (["Warning", "warning"].includes(segment)) {
          return <span key={i} className="text-yellow-400 font-medium">{segment}</span>;
        }
        return segment;
      })}
    </span>
  );

  return result;
}

// Add Prism theme styles
export const PrismStyles = () => (
  <style>{`
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: hsl(var(--muted-foreground) / 0.6);
      font-style: italic;
    }
    .token.punctuation {
      color: hsl(var(--muted-foreground));
    }
    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #f97583;
    }
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #9ecbff;
    }
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #79b8ff;
    }
    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #b392f0;
    }
    .token.function,
    .token.class-name {
      color: #79b8ff;
    }
    .token.regex,
    .token.important,
    .token.variable {
      color: #ffab70;
    }
  `}</style>
);
