import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal as TerminalComponent } from "@/components/Terminal";
import { Sidebar } from "@/components/Sidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-border flex items-center px-3 sm:px-4 bg-card/50 backdrop-blur-sm flex-shrink-0">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 h-9 w-9 sm:h-10 sm:w-10"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 sm:w-80">
            <Sidebar
              onNewChat={() => {
                setCurrentConversationId(null);
                setSidebarOpen(false);
              }}
              onSelectConversation={(id) => {
                setCurrentConversationId(id);
                setSidebarOpen(false);
              }}
              currentConversationId={currentConversationId}
              onOpenSettings={() => {
                setSettingsOpen(true);
                setSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
        <h1 className="text-base sm:text-lg font-semibold bg-gradient-accent bg-clip-text text-transparent tracking-tight">
          Elite Code Assistant
        </h1>
      </header>
      
      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <TerminalComponent
          conversationId={currentConversationId}
          onConversationCreate={setCurrentConversationId}
        />
      </main>
      
      {/* Settings dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
