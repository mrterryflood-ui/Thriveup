import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, LayoutDashboard, GraduationCap, ArrowLeft, Briefcase, Sparkles, BookOpen, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {

  useEffect(() => { document.title = "Page Not Found | AI Mastery Academy"; }, []);
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background" data-testid="page-not-found">
      <Card className="w-full max-w-lg mx-4">
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
              <Link href="/curriculum" data-testid="link-curriculum">
                <GraduationCap className="mr-2 h-4 w-4" />
                AI Curriculum
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} data-testid="button-go-back" aria-label="Go back to previous page">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-3">Popular pages:</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/academy/careers" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-careers">
                <Briefcase className="h-3 w-3" /> Career Explorer
              </Link>
              <Link href="/ai-companion" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-spark">
                <Sparkles className="h-3 w-3" /> Ask Spark
              </Link>
              <Link href="/ai-tools" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-tools">
                <BookOpen className="h-3 w-3" /> AI Creation Studio
              </Link>
              <Link href="/resources" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-resources">
                <MapPin className="h-3 w-3" /> Resource Finder
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
