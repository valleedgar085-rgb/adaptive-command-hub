import { CheckCircle2, AlertCircle, AlertTriangle, Info, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationIssue {
  type: "error" | "warning" | "info" | "success";
  message: string;
  table?: string;
  column?: string;
}

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

interface SQLValidationPanelProps {
  tables: Table[];
}

export const SQLValidationPanel = ({ tables }: SQLValidationPanelProps) => {
  const validateSchema = (): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    if (tables.length === 0) {
      issues.push({ type: "info", message: "Add tables to start validation" });
      return issues;
    }

    // Check each table
    for (const table of tables) {
      // Check for primary key
      const hasPK = table.columns.some(c => c.primaryKey);
      if (!hasPK) {
        issues.push({
          type: "warning",
          message: `No primary key defined`,
          table: table.name
        });
      }

      // Check for duplicate column names
      const colNames = table.columns.map(c => c.name.toLowerCase());
      const duplicates = colNames.filter((name, i) => colNames.indexOf(name) !== i);
      if (duplicates.length > 0) {
        issues.push({
          type: "error",
          message: `Duplicate column name: "${duplicates[0]}"`,
          table: table.name
        });
      }

      // Check for empty column names
      const emptyNames = table.columns.filter(c => !c.name.trim());
      if (emptyNames.length > 0) {
        issues.push({
          type: "error",
          message: `Empty column name detected`,
          table: table.name
        });
      }

      // Check for user_id column (RLS best practice)
      const hasUserId = table.columns.some(c => c.name.toLowerCase() === "user_id");
      if (!hasUserId && table.name !== "profiles" && table.name !== "settings") {
        issues.push({
          type: "info",
          message: `Consider adding user_id for RLS`,
          table: table.name
        });
      }

      // Check for timestamps
      const hasCreatedAt = table.columns.some(c => c.name.toLowerCase() === "created_at");
      const hasUpdatedAt = table.columns.some(c => c.name.toLowerCase() === "updated_at");
      if (!hasCreatedAt || !hasUpdatedAt) {
        issues.push({
          type: "info",
          message: `Consider adding timestamp columns`,
          table: table.name
        });
      }

      // Validate foreign key references
      for (const col of table.columns) {
        if (col.foreignKey) {
          const [refTable] = col.foreignKey.split(".");
          const exists = tables.some(t => t.name === refTable);
          if (!exists) {
            issues.push({
              type: "warning",
              message: `FK references non-existent table "${refTable}"`,
              table: table.name,
              column: col.name
            });
          }
        }
      }
    }

    // Check for table naming conventions
    for (const table of tables) {
      if (!/^[a-z][a-z0-9_]*$/.test(table.name)) {
        issues.push({
          type: "warning",
          message: `Use lowercase snake_case for table names`,
          table: table.name
        });
      }
    }

    // Success message if no issues
    if (issues.length === 0) {
      issues.push({ type: "success", message: "Schema looks good! No issues found." });
    }

    return issues;
  };

  const issues = validateSchema();
  const errorCount = issues.filter(i => i.type === "error").length;
  const warningCount = issues.filter(i => i.type === "warning").length;

  const getIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
      default: return <Info className="h-4 w-4 text-primary flex-shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Schema Validation</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <AlertCircle className="h-3 w-3" />
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-500 font-medium">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && tables.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              Valid
            </span>
          )}
        </div>
      </div>

      {/* Issues List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                issue.type === "error" 
                  ? "bg-destructive/5 border-destructive/20" 
                  : issue.type === "warning"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : issue.type === "success"
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-primary/5 border-primary/20"
              }`}
            >
              {getIcon(issue.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{issue.message}</p>
                {(issue.table || issue.column) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {issue.table && <span className="font-mono">{issue.table}</span>}
                    {issue.column && <span className="font-mono">.{issue.column}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
