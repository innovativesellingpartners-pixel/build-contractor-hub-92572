import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, BookOpen, Lightbulb, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainSiteHeader } from "@/components/MainSiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { FloatingTrialButton } from "@/components/FloatingTrialButton";
import type { BlogPostData } from "@/data/blogPosts/types";

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
    return () => { script?.remove(); };
  }, [slug]);

  const renderParagraphs = (text: string) =>
    text.split("\n\n").map((p, i) => (
      <p key={i} className="text-muted-foreground leading-relaxed mb-4">{p}</p>
    ));

  return (
    <div className="min-h-screen bg-background">
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Article Header */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="secondary" className="text-xs font-medium">{category}</Badge>
            <Link to="/blog-podcast" className="text-sm text-primary hover:underline">← All Articles</Link>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">{title}</h1>
          <p className="mt-6 text-lg text-muted-foreground">{intro}</p>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {sections.map(({ heading, content }, i) => (
            <section key={i} className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{heading}</h2>
              {renderParagraphs(content)}
            </section>
          ))}

          {/* myCT1 Solution Section */}
          <section className="mb-12">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Wrench className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">How myCT1 Business-in-a-Box Solves This</h2>
                </div>
                {renderParagraphs(myCT1Solution)}
              </CardContent>
            </Card>
          </section>

          {/* Internal Links */}
          <section className="mb-12">
            <h3 className="text-lg font-semibold text-foreground mb-4">Explore the Platform</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { to: "/features/crm", label: "CRM & Lead Management" },
                { to: "/features/estimating", label: "Estimating Tools" },
                { to: "/features/jobs", label: "Job Scheduling" },
                { to: "/features/voice-ai", label: "Voice AI Assistant" },
                { to: "/products/pocketbot", label: "PocketBot AI" },
                { to: "/pricing", label: "View Pricing" },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="flex items-center gap-2 text-sm text-primary hover:underline py-1">
                  <ArrowRight className="h-3 w-3" />
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>

      {/* CTA */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-background">Ready to Run Your Business Like a Pro?</h2>
          <p className="mt-4 text-lg text-background/70">
            The myCT1 Business-in-a-Box gives you everything you need to manage leads, estimates, jobs, invoices, and more - all in one platform built for contractors.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover">
              <Link to="/trial-signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10">
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground mb-10">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqItems.map(({ question, answer }) => (
              <div key={question} className="border-b border-border pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-foreground">{question}</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
