import { useState } from "react";
import { 
  Plus, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  FileCode, 
  Terminal, 
  Info, 
  MousePointer,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserScripts } from "@/hooks/useUserScripts";
import { useToast } from "@/hooks/use-toast";

interface ScriptCommand {
  id: string;
  command: string;
  description: string;
  type: "shell" | "info" | "action";
}

interface ScriptBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScriptSelect?: (commands: ScriptCommand[]) => void;
}

export const ScriptBuilder = ({ open, onOpenChange, onScriptSelect }: ScriptBuilderProps) => {
  const { scripts, createScript, createFromTemplate, deleteScript, templates } = useUserScripts();
  const [isCreating, setIsCreating] = useState(false);
  const [newScript, setNewScript] = useState({
    name: "",
    description: "",
    script_type: "build",
    commands: [] as ScriptCommand[],
  });
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const { toast } = useToast();

  const addCommand = () => {
    const newCommand: ScriptCommand = {
      id: Date.now().toString(),
      command: "",
      description: "",
      type: "shell",
    };
    setNewScript(prev => ({
      ...prev,
      commands: [...prev.commands, newCommand],
    }));
  };

  const updateCommand = (id: string, field: keyof ScriptCommand, value: string) => {
    setNewScript(prev => ({
      ...prev,
      commands: prev.commands.map(cmd =>
        cmd.id === id ? { ...cmd, [field]: value } : cmd
      ),
    }));
  };

  const removeCommand = (id: string) => {
    setNewScript(prev => ({
      ...prev,
      commands: prev.commands.filter(cmd => cmd.id !== id),
    }));
  };

  const handleSaveScript = async () => {
    if (!newScript.name.trim()) {
      toast({
        title: "Error",
        description: "Script name is required",
        variant: "destructive",
      });
      return;
    }

    await createScript(
      newScript.name,
      newScript.description,
      newScript.script_type,
      newScript.commands
    );

    setNewScript({
      name: "",
      description: "",
      script_type: "build",
      commands: [],
    });
    setIsCreating(false);
  };

  const copyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const getCommandIcon = (type: string) => {
    switch (type) {
      case "shell":
        return <Terminal className="h-3.5 w-3.5" />;
      case "action":
        return <MousePointer className="h-3.5 w-3.5" />;
      case "info":
        return <Info className="h-3.5 w-3.5" />;
      default:
        return <Terminal className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-ai flex items-center justify-center shadow-lg">
              <FileCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Script Builder</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Create and manage automated scripts for complex tasks
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {/* Templates Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(templates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={async () => {
                      const script = await createFromTemplate(key as keyof typeof templates);
                      if (script && onScriptSelect) {
                        onScriptSelect(script.commands);
                      }
                    }}
                    className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{template.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to use →
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Scripts */}
            {scripts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Scripts
                </h3>
                <div className="space-y-2">
                  {scripts.map(script => (
                    <div
                      key={script.id}
                      className="rounded-xl border border-border/50 bg-card overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedScript(
                          expandedScript === script.id ? null : script.id
                        )}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileCode className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-medium">{script.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {script.commands.length} commands • {script.execution_count} runs
                            </p>
                          </div>
                        </div>
                        {expandedScript === script.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {expandedScript === script.id && (
                        <div className="p-4 pt-0 space-y-3 border-t border-border/50">
                          {script.commands.map((cmd, idx) => (
                            <div
                              key={cmd.id}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                cmd.type === "shell" ? "bg-blue-500/20 text-blue-500" :
                                cmd.type === "action" ? "bg-amber-500/20 text-amber-500" :
                                "bg-green-500/20 text-green-500"
                              }`}>
                                {getCommandIcon(cmd.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{cmd.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs bg-background px-2 py-1 rounded border border-border/50 flex-1 overflow-x-auto">
                                    {cmd.command}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyCommand(cmd.command, cmd.id)}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    {copiedCommand === cmd.id ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (onScriptSelect) {
                                  onScriptSelect(script.commands);
                                  onOpenChange(false);
                                }
                              }}
                              className="flex-1"
                            >
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              Use Script
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteScript(script.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Script */}
            {isCreating ? (
              <div className="space-y-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                <h3 className="font-semibold">New Script</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <Input
                      value={newScript.name}
                      onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Build Script"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <Select
                      value={newScript.script_type}
                      onValueChange={(value) => setNewScript(prev => ({ ...prev, script_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="build">Build</SelectItem>
                        <SelectItem value="deploy">Deploy</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea
                    value={newScript.description}
                    onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What does this script do?"
                    rows={2}
                  />
                </div>

                {/* Commands */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Commands</label>
                    <Button variant="ghost" size="sm" onClick={addCommand}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Command
                    </Button>
                  </div>

                  {newScript.commands.map((cmd, idx) => (
                    <div key={cmd.id} className="flex items-start gap-2 p-3 rounded-lg bg-background border border-border/50">
                      <span className="text-xs font-bold text-muted-foreground mt-2">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={cmd.command}
                            onChange={(e) => updateCommand(cmd.id, "command", e.target.value)}
                            placeholder="npm install"
                            className="flex-1 font-mono text-sm"
                          />
                          <Select
                            value={cmd.type}
                            onValueChange={(value) => updateCommand(cmd.id, "type", value as "shell" | "info" | "action")}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shell">Shell</SelectItem>
                              <SelectItem value="action">Action</SelectItem>
                              <SelectItem value="info">Info</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          value={cmd.description}
                          onChange={(e) => updateCommand(cmd.id, "description", e.target.value)}
                          placeholder="Install dependencies"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCommand(cmd.id)}
                        className="text-destructive hover:text-destructive mt-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button onClick={handleSaveScript} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Script
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Script
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
