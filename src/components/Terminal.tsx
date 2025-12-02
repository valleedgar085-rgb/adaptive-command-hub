import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Code, Lightbulb, Copy, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TerminalProps {
  conversationId: string | null;
  onConversationCreate: (id: string) => void;
}

export const Terminal = ({ conversationId, onConversationCreate }: TerminalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Smooth scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        setConnectionError("Failed to load messages. Please try again.");
        return;
      }

      setConnectionError(null);
      setMessages(data.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content })));
    } catch (err) {
      console.error("Network error:", err);
      setConnectionError("Network error. Please check your connection.");
    }
  }, [conversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
      setConnectionError(null);
    }
  }, [conversationId, loadMessages]);

  const generateSuggestions = useCallback(() => {
    const lastMessages = messages.slice(-3);
    const hasCode = lastMessages.some(m => m.content.includes("```"));
    const context = lastMessages.map(m => m.content.toLowerCase()).join(" ");
    
    const newSuggestions: string[] = [];
    
    if (hasCode) {
      newSuggestions.push("Explain this code");
      newSuggestions.push("Add error handling");
      newSuggestions.push("Optimize performance");
    } else if (context.includes("database") || context.includes("table")) {
      newSuggestions.push("Add validation");
      newSuggestions.push("Create migration");
      newSuggestions.push("Show schema");
    } else if (context.includes("ui") || context.includes("component")) {
      newSuggestions.push("Make it responsive");
      newSuggestions.push("Add animations");
      newSuggestions.push("Improve accessibility");
    } else {
      newSuggestions.push("Continue with implementation");
      newSuggestions.push("Explain in detail");
      newSuggestions.push("Show alternative approach");
    }
    
    setSuggestions(newSuggestions.slice(0, 3));
  }, [messages]);

  // Generate suggestions when messages change
  useEffect(() => {
    if (messages.length > 0) {
      generateSuggestions();
    }
  }, [messages, generateSuggestions]);

  const createConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("conversations")
      .insert({ 
        user_id: user.id,
        type: "chat" 
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        role,
        content,
      });

    if (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setConnectionError(null);
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation();
        onConversationCreate(convId);
      }

      await saveMessage(convId, "user", userMessage.content);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("API configuration error. Please contact support.");
      }

      const CHAT_URL = `${supabaseUrl}/functions/v1/chat`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId: convId,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to get response from AI assistant";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
        throw new Error(errorMessage);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      const updateAssistant = (content: string) => {
        assistantContent = content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              updateAssistant(assistantContent + content);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await saveMessage(convId, "assistant", assistantContent);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const renderMessage = (msg: Message, idx: number) => {
    const isUser = msg.role === "user";
    
    // Parse code blocks for syntax highlighting
    const parts = msg.content.split(/(```[\s\S]*?```)/g);
    
    return (
      <div
        key={idx}
        className={`flex gap-3 sm:gap-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-secondary flex items-center justify-center shadow-lg">
              <span className="text-secondary-foreground font-semibold text-xs sm:text-sm">U</span>
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
              <Code className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
          )}
        </div>
        <div
          className={`flex-1 max-w-[calc(100%-3rem)] sm:max-w-none rounded-xl p-3 sm:p-4 space-y-3 ${
            isUser
              ? "bg-gradient-primary text-primary-foreground shadow-lg ml-4 sm:mr-12 sm:ml-0"
              : "bg-card/80 backdrop-blur-sm border-2 mr-4 sm:ml-12 sm:mr-0 transition-all duration-300"
          } ${
            !isUser && idx === messages.length - 1 && isLoading
              ? "border-primary/70 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
              : !isUser
              ? "border-border/60"
              : ""
          }`}
        >
          <div className="space-y-2">
            {parts.map((part, i) => {
              if (part.startsWith("```")) {
                const codeContent = part.replace(/```[\w]*\n?/g, "").replace(/```$/g, "");
                return (
                  <div key={i} className="relative group">
                    <pre className="bg-muted/50 border border-border/30 rounded-lg p-3 sm:p-4 overflow-x-auto">
                      <code className="text-xs sm:text-sm font-mono text-foreground leading-relaxed">
                        {codeContent}
                      </code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-7 w-7 bg-background/80"
                      onClick={() => handleCopy(codeContent, idx)}
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                );
              }
              // Skip empty parts
              if (!part.trim()) return null;
              return (
                <p
                  key={i}
                  className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
                    isUser ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {part}
                </p>
              );
            })}
          </div>
          {!isUser && msg.content && (
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Helpful
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Connection error banner */}
      {connectionError && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{connectionError}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadMessages}
            className="ml-auto text-xs"
          >
            Retry
          </Button>
        </div>
      )}
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-2">
              <div className="text-center space-y-4 sm:space-y-6 max-w-xl w-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-accent mx-auto flex items-center justify-center shadow-2xl">
                  <Code className="h-8 w-8 sm:h-10 sm:w-10 text-accent-foreground" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                    Elite Code Assistant
                  </h2>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    Accurate, production-ready code with detailed explanations
                  </p>
                </div>
                <div className="grid gap-3 pt-4 sm:pt-6">
                  <div className="p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">💡</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-0.5">
                          Collaborative Coding
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          I generate code in meaningful chunks and pause for your review
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">🧠</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-0.5">
                          Learning & Memory
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          I remember your patterns and adapt to your coding style
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">🎯</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-0.5">
                          Accuracy First
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Production-ready code with minimal bugs and best practices
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => renderMessage(msg, idx))}
          {/* Loading indicator when waiting for response */}
          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 sm:gap-4 animate-fade-in">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                <Code className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/50 shadow-lg rounded-xl p-3 sm:p-4 mr-4 sm:ml-12 sm:mr-0">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border bg-card/30 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-3">
          {/* Suggestion buttons */}
          {suggestions.length > 0 && messages.length > 0 && !isLoading && (
            <div className="flex gap-2 flex-wrap animate-fade-in">
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-card/60 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          {/* Message input */}
          <div className="flex gap-2 sm:gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build..."
              className="min-h-[56px] sm:min-h-[70px] max-h-[200px] resize-none bg-background/80 border-border/50 focus:border-primary transition-colors text-sm sm:text-base leading-relaxed"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[56px] w-[56px] sm:h-[70px] sm:w-[70px] bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg flex-shrink-0"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
              ) : (
                <Send className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </div>
          {/* Keyboard hint - hidden on mobile */}
          <p className="hidden sm:block text-xs text-muted-foreground text-center">
            Press Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};
