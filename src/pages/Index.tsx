import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal as TerminalComponent } from "@/components/Terminal";
import { Sidebar } from "@/components/Sidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        onNewChat={() => setCurrentConversationId(null)}
        onSelectConversation={setCurrentConversationId}
        currentConversationId={currentConversationId}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex-1">
        <TerminalComponent
          conversationId={currentConversationId}
          onConversationCreate={setCurrentConversationId}
        />
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
