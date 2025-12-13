import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Memory {
  id: string;
  category: string;
  title: string;
  content: string;
  confidence: number;
  created_at: string;
}

const Memories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("confidence", { ascending: false });

      if (!error && data) {
        setMemories(data);
      }
    } catch (err) {
      console.error("Error loading memories:", err);
      toast({
        title: "Error",
        description: "Failed to load memories",
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
      loadMemories();
    }
  }, [user, loading, navigate, loadMemories]);

  const deleteMemory = async (id: string) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUser.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete memory",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Memory deleted",
    });

    loadMemories();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    if (confidence >= 0.5) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
    return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
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
          Memory Dashboard
        </h1>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6">
          <p className="text-muted-foreground">
            The AI remembers your coding patterns and preferences to provide better assistance over time.
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          {memories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Brain className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No memories yet</h2>
              <p className="text-muted-foreground mb-6">
                Keep chatting to help the AI learn your patterns
              </p>
              <Button onClick={() => navigate("/")}>
                Start Chatting
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memories.map((memory) => (
                <Card 
                  key={memory.id} 
                  className="hover:border-primary/50 transition-all group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {memory.category}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(memory.confidence)}`}
                          >
                            {Math.round(memory.confidence * 100)}%
                          </Badge>
                        </div>
                        <CardTitle className="text-base line-clamp-2">
                          {memory.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMemory(memory.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm line-clamp-3">
                      {memory.content}
                    </CardDescription>
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

export default Memories;
