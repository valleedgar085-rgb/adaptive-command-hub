import { useState } from "react";
import { 
  FolderPlus, 
  Code2, 
  Check,
  Smartphone,
  Globe,
  Server,
  Database,
  Sparkles,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProjectLanguage {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  extensions: string[];
  templates: string[];
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof Globe;
  category: string;
}

const LANGUAGES: ProjectLanguage[] = [
  {
    id: "typescript",
    name: "TypeScript",
    icon: "TS",
    color: "bg-blue-500",
    description: "Strongly typed JavaScript",
    extensions: [".ts", ".tsx"],
    templates: ["react", "node", "next"]
  },
  {
    id: "javascript",
    name: "JavaScript",
    icon: "JS",
    color: "bg-yellow-500",
    description: "Dynamic web language",
    extensions: [".js", ".jsx"],
    templates: ["react", "node", "vanilla"]
  },
  {
    id: "python",
    name: "Python",
    icon: "PY",
    color: "bg-green-500",
    description: "Versatile & beginner-friendly",
    extensions: [".py"],
    templates: ["flask", "django", "fastapi"]
  },
  {
    id: "java",
    name: "Java",
    icon: "JV",
    color: "bg-orange-500",
    description: "Enterprise & Android",
    extensions: [".java"],
    templates: ["spring", "android", "maven"]
  },
  {
    id: "kotlin",
    name: "Kotlin",
    icon: "KT",
    color: "bg-purple-500",
    description: "Modern Android development",
    extensions: [".kt", ".kts"],
    templates: ["android", "ktor", "compose"]
  },
  {
    id: "swift",
    name: "Swift",
    icon: "SW",
    color: "bg-orange-400",
    description: "iOS & macOS apps",
    extensions: [".swift"],
    templates: ["ios", "swiftui", "vapor"]
  },
  {
    id: "rust",
    name: "Rust",
    icon: "RS",
    color: "bg-orange-600",
    description: "Systems programming",
    extensions: [".rs"],
    templates: ["cli", "wasm", "api"]
  },
  {
    id: "go",
    name: "Go",
    icon: "GO",
    color: "bg-cyan-500",
    description: "Cloud & microservices",
    extensions: [".go"],
    templates: ["api", "cli", "microservice"]
  },
  {
    id: "csharp",
    name: "C#",
    icon: "C#",
    color: "bg-violet-500",
    description: ".NET & Unity games",
    extensions: [".cs"],
    templates: ["dotnet", "unity", "aspnet"]
  },
  {
    id: "sql",
    name: "SQL",
    icon: "DB",
    color: "bg-cyan-400",
    description: "Database queries",
    extensions: [".sql"],
    templates: ["postgres", "mysql", "sqlite"]
  }
];

const TEMPLATES: ProjectTemplate[] = [
  { id: "react", name: "React App", description: "Modern React with hooks", icon: Globe, category: "web" },
  { id: "node", name: "Node.js API", description: "Express REST API", icon: Server, category: "backend" },
  { id: "android", name: "Android App", description: "Native Android", icon: Smartphone, category: "mobile" },
  { id: "database", name: "Database Schema", description: "SQL schema design", icon: Database, category: "database" },
];

interface ProjectSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreate: (config: ProjectConfig) => void;
}

export interface ProjectConfig {
  name: string;
  language: ProjectLanguage;
  template: string;
  features: string[];
}

export const ProjectSetup = ({ open, onOpenChange, onProjectCreate }: ProjectSetupProps) => {
  const [step, setStep] = useState<"language" | "template" | "configure">("language");
  const [projectName, setProjectName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<ProjectLanguage | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const features = [
    { id: "autocomplete", name: "Smart Autocomplete", description: "AI-powered code suggestions" },
    { id: "linting", name: "Live Linting", description: "Real-time error detection" },
    { id: "formatting", name: "Auto Format", description: "Code formatting on save" },
    { id: "git", name: "Git Integration", description: "Version control support" },
    { id: "testing", name: "Testing Setup", description: "Unit test configuration" },
    { id: "debugging", name: "Debugger", description: "Built-in debugging tools" },
  ];

  const handleCreate = () => {
    if (!selectedLanguage || !projectName) return;
    
    onProjectCreate({
      name: projectName,
      language: selectedLanguage,
      template: selectedTemplate,
      features: selectedFeatures
    });
    
    // Reset state
    setStep("language");
    setProjectName("");
    setSelectedLanguage(null);
    setSelectedTemplate("");
    setSelectedFeatures([]);
    onOpenChange(false);
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const renderStep = () => {
    switch (step) {
      case "language":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">Choose Your Language</h3>
              <p className="text-sm text-muted-foreground">Select the primary language for your project</p>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setStep("template");
                    }}
                    className={cn(
                      "group relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                      "hover:scale-[1.02] hover:shadow-lg",
                      selectedLanguage?.id === lang.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm",
                        lang.color
                      )}>
                        {lang.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {lang.name}
                          {selectedLanguage?.id === lang.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lang.description}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {lang.extensions.map(ext => (
                            <Badge 
                              key={ext} 
                              variant="outline" 
                              className="text-[10px] h-5 bg-background/50"
                            >
                              {ext}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case "template":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs",
                  selectedLanguage?.color
                )}>
                  {selectedLanguage?.icon}
                </div>
                <span className="font-semibold text-foreground">{selectedLanguage?.name}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Choose a Template</h3>
              <p className="text-sm text-muted-foreground">Start with a pre-configured project structure</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.filter(t => 
                selectedLanguage?.templates.some(lt => t.id.includes(lt) || lt.includes(t.id)) ||
                t.category === "database"
              ).map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setStep("configure");
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    "hover:scale-[1.02] hover:shadow-lg",
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card/50 hover:border-primary/50"
                  )}
                >
                  <template.icon className="h-8 w-8 text-primary mb-3" />
                  <div className="font-semibold text-foreground">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </button>
              ))}
              
              <button
                onClick={() => {
                  setSelectedTemplate("blank");
                  setStep("configure");
                }}
                className="p-4 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 transition-all text-left"
              >
                <FolderPlus className="h-8 w-8 text-muted-foreground mb-3" />
                <div className="font-semibold text-foreground">Blank Project</div>
                <div className="text-xs text-muted-foreground">Start from scratch</div>
              </button>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => setStep("language")}
              className="w-full mt-4"
            >
              ← Back to Languages
            </Button>
          </div>
        );

      case "configure":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">Configure Your Project</h3>
              <p className="text-sm text-muted-foreground">Name your project and select features</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Project Name
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-awesome-project"
                  className="h-11 bg-muted/50 border-border/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Features <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => toggleFeature(feature.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        selectedFeatures.includes(feature.id)
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-card/50 hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center",
                          selectedFeatures.includes(feature.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground"
                        )}>
                          {selectedFeatures.includes(feature.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {feature.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {feature.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => setStep("template")}
                className="flex-1"
              >
                ← Back
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!projectName.trim()}
                className="flex-1 bg-primary text-primary-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            New Project Setup
          </DialogTitle>
          <DialogDescription>
            Create a new project with language-specific features and autocomplete
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4 border-b border-border/30">
          {["language", "template", "configure"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s
                  ? "bg-primary text-primary-foreground"
                  : ["language", "template", "configure"].indexOf(step) > i
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {["language", "template", "configure"].indexOf(step) > i ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && (
                <div className={cn(
                  "w-12 h-0.5",
                  ["language", "template", "configure"].indexOf(step) > i
                    ? "bg-emerald-500"
                    : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
