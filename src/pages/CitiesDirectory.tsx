import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import trades from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";

export default function CitiesDirectory() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contractor CRM by City | myCT1";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Find contractor CRM and business management software for your city. myCT1 serves contractors in 50+ cities across all 50 states.");

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/cities";
  }, []);

  // Group cities by state
  const byState: Record<string, typeof cities> = {};
  cities.forEach((c) => {
    if (!byState[c.state]) byState[c.state] = [];
    byState[c.state].push(c);
  });

  const topTrades = trades.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Contractor CRM by City
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              myCT1 is a cloud-based contractor platform available nationwide. Find resources for contractors in your city below.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <SeoBreadcrumb items={[{ label: "Cities", href: "/cities" }]} />
      </div>

      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          {Object.entries(byState).sort().map(([state, cityList]) => (
            <div key={state} className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {state}
              </h2>
              <div className="space-y-6">
                {cityList.map((city) => (
                  <div key={city.slug}>
                    <h3 className="font-semibold text-foreground mb-2">{city.name}, {city.stateCode}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {topTrades.map((trade) => (
                        <Link
                          key={`${trade.slug}-${city.slug}`}
                          to={`/crm-for-${trade.slug}-in-${city.slug}`}
                          className="p-2.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all text-center"
                        >
                          <span className="text-xs font-medium text-foreground">{trade.tradePlural} CRM</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Explore More</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline"><Link to="/trades">Browse by Trade</Link></Button>
            <Button asChild variant="outline"><Link to="/features">Platform Features</Link></Button>
            <Button asChild variant="outline"><Link to="/blog">Contractor Blog</Link></Button>
            <Button asChild><Link to="/pricing">See Pricing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <PublicFooter />
      <FloatingTrialButton />
    </div>
  );
}
