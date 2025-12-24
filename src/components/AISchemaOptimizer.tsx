import { useState } from "react";
import { 
  Sparkles, Loader2, Zap, AlertTriangle, AlertCircle, Info, 
  CheckCircle2, TrendingUp, Shield, Database, Tag, Search,
  Code, ChevronDown, ChevronUp, Copy, Check, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface Suggestion {
  id: string;
  type: "performance" | "security" | "structure" | "naming" | "indexing" | "normalization";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  table: string;
  column?: string;
  recommendation: string;
  impact: string;
  sql_fix?: string;
}

interface OptimizationResult {
  summary: string;
  score: number;
  suggestions: Suggestion[];
  best_practices: string[];
}

interface AISchemaOptimizerProps {
  tables: Table[];
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
};

const TYPE_CONFIG = {
  performance: { icon: TrendingUp, label: "Performance", color: "text-emerald-400" },
  security: { icon: Shield, label: "Security", color: "text-red-400" },
  structure: { icon: Database, label: "Structure", color: "text-blue-400" },
  naming: { icon: Tag, label: "Naming", color: "text-purple-400" },
  indexing: { icon: Search, label: "Indexing", color: "text-cyan-400" },
  normalization: { icon: Database, label: "Normalization", color: "text-orange-400" },
};

export const AISchemaOptimizer = ({ tables }: AISchemaOptimizerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeSchema = async () => {
    if (tables.length === 0) {
      toast({
        title: "No tables",
        description: "Add some tables to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error("Please sign in to use AI optimization");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-schema`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({ tables }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze schema");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: "Analysis complete!",
        description: `Found ${data.suggestions?.length || 0} optimization suggestions`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze schema";
      setError(message);
      toast({
        title: "Analysis failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copySql = async (sql: string, id: string) => {
    await navigator.clipboard.writeText(sql);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2000);
    toast({ title: "Copied!", description: "SQL copied to clipboard" });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Needs Work";
    return "Critical";
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Schema Optimizer</h3>
            <p className="text-xs text-muted-foreground">
              Analyze your schema for performance, security, and best practices
            </p>
          </div>
        </div>
        <Button
          onClick={analyzeSchema}
          disabled={isAnalyzing || tables.length === 0}
          className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Schema
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {!result && !isAnalyzing && !error && (
          <div className="text-center py-16">
            <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-medium">Ready to analyze</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {tables.length > 0 
                ? `${tables.length} table(s) ready for optimization analysis`
                : "Add some tables first, then analyze"}
            </p>
          </div>
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            {/* Score Card */}
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Schema Health Score</CardTitle>
                  <Button variant="ghost" size="sm" onClick={analyzeSchema} className="gap-1.5 h-8">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Re-analyze
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}
                  </div>
                  <div className="flex-1">
                    <Progress value={result.score} className="h-3" />
                    <p className={`text-sm font-medium mt-1 ${getScoreColor(result.score)}`}>
                      {getScoreLabel(result.score)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Best Practices */}
            {result.best_practices && result.best_practices.length > 0 && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                    What You're Doing Right
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {result.best_practices.map((practice, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {practice}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-semibold text-foreground">
                    Optimization Suggestions ({result.suggestions.length})
                  </h4>
                  <div className="flex gap-1.5">
                    {["critical", "warning", "info"].map(severity => {
                      const count = result.suggestions.filter(s => s.severity === severity).length;
                      if (count === 0) return null;
                      const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
                      return (
                        <Badge key={severity} variant="outline" className={`${config.bg} ${config.border} text-xs`}>
                          {count} {severity}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  {result.suggestions.map((suggestion) => {
                    const severityConfig = SEVERITY_CONFIG[suggestion.severity];
                    const typeConfig = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.structure;
                    const SeverityIcon = severityConfig.icon;
                    const TypeIcon = typeConfig.icon;
                    const isExpanded = expandedSuggestions.has(suggestion.id);

                    return (
                      <Collapsible key={suggestion.id} open={isExpanded} onOpenChange={() => toggleSuggestion(suggestion.id)}>
                        <Card className={`${severityConfig.bg} ${severityConfig.border} border overflow-hidden`}>
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="p-3 hover:bg-muted/30 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg ${severityConfig.bg}`}>
                                  <SeverityIcon className={`h-4 w-4 ${severityConfig.color}`} />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                                    <Badge variant="secondary" className="text-[10px] gap-1">
                                      <TypeIcon className={`h-2.5 w-2.5 ${typeConfig.color}`} />
                                      {typeConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      {suggestion.table}
                                      {suggestion.column && `.${suggestion.column}`}
                                    </Badge>
                                  </div>
                                  <CardDescription className="text-xs mt-1 line-clamp-2">
                                    {suggestion.description}
                                  </CardDescription>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="px-3 pb-3 pt-0 space-y-3">
                              <div className="grid gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-background/50">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
                                  <p className="text-foreground">{suggestion.recommendation}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-background/50">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Expected Impact</p>
                                  <p className="text-foreground">{suggestion.impact}</p>
                                </div>
                                {suggestion.sql_fix && (
                                  <div className="p-3 rounded-lg bg-background/50">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <Code className="h-3 w-3" />
                                        SQL Fix
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copySql(suggestion.sql_fix!, suggestion.id);
                                        }}
                                        className="h-7 gap-1.5 text-xs"
                                      >
                                        {copiedSql === suggestion.id ? (
                                          <Check className="h-3 w-3" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                        Copy
                                      </Button>
                                    </div>
                                    <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                      {suggestion.sql_fix}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}

            {result.suggestions?.length === 0 && (
              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                  <p className="font-medium text-emerald-500">Perfect Schema!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No optimization suggestions found. Your schema follows best practices.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
