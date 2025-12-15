import { useState } from "react";
import { Database, Play, Copy, Check, Plus, Trash2, Table2, Key, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CodeBlock } from "./CodeBlock";

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
  const { toast } = useToast();

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
      
      // Enable RLS
      sql += `-- Enable Row Level Security\n`;
      sql += `ALTER TABLE public.${table.name} ENABLE ROW LEVEL SECURITY;\n\n`;
      
      // Basic policies
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-ai flex items-center justify-center shadow-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">SQL Database Builder</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Design your database schema visually and generate SQL
              </DialogDescription>
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
  );
};
