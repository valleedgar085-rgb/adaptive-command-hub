import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchUserConversations, deleteConversation, getCurrentUser } from "@/lib/supabase-helpers";
import { getErrorMessage } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

const History = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      const data = await fetchUserConversations(currentUser.id);
      setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user) {
      loadConversations();
    }
  }, [user, loading, navigate, loadConversations]);

  const deleteConversationHandler = async (id: string) => {
    try {
      const currentUser = await getCurrentUser();
      await deleteConversation(id, currentUser.id);
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
      loadConversations();
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast({
        title: "Error",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold bg-gradient-accent bg-clip-text text-transparent">
          Conversation History
        </h1>
      </header>

      <main className="container mx-auto p-6">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
              <p className="text-muted-foreground mb-6">Start a new chat to begin your coding journey</p>
              <Button onClick={() => navigate("/")}>
                Start New Chat
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conversations.map((conv) => (
                <Card 
                  key={conv.id} 
                  className="hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`/?conversation=${conv.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate text-base">
                          {conv.title || "Untitled Chat"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(conv.updated_at)}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversationHandler(conv.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      View conversation
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </main>
    </div>
  );
};

export default History;
