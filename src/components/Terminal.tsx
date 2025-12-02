import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Code, Lightbulb, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      generateSuggestions();
    }
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content })));
  };

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
      if (!session) throw new Error("Not authenticated");

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
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
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = () => {
    const lastMessages = messages.slice(-3);
    const hasCode = lastMessages.some(m => m.content.includes("```"));
    const context = lastMessages.map(m => m.content.toLowerCase()).join(" ");
    
    const newSuggestions = [];
    
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
    const hasCodeBlock = msg.content.includes("```");
    
    // Parse code blocks
    const parts = msg.content.split(/(```[\s\S]*?```)/g);
    
    return (
      <div
        key={idx}
        className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-9 h-9 rounded-full bg-gradient-secondary flex items-center justify-center shadow-lg">
              <span className="text-secondary-foreground font-bold text-sm">U</span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
        <div
          className={`flex-1 rounded-xl p-4 space-y-3 ${
            isUser
              ? "bg-gradient-primary text-primary-foreground shadow-lg mr-12"
              : "bg-card/80 backdrop-blur-sm border-2 ml-12 transition-all duration-300"
          } ${
            !isUser && idx === messages.length - 1 && isLoading
              ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse"
              : !isUser
              ? "border-black/50"
              : ""
          }`}
        >
          <div className="space-y-2">
            {parts.map((part, i) => {
              if (part.startsWith("```")) {
                const codeContent = part.replace(/```[\w]*\n?/g, "").replace(/```$/g, "");
                return (
                  <div key={i} className="relative group">
                    <pre className="bg-muted/50 border border-border/30 rounded-lg p-4 overflow-x-auto">
                      <code className="text-xs font-mono text-foreground leading-relaxed">
                        {codeContent}
                      </code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
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
              return (
                <p
                  key={i}
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
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
      <ScrollArea ref={scrollRef} className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-6 max-w-xl">
                <div className="w-20 h-20 rounded-2xl bg-gradient-accent mx-auto flex items-center justify-center shadow-2xl">
                  <Code className="h-10 w-10 text-accent-foreground" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                    Elite Code Assistant
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Accurate, production-ready code with detailed explanations
                  </p>
                </div>
                <div className="grid gap-3 pt-6">
                  <div className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">💡</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Collaborative Coding
                        </p>
                        <p className="text-xs text-muted-foreground">
                          I generate code in meaningful chunks and pause for your review
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">🧠</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Learning & Memory
                        </p>
                        <p className="text-xs text-muted-foreground">
                          I remember your patterns and adapt to your coding style
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-lg">🎯</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Accuracy First
                        </p>
                        <p className="text-xs text-muted-foreground">
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
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-card/80 backdrop-blur-sm border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse rounded-xl p-4 ml-12">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-card/30 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {suggestions.length > 0 && messages.length > 0 && (
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
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build... (Shift+Enter for new line)"
              className="min-h-[70px] max-h-[200px] resize-none bg-background/80 border-border/50 focus:border-primary transition-colors text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[70px] w-[70px] bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Send className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
