import { useState, useRef, useCallback } from "react";
import { 
  Database, Play, Copy, Check, Plus, Trash2, Table2, Key, Save, 
  FolderOpen, Loader2, Upload, Download, ChevronDown, ChevronUp, 
  FileText, FileCode, Columns, GitBranch, Code, Sparkles, Zap,
  Users, ShoppingCart, FileStack, Calendar, MessageSquare, Settings
} from "lucide-react";
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

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// Constants & Templates
// ═══════════════════════════════════════════════════════════════════════════════

const SQL_TYPES = [
  "uuid", "text", "integer", "bigint", "boolean", "timestamp with time zone",
  "jsonb", "varchar(255)", "numeric", "date", "time", "serial", "smallint"
];

const DEFAULT_COLUMN: Column = {
  name: "",
  type: "text",
  nullable: true,
  primaryKey: false,
  defaultValue: ""
};

// Quick Builder Templates - Pre-built table structures
const QUICK_TEMPLATES = {
  users: {
    name: "users",
    icon: Users,
    description: "User accounts with authentication",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "email", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "username", type: "varchar(255)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "avatar_url", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  posts: {
    name: "posts",
    icon: FileStack,
    description: "Blog posts or articles",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "title", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "content", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "published", type: "boolean", nullable: false, primaryKey: false, defaultValue: "false" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  products: {
    name: "products",
    icon: ShoppingCart,
    description: "E-commerce products",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "name", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "price", type: "numeric", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "stock", type: "integer", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "image_url", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  events: {
    name: "events",
    icon: Calendar,
    description: "Calendar events or schedules",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "title", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "start_time", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "end_time", type: "timestamp with time zone", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "location", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  comments: {
    name: "comments",
    icon: MessageSquare,
    description: "User comments or feedback",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "content", type: "text", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "parent_id", type: "uuid", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  settings: {
    name: "settings",
    icon: Settings,
    description: "App configuration settings",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "key", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "value", type: "jsonb", nullable: true, primaryKey: false, defaultValue: "'{}'" },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

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

  // Toggle table expansion
  const toggleTableExpanded = (index: number) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // Quick Builder - Add template tables instantly
  const addQuickTemplate = useCallback((templateKey: keyof typeof QUICK_TEMPLATES) => {
    const template = QUICK_TEMPLATES[templateKey];
    const existingNames = tables.map(t => t.name);
    
    if (existingNames.includes(template.name)) {
      toast({ title: "Table Exists", description: `"${template.name}" already in schema`, variant: "destructive" });
      return;
    }
    
    setTables(prev => [...prev, { name: template.name, columns: [...template.columns] }]);
    setExpandedTables(prev => new Set([...prev, tables.length]));
    toast({ title: "Quick Add", description: `"${template.name}" table added` });
  }, [tables, toast]);

  // Column operations
  const addColumn = () => {
    setCurrentTable(prev => ({
      ...prev,
      columns: [...prev.columns, { ...DEFAULT_COLUMN }]
    }));
  };

  const updateColumn = (index: number, field: keyof Column, value: string | boolean) => {
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

  // Table operations
  const addTable = () => {
    if (!currentTable.name.trim()) {
      toast({ title: "Error", description: "Table name is required", variant: "destructive" });
      return;
    }
    if (currentTable.columns.length === 0) {
      toast({ title: "Error", description: "Add at least one column", variant: "destructive" });
      return;
    }
    setTables(prev => [...prev, { ...currentTable }]);
    setCurrentTable({ name: "", columns: [] });
    setExpandedTables(prev => new Set([...prev, tables.length]));
    toast({ title: "Table Added", description: `"${currentTable.name}" added to schema` });
  };

  const removeTable = (index: number) => {
    const tableName = tables[index]?.name;
    setTables(prev => prev.filter((_, i) => i !== index));
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast({ title: "Table Removed", description: `"${tableName}" removed from schema` });
  };

  // Generate formatted SQL
  const generateSQL = () => {
    if (tables.length === 0) {
      toast({ title: "Error", description: "Add at least one table first", variant: "destructive" });
      return;
    }

    const lines: string[] = [];
    const indent = "    ";
    
    // Header
    lines.push("-- ══════════════════════════════════════════════════════════");
    lines.push(`-- Schema: ${schemaName || "Untitled Schema"}`);
    lines.push(`-- Generated: ${new Date().toLocaleString()}`);
    lines.push("-- ══════════════════════════════════════════════════════════");
    lines.push("");

    for (const table of tables) {
      lines.push(`-- ──────────────────────────────────────────────────────────`);
      lines.push(`-- Table: ${table.name}`);
      lines.push(`-- ──────────────────────────────────────────────────────────`);
      lines.push("");
      lines.push(`CREATE TABLE public.${table.name} (`);
      
      const columnDefs: string[] = [];
      const constraints: string[] = [];
      
      for (const col of table.columns) {
        let def = `${indent}${col.name.padEnd(24)} ${col.type.toUpperCase()}`;
        
        if (!col.nullable) def += " NOT NULL";
        
        if (col.defaultValue) {
          const needsQuotes = col.type === "text" || col.type.startsWith("varchar");
          const isFunction = col.defaultValue.includes("(") || ["now()", "gen_random_uuid()"].includes(col.defaultValue);
          def += ` DEFAULT ${isFunction ? col.defaultValue : needsQuotes ? `'${col.defaultValue}'` : col.defaultValue}`;
        }
        
        columnDefs.push(def);
        
        if (col.primaryKey) {
          constraints.push(`${indent}PRIMARY KEY (${col.name})`);
        }
        
        if (col.foreignKey) {
          const [refTable, refCol] = col.foreignKey.split(".");
          constraints.push(`${indent}FOREIGN KEY (${col.name}) REFERENCES public.${refTable}(${refCol || "id"}) ON DELETE CASCADE`);
        }
      }
      
      lines.push([...columnDefs, ...constraints].join(",\n"));
      lines.push(");");
      lines.push("");
      
      // RLS
      lines.push(`-- Enable Row Level Security`);
      lines.push(`ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;`);
      lines.push("");
      
      // Indexes for foreign keys
      const fkColumns = table.columns.filter(c => c.foreignKey);
      if (fkColumns.length > 0) {
        lines.push(`-- Foreign Key Indexes`);
        for (const col of fkColumns) {
          lines.push(`CREATE INDEX idx_${table.name}_${col.name} ON public.${table.name}(${col.name});`);
        }
        lines.push("");
      }
    }
    
    lines.push("-- ══════════════════════════════════════════════════════════");
    lines.push("-- End of Schema");
    lines.push("-- ══════════════════════════════════════════════════════════");

    const sql = lines.join("\n");
    setGeneratedSQL(sql);
    onGenerateSQL?.(sql);
    setActiveTab("sql");
    toast({ title: "SQL Generated", description: "Schema code is ready" });
  };

  const copySQL = async () => {
    await navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "SQL copied to clipboard" });
  };

  // Save/Load operations
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

  // Parse SQL for import
  const parseSQL = (sql: string): Table[] => {
    const parsedTables: Table[] = [];
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
    
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];
      const columns: Column[] = [];
      
      const columnLines = columnsStr.split(",")
        .map(line => line.trim())
        .filter(line => line && !line.toUpperCase().match(/^(CONSTRAINT|PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK)/));
      
      for (const line of columnLines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const colName = parts[0].replace(/"/g, "");
          let colType = parts[1].toLowerCase();
          
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
      toast({ title: "Error", description: "Could not parse any tables from SQL", variant: "destructive" });
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
    reader.onload = (event) => setImportSQL(event.target?.result as string);
    reader.readAsText(file);
  };

  const downloadSQL = (format: "sql" | "json") => {
    const content = format === "sql" 
      ? generatedSQL 
      : JSON.stringify({ name: schemaName, description: schemaDescription, tables, sql: generatedSQL }, null, 2);
    
    const blob = new Blob([content], { type: format === "sql" ? "text/plain" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schemaName || "schema"}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: `Schema saved as ${a.download}` });
  };

  // Get available foreign key references
  const allTableColumns = tables.flatMap(t => 
    t.columns.filter(c => c.primaryKey).map(c => `${t.name}.${c.name}`)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden glass">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-sql flex items-center justify-center shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    SQL Database Builder
                    {schemaName && (
                      <span className="text-sm font-normal text-muted-foreground">— {schemaName}</span>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-sm">
                    Design your database schema visually
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="h-9 gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)} className="h-9 gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Load
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} disabled={tables.length === 0} className="h-9 gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNewSchema} className="h-9">
                  New
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-5 mt-4 w-fit shrink-0 bg-muted/50 p-1">
              <TabsTrigger value="builder" className="gap-2 data-[state=active]:bg-card">
                <Table2 className="h-4 w-4" />
                Table Builder
              </TabsTrigger>
              <TabsTrigger value="diagram" className="gap-2 data-[state=active]:bg-card">
                <GitBranch className="h-4 w-4" />
                Relationships
              </TabsTrigger>
              <TabsTrigger value="sql" className="gap-2 data-[state=active]:bg-card">
                <Code className="h-4 w-4" />
                Generated SQL
              </TabsTrigger>
            </TabsList>

            {/* Builder Tab - Enhanced with Quick Builder */}
            <TabsContent value="builder" className="flex-1 min-h-0 m-0 p-5 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
                {/* Left Panel: Create Table */}
                <div className="border-2 border-border/50 rounded-xl flex flex-col overflow-hidden bg-card/80 shadow-lg">
                  {/* Quick Builder Section */}
                  <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <Label className="font-bold text-foreground">Quick Builder</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(QUICK_TEMPLATES).map(([key, template]) => {
                        const IconComponent = template.icon;
                        return (
                          <Button
                            key={key}
                            variant="outline"
                            size="sm"
                            onClick={() => addQuickTemplate(key as keyof typeof QUICK_TEMPLATES)}
                            className="h-auto py-2 px-3 flex flex-col items-center gap-1.5 bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-300 group"
                            title={template.description}
                          >
                            <IconComponent className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-xs font-medium capitalize">{template.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Table Creation */}
                  <div className="p-4 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Label className="font-semibold text-foreground">Create Custom Table</Label>
                    </div>
                    <Input
                      placeholder="Table name (e.g., users, posts, products)"
                      value={currentTable.name}
                      onChange={(e) => setCurrentTable(prev => ({ ...prev, name: e.target.value }))}
                      className="mb-3 h-11 bg-background/80 border-2 border-border/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/60"
                    />
                    <Button onClick={addColumn} variant="outline" size="sm" className="w-full gap-2 h-10 bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/40">
                      <Plus className="h-4 w-4" />
                      Add Column
                    </Button>
                  </div>

                  {/* Columns Section */}
                  <Collapsible open={columnsExpanded} onOpenChange={setColumnsExpanded} className="flex-1 flex flex-col min-h-0">
                    <CollapsibleTrigger className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/30 hover:bg-muted/40 transition-colors shrink-0">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Columns className="h-4 w-4 text-primary" />
                        Columns ({currentTable.columns.length})
                      </span>
                      {columnsExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex-1 min-h-0 overflow-hidden">
                      <ScrollArea className="h-full max-h-[280px]">
                        <div className="p-3 space-y-3">
                          {currentTable.columns.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              No columns yet. Click "Add Column" or use Quick Builder.
                            </p>
                          ) : (
                            currentTable.columns.map((col, index) => (
                              <div key={index} className="p-4 rounded-xl bg-background/60 border-2 border-border/50 space-y-3 animate-fade-in hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Column name"
                                    value={col.name}
                                    onChange={(e) => updateColumn(index, "name", e.target.value)}
                                    className="flex-1 h-10 bg-muted/30 border-border/50 focus:border-primary/50 text-foreground font-medium"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeColumn(index)}
                                    className="h-10 w-10 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Select value={col.type} onValueChange={(v) => updateColumn(index, "type", v)}>
                                    <SelectTrigger className="h-10 bg-muted/30 border-border/50 text-foreground">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                      {SQL_TYPES.map(type => (
                                        <SelectItem key={type} value={type} className="text-foreground">{type}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Default value"
                                    value={col.defaultValue}
                                    onChange={(e) => updateColumn(index, "defaultValue", e.target.value)}
                                    className="h-10 bg-muted/30 border-border/50 text-foreground placeholder:text-muted-foreground/50"
                                  />
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Switch
                                      checked={col.primaryKey}
                                      onCheckedChange={(v) => updateColumn(index, "primaryKey", v)}
                                    />
                                    <Key className="h-4 w-4 text-amber-500" />
                                    <span className="text-foreground/80 font-medium">Primary Key</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Switch
                                      checked={!col.nullable}
                                      onCheckedChange={(v) => updateColumn(index, "nullable", !v)}
                                    />
                                    <span className="text-foreground/80 font-medium">Required</span>
                                  </label>
                                </div>
                                {allTableColumns.length > 0 && (
                                  <Select
                                    value={col.foreignKey || "none"}
                                    onValueChange={(v) => updateColumn(index, "foreignKey", v === "none" ? "" : v)}
                                  >
                                    <SelectTrigger className="h-10 bg-muted/30 border-border/50 text-foreground">
                                      <SelectValue placeholder="Foreign Key (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                      <SelectItem value="none" className="text-foreground">No Foreign Key</SelectItem>
                                      {allTableColumns.map(ref => (
                                        <SelectItem key={ref} value={ref} className="text-foreground">{ref}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="p-4 border-t border-border/50 bg-muted/30 shrink-0">
                    <Button
                      onClick={addTable}
                      disabled={!currentTable.name.trim() || currentTable.columns.length === 0}
                      className="w-full gap-2 h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Add Table to Schema
                    </Button>
                  </div>
                </div>

                {/* Right Panel: Schema Tables */}
                <div className="border border-border/50 rounded-xl flex flex-col overflow-hidden bg-card/50">
                  <div className="p-4 border-b border-border/50 bg-muted/30 shrink-0">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold">Schema Tables ({tables.length})</Label>
                      <Button onClick={generateSQL} disabled={tables.length === 0} size="sm" className="gap-2">
                        <Play className="h-4 w-4" />
                        Generate SQL
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                      {tables.length === 0 ? (
                        <div className="text-center py-12">
                          <Table2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No tables yet</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Create your first table using the builder</p>
                        </div>
                      ) : (
                        tables.map((table, index) => (
                          <Collapsible
                            key={index}
                            open={expandedTables.has(index)}
                            onOpenChange={() => toggleTableExpanded(index)}
                          >
                            <div className="rounded-lg border border-border/50 bg-muted/20 overflow-hidden sql-table-card animate-fade-in">
                              <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Table2 className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{table.name}</span>
                                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                    {table.columns.length} columns
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); removeTable(index); }}
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  {expandedTables.has(index) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="border-t border-border/30 p-3 space-y-1.5">
                                  {table.columns.map((col, colIndex) => (
                                    <div key={colIndex} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-background/50">
                                      {col.primaryKey && <Key className="h-3.5 w-3.5 text-amber-500" />}
                                      <span className="font-mono font-medium">{col.name}</span>
                                      <span className="text-muted-foreground text-xs">{col.type}</span>
                                      {!col.nullable && <span className="text-destructive text-xs font-medium">NOT NULL</span>}
                                      {col.foreignKey && (
                                        <span className="text-primary text-xs">→ {col.foreignKey}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            {/* Diagram Tab */}
            <TabsContent value="diagram" className="flex-1 min-h-0 m-0 p-5 pt-4">
              <div className="h-full border border-border/50 rounded-xl overflow-hidden bg-card/50">
                <SchemaRelationshipDiagram tables={tables} />
              </div>
            </TabsContent>

            {/* SQL Tab */}
            <TabsContent value="sql" className="flex-1 min-h-0 m-0 p-5 pt-4">
              <div className="h-full flex flex-col border border-border/50 rounded-xl overflow-hidden bg-card/50">
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30 shrink-0">
                  <Label className="font-semibold">Generated SQL Code</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSQL("sql")}
                      disabled={!generatedSQL}
                      className="h-9 gap-2"
                    >
                      <FileCode className="h-4 w-4" />
                      .sql
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSQL("json")}
                      disabled={!generatedSQL}
                      className="h-9 gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      .json
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copySQL}
                      disabled={!generatedSQL}
                      className="h-9 gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {generatedSQL ? (
                    <pre className="p-5 text-sm font-mono leading-relaxed whitespace-pre text-foreground">
                      {generatedSQL}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center py-12">
                        <Code className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Click "Generate SQL" to see your schema</p>
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
        <DialogContent className="max-w-md glass">
          <DialogHeader>
            <DialogTitle>Save Schema</DialogTitle>
            <DialogDescription>Save your schema to load it later</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Schema Name *</Label>
              <Input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="My Database Schema"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                placeholder="Optional description..."
                className="mt-2 resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSchema}>{currentSchemaId ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-md glass">
          <DialogHeader>
            <DialogTitle>Load Schema</DialogTitle>
            <DialogDescription>Select a saved schema to load</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : schemas.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No saved schemas</p>
            ) : (
              <div className="space-y-2 pr-3">
                {schemas.map(schema => (
                  <div
                    key={schema.id}
                    className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-all hover:border-primary/30 card-hover"
                    onClick={() => handleLoadSchema(schema)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{schema.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); deleteSchema(schema.id); }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {schema.description && (
                      <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-2">
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
        <DialogContent className="max-w-lg glass">
          <DialogHeader>
            <DialogTitle>Import SQL Schema</DialogTitle>
            <DialogDescription>Paste SQL or upload a .sql file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload .sql File
              </Button>
            </div>
            <div>
              <Label>Or paste SQL directly:</Label>
              <Textarea
                value={importSQL}
                onChange={(e) => setImportSQL(e.target.value)}
                placeholder="CREATE TABLE public.users (..."
                className="mt-2 font-mono text-sm resize-none"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onClick={handleImportSQL}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};