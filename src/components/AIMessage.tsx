import { useState, useEffect, useCallback } from "react";
import { Sparkles, Lightbulb, SkipForward, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/CodeBlock";
import { AIProgressBar } from "@/components/AIProgressBar";
import { useToast } from "@/hooks/use-toast";

interface AIMessageProps {
  content: string;
  isStreaming: boolean;
  onRunCode: (code: string) => void;
}

type AIStage = "thinking" | "analyzing" | "generating" | "complete";

export const AIMessage = ({ content, isStreaming, onRunCode }: AIMessageProps) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [stage, setStage] = useState<AIStage>("thinking");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Typewriter effect with smooth character-by-character display
  useEffect(() => {
    if (!content) {
      setDisplayedContent("");
      return;
    }

    // Update stage based on content length and streaming status
    if (isStreaming) {
      if (content.length < 20) {
        setStage("thinking");
      } else if (content.length < 100) {
        setStage("analyzing");
      } else {
        setStage("generating");
      }
    } else {
      setStage("complete");
    }

    // If we're still streaming, show content with a slight typewriter delay
    if (isStreaming) {
      setIsTyping(true);
      
      // Smooth catch-up: display content with minimal delay during streaming
      const displayLength = displayedContent.length;
      const targetLength = content.length;
      
      if (displayLength < targetLength) {
        // Add characters gradually with natural pacing
        const charsToAdd = Math.min(3, targetLength - displayLength);
        const delay = 30 + Math.random() * 20;
        
        const timer = setTimeout(() => {
          setDisplayedContent(content.slice(0, displayLength + charsToAdd));
        }, delay);
        
        return () => clearTimeout(timer);
      }
    } else {
      // When streaming completes, smoothly finish displaying remaining content
      if (displayedContent.length < content.length) {
        const remaining = content.length - displayedContent.length;
        const charsPerTick = Math.max(5, Math.ceil(remaining / 20));
        
        const timer = setTimeout(() => {
          const newLength = Math.min(displayedContent.length + charsPerTick, content.length);
          setDisplayedContent(content.slice(0, newLength));
          
          if (newLength >= content.length) {
            setIsTyping(false);
          }
        }, 20);
        
        return () => clearTimeout(timer);
      } else {
        setDisplayedContent(content);
        setIsTyping(false);
      }
    }
  }, [content, isStreaming, displayedContent]);

  const skipToEnd = useCallback(() => {
    setDisplayedContent(content);
    setIsTyping(false);
  }, [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const extractLanguage = (codeBlock: string): string => {
    const match = codeBlock.match(/```(\w+)/);
    return match ? match[1] : "javascript";
  };

  const extractCode = (codeBlock: string): string => {
    return codeBlock.replace(/```[\w]*\n?/g, "").replace(/```$/g, "").trim();
  };

  // Parse code blocks from displayed content
  const parts = displayedContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="flex gap-4 sm:gap-6 animate-fade-in">
      {/* Avatar with enhanced glow */}
      <div className="flex-shrink-0 mt-1">
        <div 
          className={`
            w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center 
            transition-all duration-700 ease-out
            ${isStreaming || isTyping 
              ? 'bg-gradient-to-br from-primary to-primary/70 shadow-[0_0_40px_hsl(var(--primary)/0.5)] scale-105' 
              : 'bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/20'
            }
          `}
        >
          <Sparkles className={`h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground ${isStreaming ? 'animate-pulse' : ''}`} />
        </div>
      </div>

      {/* Message Content with improved contrast */}
      <div className="flex-1 max-w-[calc(100%-5rem)] sm:max-w-[85%]">
        <div
          className={`
            rounded-2xl overflow-hidden transition-all duration-700 ease-out
            bg-card border-2
            ${isStreaming || isTyping 
              ? 'border-primary/40 shadow-[0_0_50px_hsl(var(--primary)/0.15)]' 
              : 'border-primary/20 shadow-xl shadow-black/5'
            }
          `}
        >
          {/* Header with better contrast */}
          <div className="px-6 py-4 border-b border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className={`
                    w-3 h-3 rounded-full transition-all duration-500
                    ${isStreaming || isTyping 
                      ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)] animate-pulse' 
                      : 'bg-primary/70'
                    }
                  `} 
                />
                <span className="text-sm font-bold text-primary uppercase tracking-widest">
                  Elite AI
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {(isStreaming || isTyping) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipToEnd}
                    className="h-7 text-xs text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <SkipForward className="h-3.5 w-3.5 mr-1" />
                    Skip
                  </Button>
                )}
                {!isStreaming && !isTyping && content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar - Enhanced visibility */}
          {(isStreaming || isTyping) && (
            <div className="px-6 py-4 border-b border-primary/10 bg-primary/5">
              <AIProgressBar 
                isActive={isStreaming || isTyping} 
                stage={stage}
              />
            </div>
          )}

          {/* Message Body with better text contrast */}
          <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-transparent to-background/30">
            {displayedContent ? (
              parts.map((part, i) => {
                if (part.startsWith("```")) {
                  const language = extractLanguage(part);
                  const code = extractCode(part);
                  if (part.endsWith("```") && code) {
                    return (
                      <div key={i} className="my-5">
                        <CodeBlock
                          code={code}
                          language={language}
                          onRunCode={onRunCode}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="my-4 p-4 rounded-lg bg-muted/50 border border-border font-mono text-sm text-foreground/80">
                      {part}
                      {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm" />}
                    </div>
                  );
                }
                if (!part.trim()) return null;
                return (
                  <p
                    key={i}
                    className="text-[15px] sm:text-base leading-8 text-foreground whitespace-pre-wrap break-words tracking-wide"
                  >
                    {part}
                    {i === parts.length - 1 && isTyping && (
                      <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
                    )}
                  </p>
                );
              })
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm font-medium">Thinking...</span>
              </div>
            )}
          </div>

          {/* Footer with enhanced contrast */}
          {!isStreaming && !isTyping && content && (
            <div className="px-6 py-4 border-t border-primary/15 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-2" />
                Helpful
              </Button>
              <span className="text-xs text-muted-foreground/60 font-medium">
                {content.length} characters
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
