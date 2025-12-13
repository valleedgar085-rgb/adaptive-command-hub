import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Code, Brain, Zap, Shield, MessageSquare, Terminal } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Code,
      title: "AI-Powered Code Assistant",
      description: "Get accurate, production-ready code with detailed explanations powered by advanced AI models.",
    },
    {
      icon: Brain,
      title: "Learning & Memory",
      description: "The AI remembers your coding patterns and preferences to provide better assistance over time.",
    },
    {
      icon: MessageSquare,
      title: "Collaborative Coding",
      description: "Code generated in meaningful chunks with opportunities for your review and feedback.",
    },
    {
      icon: Zap,
      title: "Streaming Responses",
      description: "Real-time streaming of AI responses for a smooth, interactive experience.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations and data are securely stored and managed with Supabase.",
    },
    {
      icon: Terminal,
      title: "Mobile Ready",
      description: "Native Android app support via Capacitor for coding on the go.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border flex items-center px-4 bg-card/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold bg-gradient-accent bg-clip-text text-transparent">
          About Elite Code Assistant
        </h1>
      </header>

      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-2xl">
              <Code className="h-10 w-10 text-accent-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-accent bg-clip-text text-transparent">
            Elite Code Assistant
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            An AI-powered code assistant that helps you write better code faster. 
            Built with React, TypeScript, and powered by cutting-edge AI technology.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Technologies Used</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2 text-sm">Frontend</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React 18 with TypeScript</li>
                <li>• Vite for fast development</li>
                <li>• shadcn/ui components</li>
                <li>• Tailwind CSS for styling</li>
                <li>• React Router for navigation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm">Backend & Services</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Supabase (Auth, Database)</li>
                <li>• Edge Functions for AI</li>
                <li>• TanStack Query for state</li>
                <li>• Capacitor for Android</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Version 0.0.0 • Built with ❤️ for developers
          </p>
          <Button onClick={() => navigate("/")}>
            Start Coding
          </Button>
        </div>
      </main>
    </div>
  );
};

export default About;
