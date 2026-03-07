import { useParams, Navigate } from "react-router-dom";
import { allBlogPosts } from "@/data/blogPosts";
import { BlogPostTemplate } from "@/components/BlogPostTemplate";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = allBlogPosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog-podcast" replace />;

  return <BlogPostTemplate post={post} />;
}
