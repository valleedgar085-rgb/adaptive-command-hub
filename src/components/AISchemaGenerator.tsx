import { useState } from "react";
import { Sparkles, Loader2, Wand2, Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
  foreignKey?: string;
  unique?: boolean;
  index?: boolean;
}

interface Table {
  name: string;
  columns: Column[];
}

interface AISchemaGeneratorProps {
  existingTables: Table[];
  onSchemaGenerated: (tables: Table[]) => void;
}

const EXAMPLE_PROMPTS = [
  "E-commerce platform with products, orders, customers, and reviews",
  "Social media app with users, posts, comments, likes, and followers",
  "Project management tool with projects, tasks, teams, and comments",
  "Blog platform with authors, articles, categories, and tags",
  "SaaS subscription system with plans, subscriptions, invoices, and usage",
  "Healthcare app with patients, doctors, appointments, and medical records",
];

export const AISchemaGenerator = ({ existingTables, onSchemaGenerated }: AISchemaGeneratorProps) => {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState<{ tables: Table[]; explanation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSchema = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe the database you want to create",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedSchema(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("Please sign in to use AI generation");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sql`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            description,
            existingTables: existingTables.map(t => ({ name: t.name, columns: t.columns.map(c => c.name) })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate schema");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.tables || !Array.isArray(data.tables)) {
        throw new Error("Invalid schema response");
      }

      setGeneratedSchema(data);
      toast({
        title: "Schema generated!",
        description: `Created ${data.tables.length} table(s) successfully`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate schema";
      setError(message);
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applySchema = () => {
    if (generatedSchema?.tables) {
      onSchemaGenerated(generatedSchema.tables);
      toast({
        title: "Schema applied!",
        description: `Added ${generatedSchema.tables.length} table(s) to your builder`,
      });
      setGeneratedSchema(null);
      setDescription("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Schema Generator</h3>
          <p className="text-xs text-muted-foreground">Describe your database and let AI create the schema</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-3">
        <Label htmlFor="description" className="text-sm font-medium">
          Describe your database
        </Label>
        <Textarea
          id="description"
          placeholder="e.g., A task management app with projects, tasks, team members, and comments. Include user authentication and activity tracking."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
          disabled={isGenerating}
        />
        
        {/* Example Prompts */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick examples:</Label>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((prompt, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
                onClick={() => setDescription(prompt)}
              >
                {prompt.split(" ").slice(0, 3).join(" ")}...
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={generateSchema}
          disabled={isGenerating || !description.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Schema...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Schema
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Schema Preview */}
      {generatedSchema && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle className="text-base">Generated Schema</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {generatedSchema.tables.length} tables
              </Badge>
            </div>
            {generatedSchema.explanation && (
              <CardDescription className="text-xs mt-1">
                {generatedSchema.explanation}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-2">
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {generatedSchema.tables.map((table, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="font-mono font-medium text-sm">{table.name}</span>
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {table.columns.length} cols
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {table.columns.slice(0, 6).map((col, colIndex) => (
                        <Badge
                          key={colIndex}
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
                          {col.name}
                          {col.primaryKey && " 🔑"}
                          {col.foreignKey && " →"}
                        </Badge>
                      ))}
                      {table.columns.length > 6 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{table.columns.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGeneratedSchema(null)}
              >
                Discard
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={applySchema}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply Schema
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Tables Info */}
      {existingTables.length > 0 && (
        <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
          <span className="font-medium">Context:</span> AI will consider your {existingTables.length} existing table(s) when generating relationships.
        </div>
      )}
    </div>
  );
};
