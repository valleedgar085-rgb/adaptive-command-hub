import { useState } from "react";
import { Database, Play, Copy, Check, Plus, Trash2, Table2, Key, Save, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CodeBlock } from "./CodeBlock";
import { useSavedSchemas } from "@/hooks/useSavedSchemas";

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

interface SQLDatabaseBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateSQL?: (sql: string) => void;
}

const SQL_TYPES = [
  "uuid", "text", "integer", "bigint", "boolean", "timestamp with time zone",
  "jsonb", "varchar(255)", "numeric", "date", "time"
];

export const SQLDatabaseBuilder = ({ open, onOpenChange, onGenerateSQL }: SQLDatabaseBuilderProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTable, setCurrentTable] = useState<Table>({ name: "", columns: [] });
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [copied, setCopied] = useState(false);
  const [schemaName, setSchemaName] = useState("");
  const [schemaDescription, setSchemaDescription] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const { toast } = useToast();
  const { schemas, isLoading, saveSchema, updateSchema, deleteSchema } = useSavedSchemas();

  const addColumn = () => {
    setCurrentTable(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { name: "", type: "text", nullable: true, primaryKey: false, defaultValue: "" }
      ]
    }));
  };

  const updateColumn = (index: number, field: keyof Column, value: any) => {
    setCurrentTable(prev => ({
      ...prev,
      columns: prev.columns.map((col, i) => i === index ? { ...col, [field]: value } : col)
    }));
  };

  const removeColumn = (index: number) => {
    setCurrentTable(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const addTable = () => {
    if (!currentTable.name.trim()) {
      toast({ title: "Error", description: "Table name is required", variant: "destructive" });
      return;
    }
    if (currentTable.columns.length === 0) {
      toast({ title: "Error", description: "Add at least one column", variant: "destructive" });
      return;
    }
    setTables(prev => [...prev, currentTable]);
    setCurrentTable({ name: "", columns: [] });
    toast({ title: "Table Added", description: `Table "${currentTable.name}" added successfully` });
  };

  const removeTable = (index: number) => {
    setTables(prev => prev.filter((_, i) => i !== index));
  };

  const generateSQL = () => {
    let sql = "";
    
    for (const table of tables) {
      sql += `-- Create table: ${table.name}\n`;
      sql += `CREATE TABLE public.${table.name} (\n`;
      
      const columnDefs = table.columns.map(col => {
        let def = `  ${col.name} ${col.type.toUpperCase()}`;
        if (!col.nullable) def += " NOT NULL";
        if (col.primaryKey) def += " PRIMARY KEY";
        if (col.defaultValue) def += ` DEFAULT ${col.defaultValue}`;
        return def;
      });
      
      sql += columnDefs.join(",\n");
      sql += "\n);\n\n";
      
      sql += `-- Enable Row Level Security\n`;
      sql += `ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;\n\n`;
      
      sql += `-- Create RLS policies\n`;
      sql += `CREATE POLICY "Users can view their own ${table.name}"\n`;
      sql += `ON public.${table.name}\n`;
      sql += `FOR SELECT\n`;
      sql += `USING (auth.uid() = user_id);\n\n`;
      
      sql += `CREATE POLICY "Users can create their own ${table.name}"\n`;
      sql += `ON public.${table.name}\n`;
      sql += `FOR INSERT\n`;
      sql += `WITH CHECK (auth.uid() = user_id);\n\n`;
      
      sql += `CREATE POLICY "Users can update their own ${table.name}"\n`;
      sql += `ON public.${table.name}\n`;
      sql += `FOR UPDATE\n`;
      sql += `USING (auth.uid() = user_id);\n\n`;
      
      sql += `CREATE POLICY "Users can delete their own ${table.name}"\n`;
      sql += `ON public.${table.name}\n`;
      sql += `FOR DELETE\n`;
      sql += `USING (auth.uid() = user_id);\n\n`;
    }
    
    setGeneratedSQL(sql);
    if (onGenerateSQL) onGenerateSQL(sql);
  };

  const copySQL = async () => {
    await navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "SQL copied to clipboard" });
  };

  const handleSaveSchema = async () => {
    if (!schemaName.trim()) {
      toast({ title: "Error", description: "Schema name is required", variant: "destructive" });
      return;
    }
    
    if (currentSchemaId) {
      await updateSchema(currentSchemaId, schemaName, schemaDescription, tables, generatedSQL);
    } else {
      const result = await saveSchema(schemaName, schemaDescription, tables, generatedSQL);
      if (result) setCurrentSchemaId(result.id);
    }
    setShowSaveDialog(false);
  };

  const handleLoadSchema = (schema: typeof schemas[0]) => {
    setTables(schema.tables);
    setGeneratedSQL(schema.generated_sql || "");
    setSchemaName(schema.name);
    setSchemaDescription(schema.description || "");
    setCurrentSchemaId(schema.id);
    setShowLoadDialog(false);
    toast({ title: "Schema Loaded", description: `"${schema.name}" loaded successfully` });
  };

  const handleNewSchema = () => {
    setTables([]);
    setCurrentTable({ name: "", columns: [] });
    setGeneratedSQL("");
    setSchemaName("");
    setSchemaDescription("");
    setCurrentSchemaId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-ai flex items-center justify-center shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    SQL Database Builder
                    {schemaName && <span className="text-muted-foreground font-normal ml-2">- {schemaName}</span>}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1">
                    Design your database schema visually and generate SQL
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} disabled={tables.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNewSchema}>
                  New
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-0 h-[60vh]">
            {/* Left: Table Builder */}
            <div className="border-r border-border/50 flex flex-col">
              <div className="p-4 border-b border-border/50 bg-muted/20">
                <Label className="text-sm font-semibold mb-2 block">Table Name</Label>
                <Input
                  placeholder="e.g., posts, comments, products"
                  value={currentTable.name}
                  onChange={(e) => setCurrentTable(prev => ({ ...prev, name: e.target.value }))}
                  className="mb-3"
                />
                <Button onClick={addColumn} variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {currentTable.columns.map((col, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Column name"
                          value={col.name}
                          onChange={(e) => updateColumn(index, "name", e.target.value)}
                          className="flex-1 h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={col.type} onValueChange={(v) => updateColumn(index, "type", v)}>
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SQL_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Default"
                          value={col.defaultValue}
                          onChange={(e) => updateColumn(index, "defaultValue", e.target.value)}
                          className="h-8 text-xs w-24"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-1.5">
                          <Switch
                            checked={col.primaryKey}
                            onCheckedChange={(v) => updateColumn(index, "primaryKey", v)}
                            className="scale-75"
                          />
                          <Key className="h-3 w-3" />
                          Primary
                        </label>
                        <label className="flex items-center gap-1.5">
                          <Switch
                            checked={!col.nullable}
                            onCheckedChange={(v) => updateColumn(index, "nullable", !v)}
                            className="scale-75"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/50 bg-muted/20 space-y-2">
                {/* Show added tables */}
                {tables.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Added Tables:</Label>
                    <div className="flex flex-wrap gap-1">
                      {tables.map((t, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs">
                          <Table2 className="h-3 w-3" />
                          {t.name}
                          <button onClick={() => removeTable(i)} className="ml-1 text-destructive hover:text-destructive/80">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={addTable} className="w-full" disabled={!currentTable.name || currentTable.columns.length === 0}>
                  <Table2 className="h-4 w-4 mr-2" />
                  Add Table ({tables.length} tables)
                </Button>
                <Button onClick={generateSQL} variant="secondary" className="w-full" disabled={tables.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Generate SQL
                </Button>
              </div>
            </div>

            {/* Right: SQL Preview */}
            <div className="flex flex-col">
              <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <span className="text-sm font-semibold">Generated SQL</span>
                {generatedSQL && (
                  <Button variant="ghost" size="sm" onClick={copySQL}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <ScrollArea className="flex-1">
                {generatedSQL ? (
                  <div className="p-4">
                    <CodeBlock code={generatedSQL} language="sql" showLineNumbers={false} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                    <Database className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-sm">Add tables and click "Generate SQL" to see the output</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Schema Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Schema</DialogTitle>
            <DialogDescription>Save your database schema for later use</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Schema Name</Label>
              <Input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="e.g., E-commerce Database"
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                placeholder="Brief description of this schema"
              />
            </div>
            <Button onClick={handleSaveSchema} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {currentSchemaId ? "Update Schema" : "Save Schema"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Schema Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load Schema</DialogTitle>
            <DialogDescription>Select a saved schema to load</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : schemas.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No saved schemas yet</p>
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {schemas.map((schema) => (
                  <div
                    key={schema.id}
                    className="p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => handleLoadSchema(schema)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{schema.name}</h4>
                        {schema.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{schema.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {schema.tables.length} table{schema.tables.length !== 1 ? "s" : ""} •{" "}
                          {new Date(schema.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSchema(schema.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
