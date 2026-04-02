import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Wrench, HelpCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import { SeoBreadcrumb } from "@/components/SeoBreadcrumb";
import type { BlogPostData } from "@/data/blogPosts/types";
import ct1Logo from "@/assets/ct1-round-logo-new.png";

interface Props {
  post: BlogPostData;
}

export function BlogPostTemplate({ post }: Props) {
  const { slug, title, metaDescription, category, intro, sections, myCT1Solution, faqItems } = post;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: metaDescription,
    url: `https://myct1.com/blog/${slug}`,
    image: "https://myct1.com/og-blog-creative-3.webp",
    datePublished: new Date().toISOString().split("T")[0],
    dateModified: new Date().toISOString().split("T")[0],
    author: { "@type": "Organization", name: "myCT1", url: "https://myct1.com" },
    publisher: {
      "@type": "Organization",
      name: "myCT1",
      url: "https://myct1.com",
      logo: { "@type": "ImageObject", url: "https://myct1.com/icons/icon-512.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://myct1.com/blog/${slug}` },
    articleSection: category,
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${title} | myCT1`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    setMeta("description", metaDescription);

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = `https://myct1.com/blog/${slug}`;

    let script = document.getElementById("faq-schema") as HTMLScriptElement | null;
    if (!script) { script = document.createElement("script"); script.id = "faq-schema"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = JSON.stringify(faqSchema);

    let bpScript = document.getElementById("blogposting-schema") as HTMLScriptElement | null;
    if (!bpScript) { bpScript = document.createElement("script"); bpScript.id = "blogposting-schema"; bpScript.type = "application/ld+json"; document.head.appendChild(bpScript); }
    bpScript.textContent = JSON.stringify(blogPostingSchema);

    // Set OG meta tags for blog posts
    const setOgMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (el) el.setAttribute("content", content);
    };
    setOgMeta("og:title", `${title} | myCT1`);
    setOgMeta("og:description", metaDescription);
    setOgMeta("og:url", `https://myct1.com/blog/${slug}`);
    setOgMeta("og:type", "article");

    return () => { script?.remove(); bpScript?.remove(); };
  }, [slug]);

  const renderParagraphs = (text: string) =>
    text.split("\n\n").map((p, i) => (
      <p key={i} className="text-muted-foreground leading-[1.8] text-[15px]">{p}</p>
    ));

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,72%,12%)] to-[hsl(0,0%,8%)] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link to="/blog-podcast" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors">
              <ArrowLeft className="h-3 w-3" />
              Blog & Podcast
            </Link>
            <ChevronRight className="h-3 w-3 text-white/30" />
            <span className="text-xs text-primary font-medium">{category}</span>
          </div>

          {/* Logo + Title */}
          <div className="flex items-start gap-4 mb-6">
            <img src={ct1Logo} alt="myCT1" className="h-10 w-10 mt-1 shrink-0 drop-shadow-xl hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">{category}</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mt-1">{title}</h1>
            </div>
          </div>

          <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl">{intro}</p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SeoBreadcrumb items={[{ label: "Blog", href: "/blog" }, { label: category, href: "/blog" }, { label: title }]} />
      </div>

      {/* Article Body */}
      <article className="py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map(({ heading, content }, i) => (
              <section key={i} className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-8 bg-primary rounded-full" />
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">{heading}</h2>
                </div>
                <div className="pl-0 sm:pl-11 space-y-4">
                  {renderParagraphs(content)}
                </div>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <img src={ct1Logo} alt="CT1" className="h-8 w-8 opacity-40" />
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* myCT1 Solution Section */}
          <section className="mb-12">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Platform Solution</p>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">How myCT1 Business-in-a-Box Solves This</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {renderParagraphs(myCT1Solution)}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Explore Links */}
          <section className="mb-12">
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Explore the Platform</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { to: "/features/contractor-crm", label: "CRM & Lead Management" },
                    { to: "/features/contractor-estimating", label: "Estimating Tools" },
                    { to: "/features/job-scheduling", label: "Job Scheduling" },
                    { to: "/features/forge-ai-automation", label: "Forge AI Automation" },
                    { to: "/crm-for-plumbers", label: "CRM for Plumbers" },
                    { to: "/crm-for-electricians", label: "CRM for Electricians" },
                    { to: "/trades", label: "All Trades" },
                    { to: "/pricing", label: "View Pricing" },
                  ].map(({ to, label }) => (
                    <Link key={to} to={to} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-1.5 px-2 rounded-md hover:bg-muted/50">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </article>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,72%,12%)] to-[hsl(0,0%,8%)] py-12 md:py-16">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <img src={ct1Logo} alt="CT1" className="h-12 w-12 mx-auto mb-4 drop-shadow-xl" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Run Your Business Like a Pro?</h2>
            <p className="text-sm sm:text-base text-white/60 mb-8 max-w-lg mx-auto">
              The myCT1 Business-in-a-Box gives you everything you need to manage leads, estimates, jobs, invoices, and more - all in one platform built for contractors.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link to="/trial-signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link to="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-0">
            {faqItems.map(({ question, answer }, i) => (
              <div key={question} className={`py-5 ${i < faqItems.length - 1 ? 'border-b border-border' : ''}`}>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">{question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
