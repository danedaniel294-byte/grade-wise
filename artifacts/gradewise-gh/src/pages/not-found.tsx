import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="bg-destructive/10 p-6 rounded-full">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground">404 - Page Not Found</h1>
        <p className="text-lg text-muted-foreground">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link href="/">
          <Button className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 mt-4">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
