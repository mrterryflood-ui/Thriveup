import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4" data-testid="nav-breadcrumbs">
      <Link href="/" className="inline-flex items-center justify-center min-h-11 min-w-11 -ml-3 hover:text-foreground transition-colors" data-testid="breadcrumb-home" aria-label="Home">
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="inline-flex items-center min-h-11 hover:text-foreground transition-colors" data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium" data-testid={`breadcrumb-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
