import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface ScriptCommand {
  id: string;
  command: string;
  description: string;
  type: "shell" | "info" | "action";
}

interface UserScript {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  script_type: string;
  commands: ScriptCommand[];
  is_active: boolean;
  last_executed_at: string | null;
  execution_count: number;
  created_at: string;
}

interface ScriptExecution {
  id: string;
  script_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  output: string | null;
  error: string | null;
}

// Pre-defined script templates
const SCRIPT_TEMPLATES = {
  apk_build: {
    name: "Android APK Build",
    description: "Complete workflow to build an Android APK from your Lovable project",
    script_type: "build",
    commands: [
      { id: "1", command: "git clone <repo-url>", description: "Clone repository from GitHub", type: "shell" as const },
      { id: "2", command: "cd <project-name>", description: "Navigate to project directory", type: "shell" as const },
      { id: "3", command: "npm install", description: "Install all dependencies", type: "shell" as const },
      { id: "4", command: "npx cap add android", description: "Add Android platform to Capacitor", type: "shell" as const },
      { id: "5", command: "npm run build", description: "Build the production bundle", type: "shell" as const },
      { id: "6", command: "npx cap sync android", description: "Sync web assets with Android project", type: "shell" as const },
      { id: "7", command: "npx cap open android", description: "Open project in Android Studio", type: "shell" as const },
      { id: "8", command: "Build > Build Bundle(s) / APK(s) > Build APK(s)", description: "Build APK in Android Studio", type: "action" as const },
      { id: "9", command: "android/app/build/outputs/apk/debug/app-debug.apk", description: "Find your APK at this location", type: "info" as const },
    ],
  },
  ios_build: {
    name: "iOS App Build",
    description: "Complete workflow to build an iOS app from your Lovable project",
    script_type: "build",
    commands: [
      { id: "1", command: "git clone <repo-url>", description: "Clone repository from GitHub", type: "shell" as const },
      { id: "2", command: "cd <project-name>", description: "Navigate to project directory", type: "shell" as const },
      { id: "3", command: "npm install", description: "Install all dependencies", type: "shell" as const },
      { id: "4", command: "npx cap add ios", description: "Add iOS platform to Capacitor", type: "shell" as const },
      { id: "5", command: "npm run build", description: "Build the production bundle", type: "shell" as const },
      { id: "6", command: "npx cap sync ios", description: "Sync web assets with iOS project", type: "shell" as const },
      { id: "7", command: "npx cap open ios", description: "Open project in Xcode", type: "shell" as const },
      { id: "8", command: "Product > Archive", description: "Archive app in Xcode", type: "action" as const },
    ],
  },
  deploy_production: {
    name: "Production Deployment",
    description: "Deploy your app to production",
    script_type: "deploy",
    commands: [
      { id: "1", command: "npm run build", description: "Build production bundle", type: "shell" as const },
      { id: "2", command: "npm run preview", description: "Preview production build locally", type: "shell" as const },
      { id: "3", command: "Click Publish in Lovable", description: "Deploy to Lovable hosting", type: "action" as const },
    ],
  },
};

export const useUserScripts = () => {
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchScripts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_scripts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type cast the commands from Json to ScriptCommand[]
      const typedScripts = (data || []).map(script => ({
        ...script,
        commands: script.commands as unknown as ScriptCommand[]
      }));
      
      setScripts(typedScripts);
    } catch (err) {
      console.error("Error fetching scripts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const createScript = useCallback(async (
    name: string,
    description: string,
    scriptType: string,
    commands: ScriptCommand[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_scripts")
        .insert([{
          user_id: user.id,
          name,
          description,
          script_type: scriptType,
          commands: JSON.parse(JSON.stringify(commands)) as Json,
        }])
        .select()
        .single();

      if (error) throw error;

      const typedScript = {
        ...data,
        commands: data.commands as unknown as ScriptCommand[]
      };

      setScripts(prev => [typedScript, ...prev]);
      toast({ title: "Script Created", description: `"${name}" has been saved` });
      return typedScript;
    } catch (err) {
      console.error("Error creating script:", err);
      toast({
        title: "Error",
        description: "Failed to create script",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const createFromTemplate = useCallback(async (templateKey: keyof typeof SCRIPT_TEMPLATES) => {
    const template = SCRIPT_TEMPLATES[templateKey];
    if (!template) return null;

    return createScript(
      template.name,
      template.description,
      template.script_type,
      template.commands
    );
  }, [createScript]);

  const updateScript = useCallback(async (
    scriptId: string,
    updates: Partial<Pick<UserScript, "name" | "description" | "commands">>
  ) => {
    try {
      const { data, error } = await supabase
        .from("user_scripts")
        .update(updates as Record<string, unknown>)
        .eq("id", scriptId)
        .select()
        .single();

      if (error) throw error;

      const typedScript = {
        ...data,
        commands: data.commands as unknown as ScriptCommand[]
      };

      setScripts(prev => prev.map(s => s.id === scriptId ? typedScript : s));
      return typedScript;
    } catch (err) {
      console.error("Error updating script:", err);
      return null;
    }
  }, []);

  const deleteScript = useCallback(async (scriptId: string) => {
    try {
      const { error } = await supabase
        .from("user_scripts")
        .update({ is_active: false })
        .eq("id", scriptId);

      if (error) throw error;
      setScripts(prev => prev.filter(s => s.id !== scriptId));
      toast({ title: "Script Deleted" });
    } catch (err) {
      console.error("Error deleting script:", err);
    }
  }, [toast]);

  const logExecution = useCallback(async (
    scriptId: string,
    status: string,
    output?: string,
    error?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("script_executions")
        .insert({
          script_id: scriptId,
          user_id: user.id,
          status,
          output,
          error,
          completed_at: status !== "running" ? new Date().toISOString() : null,
        });

      // Update script execution count
      await supabase
        .from("user_scripts")
        .update({
          last_executed_at: new Date().toISOString(),
          execution_count: scripts.find(s => s.id === scriptId)?.execution_count || 0 + 1,
        })
        .eq("id", scriptId);
    } catch (err) {
      console.error("Error logging execution:", err);
    }
  }, [scripts]);

  return {
    scripts,
    isLoading,
    createScript,
    createFromTemplate,
    updateScript,
    deleteScript,
    logExecution,
    fetchScripts,
    templates: SCRIPT_TEMPLATES,
  };
};
