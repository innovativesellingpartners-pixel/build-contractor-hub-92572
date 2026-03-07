import { useLocation, Navigate } from "react-router-dom";
import { allBlogPosts } from "@/data/blogPosts";
import { BlogPostTemplate } from "@/components/BlogPostTemplate";

export default function BlogPost() {
  const location = useLocation();
  const slug = location.pathname.replace("/blog/", "");
  const post = allBlogPosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog-podcast" replace />;

  return <BlogPostTemplate post={post} />;
}
