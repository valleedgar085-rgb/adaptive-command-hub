import { useState, useRef } from "react";
import { Database, Play, Copy, Check, Plus, Trash2, Table2, Key, Save, FolderOpen, Loader2, Upload, Download, ChevronDown, ChevronUp, FileText, FileCode, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { CodeBlock } from "./CodeBlock";
import { useSavedSchemas } from "@/hooks/useSavedSchemas";
import { Textarea } from "@/components/ui/textarea";

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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSQL, setImportSQL] = useState("");
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  const [columnsExpanded, setColumnsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { schemas, isLoading, saveSchema, updateSchema, deleteSchema } = useSavedSchemas();

  const toggleTableExpanded = (index: number) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addColumn = () => {
    setCurrentTable(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { name: "", type: "text", nullable: true, primaryKey: false, defaultValue: "" }
      ]
    }));
    setColumnsExpanded(true);
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
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
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
    setExpandedTables(new Set());
  };

  // Parse SQL to extract tables
  const parseSQL = (sql: string): Table[] => {
    const tables: Table[] = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
    
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];
      const columns: Column[] = [];
      
      // Parse columns
      const columnLines = columnsStr.split(',').map(line => line.trim()).filter(line => line && !line.startsWith('CONSTRAINT') && !line.startsWith('PRIMARY KEY') && !line.startsWith('FOREIGN KEY'));
      
      for (const line of columnLines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const name = parts[0].replace(/["`]/g, '');
          let type = parts[1].toLowerCase();
          
          // Normalize type
          if (type.startsWith('varchar')) type = 'varchar(255)';
          else if (type === 'timestamptz' || type.includes('timestamp')) type = 'timestamp with time zone';
          else if (!SQL_TYPES.includes(type)) type = 'text';
          
          columns.push({
            name,
            type,
            nullable: !line.toUpperCase().includes('NOT NULL'),
            primaryKey: line.toUpperCase().includes('PRIMARY KEY'),
            defaultValue: line.match(/DEFAULT\s+(.+?)(?:,|$)/i)?.[1]?.trim() || ""
          });
        }
      }
      
      if (columns.length > 0) {
        tables.push({ name: tableName, columns });
      }
    }
    
    return tables;
  };

  const handleImportSQL = () => {
    if (!importSQL.trim()) {
      toast({ title: "Error", description: "Please paste SQL content", variant: "destructive" });
      return;
    }
    
    const parsedTables = parseSQL(importSQL);
    if (parsedTables.length === 0) {
      toast({ title: "No Tables Found", description: "Could not parse any CREATE TABLE statements", variant: "destructive" });
      return;
    }
    
    setTables(prev => [...prev, ...parsedTables]);
    setImportSQL("");
    setShowImportDialog(false);
    toast({ title: "Import Successful", description: `Imported ${parsedTables.length} table(s)` });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportSQL(content);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const downloadSchema = (format: 'sql' | 'json') => {
    let content: string;
    let filename: string;
    let mimeType: string;
    
    if (format === 'sql') {
      content = generatedSQL || "-- No SQL generated yet";
      filename = `${schemaName || 'schema'}_${Date.now()}.sql`;
      mimeType = 'text/plain';
    } else {
      content = JSON.stringify({ name: schemaName, description: schemaDescription, tables, generatedSQL }, null, 2);
      filename = `${schemaName || 'schema'}_${Date.now()}.json`;
      mimeType = 'application/json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: `Schema saved as ${filename}` });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-ai flex items-center justify-center shadow-lg">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    SQL Database Builder
                    {schemaName && <span className="text-muted-foreground font-normal ml-2">- {schemaName}</span>}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Design your database schema visually
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="h-8 text-xs">
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)} className="h-8 text-xs">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  Load
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} disabled={tables.length === 0} className="h-8 text-xs">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNewSchema} className="h-8 text-xs">
                  New
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-0 h-[60vh]">
            {/* Left: Table Builder */}
            <div className="border-r border-border/50 flex flex-col">
              <div className="p-3 border-b border-border/50 bg-muted/20">
                <Label className="text-xs font-semibold mb-1.5 block">Table Name</Label>
                <Input
                  placeholder="e.g., posts, comments, products"
                  value={currentTable.name}
                  onChange={(e) => setCurrentTable(prev => ({ ...prev, name: e.target.value }))}
                  className="mb-2 h-8 text-sm"
                />
                <Button onClick={addColumn} variant="outline" size="sm" className="w-full h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Column
                </Button>
              </div>

              {/* Collapsible Columns Section */}
              <Collapsible open={columnsExpanded} onOpenChange={setColumnsExpanded} className="flex-1 flex flex-col min-h-0">
                <CollapsibleTrigger className="flex items-center justify-between p-2 bg-muted/30 border-b border-border/30 hover:bg-muted/40 transition-colors">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Columns className="h-3.5 w-3.5" />
                    Columns ({currentTable.columns.length})
                  </span>
                  {columnsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="flex-1 min-h-0">
                  <ScrollArea className="h-[180px]">
                    <div className="p-2 space-y-2">
                      {currentTable.columns.map((col, index) => (
                        <div key={index} className="p-2 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Input
                              placeholder="Column name"
                              value={col.name}
                              onChange={(e) => updateColumn(index, "name", e.target.value)}
                              className="flex-1 h-7 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(index)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Select value={col.type} onValueChange={(v) => updateColumn(index, "type", v)}>
                              <SelectTrigger className="h-7 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SQL_TYPES.map(type => (
                                  <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Default"
                              value={col.defaultValue}
                              onChange={(e) => updateColumn(index, "defaultValue", e.target.value)}
                              className="h-7 text-xs w-20"
                            />
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <label className="flex items-center gap-1">
                              <Switch
                                checked={col.primaryKey}
                                onCheckedChange={(v) => updateColumn(index, "primaryKey", v)}
                                className="scale-[0.6]"
                              />
                              <Key className="h-3 w-3" />
                              PK
                            </label>
                            <label className="flex items-center gap-1">
                              <Switch
                                checked={!col.nullable}
                                onCheckedChange={(v) => updateColumn(index, "nullable", !v)}
                                className="scale-[0.6]"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                      ))}
                      {currentTable.columns.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground text-xs">
                          No columns added yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>

              {/* Collapsible Added Tables */}
              {tables.length > 0 && (
                <div className="border-t border-border/50 max-h-[150px] overflow-hidden">
                  <div className="p-2 bg-muted/20">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Added Tables ({tables.length})</Label>
                    <ScrollArea className="h-[100px]">
                      <div className="space-y-1.5">
                        {tables.map((t, i) => (
                          <Collapsible key={i} open={expandedTables.has(i)} onOpenChange={() => toggleTableExpanded(i)}>
                            <div className="flex items-center gap-1.5 p-1.5 bg-primary/10 rounded text-xs">
                              <CollapsibleTrigger className="flex items-center gap-1 flex-1 hover:text-primary transition-colors">
                                {expandedTables.has(i) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                <Table2 className="h-3 w-3" />
                                <span className="font-medium">{t.name}</span>
                                <span className="text-muted-foreground">({t.columns.length} cols)</span>
                              </CollapsibleTrigger>
                              <button onClick={() => removeTable(i)} className="text-destructive hover:text-destructive/80 p-0.5">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <CollapsibleContent>
                              <div className="pl-4 py-1 space-y-0.5">
                                {t.columns.map((col, ci) => (
                                  <div key={ci} className="text-xs text-muted-foreground flex items-center gap-1">
                                    {col.primaryKey && <Key className="h-2.5 w-2.5 text-primary" />}
                                    <span>{col.name}</span>
                                    <span className="opacity-60">({col.type})</span>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-border/50 bg-muted/20 space-y-1.5 mt-auto">
                <Button onClick={addTable} className="w-full h-8 text-xs" disabled={!currentTable.name || currentTable.columns.length === 0}>
                  <Table2 className="h-3.5 w-3.5 mr-1.5" />
                  Add Table
                </Button>
                <Button onClick={generateSQL} variant="secondary" className="w-full h-8 text-xs" disabled={tables.length === 0}>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Generate SQL
                </Button>
              </div>
            </div>

            {/* Right: SQL Preview */}
            <div className="flex flex-col">
              <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-semibold">Generated SQL</span>
                <div className="flex items-center gap-1">
                  {generatedSQL && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => downloadSchema('sql')} className="h-7 px-2">
                        <Download className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">.sql</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadSchema('json')} className="h-7 px-2">
                        <FileCode className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">.json</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copySQL} className="h-7 w-7 p-0">
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <ScrollArea className="flex-1">
                {generatedSQL ? (
                  <div className="p-3">
                    <CodeBlock code={generatedSQL} language="sql" showLineNumbers={false} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                    <Database className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-xs">Add tables and click "Generate SQL" to see the output</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import SQL Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import SQL Schema
            </DialogTitle>
            <DialogDescription>Paste SQL or upload a .sql file to import tables</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,.txt"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Upload .sql File
              </Button>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Or paste SQL directly:</Label>
              <Textarea
                value={importSQL}
                onChange={(e) => setImportSQL(e.target.value)}
                placeholder="CREATE TABLE public.users (&#10;  id uuid PRIMARY KEY,&#10;  name text NOT NULL,&#10;  ...&#10;);"
                className="mt-1.5 h-48 font-mono text-xs"
              />
            </div>
            <Button onClick={handleImportSQL} className="w-full" disabled={!importSQL.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Tables
            </Button>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSchema(schema.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-destructive"
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
