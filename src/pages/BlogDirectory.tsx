import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import { allBlogPosts } from "@/data/blogPosts";

export default function BlogDirectory() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contractor Business Blog | myCT1";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Actionable guides for contractors covering lead generation, estimating, job management, invoicing, cash flow, marketing, and business growth strategies.");

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/blog";
  }, []);

  const categories = useMemo(() => {
    const map: Record<string, typeof allBlogPosts> = {};
    allBlogPosts.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Contractor Business Blog
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              Actionable guides covering the real problems contractors face every day. From getting more leads to improving cash flow, these articles are written for contractors who want to grow.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <SeoBreadcrumb items={[{ label: "Blog", href: "/blog" }]} />
      </div>

      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="space-y-14">
            {categories.map(([category, posts]) => (
              <div key={category}>
                <h2 className="text-xl font-bold text-foreground mb-6 border-l-4 border-primary pl-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {category}
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {posts.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                    >
                      <span className="text-xs text-primary font-medium">{post.category}</span>
                      <h3 className="text-sm font-semibold text-foreground mt-1 leading-snug line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{post.metaDescription}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Explore More</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline"><Link to="/trades">Browse by Trade</Link></Button>
            <Button asChild variant="outline"><Link to="/cities">Browse by City</Link></Button>
            <Button asChild variant="outline"><Link to="/features">Platform Features</Link></Button>
            <Button asChild><Link to="/pricing">See Pricing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
      <FloatingTrialButton />
    </div>
  );
}
