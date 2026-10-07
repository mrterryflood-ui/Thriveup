import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, HandHeart, Search, Shield, GraduationCap, MapPin, Briefcase, Phone } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {

  useEffect(() => { document.title = "Page Not Found | ThriveUp"; }, []);
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background" data-testid="page-not-found">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center flex-wrap">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold" data-testid="text-404-title">Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground" data-testid="text-404-description">
            The page you're looking for doesn't exist or has been moved. Use the links below to find what you need.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button variant="default" asChild>
              <Link href="/get-help" data-testid="link-get-help">
                <HandHeart className="mr-2 h-4 w-4" />
                Get Help Now
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" data-testid="link-home">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} data-testid="button-go-back" aria-label="Go back to previous page">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-3">Looking for help?</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/benefits-screener" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-screener">
                <Shield className="h-3 w-3" /> Benefits Screener
              </Link>
              <Link href="/resources" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-resources">
                <Search className="h-3 w-3" /> Resource Finder
              </Link>
              <Link href="/ecosystem" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-ecosystem">
                <MapPin className="h-3 w-3" /> Ecosystem Hub
              </Link>
              <Link href="/resource-directory" className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="link-popular-directory">
                <Briefcase className="h-3 w-3" /> Resource Directory
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t text-center">
            <p className="text-xs text-muted-foreground">Need immediate help? Call <a href="tel:211" className="text-primary font-medium">2-1-1</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
