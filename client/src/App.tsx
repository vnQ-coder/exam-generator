import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Database, Tags, BarChart3, Settings, Bell, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import Home from "@/pages/home";
import QuestionBank from "@/pages/question-bank";
import NotFound from "@/pages/not-found";

function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Brain, label: "Generate", testId: "nav-generate" },
    { path: "/question-bank", icon: Database, label: "Question Bank", testId: "nav-question-bank" },
    { path: "/categories", icon: Tags, label: "Categories", testId: "nav-categories" },
    { path: "/analytics", icon: BarChart3, label: "Analytics", testId: "nav-analytics" },
    { path: "/settings", icon: Settings, label: "Settings", testId: "nav-settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="text-primary-foreground h-4 w-4" />
          </div>
          <h1 className="text-lg font-semibold" data-testid="text-app-title">AI Question Gen</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                    data-testid={item.testId}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* API Status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-muted-foreground" data-testid="text-api-status">Gemini API Connected</span>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const [location] = useLocation();
  
  const getPageInfo = () => {
    switch (location) {
      case "/":
        return {
          title: "Question Generator",
          description: "Generate intelligent questions from your content using AI"
        };
      case "/question-bank":
        return {
          title: "Question Bank",
          description: "Browse and manage your generated questions"
        };
      default:
        return {
          title: "AI Question Generator",
          description: "Powered by Gemini AI"
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="bg-card border-b border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" data-testid="text-page-title">{pageInfo.title}</h2>
          <p className="text-muted-foreground" data-testid="text-page-description">{pageInfo.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-secondary rounded-md transition-colors" data-testid="button-notifications">
            <Bell className="text-muted-foreground h-4 w-4" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-md transition-colors" data-testid="button-profile">
            <User className="text-muted-foreground h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">This feature is coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 p-6 overflow-auto custom-scrollbar">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/question-bank" component={QuestionBank} />
            <Route path="/categories" component={() => <PlaceholderPage title="Categories" />} />
            <Route path="/analytics" component={() => <PlaceholderPage title="Analytics" />} />
            <Route path="/settings" component={() => <PlaceholderPage title="Settings" />} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
