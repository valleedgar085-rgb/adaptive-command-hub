import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { 
  Database, Play, Copy, Check, Plus, Trash2, Table2, Key, Save, 
  FolderOpen, Loader2, Upload, Download, ChevronDown, ChevronUp, 
  FileText, FileCode, Columns, GitBranch, Code, Sparkles, Zap,
  Users, ShoppingCart, FileStack, Calendar, MessageSquare, Settings,
  Keyboard, RotateCcw, Wand2, Shield, HelpCircle, Search, ArrowUp,
  ArrowDown, Command, Layers, Package, RefreshCw, Braces, Bot
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useSavedSchemas } from "@/hooks/useSavedSchemas";
import { useSQLBuilderKeyboard } from "@/hooks/useSQLBuilderKeyboard";
import { SchemaRelationshipDiagram } from "./SchemaRelationshipDiagram";
import { SQLKeyboardShortcutsPanel } from "./SQLKeyboardShortcutsPanel";
import { SQLValidationPanel } from "./SQLValidationPanel";
import { SQLTypeScriptGenerator } from "./SQLTypeScriptGenerator";
import { SQLCodeViewer } from "./SQLCodeViewer";
import { AISchemaGenerator } from "./AISchemaGenerator";
import { AISchemaOptimizer } from "./AISchemaOptimizer";

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
  unique?: boolean;
  index?: boolean;
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
// Constants & Professional Templates
// ═══════════════════════════════════════════════════════════════════════════════

const SQL_TYPES = [
  { value: "uuid", label: "UUID", category: "identifiers" },
  { value: "serial", label: "SERIAL", category: "identifiers" },
  { value: "bigserial", label: "BIGSERIAL", category: "identifiers" },
  { value: "text", label: "TEXT", category: "text" },
  { value: "varchar(255)", label: "VARCHAR(255)", category: "text" },
  { value: "varchar(50)", label: "VARCHAR(50)", category: "text" },
  { value: "char(1)", label: "CHAR(1)", category: "text" },
  { value: "integer", label: "INTEGER", category: "numeric" },
  { value: "bigint", label: "BIGINT", category: "numeric" },
  { value: "smallint", label: "SMALLINT", category: "numeric" },
  { value: "numeric", label: "NUMERIC", category: "numeric" },
  { value: "numeric(10,2)", label: "NUMERIC(10,2)", category: "numeric" },
  { value: "real", label: "REAL", category: "numeric" },
  { value: "double precision", label: "DOUBLE", category: "numeric" },
  { value: "boolean", label: "BOOLEAN", category: "boolean" },
  { value: "timestamp with time zone", label: "TIMESTAMPTZ", category: "datetime" },
  { value: "timestamp", label: "TIMESTAMP", category: "datetime" },
  { value: "date", label: "DATE", category: "datetime" },
  { value: "time", label: "TIME", category: "datetime" },
  { value: "interval", label: "INTERVAL", category: "datetime" },
  { value: "jsonb", label: "JSONB", category: "json" },
  { value: "json", label: "JSON", category: "json" },
  { value: "bytea", label: "BYTEA", category: "binary" },
  { value: "uuid[]", label: "UUID[]", category: "array" },
  { value: "text[]", label: "TEXT[]", category: "array" },
  { value: "integer[]", label: "INTEGER[]", category: "array" },
];

const DEFAULT_COLUMN: Column = {
  name: "",
  type: "text",
  nullable: true,
  primaryKey: false,
  defaultValue: "",
  unique: false,
  index: false,
};

