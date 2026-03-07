import type { BlogPostData } from "./types";
import { salesMarketingPosts } from "./salesMarketing";
import { cashFlowPosts } from "./cashFlow";

export type { BlogPostData };

export const allBlogPosts: BlogPostData[] = [
  ...salesMarketingPosts,
  ...cashFlowPosts,
];
