import { useState, useEffect } from "react";
import { Plus, MessageSquare, Settings, LogOut, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { signOut } = useAuth();

  useEffect(() => {
    loadConversations();
    loadMemories();
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setConversations(data);
    }
  };

  const loadMemories = async () => {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("confidence", { ascending: false })
      .limit(10);

    if (!error && data) {
      setMemories(data);
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-2 flex gap-1">
          <Button
            variant={!showMemories ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setShowMemories(false)}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Chats
          </Button>
          <Button
            variant={showMemories ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => setShowMemories(true)}
          >
            <Brain className="h-4 w-4 mr-1" />
            Memory
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {!showMemories ? (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left"
                  size="sm"
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {conv.title || new Date(conv.created_at).toLocaleDateString()}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="p-2 rounded-md bg-muted text-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase">
                      {memory.category}
                    </span>
                    <span className="text-xs text-primary">
                      {Math.round(memory.confidence * 100)}%
                    </span>
                  </div>
                  <p className="font-medium text-foreground">{memory.title}</p>
                </div>
              ))}
              {memories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No memories yet. Keep chatting to help the AI learn your patterns!
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-2 border-t border-border space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
