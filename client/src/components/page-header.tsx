import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6" data-testid="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-header-title">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1" data-testid="page-header-description">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0" data-testid="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
