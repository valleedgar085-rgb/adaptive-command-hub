import { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Settings, LogOut, Brain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserConversations, fetchUserMemories, getCurrentUser } from "@/lib/supabase-helpers";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface Memory {
  id: string;
  category: string;
  title: string;
  confidence: number;
}

interface SidebarProps {
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  currentConversationId: string | null;
  onOpenSettings: () => void;
}

export const Sidebar = ({
  onNewChat,
  onSelectConversation,
  currentConversationId,
  onOpenSettings,
}: SidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signOut } = useAuth();

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      const data = await fetchUserConversations(currentUser.id, 20);
      setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMemories = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const data = await fetchUserMemories(currentUser.id, 10);
      setMemories(data);
    } catch (err) {
      console.error("Error loading memories:", err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadMemories();
  }, [loadConversations, loadMemories]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-2 flex gap-1 flex-shrink-0">
          <Button
            variant={!showMemories ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={() => setShowMemories(false)}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Chats
          </Button>
          <Button
            variant={showMemories ? "secondary" : "ghost"}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={() => setShowMemories(true)}
          >
            <Brain className="h-4 w-4 mr-1.5" />
            Memory
          </Button>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          {!showMemories ? (
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 px-2">
                  No conversations yet. Start a new chat!
                </p>
              ) : (
                conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    size="sm"
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="truncate w-full text-sm font-medium">
                        {conv.title || "Untitled Chat"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conv.created_at)}
                      </span>
                    </div>
                  </Button>
                ))
              )}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {memories.length === 0 ? (
                <div className="text-center py-6 px-3">
                  <Brain className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No memories yet. Keep chatting to help the AI learn your patterns!
                  </p>
                </div>
              ) : (
                memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                        {memory.category}
                      </span>
                      <span className="text-xs text-primary font-semibold">
                        {Math.round(memory.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {memory.title}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer actions */}
      <div className="p-2 border-t border-border space-y-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          <span className="text-sm">Settings</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};
