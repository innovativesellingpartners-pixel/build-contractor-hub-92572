import { useState, useMemo } from 'react';
import { PublicFooter } from "@/components/PublicFooter";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FloatingTrialButton } from '@/components/FloatingTrialButton';
import { MainSiteHeader } from '@/components/MainSiteHeader';
import { SEOHead } from '@/components/SEOHead';
import { Youtube, FileText, Mic, Play, Search } from 'lucide-react';
import { allBlogPosts } from '@/data/blogPosts';
import podcastThumbnail from '@/assets/podcast-thumbnail.png';
import heroBg from '@/assets/hero-tech-dashboard.jpg';

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
        title="Blog & Podcast - Contractor Business Insights"
        description="Insights, strategies, and success stories to help you build a better contracting business."
        ogImage="https://build-contractor-hub-92572.lovable.app/og-blog-creative-3.png"
      />
      <FloatingTrialButton />
      <MainSiteHeader />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Blog & Podcast</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Insights, strategies, and success stories to help you build a better contracting business.
          </p>
          <p className="text-sm text-muted-foreground">{allBlogPosts.length} articles and growing</p>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold">Latest Articles</h2>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Article Grid */}
          {filteredPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No articles found matching your search.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="no-underline group">
                  <Card className="hover:shadow-lg transition-shadow h-full border-border hover:border-primary/30">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug">
                          {post.title}
                        </CardTitle>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
                        {post.category}
                      </span>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{post.metaDescription}</p>
                      <p className="text-xs text-primary font-semibold mt-4">Read Article →</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Podcast Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Mic className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold">CT1 Podcast</h2>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">
            Listen to in-depth conversations with successful contractors, industry experts, and the CT1 team.
            Episodes will be linked from our YouTube channel.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-3">
              <div className="aspect-video relative">
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
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-10 w-10 text-primary-foreground ml-1" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Featured Episode</CardTitle>
              </CardHeader>
            </Card>

            {podcastEpisodes.map((episode, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Youtube className="h-16 w-16 text-muted-foreground" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{episode.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{episode.description}</p>
                  <p className="text-xs text-primary font-semibold">{episode.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" variant="outline" disabled>
              <Youtube className="mr-2 h-5 w-5" />
              View All Episodes on YouTube (Coming Soon)
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-2 border-primary">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Stay Updated</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Get the latest podcast episodes, blog posts, and contractor tips delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border rounded-md"
                  disabled
                />
                <Button disabled>Subscribe (Coming Soon)</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Take Action?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Don't just consume content - join CT1 and get hands-on tools, training, and leads to grow your business.
          </p>
          <div className="flex gap-4 justify-center">
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
