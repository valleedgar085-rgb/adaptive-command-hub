import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  Sparkles, 
  Code2, 
  Braces, 
  Hash,
  Type,
  Box,
  Zap,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  text: string;
  displayText: string;
  type: "keyword" | "function" | "variable" | "class" | "snippet" | "property" | "method";
  description?: string;
  insertText?: string;
  language: string;
}

interface CodeAutocompleteProps {
  language: string;
  currentInput: string;
  cursorPosition?: number;
  onSelect: (suggestion: Suggestion) => void;
  isVisible: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

// Language-specific suggestions
const LANGUAGE_SUGGESTIONS: Record<string, Suggestion[]> = {
  typescript: [
    { id: "ts-1", text: "interface", displayText: "interface", type: "keyword", description: "Define a TypeScript interface", insertText: "interface ${1:Name} {\n  ${2}\n}", language: "typescript" },
    { id: "ts-2", text: "type", displayText: "type", type: "keyword", description: "Define a type alias", insertText: "type ${1:Name} = ${2}", language: "typescript" },
    { id: "ts-3", text: "const", displayText: "const", type: "keyword", description: "Declare a constant", insertText: "const ${1:name} = ${2}", language: "typescript" },
    { id: "ts-4", text: "function", displayText: "function", type: "keyword", description: "Declare a function", insertText: "function ${1:name}(${2}): ${3:void} {\n  ${4}\n}", language: "typescript" },
    { id: "ts-5", text: "async", displayText: "async function", type: "snippet", description: "Async function", insertText: "async function ${1:name}(${2}): Promise<${3:void}> {\n  ${4}\n}", language: "typescript" },
    { id: "ts-6", text: "useState", displayText: "useState<T>", type: "function", description: "React useState hook", insertText: "const [${1:state}, set${2:State}] = useState<${3:T}>(${4})", language: "typescript" },
    { id: "ts-7", text: "useEffect", displayText: "useEffect", type: "function", description: "React useEffect hook", insertText: "useEffect(() => {\n  ${1}\n}, [${2}])", language: "typescript" },
    { id: "ts-8", text: "useCallback", displayText: "useCallback", type: "function", description: "React useCallback hook", insertText: "useCallback((${1}) => {\n  ${2}\n}, [${3}])", language: "typescript" },
    { id: "ts-9", text: "useMemo", displayText: "useMemo", type: "function", description: "React useMemo hook", insertText: "useMemo(() => ${1}, [${2}])", language: "typescript" },
    { id: "ts-10", text: "component", displayText: "React Component", type: "snippet", description: "Functional component", insertText: "export const ${1:Component} = () => {\n  return (\n    <div>\n      ${2}\n    </div>\n  )\n}", language: "typescript" },
    { id: "ts-11", text: "try", displayText: "try/catch", type: "snippet", description: "Try-catch block", insertText: "try {\n  ${1}\n} catch (error) {\n  ${2}\n}", language: "typescript" },
    { id: "ts-12", text: "map", displayText: ".map()", type: "method", description: "Array map method", insertText: ".map((${1:item}) => ${2})", language: "typescript" },
    { id: "ts-13", text: "filter", displayText: ".filter()", type: "method", description: "Array filter method", insertText: ".filter((${1:item}) => ${2})", language: "typescript" },
    { id: "ts-14", text: "reduce", displayText: ".reduce()", type: "method", description: "Array reduce method", insertText: ".reduce((${1:acc}, ${2:item}) => ${3}, ${4:initial})", language: "typescript" },
    { id: "ts-15", text: "import", displayText: "import", type: "keyword", description: "Import statement", insertText: "import { ${1} } from '${2}'", language: "typescript" },
  ],
  javascript: [
    { id: "js-1", text: "const", displayText: "const", type: "keyword", description: "Declare a constant", insertText: "const ${1:name} = ${2}", language: "javascript" },
    { id: "js-2", text: "let", displayText: "let", type: "keyword", description: "Declare a variable", insertText: "let ${1:name} = ${2}", language: "javascript" },
    { id: "js-3", text: "function", displayText: "function", type: "keyword", description: "Declare a function", insertText: "function ${1:name}(${2}) {\n  ${3}\n}", language: "javascript" },
    { id: "js-4", text: "arrow", displayText: "Arrow function", type: "snippet", description: "Arrow function", insertText: "const ${1:name} = (${2}) => {\n  ${3}\n}", language: "javascript" },
    { id: "js-5", text: "async", displayText: "async function", type: "snippet", description: "Async function", insertText: "async function ${1:name}(${2}) {\n  ${3}\n}", language: "javascript" },
    { id: "js-6", text: "class", displayText: "class", type: "keyword", description: "Declare a class", insertText: "class ${1:Name} {\n  constructor(${2}) {\n    ${3}\n  }\n}", language: "javascript" },
    { id: "js-7", text: "fetch", displayText: "fetch", type: "function", description: "Fetch API call", insertText: "fetch('${1:url}')\n  .then(res => res.json())\n  .then(data => ${2})\n  .catch(err => ${3})", language: "javascript" },
    { id: "js-8", text: "promise", displayText: "Promise", type: "snippet", description: "New Promise", insertText: "new Promise((resolve, reject) => {\n  ${1}\n})", language: "javascript" },
    { id: "js-9", text: "for", displayText: "for loop", type: "snippet", description: "For loop", insertText: "for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n  ${3}\n}", language: "javascript" },
    { id: "js-10", text: "foreach", displayText: ".forEach()", type: "method", description: "Array forEach", insertText: ".forEach((${1:item}) => {\n  ${2}\n})", language: "javascript" },
  ],
  python: [
    { id: "py-1", text: "def", displayText: "def", type: "keyword", description: "Define a function", insertText: "def ${1:name}(${2}):\n    ${3:pass}", language: "python" },
    { id: "py-2", text: "class", displayText: "class", type: "keyword", description: "Define a class", insertText: "class ${1:Name}:\n    def __init__(self${2}):\n        ${3:pass}", language: "python" },
    { id: "py-3", text: "async def", displayText: "async def", type: "keyword", description: "Async function", insertText: "async def ${1:name}(${2}):\n    ${3:pass}", language: "python" },
    { id: "py-4", text: "if", displayText: "if", type: "keyword", description: "If statement", insertText: "if ${1:condition}:\n    ${2:pass}", language: "python" },
    { id: "py-5", text: "for", displayText: "for loop", type: "snippet", description: "For loop", insertText: "for ${1:item} in ${2:items}:\n    ${3:pass}", language: "python" },
    { id: "py-6", text: "with", displayText: "with", type: "keyword", description: "Context manager", insertText: "with ${1:expression} as ${2:var}:\n    ${3:pass}", language: "python" },
    { id: "py-7", text: "try", displayText: "try/except", type: "snippet", description: "Try-except block", insertText: "try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${3:pass}", language: "python" },
    { id: "py-8", text: "lambda", displayText: "lambda", type: "keyword", description: "Lambda function", insertText: "lambda ${1:x}: ${2}", language: "python" },
    { id: "py-9", text: "list comp", displayText: "List comprehension", type: "snippet", description: "List comprehension", insertText: "[${1:expr} for ${2:item} in ${3:items}]", language: "python" },
    { id: "py-10", text: "dict comp", displayText: "Dict comprehension", type: "snippet", description: "Dictionary comprehension", insertText: "{${1:key}: ${2:value} for ${3:item} in ${4:items}}", language: "python" },
    { id: "py-11", text: "import", displayText: "import", type: "keyword", description: "Import module", insertText: "import ${1:module}", language: "python" },
    { id: "py-12", text: "from import", displayText: "from ... import", type: "snippet", description: "Import from module", insertText: "from ${1:module} import ${2:name}", language: "python" },
  ],
  sql: [
    { id: "sql-1", text: "select", displayText: "SELECT", type: "keyword", description: "Select statement", insertText: "SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition}", language: "sql" },
    { id: "sql-2", text: "insert", displayText: "INSERT INTO", type: "keyword", description: "Insert statement", insertText: "INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values})", language: "sql" },
    { id: "sql-3", text: "update", displayText: "UPDATE", type: "keyword", description: "Update statement", insertText: "UPDATE ${1:table}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition}", language: "sql" },
    { id: "sql-4", text: "delete", displayText: "DELETE FROM", type: "keyword", description: "Delete statement", insertText: "DELETE FROM ${1:table}\nWHERE ${2:condition}", language: "sql" },
    { id: "sql-5", text: "create table", displayText: "CREATE TABLE", type: "snippet", description: "Create table", insertText: "CREATE TABLE ${1:table_name} (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  ${2:column} ${3:type},\n  created_at TIMESTAMPTZ DEFAULT now()\n)", language: "sql" },
    { id: "sql-6", text: "join", displayText: "INNER JOIN", type: "keyword", description: "Inner join", insertText: "INNER JOIN ${1:table} ON ${2:condition}", language: "sql" },
    { id: "sql-7", text: "left join", displayText: "LEFT JOIN", type: "keyword", description: "Left join", insertText: "LEFT JOIN ${1:table} ON ${2:condition}", language: "sql" },
    { id: "sql-8", text: "group by", displayText: "GROUP BY", type: "keyword", description: "Group by clause", insertText: "GROUP BY ${1:column}", language: "sql" },
    { id: "sql-9", text: "order by", displayText: "ORDER BY", type: "keyword", description: "Order by clause", insertText: "ORDER BY ${1:column} ${2:ASC}", language: "sql" },
    { id: "sql-10", text: "alter table", displayText: "ALTER TABLE", type: "keyword", description: "Alter table", insertText: "ALTER TABLE ${1:table}\nADD COLUMN ${2:column} ${3:type}", language: "sql" },
    { id: "sql-11", text: "rls policy", displayText: "RLS Policy", type: "snippet", description: "Row Level Security policy", insertText: "CREATE POLICY \"${1:policy_name}\"\nON ${2:table}\nFOR ${3:SELECT}\nUSING (${4:auth.uid() = user_id})", language: "sql" },
  ],
  java: [
    { id: "java-1", text: "public class", displayText: "public class", type: "keyword", description: "Public class", insertText: "public class ${1:Name} {\n    ${2}\n}", language: "java" },
    { id: "java-2", text: "public void", displayText: "public void", type: "keyword", description: "Public void method", insertText: "public void ${1:methodName}(${2}) {\n    ${3}\n}", language: "java" },
    { id: "java-3", text: "private", displayText: "private", type: "keyword", description: "Private field", insertText: "private ${1:Type} ${2:name};", language: "java" },
    { id: "java-4", text: "for", displayText: "for loop", type: "snippet", description: "For loop", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n    ${3}\n}", language: "java" },
    { id: "java-5", text: "foreach", displayText: "for-each", type: "snippet", description: "Enhanced for loop", insertText: "for (${1:Type} ${2:item} : ${3:collection}) {\n    ${4}\n}", language: "java" },
    { id: "java-6", text: "try", displayText: "try-catch", type: "snippet", description: "Try-catch block", insertText: "try {\n    ${1}\n} catch (${2:Exception} e) {\n    ${3}\n}", language: "java" },
    { id: "java-7", text: "main", displayText: "main method", type: "snippet", description: "Main method", insertText: "public static void main(String[] args) {\n    ${1}\n}", language: "java" },
    { id: "java-8", text: "sout", displayText: "System.out.println", type: "snippet", description: "Print statement", insertText: "System.out.println(${1});", language: "java" },
  ],
  kotlin: [
    { id: "kt-1", text: "fun", displayText: "fun", type: "keyword", description: "Function declaration", insertText: "fun ${1:name}(${2}): ${3:Unit} {\n    ${4}\n}", language: "kotlin" },
    { id: "kt-2", text: "class", displayText: "class", type: "keyword", description: "Class declaration", insertText: "class ${1:Name}(${2}) {\n    ${3}\n}", language: "kotlin" },
    { id: "kt-3", text: "data class", displayText: "data class", type: "keyword", description: "Data class", insertText: "data class ${1:Name}(\n    val ${2:property}: ${3:Type}\n)", language: "kotlin" },
    { id: "kt-4", text: "suspend", displayText: "suspend fun", type: "keyword", description: "Suspend function", insertText: "suspend fun ${1:name}(${2}): ${3:Unit} {\n    ${4}\n}", language: "kotlin" },
    { id: "kt-5", text: "when", displayText: "when", type: "keyword", description: "When expression", insertText: "when (${1:value}) {\n    ${2:case} -> ${3}\n    else -> ${4}\n}", language: "kotlin" },
    { id: "kt-6", text: "val", displayText: "val", type: "keyword", description: "Immutable variable", insertText: "val ${1:name}: ${2:Type} = ${3}", language: "kotlin" },
    { id: "kt-7", text: "var", displayText: "var", type: "keyword", description: "Mutable variable", insertText: "var ${1:name}: ${2:Type} = ${3}", language: "kotlin" },
    { id: "kt-8", text: "composable", displayText: "@Composable", type: "snippet", description: "Jetpack Compose function", insertText: "@Composable\nfun ${1:Name}(${2}) {\n    ${3}\n}", language: "kotlin" },
  ],
};

const TYPE_ICONS: Record<Suggestion["type"], typeof Code2> = {
  keyword: Hash,
  function: Braces,
  variable: Box,
  class: Type,
  snippet: Sparkles,
  property: Code2,
  method: Zap,
};

const TYPE_COLORS: Record<Suggestion["type"], string> = {
  keyword: "text-purple-400",
  function: "text-blue-400",
  variable: "text-cyan-400",
  class: "text-yellow-400",
  snippet: "text-emerald-400",
  property: "text-orange-400",
  method: "text-pink-400",
};

export const CodeAutocomplete = ({
  language,
  currentInput,
  cursorPosition,
  onSelect,
  isVisible,
  onClose,
  position
}: CodeAutocompleteProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Get word at cursor for filtering
  const currentWord = useMemo(() => {
    if (!currentInput) return "";
    const words = currentInput.split(/[\s\n\r\t(){}[\];,]+/);
    return words[words.length - 1]?.toLowerCase() || "";
  }, [currentInput]);

  // Filter suggestions based on current word
  const filteredSuggestions = useMemo(() => {
    const langKey = language.toLowerCase();
    const suggestions = LANGUAGE_SUGGESTIONS[langKey] || LANGUAGE_SUGGESTIONS["typescript"];
    
    if (!currentWord) return suggestions.slice(0, 8);
    
    return suggestions
      .filter(s => 
        s.text.toLowerCase().includes(currentWord) ||
        s.displayText.toLowerCase().includes(currentWord)
      )
      .slice(0, 8);
  }, [language, currentWord]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredSuggestions]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case "Tab":
        case "Enter":
          e.preventDefault();
          if (filteredSuggestions[selectedIndex]) {
            onSelect(filteredSuggestions[selectedIndex]);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, filteredSuggestions, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isVisible || filteredSuggestions.length === 0) return null;

  return (
    <div 
      className="absolute z-50 w-80 max-h-64 overflow-hidden rounded-xl border-2 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl"
      style={position ? { left: position.x, top: position.y } : {}}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Suggestions for <span className="text-foreground font-medium">{language}</span></span>
          {currentWord && (
            <span className="ml-auto px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px]">
              "{currentWord}"
            </span>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div ref={listRef} className="overflow-y-auto max-h-48">
        {filteredSuggestions.map((suggestion, index) => {
          const Icon = TYPE_ICONS[suggestion.type];
          const colorClass = TYPE_COLORS[suggestion.type];
          
          return (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-3 text-left transition-colors",
                index === selectedIndex
                  ? "bg-primary/10"
                  : "hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center bg-muted/50",
                colorClass
              )}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {suggestion.displayText}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                    {suggestion.type}
                  </span>
                </div>
                {suggestion.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.description}
                  </p>
                )}
              </div>

              {index === selectedIndex && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <kbd className="px-1 py-0.5 rounded bg-muted/50 font-mono">Tab</kbd>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="px-1 py-0.5 rounded bg-muted/50 font-mono">↑↓</kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1 py-0.5 rounded bg-muted/50 font-mono">Tab</kbd>
          <span>Insert</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1 py-0.5 rounded bg-muted/50 font-mono">Esc</kbd>
          <span>Close</span>
        </div>
      </div>
    </div>
  );
};

// Hook for managing autocomplete state
export const useCodeAutocomplete = (language: string) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentInput, setCurrentInput] = useState("");

  const showAutocomplete = useCallback((input: string) => {
    setCurrentInput(input);
    setIsVisible(true);
  }, []);

  const hideAutocomplete = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleInputChange = useCallback((input: string) => {
    setCurrentInput(input);
    // Show autocomplete after typing at least 2 characters
    const words = input.split(/[\s\n\r\t(){}[\];,]+/);
    const lastWord = words[words.length - 1] || "";
    
    if (lastWord.length >= 2) {
      setIsVisible(true);
    } else if (lastWord.length === 0) {
      setIsVisible(false);
    }
  }, []);

  return {
    isVisible,
    currentInput,
    showAutocomplete,
    hideAutocomplete,
    handleInputChange
  };
};
