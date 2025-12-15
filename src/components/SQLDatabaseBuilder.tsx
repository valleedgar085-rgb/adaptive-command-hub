import { useState, useRef } from "react";
import { Database, Play, Copy, Check, Plus, Trash2, Table2, Key, Save, FolderOpen, Loader2, Upload, Download, ChevronDown, ChevronUp, FileText, FileCode, Columns, GitBranch, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSavedSchemas } from "@/hooks/useSavedSchemas";
import { SchemaRelationshipDiagram } from "./SchemaRelationshipDiagram";

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
  const [activeTab, setActiveTab] = useState("builder");
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
      columns: [...prev.columns, { name: "", type: "text", nullable: true, primaryKey: false, defaultValue: "" }]
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
    setTables(prev => [...prev, { ...currentTable }]);
    setCurrentTable({ name: "", columns: [] });
    setExpandedTables(prev => new Set([...prev, tables.length]));
  };

  const removeTable = (index: number) => {
    setTables(prev => prev.filter((_, i) => i !== index));
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  // Generate well-formatted, readable SQL
  const generateSQL = () => {
    if (tables.length === 0) {
      toast({ title: "Error", description: "Add at least one table first", variant: "destructive" });
      return;
    }

    const lines: string[] = [];
    const indent = "    ";
    
    // Header comment
    lines.push("-- ==========================================================");
    lines.push(`-- Database Schema: ${schemaName || "Untitled Schema"}`);
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push("-- ==========================================================");
    lines.push("");

    for (const table of tables) {
      // Table header
      lines.push(`-- ----------------------------------------------------------`);
      lines.push(`-- Table: ${table.name}`);
      lines.push(`-- ----------------------------------------------------------`);
      lines.push("");
      lines.push(`CREATE TABLE public.${table.name} (`);
      
      const columnLines: string[] = [];
      const constraints: string[] = [];
      
      for (const col of table.columns) {
        let def = `${indent}${col.name.padEnd(20)} ${col.type.toUpperCase()}`;
        
        if (!col.nullable) {
          def += " NOT NULL";
        }
        
        if (col.defaultValue) {
          if (col.defaultValue.includes("(") || col.defaultValue === "now()" || col.defaultValue === "gen_random_uuid()") {
            def += ` DEFAULT ${col.defaultValue}`;
          } else if (col.type === "text" || col.type.startsWith("varchar")) {
            def += ` DEFAULT '${col.defaultValue}'`;
          } else {
            def += ` DEFAULT ${col.defaultValue}`;
          }
        }
        
        columnLines.push(def);
        
        // Collect primary key constraint
        if (col.primaryKey) {
          constraints.push(`${indent}PRIMARY KEY (${col.name})`);
        }
        
        // Collect foreign key constraint
        if (col.foreignKey) {
          const [refTable, refCol] = col.foreignKey.split(".");
          constraints.push(`${indent}FOREIGN KEY (${col.name}) REFERENCES public.${refTable}(${refCol || "id"}) ON DELETE CASCADE`);
        }
      }
      
      // Combine columns and constraints
      const allDefs = [...columnLines, ...constraints];
      lines.push(allDefs.join(",\n"));
      lines.push(");");
      lines.push("");
      
      // Enable RLS
      lines.push(`-- Enable Row Level Security`);
      lines.push(`ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;`);
      lines.push("");
      
      // Add index for foreign keys
      const fkColumns = table.columns.filter(c => c.foreignKey);
      if (fkColumns.length > 0) {
        lines.push(`-- Indexes for foreign keys`);
        for (const col of fkColumns) {
          lines.push(`CREATE INDEX idx_${table.name}_${col.name} ON public.${table.name}(${col.name});`);
        }
        lines.push("");
      }
    }
    
    // Add comment footer
    lines.push("-- ==========================================================");
    lines.push("-- End of Schema");
    lines.push("-- ==========================================================");

    const sql = lines.join("\n");
    setGeneratedSQL(sql);
    onGenerateSQL?.(sql);
    toast({ title: "SQL Generated", description: "SQL code has been generated successfully" });
  };

  const copySQL = async () => {
    await navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "SQL copied to clipboard" });
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
    const parsedTables: Table[] = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
    
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];
      const columns: Column[] = [];
      
      const columnLines = columnsStr.split(",").map(line => line.trim()).filter(line => 
        line && 
        !line.toUpperCase().startsWith("CONSTRAINT") && 
        !line.toUpperCase().startsWith("PRIMARY KEY") && 
        !line.toUpperCase().startsWith("FOREIGN KEY") &&
        !line.toUpperCase().startsWith("UNIQUE") &&
        !line.toUpperCase().startsWith("CHECK")
      );
      
      for (const line of columnLines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const colName = parts[0].replace(/"/g, "");
          let colType = parts[1].toLowerCase();
          
          // Normalize type
          if (colType === "timestamp" && parts[2]?.toLowerCase() === "with") {
            colType = "timestamp with time zone";
          }
          
          const fullLine = line.toUpperCase();
          const isPrimaryKey = fullLine.includes("PRIMARY KEY");
          const isNotNull = fullLine.includes("NOT NULL");
          
          let defaultValue = "";
          const defaultMatch = line.match(/DEFAULT\s+([^\s,]+(?:\([^)]*\))?)/i);
          if (defaultMatch) {
            defaultValue = defaultMatch[1].replace(/^'|'$/g, "");
          }
          
          // Extract foreign key reference
          let foreignKey = "";
          const refMatch = line.match(/REFERENCES\s+(?:public\.)?(\w+)\((\w+)\)/i);
          if (refMatch) {
            foreignKey = `${refMatch[1]}.${refMatch[2]}`;
          }
          
          columns.push({
            name: colName,
            type: colType,
            nullable: !isNotNull,
            primaryKey: isPrimaryKey,
            defaultValue,
            foreignKey
          });
        }
      }
      
      if (columns.length > 0) {
        parsedTables.push({ name: tableName, columns });
      }
    }
    
    return parsedTables;
  };

  const handleImportSQL = () => {
    if (!importSQL.trim()) {
      toast({ title: "Error", description: "Please paste SQL to import", variant: "destructive" });
      return;
    }
    
    const parsedTables = parseSQL(importSQL);
    if (parsedTables.length === 0) {
      toast({ title: "Error", description: "Could not parse any tables from the SQL", variant: "destructive" });
      return;
    }
    
    setTables(parsedTables);
    setShowImportDialog(false);
    setImportSQL("");
    toast({ title: "Import Successful", description: `Imported ${parsedTables.length} table(s)` });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportSQL(content);
    };
    reader.readAsText(file);
  };

  const downloadSQL = (format: "sql" | "json") => {
    let content: string;
    let filename: string;
    let mimeType: string;
    
    if (format === "sql") {
      content = generatedSQL;
      filename = `${schemaName || "schema"}.sql`;
      mimeType = "text/plain";
    } else {
      content = JSON.stringify({ name: schemaName, description: schemaDescription, tables, sql: generatedSQL }, null, 2);
      filename = `${schemaName || "schema"}.json`;
      mimeType = "application/json";
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: `Schema saved as ${filename}` });
  };

  // Get all table names for foreign key selection
  const allTableColumns = tables.flatMap(t => 
    t.columns.filter(c => c.primaryKey).map(c => `${t.name}.${c.name}`)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 pb-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50 shrink-0">
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
                    Design your database schema visually with relationships
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-4 mt-2 w-fit shrink-0">
              <TabsTrigger value="builder" className="text-xs gap-1.5">
                <Table2 className="h-3.5 w-3.5" />
                Table Builder
              </TabsTrigger>
              <TabsTrigger value="diagram" className="text-xs gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Relationship Diagram
              </TabsTrigger>
              <TabsTrigger value="sql" className="text-xs gap-1.5">
                <Code className="h-3.5 w-3.5" />
                Generated SQL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="flex-1 min-h-0 m-0 p-4 pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                {/* Left: Table Builder */}
                <div className="border border-border/50 rounded-lg flex flex-col overflow-hidden bg-card">
                  <div className="p-3 border-b border-border/50 bg-muted/20 shrink-0">
                    <Label className="text-xs font-semibold mb-1.5 block">Create New Table</Label>
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

                  {/* Columns Section */}
                  <Collapsible open={columnsExpanded} onOpenChange={setColumnsExpanded} className="flex-1 flex flex-col min-h-0">
                    <CollapsibleTrigger className="flex items-center justify-between p-2 bg-muted/30 border-b border-border/30 hover:bg-muted/40 transition-colors shrink-0">
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        <Columns className="h-3.5 w-3.5" />
                        Columns ({currentTable.columns.length})
                      </span>
                      {columnsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full max-h-[200px]">
                        <div className="p-2 space-y-2">
                          {currentTable.columns.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              No columns yet. Click "Add Column" to start.
                            </p>
                          )}
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
                              <div className="grid grid-cols-2 gap-1.5">
                                <Select value={col.type} onValueChange={(v) => updateColumn(index, "type", v)}>
                                  <SelectTrigger className="h-7 text-xs">
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
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Switch
                                    checked={col.primaryKey}
                                    onCheckedChange={(v) => updateColumn(index, "primaryKey", v)}
                                    className="scale-75"
                                  />
                                  <Key className="h-3 w-3 text-amber-500" />
                                  PK
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Switch
                                    checked={!col.nullable}
                                    onCheckedChange={(v) => updateColumn(index, "nullable", !v)}
                                    className="scale-75"
                                  />
                                  Required
                                </label>
                              </div>
                              {/* Foreign Key Selection */}
                              {allTableColumns.length > 0 && (
                                <Select
                                  value={col.foreignKey || "none"}
                                  onValueChange={(v) => updateColumn(index, "foreignKey", v === "none" ? "" : v)}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue placeholder="Foreign Key (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" className="text-xs">No Foreign Key</SelectItem>
                                    {allTableColumns.map(ref => (
                                      <SelectItem key={ref} value={ref} className="text-xs">{ref}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="p-3 border-t border-border/50 bg-muted/20 shrink-0">
                    <Button
                      onClick={addTable}
                      disabled={!currentTable.name.trim() || currentTable.columns.length === 0}
                      className="w-full h-8 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Table to Schema
                    </Button>
                  </div>
                </div>

                {/* Right: Tables List */}
                <div className="border border-border/50 rounded-lg flex flex-col overflow-hidden bg-card">
                  <div className="p-3 border-b border-border/50 bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Tables in Schema ({tables.length})</Label>
                      <Button onClick={generateSQL} disabled={tables.length === 0} size="sm" className="h-7 text-xs">
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Generate SQL
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                      {tables.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No tables yet. Create your first table using the builder on the left.
                        </p>
                      )}
                      {tables.map((table, index) => (
                        <Collapsible
                          key={index}
                          open={expandedTables.has(index)}
                          onOpenChange={() => toggleTableExpanded(index)}
                        >
                          <div className="rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
                            <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <Table2 className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{table.name}</span>
                                <span className="text-xs text-muted-foreground">({table.columns.length} cols)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); removeTable(index); }}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                {expandedTables.has(index) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t border-border/30 p-2 space-y-1">
                                {table.columns.map((col, colIndex) => (
                                  <div key={colIndex} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-background/50">
                                    {col.primaryKey && <Key className="h-3 w-3 text-amber-500" />}
                                    <span className="font-mono">{col.name}</span>
                                    <span className="text-muted-foreground">{col.type}</span>
                                    {!col.nullable && <span className="text-destructive text-[10px]">NOT NULL</span>}
                                    {col.foreignKey && (
                                      <span className="text-primary text-[10px]">→ {col.foreignKey}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagram" className="flex-1 min-h-0 m-0 p-4 pt-2">
              <div className="h-full border border-border/50 rounded-lg overflow-hidden bg-card">
                <SchemaRelationshipDiagram tables={tables} />
              </div>
            </TabsContent>

            <TabsContent value="sql" className="flex-1 min-h-0 m-0 p-4 pt-2">
              <div className="h-full flex flex-col border border-border/50 rounded-lg overflow-hidden bg-card">
                <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/20 shrink-0">
                  <Label className="text-xs font-semibold">Generated SQL Code</Label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSQL("sql")}
                      disabled={!generatedSQL}
                      className="h-7 text-xs"
                    >
                      <FileCode className="h-3.5 w-3.5 mr-1.5" />
                      .sql
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSQL("json")}
                      disabled={!generatedSQL}
                      className="h-7 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      .json
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copySQL}
                      disabled={!generatedSQL}
                      className="h-7 text-xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {generatedSQL ? (
                    <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre text-foreground">
                      {generatedSQL}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Click "Generate SQL" to see your schema code</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Save Schema</DialogTitle>
            <DialogDescription className="text-xs">Save your schema to load it later</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Schema Name *</Label>
              <Input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="My Database Schema"
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                placeholder="Optional description..."
                className="text-sm mt-1 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveSchema}>{currentSchemaId ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Load Schema</DialogTitle>
            <DialogDescription className="text-xs">Select a saved schema to load</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : schemas.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No saved schemas</p>
            ) : (
              <div className="space-y-2 pr-2">
                {schemas.map(schema => (
                  <div
                    key={schema.id}
                    className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLoadSchema(schema)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{schema.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); deleteSchema(schema.id); }}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {schema.description && (
                      <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {schema.tables.length} table(s) • Updated {new Date(schema.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Import SQL Schema</DialogTitle>
            <DialogDescription className="text-xs">Paste SQL or upload a .sql file</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
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
                className="w-full h-8 text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload .sql File
              </Button>
            </div>
            <div>
              <Label className="text-xs">Or paste SQL directly:</Label>
              <Textarea
                value={importSQL}
                onChange={(e) => setImportSQL(e.target.value)}
                placeholder="CREATE TABLE public.users (..."
                className="text-xs font-mono mt-1 resize-none"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleImportSQL}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