// Professional Quick Templates with expanded options
const QUICK_TEMPLATES = {
  users: {
    name: "users",
    icon: Users,
    description: "User accounts with auth",
    color: "text-blue-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()", unique: true },
      { name: "email", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "", unique: true },
      { name: "username", type: "varchar(50)", nullable: true, primaryKey: false, defaultValue: "", unique: true },
      { name: "full_name", type: "varchar(255)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "avatar_url", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "role", type: "varchar(50)", nullable: false, primaryKey: false, defaultValue: "'user'" },
      { name: "is_active", type: "boolean", nullable: false, primaryKey: false, defaultValue: "true" },
      { name: "last_login", type: "timestamp with time zone", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  posts: {
    name: "posts",
    icon: FileStack,
    description: "Blog posts or articles",
    color: "text-emerald-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "title", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "slug", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "", unique: true },
      { name: "excerpt", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "content", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "cover_image", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "status", type: "varchar(50)", nullable: false, primaryKey: false, defaultValue: "'draft'" },
      { name: "published_at", type: "timestamp with time zone", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "view_count", type: "integer", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  products: {
    name: "products",
    icon: ShoppingCart,
    description: "E-commerce products",
    color: "text-amber-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "sku", type: "varchar(50)", nullable: false, primaryKey: false, defaultValue: "", unique: true },
      { name: "name", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "price", type: "numeric(10,2)", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "compare_price", type: "numeric(10,2)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "cost", type: "numeric(10,2)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "stock", type: "integer", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "category", type: "varchar(100)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "tags", type: "text[]", nullable: true, primaryKey: false, defaultValue: "'{}'" },
      { name: "images", type: "text[]", nullable: true, primaryKey: false, defaultValue: "'{}'" },
      { name: "is_active", type: "boolean", nullable: false, primaryKey: false, defaultValue: "true" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  orders: {
    name: "orders",
    icon: Package,
    description: "Customer orders",
    color: "text-purple-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "order_number", type: "varchar(50)", nullable: false, primaryKey: false, defaultValue: "", unique: true },
      { name: "status", type: "varchar(50)", nullable: false, primaryKey: false, defaultValue: "'pending'" },
      { name: "subtotal", type: "numeric(10,2)", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "tax", type: "numeric(10,2)", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "shipping", type: "numeric(10,2)", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "total", type: "numeric(10,2)", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "shipping_address", type: "jsonb", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "billing_address", type: "jsonb", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "notes", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  events: {
    name: "events",
    icon: Calendar,
    description: "Calendar events",
    color: "text-cyan-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "title", type: "varchar(255)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "location", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "start_time", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "end_time", type: "timestamp with time zone", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "all_day", type: "boolean", nullable: false, primaryKey: false, defaultValue: "false" },
      { name: "recurrence", type: "varchar(50)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "color", type: "varchar(20)", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  comments: {
    name: "comments",
    icon: MessageSquare,
    description: "User comments",
    color: "text-rose-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: false, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "post_id", type: "uuid", nullable: true, primaryKey: false, defaultValue: "", foreignKey: "posts.id" },
      { name: "parent_id", type: "uuid", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "content", type: "text", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "is_edited", type: "boolean", nullable: false, primaryKey: false, defaultValue: "false" },
      { name: "likes_count", type: "integer", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  categories: {
    name: "categories",
    icon: Layers,
    description: "Hierarchical categories",
    color: "text-indigo-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "parent_id", type: "uuid", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "name", type: "varchar(100)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "slug", type: "varchar(100)", nullable: false, primaryKey: false, defaultValue: "", unique: true },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "image_url", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "sort_order", type: "integer", nullable: false, primaryKey: false, defaultValue: "0" },
      { name: "is_active", type: "boolean", nullable: false, primaryKey: false, defaultValue: "true" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ]
  },
  settings: {
    name: "settings",
    icon: Settings,
    description: "App configuration",
    color: "text-slate-400",
    columns: [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true, primaryKey: false, defaultValue: "", foreignKey: "users.id" },
      { name: "key", type: "varchar(100)", nullable: false, primaryKey: false, defaultValue: "" },
      { name: "value", type: "jsonb", nullable: true, primaryKey: false, defaultValue: "'{}'" },
      { name: "description", type: "text", nullable: true, primaryKey: false, defaultValue: "" },
      { name: "is_public", type: "boolean", nullable: false, primaryKey: false, defaultValue: "false" },
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
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [importSQL, setImportSQL] = useState("");
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<number>>(new Set());
  const [columnsExpanded, setColumnsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("builder");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<Table[][]>([]);
  const [includeRLS, setIncludeRLS] = useState(true);
  const [includeIndexes, setIncludeIndexes] = useState(true);
  const [includeTriggers, setIncludeTriggers] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableNameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { schemas, isLoading, saveSchema, updateSchema, deleteSchema } = useSavedSchemas();

  // ═══════════════════════════════════════════════════════════════════════════════
  // Keyboard Shortcuts
  // ═══════════════════════════════════════════════════════════════════════════════

  const shortcutDefinitions = useMemo(() => [
    { key: "n", ctrl: true, description: "New table", action: () => tableNameInputRef.current?.focus() },
    { key: "g", ctrl: true, description: "Generate SQL", action: () => tables.length > 0 && generateSQL() },
    { key: "s", ctrl: true, description: "Save schema", action: () => tables.length > 0 && setShowSaveDialog(true) },
    { key: "o", ctrl: true, description: "Load schema", action: () => setShowLoadDialog(true) },
    { key: "i", ctrl: true, description: "Import SQL", action: () => setShowImportDialog(true) },
    { key: "z", ctrl: true, description: "Undo", action: handleUndo },
    { key: "1", ctrl: true, description: "Builder tab", action: () => setActiveTab("builder") },
    { key: "2", ctrl: true, description: "AI tab", action: () => setActiveTab("ai") },
    { key: "3", ctrl: true, description: "Diagram tab", action: () => setActiveTab("diagram") },
    { key: "4", ctrl: true, description: "SQL tab", action: () => setActiveTab("sql") },
    { key: "5", ctrl: true, description: "TypeScript tab", action: () => setActiveTab("typescript") },
    { key: "6", ctrl: true, description: "Validation tab", action: () => setActiveTab("validation") },
    { key: "7", ctrl: true, description: "Optimizer tab", action: () => setActiveTab("optimizer") },
    { key: "/", ctrl: true, description: "Show shortcuts", action: () => setShowShortcutsDialog(true) },
    { key: "Enter", ctrl: true, description: "Add table", action: () => currentTable.name && currentTable.columns.length > 0 && addTable() },
    { key: "ArrowUp", alt: true, description: "Previous column", action: () => navigateColumn(-1) },
    { key: "ArrowDown", alt: true, description: "Next column", action: () => navigateColumn(1) },
  ], [tables, currentTable]);

  useSQLBuilderKeyboard({ isOpen: open, shortcuts: shortcutDefinitions });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Undo/Redo Functionality
  // ═══════════════════════════════════════════════════════════════════════════════

  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), [...tables]]);
  }, [tables]);

  function handleUndo() {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setTables(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      toast({ title: "Undone", description: "Reverted to previous state" });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════════

  const navigateColumn = (direction: number) => {
    const maxIndex = currentTable.columns.length - 1;
    if (maxIndex < 0) return;
    
    setSelectedColumnIndex(prev => {
      if (prev === null) return direction > 0 ? 0 : maxIndex;
      const next = prev + direction;
      if (next < 0) return 0;
      if (next > maxIndex) return maxIndex;
      return next;
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // Table & Column Operations
  // ═══════════════════════════════════════════════════════════════════════════════

  const toggleTableExpanded = (index: number) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const addQuickTemplate = useCallback((templateKey: keyof typeof QUICK_TEMPLATES) => {
    saveToUndoStack();
    const template = QUICK_TEMPLATES[templateKey];
    const existingNames = tables.map(t => t.name);
    
    if (existingNames.includes(template.name)) {
      toast({ title: "Table Exists", description: `"${template.name}" already in schema`, variant: "destructive" });
      return;
    }
    
    setTables(prev => [...prev, { name: template.name, columns: [...template.columns] }]);
    setExpandedTables(prev => new Set([...prev, tables.length]));
    toast({ title: "Added", description: `"${template.name}" table added` });
  }, [tables, toast, saveToUndoStack]);

  const addColumn = () => {
    setCurrentTable(prev => ({
      ...prev,
      columns: [...prev.columns, { ...DEFAULT_COLUMN }]
    }));
    setSelectedColumnIndex(currentTable.columns.length);
  };

  const addStandardColumns = () => {
    const standardCols: Column[] = [
      { name: "id", type: "uuid", nullable: false, primaryKey: true, defaultValue: "gen_random_uuid()" },
      { name: "created_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" },
      { name: "updated_at", type: "timestamp with time zone", nullable: false, primaryKey: false, defaultValue: "now()" }
    ];
    setCurrentTable(prev => ({
      ...prev,
      columns: [...standardCols, ...prev.columns.filter(c => !["id", "created_at", "updated_at"].includes(c.name))]
    }));
    toast({ title: "Added", description: "Standard columns added" });
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
    setSelectedColumnIndex(null);
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentTable.columns.length) return;
    
    setCurrentTable(prev => {
      const cols = [...prev.columns];
      [cols[index], cols[newIndex]] = [cols[newIndex], cols[index]];
      return { ...prev, columns: cols };
    });
    setSelectedColumnIndex(newIndex);
  };

  const duplicateColumn = (index: number) => {
    const col = currentTable.columns[index];
    if (!col) return;
    
    setCurrentTable(prev => ({
      ...prev,
      columns: [
        ...prev.columns.slice(0, index + 1),
        { ...col, name: `${col.name}_copy`, primaryKey: false },
        ...prev.columns.slice(index + 1)
      ]
    }));
    setSelectedColumnIndex(index + 1);
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
    
    saveToUndoStack();
    setTables(prev => [...prev, { ...currentTable }]);
    setCurrentTable({ name: "", columns: [] });
    setExpandedTables(prev => new Set([...prev, tables.length]));
    setSelectedColumnIndex(null);
    toast({ title: "Added", description: `"${currentTable.name}" added to schema` });
  };

  const removeTable = (index: number) => {
    saveToUndoStack();
    const tableName = tables[index]?.name;
    setTables(prev => prev.filter((_, i) => i !== index));
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    toast({ title: "Removed", description: `"${tableName}" removed` });
  };

  const duplicateTable = (index: number) => {
    saveToUndoStack();
    const table = tables[index];
    if (!table) return;
    
    const newName = `${table.name}_copy`;
    setTables(prev => [...prev, { ...table, name: newName, columns: table.columns.map(c => ({ ...c })) }]);
    toast({ title: "Duplicated", description: `"${newName}" created` });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // SQL Generation - Professional Grade
  // ═══════════════════════════════════════════════════════════════════════════════

  const generateSQL = useCallback(() => {
    if (tables.length === 0) {
      toast({ title: "Error", description: "Add at least one table first", variant: "destructive" });
      return;
    }

    const lines: string[] = [];
    const indent = "    ";
    const timestamp = new Date().toISOString().split("T")[0];
    
    // Professional Header
    lines.push("-- ╔══════════════════════════════════════════════════════════════════════════════╗");
    lines.push(`-- ║  Database Schema: ${(schemaName || "Untitled Schema").padEnd(55)}║`);
    lines.push(`-- ║  Generated: ${timestamp.padEnd(62)}║`);
    lines.push(`-- ║  Tables: ${String(tables.length).padEnd(65)}║`);
    lines.push("-- ╚══════════════════════════════════════════════════════════════════════════════╝");
    lines.push("");
    lines.push("-- ==============================================================================");
    lines.push("-- TABLE DEFINITIONS");
    lines.push("-- ==============================================================================");
    lines.push("");

    for (const table of tables) {
      lines.push(`-- ┌──────────────────────────────────────────────────────────────────────────────┐`);
      lines.push(`-- │  Table: ${table.name.padEnd(68)}│`);
      lines.push(`-- │  Columns: ${String(table.columns.length).padEnd(66)}│`);
      lines.push(`-- └──────────────────────────────────────────────────────────────────────────────┘`);
      lines.push("");
      
      // Drop if exists (optional)
      lines.push(`-- DROP TABLE IF EXISTS public.${table.name} CASCADE;`);
      lines.push("");
      
      lines.push(`CREATE TABLE IF NOT EXISTS public.${table.name} (`);
      
      const columnDefs: string[] = [];
      const constraints: string[] = [];
      const uniqueConstraints: string[] = [];
      
      for (const col of table.columns) {
        const colName = col.name.padEnd(24);
        let typeName = col.type.toUpperCase();
        if (typeName === "TIMESTAMP WITH TIME ZONE") typeName = "TIMESTAMPTZ";
        
        let def = `${indent}${colName} ${typeName}`;
        
        if (!col.nullable) def += " NOT NULL";
        
        if (col.defaultValue) {
          const needsQuotes = (col.type === "text" || col.type.startsWith("varchar")) && 
                              !col.defaultValue.includes("(") && 
                              !col.defaultValue.startsWith("'");
          const isFunction = col.defaultValue.includes("(") || 
                            ["now()", "gen_random_uuid()", "true", "false"].includes(col.defaultValue.toLowerCase());
          def += ` DEFAULT ${isFunction || col.defaultValue.startsWith("'") ? col.defaultValue : needsQuotes ? `'${col.defaultValue}'` : col.defaultValue}`;
        }
        
        columnDefs.push(def);
        
        if (col.primaryKey) {
          constraints.push(`${indent}CONSTRAINT ${table.name}_pkey PRIMARY KEY (${col.name})`);
        }
        
        if (col.unique && !col.primaryKey) {
          uniqueConstraints.push(`${indent}CONSTRAINT ${table.name}_${col.name}_key UNIQUE (${col.name})`);
        }
        
        if (col.foreignKey) {
          const [refTable, refCol] = col.foreignKey.split(".");
          constraints.push(`${indent}CONSTRAINT ${table.name}_${col.name}_fkey FOREIGN KEY (${col.name}) REFERENCES public.${refTable}(${refCol || "id"}) ON DELETE CASCADE`);
        }
      }
      
      lines.push([...columnDefs, ...constraints, ...uniqueConstraints].join(",\n"));
      lines.push(");");
      lines.push("");
      
      // Table comment
      if (schemaDescription) {
        lines.push(`COMMENT ON TABLE public.${table.name} IS 'Part of ${schemaName} schema';`);
        lines.push("");
      }
      
      // RLS
      if (includeRLS) {
        lines.push(`-- Row Level Security`);
        lines.push(`ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;`);
        lines.push("");
        
        // Generate RLS policies for tables with user_id
        const hasUserId = table.columns.some(c => c.name === "user_id");
        if (hasUserId) {
          lines.push(`-- RLS Policies for ${table.name}`);
          lines.push(`CREATE POLICY "${table.name}_select_policy" ON public.${table.name}`);
          lines.push(`${indent}FOR SELECT USING (auth.uid() = user_id);`);
          lines.push("");
          lines.push(`CREATE POLICY "${table.name}_insert_policy" ON public.${table.name}`);
          lines.push(`${indent}FOR INSERT WITH CHECK (auth.uid() = user_id);`);
          lines.push("");
          lines.push(`CREATE POLICY "${table.name}_update_policy" ON public.${table.name}`);
          lines.push(`${indent}FOR UPDATE USING (auth.uid() = user_id);`);
          lines.push("");
          lines.push(`CREATE POLICY "${table.name}_delete_policy" ON public.${table.name}`);
          lines.push(`${indent}FOR DELETE USING (auth.uid() = user_id);`);
          lines.push("");
        }
      }
      
      // Indexes
      if (includeIndexes) {
        const indexCols = table.columns.filter(c => c.foreignKey || c.index);
        if (indexCols.length > 0) {
          lines.push(`-- Indexes`);
          for (const col of indexCols) {
            lines.push(`CREATE INDEX IF NOT EXISTS idx_${table.name}_${col.name} ON public.${table.name}(${col.name});`);
          }
          lines.push("");
        }
      }
      
      // Triggers for updated_at
      if (includeTriggers) {
        const hasUpdatedAt = table.columns.some(c => c.name === "updated_at");
        if (hasUpdatedAt) {
          lines.push(`-- Auto-update trigger for updated_at`);
          lines.push(`CREATE OR REPLACE FUNCTION update_${table.name}_updated_at()`);
          lines.push(`RETURNS TRIGGER AS $$`);
          lines.push(`BEGIN`);
          lines.push(`${indent}NEW.updated_at = NOW();`);
          lines.push(`${indent}RETURN NEW;`);
          lines.push(`END;`);
          lines.push(`$$ LANGUAGE plpgsql;`);
          lines.push("");
          lines.push(`DROP TRIGGER IF EXISTS trigger_${table.name}_updated_at ON public.${table.name};`);
          lines.push(`CREATE TRIGGER trigger_${table.name}_updated_at`);
          lines.push(`${indent}BEFORE UPDATE ON public.${table.name}`);
          lines.push(`${indent}FOR EACH ROW EXECUTE FUNCTION update_${table.name}_updated_at();`);
          lines.push("");
        }
      }
    }
    
    // Footer
    lines.push("-- ==============================================================================");
    lines.push("-- END OF SCHEMA");
    lines.push("-- ==============================================================================");

    const sql = lines.join("\n");
    setGeneratedSQL(sql);
    onGenerateSQL?.(sql);
    setActiveTab("sql");
    toast({ title: "Generated", description: "Professional SQL schema ready" });
  }, [tables, schemaName, schemaDescription, includeRLS, includeIndexes, includeTriggers, onGenerateSQL, toast]);

  const copySQL = async () => {
    await navigator.clipboard.writeText(generatedSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "SQL copied to clipboard" });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // Save/Load/Import Operations
  // ═══════════════════════════════════════════════════════════════════════════════

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
    saveToUndoStack();
    setTables(schema.tables);
    setGeneratedSQL(schema.generated_sql || "");
    setSchemaName(schema.name);
    setSchemaDescription(schema.description || "");
    setCurrentSchemaId(schema.id);
    setShowLoadDialog(false);
    toast({ title: "Loaded", description: `"${schema.name}" loaded` });
  };

  const handleNewSchema = () => {
    saveToUndoStack();
    setTables([]);
    setCurrentTable({ name: "", columns: [] });
    setGeneratedSQL("");
    setSchemaName("");
    setSchemaDescription("");
    setCurrentSchemaId(null);
    setExpandedTables(new Set());
    setSelectedColumnIndex(null);
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
          if (colType === "timestamptz") {
            colType = "timestamp with time zone";
          }
          
          const fullLine = line.toUpperCase();
          const isPrimaryKey = fullLine.includes("PRIMARY KEY");
          const isNotNull = fullLine.includes("NOT NULL");
          const isUnique = fullLine.includes("UNIQUE");
          
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
            foreignKey,
            unique: isUnique,
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
    
    saveToUndoStack();
    setTables(parsedTables);
    setShowImportDialog(false);
    setImportSQL("");
    toast({ title: "Imported", description: `${parsedTables.length} table(s) imported` });
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
    
    toast({ title: "Downloaded", description: `Saved as ${a.download}` });
  };

  // Get available foreign key references
  const allTableColumns = useMemo(() => 
    tables.flatMap(t => t.columns.filter(c => c.primaryKey).map(c => `${t.name}.${c.name}`)),
    [tables]
  );

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return Object.entries(QUICK_TEMPLATES);
    return Object.entries(QUICK_TEMPLATES).filter(([key, template]) => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <TooltipProvider>
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="w-[98vw] max-w-7xl h-[95vh] max-h-[95vh] p-0 flex flex-col overflow-hidden border-2 border-border/50 bg-gradient-to-b from-card to-background shadow-2xl">
            {/* Enhanced Header */}
            <DialogHeader className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-sql-accent/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-sql-accent flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse-glow">
                    <Database className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold flex items-center gap-3">
                      SQL Database Builder
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">Pro</span>
                      {schemaName && (
                        <span className="text-sm font-normal text-muted-foreground">— {schemaName}</span>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm flex items-center gap-4">
                      <span>Professional database schema generator</span>
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-muted/50 border border-border/50 rounded text-[10px] font-mono">
                        <Command className="h-2.5 w-2.5" /> / for shortcuts
                      </kbd>
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowShortcutsDialog(true)} className="h-9 w-9">
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Keyboard Shortcuts</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleUndo} disabled={undoStack.length === 0} className="h-9 w-9">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                  </Tooltip>
                  <div className="w-px h-6 bg-border/50" />
                  <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="h-9 gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Import</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)} className="h-9 gap-2">
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Load</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} disabled={tables.length === 0} className="h-9 gap-2">
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNewSchema} className="h-9 gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Tabs with enhanced styling */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-5 pt-4 shrink-0">
                <TabsList className="w-full sm:w-fit bg-muted/50 p-1 gap-1">
                  <TabsTrigger value="builder" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
                    <Table2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Builder</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20">
                    <Bot className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Generate</span>
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                  </TabsTrigger>
                  <TabsTrigger value="diagram" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
                    <GitBranch className="h-4 w-4" />
                    <span className="hidden sm:inline">Diagram</span>
                  </TabsTrigger>
                  <TabsTrigger value="sql" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
                    <Code className="h-4 w-4" />
                    <span className="hidden sm:inline">SQL</span>
                    {generatedSQL && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="typescript" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
                    <Braces className="h-4 w-4" />
                    <span className="hidden sm:inline">TypeScript</span>
                    {tables.length > 0 && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </TabsTrigger>
                  <TabsTrigger value="validation" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Validate</span>
                  </TabsTrigger>
                  <TabsTrigger value="optimizer" className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20">
                    <Zap className="h-4 w-4" />
                    <span className="hidden sm:inline">Optimize</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Builder Tab */}
              <TabsContent value="builder" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
                  {/* Left Panel */}
                  <div className="border-2 border-border/50 rounded-xl flex flex-col overflow-hidden bg-card/80 shadow-xl">
                    {/* Quick Templates */}
                    <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary animate-pulse" />
                          <Label className="font-bold text-foreground">Quick Templates</Label>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 w-32 pl-8 text-xs bg-background/50 border-border/50"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {filteredTemplates.map(([key, template]) => {
                          const IconComponent = template.icon;
                          return (
                            <Tooltip key={key}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addQuickTemplate(key as keyof typeof QUICK_TEMPLATES)}
                                  className={`h-auto py-2.5 px-2 flex flex-col items-center gap-1.5 bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 group`}
                                >
                                  <IconComponent className={`h-4 w-4 ${template.color} group-hover:scale-110 transition-transform`} />
                                  <span className="text-[10px] font-medium capitalize truncate w-full text-center">{template.name}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="font-medium">{template.name}</p>
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                                <p className="text-xs text-muted-foreground">{template.columns.length} columns</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Table Creation */}
                    <div className="p-4 border-b border-border/50 bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <Label className="font-semibold text-foreground">Custom Table</Label>
                        </div>
                        <Button onClick={addStandardColumns} variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                          <Wand2 className="h-3 w-3" />
                          Add Standard Cols
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          ref={tableNameInputRef}
                          placeholder="table_name"
                          value={currentTable.name}
                          onChange={(e) => setCurrentTable(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s/g, "_") }))}
                          className="flex-1 h-11 bg-background/80 border-2 border-border/50 focus:border-primary/50 text-foreground font-mono placeholder:text-muted-foreground/60"
                        />
                        <Button onClick={addColumn} variant="outline" className="h-11 gap-2 px-4">
                          <Plus className="h-4 w-4" />
                          Column
                        </Button>
                      </div>
                    </div>

                    {/* Columns Editor */}
                    <Collapsible open={columnsExpanded} onOpenChange={setColumnsExpanded} className="flex-1 flex flex-col min-h-0">
                      <CollapsibleTrigger className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/30 hover:bg-muted/40 transition-colors shrink-0">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Columns className="h-4 w-4 text-primary" />
                          Columns ({currentTable.columns.length})
                        </span>
                        {columnsExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="flex-1 min-h-0 overflow-hidden">
                        <ScrollArea className="h-full max-h-[320px]">
                          <div className="p-3 space-y-3">
                            {currentTable.columns.length === 0 ? (
                              <div className="text-center py-8">
                                <Columns className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">No columns yet</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Click "Add Column" or use templates</p>
                              </div>
                            ) : (
                              currentTable.columns.map((col, index) => (
                                <div 
                                  key={index} 
                                  className={`p-4 rounded-xl bg-background/60 border-2 space-y-3 animate-fade-in transition-all ${
                                    selectedColumnIndex === index 
                                      ? "border-primary/50 ring-2 ring-primary/20" 
                                      : "border-border/50 hover:border-primary/30"
                                  }`}
                                  onClick={() => setSelectedColumnIndex(index)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5">
                                      <Button variant="ghost" size="icon" onClick={() => moveColumn(index, -1)} disabled={index === 0} className="h-5 w-5 p-0">
                                        <ArrowUp className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" onClick={() => moveColumn(index, 1)} disabled={index === currentTable.columns.length - 1} className="h-5 w-5 p-0">
                                        <ArrowDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="column_name"
                                      value={col.name}
                                      onChange={(e) => updateColumn(index, "name", e.target.value.toLowerCase().replace(/\s/g, "_"))}
                                      className="flex-1 h-10 bg-muted/30 border-border/50 focus:border-primary/50 text-foreground font-mono"
                                    />
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => duplicateColumn(index)} className="h-10 w-10 text-muted-foreground hover:text-foreground">
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Duplicate</TooltipContent>
                                    </Tooltip>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeColumn(index)}
                                      className="h-10 w-10 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Select value={col.type} onValueChange={(v) => updateColumn(index, "type", v)}>
                                      <SelectTrigger className="h-10 bg-muted/30 border-border/50 text-foreground font-mono text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border-border max-h-[300px]">
                                        {SQL_TYPES.map(type => (
                                          <SelectItem key={type.value} value={type.value} className="text-foreground font-mono text-xs">
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      placeholder="Default value"
                                      value={col.defaultValue}
                                      onChange={(e) => updateColumn(index, "defaultValue", e.target.value)}
                                      className="h-10 bg-muted/30 border-border/50 text-foreground font-mono text-xs placeholder:text-muted-foreground/50"
                                    />
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Switch checked={col.primaryKey} onCheckedChange={(v) => updateColumn(index, "primaryKey", v)} className="scale-90" />
                                      <Key className="h-3.5 w-3.5 text-amber-500" />
                                      <span className="text-foreground/80 text-xs font-medium">PK</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Switch checked={!col.nullable} onCheckedChange={(v) => updateColumn(index, "nullable", !v)} className="scale-90" />
                                      <span className="text-foreground/80 text-xs font-medium">Required</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Switch checked={col.unique || false} onCheckedChange={(v) => updateColumn(index, "unique", v)} className="scale-90" />
                                      <span className="text-foreground/80 text-xs font-medium">Unique</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Switch checked={col.index || false} onCheckedChange={(v) => updateColumn(index, "index", v)} className="scale-90" />
                                      <span className="text-foreground/80 text-xs font-medium">Index</span>
                                    </label>
                                  </div>
                                  {allTableColumns.length > 0 && (
                                    <Select value={col.foreignKey || "none"} onValueChange={(v) => updateColumn(index, "foreignKey", v === "none" ? "" : v)}>
                                      <SelectTrigger className="h-9 bg-muted/30 border-border/50 text-foreground text-xs">
                                        <SelectValue placeholder="Foreign Key Reference" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-card border-border">
                                        <SelectItem value="none" className="text-foreground">No Foreign Key</SelectItem>
                                        {allTableColumns.map(ref => (
                                          <SelectItem key={ref} value={ref} className="text-foreground font-mono">{ref}</SelectItem>
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

                    {/* Add Table Button */}
                    <div className="p-4 border-t border-border/50 bg-gradient-to-r from-muted/30 to-transparent shrink-0">
                      <Button
                        onClick={addTable}
                        disabled={!currentTable.name.trim() || currentTable.columns.length === 0}
                        className="w-full gap-2 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all font-semibold"
                      >
                        <Plus className="h-5 w-5" />
                        Add Table to Schema
                        <kbd className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">⌘↵</kbd>
                      </Button>
                    </div>
                  </div>

                  {/* Right Panel - Schema Tables */}
                  <div className="border-2 border-border/50 rounded-xl flex flex-col overflow-hidden bg-card/50 shadow-xl">
                    <div className="p-4 border-b border-border/50 bg-gradient-to-r from-muted/50 to-transparent shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Label className="font-bold text-foreground">Schema Tables</Label>
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">{tables.length}</span>
                        </div>
                        <Button onClick={generateSQL} disabled={tables.length === 0} size="sm" className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20">
                          <Play className="h-4 w-4" />
                          Generate SQL
                        </Button>
                      </div>
                      {/* Generation Options */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch checked={includeRLS} onCheckedChange={setIncludeRLS} className="scale-75" />
                          <span className="text-muted-foreground">RLS Policies</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch checked={includeIndexes} onCheckedChange={setIncludeIndexes} className="scale-75" />
                          <span className="text-muted-foreground">Indexes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch checked={includeTriggers} onCheckedChange={setIncludeTriggers} className="scale-75" />
                          <span className="text-muted-foreground">Triggers</span>
                        </label>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-3 space-y-2">
                        {tables.length === 0 ? (
                          <div className="text-center py-16">
                            <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
                            <p className="text-sm text-muted-foreground font-medium">No tables yet</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Use templates or create custom tables</p>
                          </div>
                        ) : (
                          tables.map((table, index) => (
                            <Collapsible key={index} open={expandedTables.has(index)} onOpenChange={() => toggleTableExpanded(index)}>
                              <div className="rounded-xl border-2 border-border/50 bg-gradient-to-r from-muted/20 to-transparent overflow-hidden hover:border-primary/30 transition-all">
                                <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                      <Table2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="text-left">
                                      <span className="font-bold text-foreground">{table.name}</span>
                                      <span className="text-xs text-muted-foreground ml-2">{table.columns.length} cols</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); duplicateTable(index); }} className="h-8 w-8">
                                          <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Duplicate</TooltipContent>
                                    </Tooltip>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeTable(index); }} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                    {expandedTables.has(index) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="border-t border-border/30 p-3 space-y-1.5 bg-background/30">
                                    {table.columns.map((col, colIndex) => (
                                      <div key={colIndex} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        {col.primaryKey && <Key className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                                        <span className="font-mono font-bold text-foreground">{col.name}</span>
                                        <span className="text-muted-foreground font-mono">{col.type}</span>
                                        <div className="flex-1" />
                                        {!col.nullable && <span className="px-1.5 py-0.5 rounded bg-destructive/20 text-destructive text-[10px] font-medium">NOT NULL</span>}
                                        {col.unique && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-medium">UNIQUE</span>}
                                        {col.foreignKey && <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">→ {col.foreignKey}</span>}
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

              {/* AI Tab */}
              <TabsContent value="ai" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <div className="h-full border-2 border-border/50 rounded-xl overflow-hidden bg-card/50 shadow-xl p-6">
                  <AISchemaGenerator 
                    existingTables={tables} 
                    onSchemaGenerated={(newTables) => {
                      saveToUndoStack();
                      setTables(prev => [...prev, ...newTables]);
                      setExpandedTables(prev => {
                        const next = new Set(prev);
                        newTables.forEach((_, i) => next.add(tables.length + i));
                        return next;
                      });
                    }} 
                  />
                </div>
              </TabsContent>

              {/* Diagram Tab */}
              <TabsContent value="diagram" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <div className="h-full border-2 border-border/50 rounded-xl overflow-hidden bg-card/50 shadow-xl">
                  <SchemaRelationshipDiagram tables={tables} />
                </div>
              </TabsContent>

              {/* SQL Tab */}
              <TabsContent value="sql" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <SQLCodeViewer sql={generatedSQL} />
              </TabsContent>

              {/* TypeScript Tab */}
              <TabsContent value="typescript" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <SQLTypeScriptGenerator tables={tables} schemaName={schemaName} />
              </TabsContent>

              {/* Validation Tab */}
              <TabsContent value="validation" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <div className="h-full border-2 border-border/50 rounded-xl overflow-hidden bg-card/50 shadow-xl">
                  <SQLValidationPanel tables={tables} />
                </div>
              </TabsContent>

              {/* Optimizer Tab */}
              <TabsContent value="optimizer" className="flex-1 min-h-0 m-0 p-5 pt-4">
                <div className="h-full border-2 border-border/50 rounded-xl overflow-hidden bg-card/50 shadow-xl p-6">
                  <AISchemaOptimizer tables={tables} />
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Shortcuts Dialog */}
        <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription>Speed up your workflow with these shortcuts</DialogDescription>
            </DialogHeader>
            <SQLKeyboardShortcutsPanel shortcuts={shortcutDefinitions} />
          </DialogContent>
        </Dialog>

        {/* Save Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Save Schema</DialogTitle>
              <DialogDescription>Save your schema for later use</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Schema Name *</Label>
                <Input value={schemaName} onChange={(e) => setSchemaName(e.target.value)} placeholder="My Database Schema" className="mt-2" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={schemaDescription} onChange={(e) => setSchemaDescription(e.target.value)} placeholder="Optional description..." className="mt-2 resize-none" rows={2} />
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Load Schema</DialogTitle>
              <DialogDescription>Select a saved schema</DialogDescription>
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
                    <div key={schema.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-all hover:border-primary/30" onClick={() => handleLoadSchema(schema)}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{schema.name}</span>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSchema(schema.id); }} className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {schema.description && <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>}
                      <p className="text-xs text-muted-foreground/70 mt-2">{schema.tables.length} table(s) • {new Date(schema.updated_at).toLocaleDateString()}</p>
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
              <DialogTitle>Import SQL Schema</DialogTitle>
              <DialogDescription>Paste SQL or upload a file</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <input ref={fileInputRef} type="file" accept=".sql,.txt" onChange={handleFileImport} className="hidden" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Upload .sql File
                </Button>
              </div>
              <div>
                <Label>Or paste SQL directly:</Label>
                <Textarea value={importSQL} onChange={(e) => setImportSQL(e.target.value)} placeholder="CREATE TABLE public.users (..." className="mt-2 font-mono text-sm resize-none" rows={10} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
              <Button onClick={handleImportSQL}>Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  );
};
