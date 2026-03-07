import { useState, useMemo } from 'react';
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';
import { SEOHead } from '@/components/SEOHead';
import { Youtube, FileText, Mic, Play, Search, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { allBlogPosts } from '@/data/blogPosts';
import podcastThumbnail from '@/assets/podcast-thumbnail.png';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

export const BlogPodcast = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allBlogPosts.map(p => p.category)));
    return ["All", ...cats.sort()];
  }, []);

  const filteredPosts = useMemo(() => {
    let posts = allBlogPosts;
    if (activeCategory !== "All") {
      posts = posts.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.metaDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return posts;
  }, [activeCategory, searchQuery]);

  const podcastEpisodes = [
    {
      title: 'Episode 1: Building Your First 5-Star Contractor Business',
      description: 'Learn the fundamentals of creating a professional contracting business from the ground up.',
      date: 'Coming Soon',
    },
    {
      title: 'Episode 2: Mastering Sales Conversations',
      description: 'Discover proven techniques to close more deals and handle objections with confidence.',
      date: 'Coming Soon',
    },
    {
      title: 'Episode 3: Scaling with AI Tools',
      description: 'How to leverage AI assistants and automation to grow your business faster.',
      date: 'Coming Soon',
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog & Podcast - Contractor Business Insights | myCT1"
        description="Insights, strategies, and success stories to help you build a better contracting business with myCT1."
        ogImage="https://build-contractor-hub-92572.lovable.app/og-blog-creative-3.png"
      />
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero with Logo + Branding */}
      <section className="relative bg-gradient-to-br from-[hsl(0,0%,5%)] via-[hsl(0,72%,15%)] to-[hsl(0,0%,8%)] py-14 md:py-20 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative container mx-auto px-4">
          <div className="flex flex-col items-center text-center gap-5">
            <img src={ct1Logo} alt="myCT1" className="h-16 w-16 md:h-20 md:w-20 drop-shadow-2xl" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">myCT1 Contractor Hub</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Blog & Podcast</h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto">
                Real strategies for real contractors. Grow smarter, not harder.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <FileText className="h-3.5 w-3.5" />
                {allBlogPosts.length} Articles
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <Mic className="h-3.5 w-3.5" />
                Podcast
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Podcast Video — Compact */}
      <section className="py-10 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Featured Episode</h2>
            </div>
            <Card className="overflow-hidden border-border">
              <div className="aspect-video max-h-[380px] relative">
                {isVideoPlaying ? (
                  <iframe
                    src="https://drive.google.com/file/d/1YIwwe3zaeu9Mcj4ftMuw3Kwu6PGdov2M/preview?t=784s"
                    className="w-full h-full"
                    allow="autoplay"
                    title="CT1 Featured Episode"
                  />
                ) : (
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className="w-full h-full relative group cursor-pointer"
                  >
                    <img
                      src={podcastThumbnail}
                      alt="CT1 Podcast - Click to play"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Play className="h-7 w-7 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Upcoming Episodes — Horizontal */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-5">
            <Mic className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Upcoming Episodes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {podcastEpisodes.map((episode, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Youtube className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">{episode.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{episode.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Articles */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Latest Articles</h2>
              </div>
              <p className="text-sm text-muted-foreground">Practical advice for running and growing your contracting business.</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                }`}
              >
                {cat}
                {cat === "All" && ` (${allBlogPosts.length})`}
              </button>
            ))}
          </div>

          {/* Article Grid */}
          {filteredPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No articles found matching your search.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="no-underline group">
                  <Card className="hover:shadow-lg transition-all h-full border-border hover:border-primary/30 hover:-translate-y-0.5 duration-200">
                    <CardHeader className="pb-3">
                      <span className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
                        {post.category}
                      </span>
                      <CardTitle className="text-base group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.metaDescription}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                        Read Article <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Stay in the Loop</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Get the latest episodes, articles, and contractor tips delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled
              />
              <Button disabled className="shrink-0">Subscribe (Coming Soon)</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <img src={ct1Logo} alt="myCT1" className="h-10 w-10 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to Take Action?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
            Stop consuming content and start using the tools that grow your business. Try myCT1 Business-in-a-Box free.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
