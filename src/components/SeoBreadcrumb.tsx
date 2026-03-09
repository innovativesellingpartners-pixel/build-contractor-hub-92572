import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function SeoBreadcrumb({ items }: Props) {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://myct1.com/" },
        ...items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 2,
          name: item.label,
          ...(item.href ? { item: `https://myct1.com${item.href}` } : {}),
        })),
      ],
    };

    let script = document.getElementById("breadcrumb-schema") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "breadcrumb-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
    return () => { script?.remove(); };
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className="py-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {item.href && i < items.length - 1 ? (
              <Link to={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
