import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, LayoutDashboard, GraduationCap, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {

  useEffect(() => { document.title = "Page Not Found | AI Mastery Academy"; }, []);
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background" data-testid="page-not-found">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center flex-wrap">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold" data-testid="text-404-title">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground" data-testid="text-404-description">
            The page you're looking for doesn't exist or has been moved. Try one of the links below to get back on track.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button variant="default" asChild>
              <Link href="/" data-testid="link-home">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard" data-testid="link-dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/academy" data-testid="link-academy">
                <GraduationCap className="mr-2 h-4 w-4" />
                Academy Hub
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <a href="javascript:history.back()" data-testid="link-go-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
