import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Bell,
  Shield,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Rocket,
  Settings,
  FileCode
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PWADocumentationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CODE_SNIPPETS = {
  manifest: `// public/manifest.json
{
  "name": "Elite Code Assistant",
  "short_name": "ECA",
  "description": "Your AI-powered coding companion",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f14",
  "theme_color": "#7c3aed",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}`,

  serviceWorker: `// public/sw.js
const CACHE_NAME = 'eca-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event with network-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Return cached version or offline page
        return caches.match(event.request)
          .then((response) => response || caches.match('/offline.html'));
      })
  );
});`,

  registration: `// src/main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && 
                navigator.serviceWorker.controller) {
              // New content available
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}`,

  viteConfig: `// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Elite Code Assistant',
        short_name: 'ECA',
        theme_color: '#7c3aed',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\\/\\/api\\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50 }
            }
          }
        ]
      }
    })
  ]
});`,

  offlinePage: `<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Elite Code Assistant</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0f0f14;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { color: #7c3aed; }
    button {
      background: #7c3aed;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>`
};

export const PWADocumentation = ({ open, onOpenChange }: PWADocumentationProps) => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const { toast } = useToast();

  const copyCode = async (code: string, name: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedSnippet(name);
    setTimeout(() => setCopiedSnippet(null), 2000);
    toast({ title: "Code copied to clipboard" });
  };

  const features = [
    {
      icon: WifiOff,
      title: "Offline Support",
      description: "Works without internet connection using cached assets",
      color: "text-blue-400"
    },
    {
      icon: Download,
      title: "Installable",
      description: "Add to home screen like a native app",
      color: "text-emerald-400"
    },
    {
      icon: RefreshCw,
      title: "Auto Updates",
      description: "Automatically updates when new content is available",
      color: "text-purple-400"
    },
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Receive notifications even when app is closed",
      color: "text-amber-400"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Requires HTTPS for secure connections",
      color: "text-red-400"
    },
    {
      icon: Zap,
      title: "Fast Loading",
      description: "Cached assets load instantly",
      color: "text-cyan-400"
    }
  ];

  const checklist = [
    { text: "HTTPS enabled", required: true },
    { text: "Web App Manifest present", required: true },
    { text: "Service Worker registered", required: true },
    { text: "Icons (192x192, 512x512)", required: true },
    { text: "Viewport meta tag", required: true },
    { text: "Offline fallback page", required: false },
    { text: "Theme color defined", required: false },
    { text: "Push notification support", required: false },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
              <Smartphone className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl">PWA Offline Documentation</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Complete guide to making your app work offline
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 flex-shrink-0">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="setup" className="text-xs sm:text-sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="code" className="text-xs sm:text-sm">
              <FileCode className="h-4 w-4 mr-1.5" />
              Code
            </TabsTrigger>
            <TabsTrigger value="deploy" className="text-xs sm:text-sm">
              <Rocket className="h-4 w-4 mr-1.5" />
              Deploy
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="m-0 space-y-6">
              {/* PWA Features */}
              <div>
                <h3 className="text-lg font-semibold mb-4">PWA Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature) => (
                    <div
                      key={feature.title}
                      className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <feature.icon className={cn("h-6 w-6 mb-2", feature.color)} />
                      <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PWA Checklist */}
              <div>
                <h3 className="text-lg font-semibold mb-4">PWA Checklist</h3>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm">{item.text}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-auto text-[10px]",
                          item.required
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Setup Steps</h3>
                
                <div className="space-y-3">
                  {[
                    { step: 1, title: "Install vite-plugin-pwa", command: "npm install -D vite-plugin-pwa" },
                    { step: 2, title: "Create manifest.json", command: "Create public/manifest.json" },
                    { step: 3, title: "Add icons", command: "Add 192x192 and 512x512 icons to public/icons/" },
                    { step: 4, title: "Configure Vite", command: "Add VitePWA plugin to vite.config.ts" },
                    { step: 5, title: "Add meta tags", command: "Add theme-color and manifest link to index.html" },
                    { step: 6, title: "Test offline", command: "Build and test in DevTools Application panel" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{item.step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{item.title}</h4>
                        <code className="text-xs text-muted-foreground font-mono mt-1 block">
                          {item.command}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="m-0 space-y-6">
              {Object.entries(CODE_SNIPPETS).map(([key, code]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(code, key)}
                      className="h-7"
                    >
                      {copiedSnippet === key ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[hsl(240,25%,6%)] border border-border/50 overflow-x-auto text-xs font-mono text-foreground/80">
                    {code}
                  </pre>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="deploy" className="m-0 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Deployment Guide</h3>
                
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-emerald-400">Lovable Auto-Deploy</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Lovable automatically handles HTTPS and deployment. Simply click "Publish" to deploy your PWA.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Testing Your PWA</h4>
                  <div className="grid gap-3">
                    {[
                      "Open Chrome DevTools → Application tab",
                      "Check 'Service Workers' section for registration status",
                      "Use 'Manifest' section to verify your manifest",
                      "Enable 'Offline' checkbox to test offline mode",
                      "Run Lighthouse audit for PWA score"
                    ].map((tip, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
