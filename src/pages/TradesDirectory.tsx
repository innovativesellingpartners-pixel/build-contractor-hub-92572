import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import trades from "@/data/tradeCrmPages";
import cities from "@/data/seoCities";

export default function TradesDirectory() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contractor CRM by Trade | myCT1";

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", "Browse CRM and business management software for every contractor trade. myCT1 serves plumbers, electricians, HVAC, roofers, and 25+ more trades.");

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://myct1.com/trades";
  }, []);

  // Group alphabetically
  const sorted = [...trades].sort((a, b) => a.trade.localeCompare(b.trade));
  const grouped: Record<string, typeof trades> = {};
  sorted.forEach((t) => {
    const letter = t.trade[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(t);
  });

  const topCities = cities.slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <MainSiteHeader />

      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,0%,8%)] to-[hsl(0,0%,12%)]">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Contractor CRM by Trade
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed max-w-3xl mx-auto">
              The myCT1 Business-in-a-Box platform is built for every contractor trade. Find your trade below and see how myCT1 helps you manage leads, estimates, jobs, invoices, and payments.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <SeoBreadcrumb items={[{ label: "Trades", href: "/trades" }]} />
      </div>

      {/* Trade Directory */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          {Object.entries(grouped).sort().map(([letter, tradeList]) => (
            <div key={letter} className="mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">{letter}</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tradeList.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/crm-for-${t.slug}`}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.keyword}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.metaDescription}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {topCities.slice(0, 3).map((city) => (
                        <Link
                          key={city.slug}
                          to={`/crm-for-${t.slug}-in-${city.slug}`}
                          className="text-[11px] text-primary/70 hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {city.name}
                        </Link>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Explore More</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline"><Link to="/cities">Browse by City</Link></Button>
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
