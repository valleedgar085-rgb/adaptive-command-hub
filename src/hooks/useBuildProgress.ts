import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

interface BuildProgress {
  id: string;
  user_id: string;
  build_type: string;
  current_step: number;
  total_steps: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  metadata: Json;
}

// Helper to convert database response to typed progress
const toTypedProgress = (data: BuildProgress | null): BuildProgress | null => {
  if (!data) return null;
  return data;
};

export const useBuildProgress = () => {
  const [progress, setProgress] = useState<BuildProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("build_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setProgress(toTypedProgress(data));
    } catch (err) {
      console.error("Error fetching build progress:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const startBuild = useCallback(async (buildType: string = "apk", totalSteps: number = 9) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Mark any existing in-progress builds as abandoned
      await supabase
        .from("build_progress")
        .update({ status: "abandoned" })
        .eq("user_id", user.id)
        .eq("status", "in_progress");

      const { data, error } = await supabase
        .from("build_progress")
        .insert({
          user_id: user.id,
          build_type: buildType,
          current_step: 0,
          total_steps: totalSteps,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;
      setProgress(toTypedProgress(data));
      return data;
    } catch (err) {
      console.error("Error starting build:", err);
      toast({
        title: "Error",
        description: "Failed to start build tracking",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateStep = useCallback(async (step: number, metadata?: Record<string, unknown>) => {
    if (!progress) return;

    try {
      const updateData: Record<string, unknown> = {
        current_step: step,
      };

      if (metadata) {
        const currentMetadata = typeof progress.metadata === 'object' ? progress.metadata : {};
        updateData.metadata = { ...currentMetadata, ...metadata };
      }

      if (step >= progress.total_steps) {
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("build_progress")
        .update(updateData)
        .eq("id", progress.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(toTypedProgress(data));

      if (step >= progress.total_steps) {
        toast({
          title: "Build Complete!",
          description: "Your APK build process is finished",
        });
      }

      return data;
    } catch (err) {
      console.error("Error updating build step:", err);
      return null;
    }
  }, [progress, toast]);

  const completeBuild = useCallback(async () => {
    if (!progress) return;
    return updateStep(progress.total_steps);
  }, [progress, updateStep]);

  const cancelBuild = useCallback(async () => {
    if (!progress) return;

    try {
      const { error } = await supabase
        .from("build_progress")
        .update({ status: "cancelled" })
        .eq("id", progress.id);

      if (error) throw error;
      setProgress(null);
    } catch (err) {
      console.error("Error cancelling build:", err);
    }
  }, [progress]);

  const resetBuild = useCallback(async () => {
    if (!progress) return;

    try {
      const { data, error } = await supabase
        .from("build_progress")
        .update({ current_step: 0, status: "in_progress", completed_at: null })
        .eq("id", progress.id)
        .select()
        .single();

      if (error) throw error;
      setProgress(toTypedProgress(data));
    } catch (err) {
      console.error("Error resetting build:", err);
    }
  }, [progress]);

  return {
    progress,
    isLoading,
    startBuild,
    updateStep,
    completeBuild,
    cancelBuild,
    resetBuild,
    fetchProgress,
  };
};
