import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, FileText, Mic } from 'lucide-react';
import ct1Logo from '@/assets/ct1-logo-main.png';

export const BlogPodcast = () => {
  // Placeholder data - will be replaced with actual content
  const podcastEpisodes = [
    {
      title: 'Episode 1: Building Your First 5-Star Contractor Business',
      description: 'Learn the fundamentals of creating a professional contracting business from the ground up.',
      date: 'Coming Soon',
      thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=225&fit=crop'
    },
    {
      title: 'Episode 2: Mastering Sales Conversations',
      description: 'Discover proven techniques to close more deals and handle objections with confidence.',
      date: 'Coming Soon',
      thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=225&fit=crop'
    },
    {
      title: 'Episode 3: Scaling with AI Tools',
      description: 'How to leverage AI assistants and automation to grow your business faster.',
      date: 'Coming Soon',
      thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=225&fit=crop'
    }
  ];

  const blogPosts = [
    {
      title: '5 Ways to Generate More Qualified Leads',
      excerpt: 'Stop chasing every lead. Learn how to attract customers who are ready to buy.',
      date: 'Coming Soon',
      category: 'Lead Generation'
    },
    {
      title: 'The Complete Guide to Contractor CRM Systems',
      excerpt: 'Why every growing contractor needs a CRM and how to choose the right one.',
      date: 'Coming Soon',
      category: 'Business Tools'
    },
    {
      title: 'Pricing Strategies That Maximize Profit',
      excerpt: 'How to price your services competitively while maintaining healthy margins.',
      date: 'Coming Soon',
      category: 'Pricing & Estimates'
    },
    {
      title: 'Building a Team That Doesn\'t Need You',
      excerpt: 'Scale your business by hiring, training, and empowering the right people.',
      date: 'Coming Soon',
      category: 'Team Management'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <img src={ct1Logo} alt="CT1 Logo" className="h-12" />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm hover:text-primary transition-colors">Home</Link>
              <Link to="/what-we-do" className="text-sm hover:text-primary transition-colors">What We Do</Link>
              <Link to="/core-values" className="text-sm hover:text-primary transition-colors">Core Values</Link>
              <Link to="/trades-we-serve" className="text-sm hover:text-primary transition-colors">Trades We Serve</Link>
              <Link to="/pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link>
              <Link to="/blog-podcast" className="text-sm font-semibold text-primary">Blog & Podcast</Link>
              <Link to="/contact" className="text-sm hover:text-primary transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/auth">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Blog & Podcast</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Insights, strategies, and success stories to help you build a better contracting business.
          </p>
        </div>
      </section>

      {/* Podcast Section */}
      <section className="py-20">
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

      {/* Blog Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold">Latest Articles</h2>
          </div>
          <p className="text-muted-foreground mb-8 text-lg">
            Practical advice and actionable strategies you can implement in your business today.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full whitespace-nowrap">
                      {post.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                  <p className="text-xs text-primary font-semibold">{post.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" variant="outline" disabled>
              Read More Articles (Coming Soon)
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
            Don't just consume content—join CT1 and get hands-on tools, training, and leads to grow your business.
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

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 CT1. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/legal/terms" className="hover:text-primary">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-primary">Privacy</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
