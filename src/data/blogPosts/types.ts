export interface BlogPostData {
  slug: string;
  title: string;
  metaDescription: string;
  category: string;
  intro: string;
  sections: { heading: string; content: string }[];
  myCT1Solution: string;
  faqItems: { question: string; answer: string }[];
}
