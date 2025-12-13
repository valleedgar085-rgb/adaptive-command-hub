import { useNavigate } from "react-router-dom";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { 
  Home, 
  MessageSquare, 
  History, 
  Settings, 
  Info, 
  LogOut,
  Brain,
  Plus,
  FileText
} from "lucide-react";

interface MainMenuProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const MainMenu = ({ onNewChat, onOpenSettings, onSignOut }: MainMenuProps) => {
  const navigate = useNavigate();

  return (
    <Menubar className="border-none bg-transparent">
      {/* File Menu */}
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/history")}>
            <History className="mr-2 h-4 w-4" />
            History
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/memories")}>
            <Brain className="mr-2 h-4 w-4" />
            Memories
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* View Menu */}
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => navigate("/")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/history")}>
            <History className="mr-2 h-4 w-4" />
            Conversation History
          </MenubarItem>
          <MenubarItem onClick={() => navigate("/memories")}>
            <Brain className="mr-2 h-4 w-4" />
            Memory Dashboard
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Settings Menu */}
      <MenubarMenu>
        <MenubarTrigger>Settings</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Preferences
            <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onOpenSettings}>
            <FileText className="mr-2 h-4 w-4" />
            Integrations
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Help Menu */}
      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => navigate("/about")}>
            <Info className="mr-2 h-4 w-4" />
            About
          </MenubarItem>
          <MenubarItem onClick={() => window.open("https://github.com/valleedgar085-rgb/adaptive-command-hub", "_blank")}>
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
