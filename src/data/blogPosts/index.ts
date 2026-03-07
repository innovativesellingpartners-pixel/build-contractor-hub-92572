import type { BlogPostData } from "./types";
import { salesMarketingPosts } from "./salesMarketing";
import { cashFlowPosts } from "./cashFlow";
import { leadManagementPosts } from "./leadManagement";
import { jobManagementPosts } from "./jobManagement";
import { estimatingBiddingPosts } from "./estimatingBidding";
import { customerExperiencePosts } from "./customerExperience";
import { operationsPosts } from "./operations";
import { growthScalingPosts } from "./growthScaling";
import { automationPosts } from "./automation";

export type { BlogPostData };

export const allBlogPosts: BlogPostData[] = [
  ...salesMarketingPosts,
  ...cashFlowPosts,
  ...leadManagementPosts,
  ...jobManagementPosts,
  ...estimatingBiddingPosts,
  ...customerExperiencePosts,
  ...operationsPosts,
  ...growthScalingPosts,
  ...automationPosts,
];
