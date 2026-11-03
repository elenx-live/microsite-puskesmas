import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-3 px-6 max-w-7xl mx-auto">
      <ol className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] flex-wrap">
        <li>
          <a href="/" className="flex items-center gap-1 hover:text-[var(--color-primary)] transition">
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </a>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            {item.href ? (
              <a href={item.href} className="hover:text-[var(--color-primary)] transition">
                {item.label}
              </a>
            ) : (
              <span className="text-[var(--color-text)] font-semibold">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
