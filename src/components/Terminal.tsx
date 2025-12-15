import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Code, Lightbulb, Copy, Check, AlertCircle, Play, BookOpen, Sparkles, Download, FileText, File, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeSandbox } from "@/components/CodeSandbox";
import { Link } from "react-router-dom";
import { useExportChat } from "@/hooks/useExportChat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { exportAsMarkdown, exportAsText, exportAsPDF } = useExportChat();

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
      setMessages(
        data.map((msg) => ({ role: msg.role as "user" | "assistant", content: msg.content }))
      );
    } catch (err) {
      console.error("Network error:", err);
      setConnectionError("Network error. Please check your connection.");
    }
  }, [conversationId]);

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
    const hasCode = lastMessages.some((m) => m.content.includes("```"));
    const context = lastMessages.map((m) => m.content.toLowerCase()).join(" ");

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

  useEffect(() => {
    if (messages.length > 0) {
      generateSuggestions();
    }
  }, [messages, generateSuggestions]);

  const createConversation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        type: "chat",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    const { error } = await supabase.from("messages").insert({
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

      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  const handleRunCode = (code: string) => {
    setSandboxCode(code);
  };

  const extractLanguage = (codeBlock: string): string => {
    const match = codeBlock.match(/```(\w+)/);
    return match ? match[1] : "javascript";
  };

  const extractCode = (codeBlock: string): string => {
    return codeBlock.replace(/```[\w]*\n?/g, "").replace(/```$/g, "").trim();
  };

  const renderMessage = (msg: Message, idx: number) => {
    const isUser = msg.role === "user";
    const isStreaming = !isUser && idx === messages.length - 1 && isLoading;

    // Parse code blocks
    const parts = msg.content.split(/(```[\s\S]*?```)/g);

    return (
      <div
        key={idx}
        className={`flex gap-4 sm:gap-5 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-secondary flex items-center justify-center shadow-lg ring-2 ring-secondary/30">
              <span className="text-secondary-foreground font-bold text-sm">U</span>
            </div>
          ) : (
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-ai flex items-center justify-center shadow-lg ring-2 ${isStreaming ? 'ring-[hsl(217,91%,60%)]/50' : 'ring-[hsl(217,91%,50%)]/30'}`}>
              <Sparkles className="h-5 w-5 sm:h-5 sm:w-5 text-white" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div
          className={`flex-1 max-w-[calc(100%-4rem)] sm:max-w-[85%] ${
            isUser ? "ml-4" : "mr-4"
          }`}
        >
          <div
            className={`rounded-2xl overflow-hidden transition-all duration-500 ${
              isUser
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                : `bg-card/95 backdrop-blur-sm border-2 ${isStreaming ? 'ai-glow-active' : 'ai-glow-solid'}`
            }`}
          >
            {/* AI Response Header */}
            {!isUser && (
              <div className="px-5 py-3 border-b border-[hsl(217,91%,50%)]/20 bg-[hsl(217,91%,60%)]/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-[hsl(217,91%,60%)] animate-pulse' : 'bg-[hsl(217,91%,50%)]'}`} />
                  <span className="text-xs font-semibold text-[hsl(217,91%,70%)] uppercase tracking-wider">
                    AI Response
                  </span>
                </div>
                {isStreaming && (
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[hsl(217,91%,60%)] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[hsl(217,91%,60%)] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[hsl(217,91%,60%)] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-[hsl(217,91%,70%)] font-medium">Generating...</span>
                  </div>
                )}
              </div>
            )}

            {/* Message Body */}
            <div className={`p-5 sm:p-6 space-y-5 ${!isUser ? 'leading-relaxed' : ''}`}>
              {parts.map((part, i) => {
                if (part.startsWith("```")) {
                  const language = extractLanguage(part);
                  const code = extractCode(part);
                  return (
                    <div key={i} className="my-4">
                      <CodeBlock
                        code={code}
                        language={language}
                        onRunCode={handleRunCode}
                      />
                    </div>
                  );
                }
                if (!part.trim()) return null;
                return (
                  <p
                    key={i}
                    className={`text-sm sm:text-[15px] leading-7 whitespace-pre-wrap break-words ${
                      isUser ? "text-primary-foreground" : "text-foreground/95"
                    }`}
                  >
                    {part}
                  </p>
                );
              })}
            </div>

            {/* AI Response Footer */}
            {!isUser && msg.content && !isStreaming && (
              <div className="px-5 py-3 border-t border-[hsl(217,91%,50%)]/20 bg-[hsl(217,91%,60%)]/5 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,60%)]/10 transition-colors"
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                  Helpful
                </Button>
              </div>
            )}
          </div>
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
          <Button variant="ghost" size="sm" onClick={loadMessages} className="ml-auto text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Code Sandbox Modal */}
      {sandboxCode && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <CodeSandbox
              initialCode={sandboxCode}
              onClose={() => setSandboxCode(null)}
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="outline"
                onClick={() => setSandboxCode(null)}
              >
                Close Sandbox
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-2">
              <div className="text-center space-y-6 max-w-xl w-full">
                <div className="w-20 h-20 rounded-2xl bg-gradient-accent mx-auto flex items-center justify-center shadow-2xl ring-4 ring-primary/20">
                  <Sparkles className="h-10 w-10 text-accent-foreground" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                    Elite Code Assistant
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Accurate, production-ready code with detailed explanations
                  </p>
                </div>
                <div className="grid gap-3 pt-6">
                  <div className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors group">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Code className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">Collaborative Coding</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          I generate code in meaningful chunks and pause for your review
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors group">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Play className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">Code Sandbox</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Run JavaScript/TypeScript code snippets directly in the chat
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to="/terms" 
                    className="p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 text-left hover:border-primary/50 transition-colors group block"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <BookOpen className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">Coding Fundamentals</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Learn essential programming terms and concepts
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => renderMessage(msg, idx))}
          {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4 sm:gap-5 animate-fade-in">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-ai flex items-center justify-center shadow-lg ring-2 ring-[hsl(217,91%,60%)]/50">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="bg-card/95 backdrop-blur-sm border-2 ai-glow-active rounded-2xl mr-4 sm:max-w-[85%] overflow-hidden">
                <div className="px-5 py-3 border-b border-[hsl(217,91%,50%)]/20 bg-[hsl(217,91%,60%)]/5 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(217,91%,60%)] animate-pulse" />
                  <span className="text-xs font-semibold text-[hsl(217,91%,70%)] uppercase tracking-wider">
                    AI Response
                  </span>
                </div>
                <div className="p-5 sm:p-6 flex items-center gap-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(217,91%,60%)]" />
                  <span className="text-sm text-muted-foreground">Processing your request...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm p-4 sm:p-5">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Export & Suggestions Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Suggestions */}
            {messages.length > 0 && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 flex-1">
                {suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="h-8 text-xs bg-muted/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
                  >
                    <Lightbulb className="h-3 w-3 mr-1.5 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}

            {/* Export Button */}
            {messages.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-muted/30 hover:bg-[hsl(217,91%,60%)]/10 hover:border-[hsl(217,91%,60%)]/50 hover:text-[hsl(217,91%,60%)] transition-all flex-shrink-0"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => exportAsMarkdown(messages)}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportAsText(messages)}
                    className="cursor-pointer"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Export as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportAsPDF(messages)}
                    className="cursor-pointer"
                  >
                    <FileType className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Input */}
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about code..."
                className="min-h-[52px] max-h-32 pr-4 resize-none bg-background/80 border-border/50 focus:border-[hsl(217,91%,60%)]/50 rounded-xl"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[52px] w-[52px] rounded-xl bg-gradient-ai hover:opacity-90 shadow-lg shadow-[hsl(217,91%,50%)]/30 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
