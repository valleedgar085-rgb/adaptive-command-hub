import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    type: "api",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadIntegrations();
    }
  }, [open]);

  const loadIntegrations = async () => {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setIntegrations(data.map(item => ({
        ...item,
        enabled: item.enabled ?? false,
        config: (typeof item.config === 'object' && item.config !== null && !Array.isArray(item.config)) 
          ? item.config as Record<string, unknown> 
          : {}
      })));
    }
  };

  const addIntegration = async () => {
    if (!newIntegration.name.trim()) {
      toast({
        title: "Error",
        description: "Integration name is required",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("integrations").insert({
      user_id: user.id,
      name: newIntegration.name,
      type: newIntegration.type,
      config: {},
      enabled: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Integration added",
    });

    setNewIntegration({ name: "", type: "api" });
    loadIntegrations();
  };

  const toggleIntegration = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("integrations").update({ enabled }).eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    loadIntegrations();
  };

  const deleteIntegration = async (id: string) => {
    const { error } = await supabase.from("integrations").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Integration removed",
    });

    loadIntegrations();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Integrations</h3>

            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="integration-name">Name</Label>
                  <Input
                    id="integration-name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                    placeholder="e.g., GitHub, Notion, VSCode"
                  />
                </div>
                <div className="w-32">
                  <Label htmlFor="integration-type">Type</Label>
                  <Input
                    id="integration-type"
                    value={newIntegration.type}
                    onChange={(e) => setNewIntegration({ ...newIntegration, type: e.target.value })}
                    placeholder="api"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addIntegration} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="h-64 border rounded-md p-4">
              {integrations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No integrations configured yet. Add your first integration above!
                </p>
              ) : (
                <div className="space-y-2">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteIntegration(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
