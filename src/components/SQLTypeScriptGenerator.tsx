import { useState, useMemo } from "react";
import { Code2, Copy, Check, Download, FileCode2, Braces, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

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

interface SQLTypeScriptGeneratorProps {
  tables: Table[];
  schemaName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQL to TypeScript Type Mapping
// ═══════════════════════════════════════════════════════════════════════════════

const SQL_TO_TS_TYPES: Record<string, string> = {
  // Identifiers
  "uuid": "string",
  "serial": "number",
  "bigserial": "number",
  
  // Text types
  "text": "string",
  "varchar": "string",
  "char": "string",
  
  // Numeric types
  "integer": "number",
  "int": "number",
  "bigint": "number",
  "smallint": "number",
  "numeric": "number",
  "decimal": "number",
  "real": "number",
  "double precision": "number",
  "float": "number",
  
  // Boolean
  "boolean": "boolean",
  "bool": "boolean",
  
  // Date/Time
  "timestamp": "string",
  "timestamp with time zone": "string",
  "timestamptz": "string",
  "date": "string",
  "time": "string",
  "interval": "string",
  
  // JSON
  "json": "Record<string, unknown>",
  "jsonb": "Record<string, unknown>",
  
  // Binary
  "bytea": "Uint8Array",
  
  // Arrays
  "uuid[]": "string[]",
  "text[]": "string[]",
  "integer[]": "number[]",
  "varchar[]": "string[]",
};

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function getSqlToTsType(sqlType: string): string {
  const normalizedType = sqlType.toLowerCase().trim();
  
  // Check for exact match
  if (SQL_TO_TS_TYPES[normalizedType]) {
    return SQL_TO_TS_TYPES[normalizedType];
  }
  
  // Check for array types
  if (normalizedType.endsWith("[]")) {
    const baseType = normalizedType.slice(0, -2);
    const tsBaseType = SQL_TO_TS_TYPES[baseType] || "unknown";
    return `${tsBaseType}[]`;
  }
  
  // Check for varchar/char with length
  if (normalizedType.startsWith("varchar") || normalizedType.startsWith("char")) {
    return "string";
  }
  
  // Check for numeric with precision
  if (normalizedType.startsWith("numeric") || normalizedType.startsWith("decimal")) {
    return "number";
  }
  
  // Default fallback
  return "unknown";
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function SQLTypeScriptGenerator({ tables, schemaName }: SQLTypeScriptGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [includeInsertTypes, setIncludeInsertTypes] = useState(true);
  const [includeUpdateTypes, setIncludeUpdateTypes] = useState(true);
  const [includeEnums, setIncludeEnums] = useState(true);
  const [useReadonly, setUseReadonly] = useState(false);
  const [exportAsConst, setExportAsConst] = useState(false);
  
  const { toast } = useToast();

  // ═══════════════════════════════════════════════════════════════════════════════
  // TypeScript Generation
  // ═══════════════════════════════════════════════════════════════════════════════

  const generatedTypeScript = useMemo(() => {
    if (tables.length === 0) return "";

    const lines: string[] = [];
    const timestamp = new Date().toISOString().split("T")[0];
    
    // Header
    lines.push("// ═══════════════════════════════════════════════════════════════════════════════");
    lines.push(`// TypeScript Interfaces - ${schemaName || "Database Schema"}`);
    lines.push(`// Generated: ${timestamp}`);
    lines.push(`// Tables: ${tables.length}`);
    lines.push("// ═══════════════════════════════════════════════════════════════════════════════");
    lines.push("");
    
    // Json type alias (common in Supabase)
    lines.push("// Base types");
    lines.push("export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];");
    lines.push("");

    // Generate interfaces for each table
    for (const table of tables) {
      const interfaceName = toPascalCase(table.name);
      const readonlyPrefix = useReadonly ? "readonly " : "";
      
      lines.push("// ───────────────────────────────────────────────────────────────────────────────");
      lines.push(`// ${table.name}`);
      lines.push("// ───────────────────────────────────────────────────────────────────────────────");
      lines.push("");
      
      // Row type (what you get from SELECT)
      lines.push(`/**`);
      lines.push(` * Represents a row from the ${table.name} table`);
      lines.push(` */`);
      lines.push(`export interface ${interfaceName} {`);
      
      for (const col of table.columns) {
        const tsType = getSqlToTsType(col.type);
        const optional = col.nullable ? "?" : "";
        const comment = [];
        
        if (col.primaryKey) comment.push("Primary Key");
        if (col.foreignKey) comment.push(`FK → ${col.foreignKey}`);
        if (col.unique) comment.push("Unique");
        if (col.defaultValue) comment.push(`Default: ${col.defaultValue}`);
        
        const commentStr = comment.length > 0 ? ` // ${comment.join(" | ")}` : "";
        
        lines.push(`  ${readonlyPrefix}${col.name}${optional}: ${tsType};${commentStr}`);
      }
      
      lines.push("}");
      lines.push("");
      
      // Insert type (for INSERT operations)
      if (includeInsertTypes) {
        lines.push(`/**`);
        lines.push(` * Insert type for ${table.name} - omits auto-generated fields`);
        lines.push(` */`);
        lines.push(`export interface ${interfaceName}Insert {`);
        
        for (const col of table.columns) {
          const tsType = getSqlToTsType(col.type);
          const hasDefault = col.defaultValue || col.primaryKey;
          const optional = hasDefault || col.nullable ? "?" : "";
          
          lines.push(`  ${col.name}${optional}: ${tsType};`);
        }
        
        lines.push("}");
        lines.push("");
      }
      
      // Update type (for UPDATE operations - all fields optional)
      if (includeUpdateTypes) {
        lines.push(`/**`);
        lines.push(` * Update type for ${table.name} - all fields optional`);
        lines.push(` */`);
        lines.push(`export interface ${interfaceName}Update {`);
        
        for (const col of table.columns) {
          // Skip primary key from updates typically
          if (col.primaryKey) continue;
          
          const tsType = getSqlToTsType(col.type);
          lines.push(`  ${col.name}?: ${tsType};`);
        }
        
        lines.push("}");
        lines.push("");
      }
    }
    
    // Generate table name enum/const if enabled
    if (includeEnums) {
      lines.push("// ───────────────────────────────────────────────────────────────────────────────");
      lines.push("// Table Names");
      lines.push("// ───────────────────────────────────────────────────────────────────────────────");
      lines.push("");
      
      if (exportAsConst) {
        lines.push("export const TableNames = {");
        for (const table of tables) {
          const constName = table.name.toUpperCase();
          lines.push(`  ${constName}: "${table.name}",`);
        }
        lines.push("} as const;");
        lines.push("");
        lines.push("export type TableName = typeof TableNames[keyof typeof TableNames];");
      } else {
        lines.push("export enum TableNames {");
        for (const table of tables) {
          const enumKey = toPascalCase(table.name);
          lines.push(`  ${enumKey} = "${table.name}",`);
        }
        lines.push("}");
      }
      lines.push("");
    }
    
    // Database type aggregation
    lines.push("// ───────────────────────────────────────────────────────────────────────────────");
    lines.push("// Database Schema Type");
    lines.push("// ───────────────────────────────────────────────────────────────────────────────");
    lines.push("");
    lines.push("export interface Database {");
    lines.push("  public: {");
    lines.push("    Tables: {");
    
    for (const table of tables) {
      const interfaceName = toPascalCase(table.name);
      lines.push(`      ${table.name}: {`);
      lines.push(`        Row: ${interfaceName};`);
      if (includeInsertTypes) {
        lines.push(`        Insert: ${interfaceName}Insert;`);
      }
      if (includeUpdateTypes) {
        lines.push(`        Update: ${interfaceName}Update;`);
      }
      lines.push(`      };`);
    }
    
    lines.push("    };");
    lines.push("  };");
    lines.push("}");
    lines.push("");
    
    // Helper types
    lines.push("// ───────────────────────────────────────────────────────────────────────────────");
    lines.push("// Utility Types");
    lines.push("// ───────────────────────────────────────────────────────────────────────────────");
    lines.push("");
    lines.push("export type Tables<T extends keyof Database[\"public\"][\"Tables\"]> = Database[\"public\"][\"Tables\"][T][\"Row\"];");
    if (includeInsertTypes) {
      lines.push("export type TablesInsert<T extends keyof Database[\"public\"][\"Tables\"]> = Database[\"public\"][\"Tables\"][T][\"Insert\"];");
    }
    if (includeUpdateTypes) {
      lines.push("export type TablesUpdate<T extends keyof Database[\"public\"][\"Tables\"]> = Database[\"public\"][\"Tables\"][T][\"Update\"];");
    }
    lines.push("");

    return lines.join("\n");
  }, [tables, schemaName, includeInsertTypes, includeUpdateTypes, includeEnums, useReadonly, exportAsConst]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════════

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedTypeScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied", description: "TypeScript interfaces copied to clipboard" });
  };

  const downloadFile = () => {
    const blob = new Blob([generatedTypeScript], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schemaName ? schemaName.toLowerCase().replace(/\s+/g, "-") : "database"}-types.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "TypeScript file saved" });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════════

  if (tables.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-sql-accent/20 flex items-center justify-center">
          <FileCode2 className="h-10 w-10 text-primary/60" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">No Tables Defined</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Add tables to your schema using the Builder tab to generate TypeScript interfaces.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Options Header */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/10 via-transparent to-sql-accent/10 border border-border/50 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
            <Braces className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">TypeScript Generator</h3>
            <p className="text-xs text-muted-foreground">{tables.length} table{tables.length !== 1 ? "s" : ""} → Type-safe interfaces</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadFile}
            className="gap-2 h-9"
          >
            <Download className="h-4 w-4" />
            Download .ts
          </Button>
          <Button 
            size="sm" 
            onClick={copyToClipboard}
            className="gap-2 h-9 bg-gradient-to-r from-primary to-primary/80"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Options Panel */}
      <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-muted/30 border border-border/50 rounded-xl">
        <div className="flex items-center gap-2">
          <Switch 
            id="insert-types" 
            checked={includeInsertTypes} 
            onCheckedChange={setIncludeInsertTypes}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="insert-types" className="text-sm cursor-pointer">Insert Types</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            id="update-types" 
            checked={includeUpdateTypes} 
            onCheckedChange={setIncludeUpdateTypes}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="update-types" className="text-sm cursor-pointer">Update Types</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            id="enums" 
            checked={includeEnums} 
            onCheckedChange={setIncludeEnums}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="enums" className="text-sm cursor-pointer">Table Enums</Label>
        </div>
        
        <div className="w-px h-6 bg-border/50" />
        
        <div className="flex items-center gap-2">
          <Switch 
            id="readonly" 
            checked={useReadonly} 
            onCheckedChange={setUseReadonly}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="readonly" className="text-sm cursor-pointer">Readonly</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Makes all Row properties readonly for immutability
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch 
            id="as-const" 
            checked={exportAsConst} 
            onCheckedChange={setExportAsConst}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="as-const" className="text-sm cursor-pointer">as const</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Use "as const" object instead of enum for table names
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Type Mapping Info */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
        <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground">Type Mapping:</span>{" "}
          SQL types are converted to TypeScript equivalents. UUID/Text → string, Integer/Numeric → number, 
          Boolean → boolean, JSONB → Record, Timestamps → string (ISO format). Arrays are preserved.
        </div>
      </div>

      {/* Generated Code */}
      <div className="flex-1 min-h-0 border-2 border-border/50 rounded-xl overflow-hidden bg-[hsl(var(--sql-bg))]">
        <ScrollArea className="h-full">
          <pre className="p-5 text-sm font-mono leading-relaxed text-foreground/90 whitespace-pre-wrap">
            <code>{generatedTypeScript}</code>
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}
