import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Code, Lightbulb, Copy, Check, AlertCircle, Play, BookOpen, Sparkles, Download, FileText, File, FileType, FolderOpen, Smartphone, FileCode, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeSandbox } from "@/components/CodeSandbox";
import { AIMessage } from "@/components/AIMessage";
import { FileSystemAccess, useFileSystem } from "@/components/FileSystemAccess";
import { PermissionDialog } from "@/components/PermissionDialog";
import { APKBuildDialog } from "@/components/APKBuildDialog";
import { ScriptBuilder } from "@/components/ScriptBuilder";
import { SQLDatabaseBuilder } from "@/components/SQLDatabaseBuilder";
import { BuildStatusPanel } from "@/components/BuildStatusPanel";
import { Link } from "react-router-dom";
import { useExportChat } from "@/hooks/useExportChat";
import { useAPKBuilder } from "@/hooks/useAPKBuilder";
import { useAutoNaming } from "@/hooks/useAutoNaming";
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
  const [showFileSystem, setShowFileSystem] = useState(false);
  const [showAPKDialog, setShowAPKDialog] = useState(false);
  const [showScriptBuilder, setShowScriptBuilder] = useState(false);
  const [showSQLBuilder, setShowSQLBuilder] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { exportAsMarkdown, exportAsText, exportAsPDF } = useExportChat();
  const fileSystem = useFileSystem();
  const { buildState, processMessage: processAPKMessage, getAPKInstructions, resetBuildState } = useAPKBuilder();
  const { updateConversationTitle } = useAutoNaming();

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

    // Check for APK build request
    const isAPKRequest = processAPKMessage(input);
    if (isAPKRequest) {
      setShowAPKDialog(true);
    }

    setConnectionError(null);
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const messageContent = input;
    setInput("");
    setIsLoading(true);

    try {
      let convId = conversationId;
      const isNewConversation = !convId;
      
      if (!convId) {
        convId = await createConversation();
        onConversationCreate(convId);
      }

      // Auto-name conversation on first message
      if (isNewConversation && convId) {
        await updateConversationTitle(convId, messageContent);
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

    // Use AIMessage component for assistant messages
    if (!isUser) {
      return (
        <AIMessage
          key={idx}
          content={msg.content}
          isStreaming={isStreaming}
          onRunCode={handleRunCode}
        />
      );
    }

    // User message rendering
    return (
      <div
        key={idx}
        className="flex gap-4 sm:gap-6 animate-fade-in flex-row-reverse"
      >
        {/* User Avatar */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-base">U</span>
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 max-w-[calc(100%-5rem)] sm:max-w-[85%] ml-4">
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <div className="p-5 sm:p-6">
              <p className="text-[15px] sm:text-base leading-7 whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleFileRead = (file: { name: string; content: string }) => {
    setInput(prev => prev + `\n\n--- File: ${file.name} ---\n${file.content.slice(0, 2000)}${file.content.length > 2000 ? '\n... (truncated)' : ''}`);
    toast({ title: "File loaded", description: `${file.name} content added to message` });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* APK Build Dialog */}
      <APKBuildDialog
        open={showAPKDialog}
        onOpenChange={setShowAPKDialog}
        instructions={getAPKInstructions()}
      />

      {/* Script Builder Dialog */}
      <ScriptBuilder
        open={showScriptBuilder}
        onOpenChange={setShowScriptBuilder}
        onScriptSelect={(commands) => {
          // When a script is selected, add it to the chat as context
          const scriptText = commands.map((c, i) => `${i + 1}. ${c.description}: \`${c.command}\``).join('\n');
          setInput(prev => prev + (prev ? '\n\n' : '') + `Execute script:\n${scriptText}`);
        }}
      />

      {/* SQL Database Builder Dialog */}
      <SQLDatabaseBuilder
        open={showSQLBuilder}
        onOpenChange={setShowSQLBuilder}
        onGenerateSQL={(sql) => {
          setInput(prev => prev + (prev ? '\n\n' : '') + `Generated SQL:\n\`\`\`sql\n${sql}\n\`\`\``);
          toast({ title: "SQL Generated", description: "SQL added to your message" });
        }}
      />

      {/* Permission Dialog for File System */}
      <PermissionDialog
        open={!!fileSystem.pendingPermission}
        onOpenChange={(open) => !open && fileSystem.handlePermissionResponse(false)}
        permission={fileSystem.pendingPermission?.type || "file-read"}
        details={fileSystem.pendingPermission?.details || ""}
        onAllow={() => fileSystem.handlePermissionResponse(true)}
        onDeny={() => fileSystem.handlePermissionResponse(false)}
      />

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

      {/* File System Granted Permissions */}
      {fileSystem.grantedPermissions.size > 0 && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-xs text-green-500">
            File system access granted ({Array.from(fileSystem.grantedPermissions).join(", ")})
          </span>
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
            <div className="space-y-4 animate-fade-in">
              {/* Build Status Panel */}
              <BuildStatusPanel isBuilding={isLoading} buildType="code" className="max-w-2xl" />
              
              {/* AI Response Indicator */}
              <div className="flex gap-4 sm:gap-5">
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
                    <span className="text-sm text-muted-foreground">Generating response...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Enhanced with better animations and contrast */}
      <div className="border-t-2 border-primary/20 bg-gradient-to-t from-card via-card/95 to-transparent backdrop-blur-xl p-4 sm:p-6 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Export & Suggestions Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Suggestions with enhanced styling */}
            {messages.length > 0 && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 flex-1">
                {suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="h-9 text-xs font-medium bg-primary/5 border-primary/20 hover:bg-primary/15 hover:border-primary/40 hover:text-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-primary" />
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
                    className="h-9 text-xs font-medium bg-accent/10 border-accent/30 hover:bg-accent/20 hover:border-accent/50 hover:text-accent-foreground transition-all duration-300 flex-shrink-0"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-border/50 bg-card/95 backdrop-blur-xl shadow-xl">
                  <DropdownMenuItem 
                    onClick={() => exportAsMarkdown(messages)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportAsText(messages)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    <File className="h-4 w-4 mr-2" />
                    Export as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportAsPDF(messages)}
                    className="cursor-pointer hover:bg-primary/10"
                  >
                    <FileType className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Enhanced Input with better visual feedback */}
          <div className="relative flex items-end gap-3">
            {/* Tool Buttons with improved contrast */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  const file = await fileSystem.readFile();
                  if (file) handleFileRead(file);
                }}
                className="h-12 w-12 rounded-xl bg-muted/50 border-2 border-border/50 hover:bg-emerald-500/15 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5 group"
                title="Open file from computer"
              >
                <FolderOpen className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowAPKDialog(true)}
                className="h-12 w-12 rounded-xl bg-muted/50 border-2 border-border/50 hover:bg-green-500/15 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-0.5 group"
                title="Build Android APK"
              >
                <Smartphone className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowScriptBuilder(true)}
                className="h-12 w-12 rounded-xl bg-muted/50 border-2 border-border/50 hover:bg-amber-500/15 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-0.5 group"
                title="Script Builder"
              >
                <FileCode className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSQLBuilder(true)}
                className="h-12 w-12 rounded-xl bg-muted/50 border-2 border-border/50 hover:bg-blue-500/15 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 group"
                title="SQL Database Builder"
              >
                <Database className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </Button>
            </div>
            
            {/* Main Input with enhanced focus states */}
            <div className="flex-1 relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about code..."
                className="min-h-[52px] max-h-40 pr-4 resize-none bg-background/90 border-2 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl shadow-inner transition-all duration-300 text-foreground placeholder:text-muted-foreground/60"
                disabled={isLoading}
              />
            </div>
            
            {/* Send Button with enhanced animation */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Keyboard hint */}
          <div className="flex justify-center">
            <p className="text-[10px] text-muted-foreground/50">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-[9px] font-mono mx-0.5">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-[9px] font-mono mx-0.5">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
