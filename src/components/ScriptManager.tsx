import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileCode, 
  Plus, 
  Trash2, 
  Play, 
  Edit3,
  Save,
  FolderOpen
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export interface Script {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface ScriptManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunScript: (script: Script) => void;
  onLoadScript: (script: Script) => void;
}

const STORAGE_KEY = "code-sandbox-scripts";

const loadScripts = (): Script[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveScripts = (scripts: Script[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
};

export const ScriptManager = ({
  open,
  onOpenChange,
  onRunScript,
  onLoadScript
}: ScriptManagerProps) => {
  const [scripts, setScripts] = useState<Script[]>(loadScripts);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newScript, setNewScript] = useState({ name: "", description: "", code: "" });
  const { toast } = useToast();

  const handleCreate = () => {
    if (!newScript.name.trim()) {
      toast({ title: "Error", description: "Script name is required", variant: "destructive" });
      return;
    }

    const script: Script = {
      id: crypto.randomUUID(),
      name: newScript.name.trim(),
      description: newScript.description.trim(),
      code: newScript.code || "// New script\nconsole.log('Hello!');",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [...scripts, script];
    setScripts(updated);
    saveScripts(updated);
    setNewScript({ name: "", description: "", code: "" });
    setIsCreating(false);

    toast({ title: "Script Created", description: `"${script.name}" has been saved` });
  };

  const handleDelete = (id: string) => {
    const updated = scripts.filter(s => s.id !== id);
    setScripts(updated);
    saveScripts(updated);
    toast({ title: "Script Deleted" });
  };

  const handleUpdate = (script: Script) => {
    const updated = scripts.map(s => 
      s.id === script.id ? { ...script, updatedAt: Date.now() } : s
    );
    setScripts(updated);
    saveScripts(updated);
    setEditingId(null);
    toast({ title: "Script Updated" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FolderOpen className="h-5 w-5 text-primary" />
            Script Manager
          </DialogTitle>
          <DialogDescription>
            Save, manage, and run your code scripts
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isCreating ? (
            <div className="space-y-4 p-4 rounded-lg bg-muted/20 border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="script-name">Script Name</Label>
                <Input
                  id="script-name"
                  value={newScript.name}
                  onChange={(e) => setNewScript(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My awesome script"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script-desc">Description (optional)</Label>
                <Input
                  id="script-desc"
                  value={newScript.description}
                  onChange={(e) => setNewScript(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this script do?"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="script-code">Initial Code (optional)</Label>
                <Textarea
                  id="script-code"
                  value={newScript.code}
                  onChange={(e) => setNewScript(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="// Your code here..."
                  className="bg-background/50 font-mono text-sm min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} size="sm" className="bg-primary">
                  <Save className="h-4 w-4 mr-1" />
                  Save Script
                </Button>
                <Button 
                  onClick={() => setIsCreating(false)} 
                  variant="ghost" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {scripts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No saved scripts yet</p>
                  <p className="text-sm">Create your first script to get started</p>
                </div>
              ) : (
                scripts.map((script) => (
                  <div
                    key={script.id}
                    className="p-4 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    {editingId === script.id ? (
                      <div className="space-y-3">
                        <Input
                          value={script.name}
                          onChange={(e) => {
                            const updated = scripts.map(s => 
                              s.id === script.id ? { ...s, name: e.target.value } : s
                            );
                            setScripts(updated);
                          }}
                          className="bg-background/50"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleUpdate(script)} 
                            size="sm"
                            className="bg-primary"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button 
                            onClick={() => setEditingId(null)} 
                            variant="ghost" 
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              <FileCode className="h-4 w-4 text-primary" />
                              {script.name}
                            </h3>
                            {script.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {script.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingId(script.id)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(script.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              onLoadScript(script);
                              onOpenChange(false);
                            }}
                          >
                            <FolderOpen className="h-3 w-3 mr-1" />
                            Load
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-primary"
                            onClick={() => {
                              onRunScript(script);
                              onOpenChange(false);
                            }}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(script.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="bg-primary">
              <Plus className="h-4 w-4 mr-1" />
              New Script
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
