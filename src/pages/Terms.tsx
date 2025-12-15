import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code, Zap, Box, Layers, RefreshCw, GitBranch, Database, Shield, Terminal, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermDefinition {
  term: string;
  icon: React.ReactNode;
  definition: string;
  why: string;
  example?: string;
}

const terms: TermDefinition[] = [
  {
    term: "Variable",
    icon: <Box className="h-5 w-5" />,
    definition: "A named container that stores a value (number, text, etc.) that can change during program execution.",
    why: "Variables let you store and reuse data. Without them, you'd have to hardcode every value, making programs inflexible.",
    example: "let score = 100; // 'score' holds the value 100"
  },
  {
    term: "Function",
    icon: <Zap className="h-5 w-5" />,
    definition: "A reusable block of code that performs a specific task. It can accept inputs (parameters) and return an output.",
    why: "Functions prevent code duplication. Write once, use anywhere. They make code organized and maintainable.",
    example: "function add(a, b) { return a + b; }"
  },
  {
    term: "Array",
    icon: <Layers className="h-5 w-5" />,
    definition: "An ordered collection of values stored in a single variable. Each value has a numbered position (index) starting from 0.",
    why: "Arrays let you store multiple related items together. You can loop through them, filter, sort, and transform data efficiently.",
    example: "const colors = ['red', 'blue', 'green'];"
  },
  {
    term: "Object",
    icon: <Database className="h-5 w-5" />,
    definition: "A collection of key-value pairs that groups related data and functionality together.",
    why: "Objects represent real-world entities with properties. A 'user' object can have name, email, and age - all in one place.",
    example: "const user = { name: 'Alex', age: 25 };"
  },
  {
    term: "Loop",
    icon: <RefreshCw className="h-5 w-5" />,
    definition: "A control structure that repeats a block of code multiple times until a condition is met.",
    why: "Loops automate repetitive tasks. Instead of writing the same code 100 times, a loop does it in 3 lines.",
    example: "for (let i = 0; i < 5; i++) { console.log(i); }"
  },
  {
    term: "Conditional (if/else)",
    icon: <GitBranch className="h-5 w-5" />,
    definition: "A statement that executes different code based on whether a condition is true or false.",
    why: "Conditionals let programs make decisions. 'If user is logged in, show dashboard. Else, show login page.'",
    example: "if (age >= 18) { console.log('Adult'); }"
  },
  {
    term: "String",
    icon: <Code className="h-5 w-5" />,
    definition: "A sequence of characters (text) enclosed in quotes. Can be single, double, or backticks.",
    why: "Strings represent text data - names, messages, HTML content. Essential for user interaction and display.",
    example: "const greeting = 'Hello, World!';"
  },
  {
    term: "Boolean",
    icon: <Shield className="h-5 w-5" />,
    definition: "A data type with only two possible values: true or false.",
    why: "Booleans drive logic. Is the user authenticated? Is the form valid? These yes/no answers control program flow.",
    example: "const isLoggedIn = true;"
  },
  {
    term: "API (Application Programming Interface)",
    icon: <Terminal className="h-5 w-5" />,
    definition: "A set of rules and protocols that allows different software applications to communicate with each other.",
    why: "APIs let your app talk to other services - get weather data, process payments, send emails - without building everything yourself.",
    example: "fetch('/api/users').then(res => res.json())"
  },
  {
    term: "Async/Await",
    icon: <Cpu className="h-5 w-5" />,
    definition: "Keywords that make asynchronous code (operations that take time) look and behave like synchronous code.",
    why: "Network requests, file operations, and timers don't complete instantly. Async/await lets you wait for them elegantly.",
    example: "const data = await fetch('/api/data');"
  },
  {
    term: "DOM (Document Object Model)",
    icon: <Layers className="h-5 w-5" />,
    definition: "A programming interface that represents HTML as a tree of objects, allowing JavaScript to modify page content.",
    why: "The DOM is how JavaScript interacts with web pages. Change text, add elements, respond to clicks - all through the DOM.",
    example: "document.getElementById('title').textContent = 'New Title';"
  },
  {
    term: "Event",
    icon: <Zap className="h-5 w-5" />,
    definition: "An action or occurrence (click, keypress, scroll) that the browser detects and can respond to.",
    why: "Events make websites interactive. When a user clicks a button, an event triggers code to run.",
    example: "button.addEventListener('click', handleClick);"
  },
  {
    term: "State",
    icon: <Database className="h-5 w-5" />,
    definition: "Data that represents the current condition of an application at any given moment.",
    why: "State tracks everything: is the menu open? What items are in the cart? Managing state is core to modern apps.",
    example: "const [count, setCount] = useState(0);"
  },
  {
    term: "Component",
    icon: <Box className="h-5 w-5" />,
    definition: "A reusable, self-contained piece of UI that manages its own structure, style, and behavior.",
    why: "Components are building blocks. Build a Button component once, use it everywhere. This is how modern UIs are built.",
    example: "function Button({ label }) { return <button>{label}</button>; }"
  },
  {
    term: "Props",
    icon: <GitBranch className="h-5 w-5" />,
    definition: "Short for 'properties' - data passed from a parent component to a child component in React.",
    why: "Props make components customizable. Pass different data to the same component to render different content.",
    example: "<UserCard name='Alex' avatar='/alex.png' />"
  },
  {
    term: "Callback",
    icon: <RefreshCw className="h-5 w-5" />,
    definition: "A function passed as an argument to another function, to be executed later.",
    why: "Callbacks enable asynchronous programming. 'When this finishes, call this function' is a powerful pattern.",
    example: "setTimeout(() => console.log('Done!'), 1000);"
  },
  {
    term: "Promise",
    icon: <Shield className="h-5 w-5" />,
    definition: "An object representing the eventual completion or failure of an asynchronous operation.",
    why: "Promises handle async operations cleanly. They can resolve with data or reject with an error.",
    example: "fetch(url).then(data => use(data)).catch(err => handle(err));"
  },
  {
    term: "Type",
    icon: <Code className="h-5 w-5" />,
    definition: "A classification of data (string, number, boolean, object, etc.) that determines what operations can be performed on it.",
    why: "Types prevent bugs. TypeScript catches 'Cannot read property of undefined' before your code even runs.",
    example: "function greet(name: string): string { return `Hello, ${name}`; }"
  }
];

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              Coding Fundamentals
            </h1>
            <p className="text-sm text-muted-foreground">
              Essential terms every developer should know
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid gap-4 md:grid-cols-2">
            {terms.map((item, idx) => (
              <div
                key={idx}
                className="group rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground mb-1">
                      {item.term}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {item.definition}
                    </p>
                    <div className="bg-primary/5 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-primary mb-1">Why it matters:</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.why}
                      </p>
                    </div>
                    {item.example && (
                      <div className="bg-muted/30 rounded-lg p-2.5 border border-border/30">
                        <code className="text-xs font-mono text-foreground">
                          {item.example}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Terms;
