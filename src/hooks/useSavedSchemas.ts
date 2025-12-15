import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
  foreignKey?: string;
}

interface Table {
  name: string;
  columns: Column[];
}

interface SavedSchema {
  id: string;
  name: string;
  description: string | null;
  tables: Table[];
  generated_sql: string | null;
  created_at: string;
  updated_at: string;
}

export const useSavedSchemas = () => {
  const [schemas, setSchemas] = useState<SavedSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchSchemas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_schemas")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      setSchemas((data || []).map(schema => ({
        ...schema,
        tables: Array.isArray(schema.tables) ? schema.tables as unknown as Table[] : []
      })));
    } catch (error) {
      console.error("Error fetching schemas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const saveSchema = async (name: string, description: string, tables: Table[], generatedSQL: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("saved_schemas")
        .insert([{
          user_id: user.id,
          name,
          description: description || null,
          tables: JSON.parse(JSON.stringify(tables)),
          generated_sql: generatedSQL || null
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Schema Saved", description: `"${name}" saved successfully` });
      await fetchSchemas();
      return data;
    } catch (error) {
      console.error("Error saving schema:", error);
      toast({ title: "Error", description: "Failed to save schema", variant: "destructive" });
      return null;
    }
  };

  const updateSchema = async (id: string, name: string, description: string, tables: Table[], generatedSQL: string) => {
    try {
      const { error } = await supabase
        .from("saved_schemas")
        .update({
          name,
          description: description || null,
          tables: JSON.parse(JSON.stringify(tables)),
          generated_sql: generatedSQL || null
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Schema Updated", description: `"${name}" updated successfully` });
      await fetchSchemas();
    } catch (error) {
      console.error("Error updating schema:", error);
      toast({ title: "Error", description: "Failed to update schema", variant: "destructive" });
    }
  };

  const deleteSchema = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_schemas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Schema Deleted", description: "Schema deleted successfully" });
      await fetchSchemas();
    } catch (error) {
      console.error("Error deleting schema:", error);
      toast({ title: "Error", description: "Failed to delete schema", variant: "destructive" });
    }
  };

  return {
    schemas,
    isLoading,
    saveSchema,
    updateSchema,
    deleteSchema,
    refreshSchemas: fetchSchemas
  };
};
