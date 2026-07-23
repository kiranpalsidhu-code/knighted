import { Link } from "wouter";
import { FileText, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-5xl font-bold text-foreground mb-3">404</h1>
      <h2 className="text-xl font-semibold text-foreground mb-2">Page not found</h2>
      <p className="text-muted-foreground text-center max-w-sm mb-8">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
        <Link href="/">
          <Button>
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
