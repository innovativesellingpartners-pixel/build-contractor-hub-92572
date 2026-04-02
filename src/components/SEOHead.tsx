import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: object;
}

export function SEOHead({
  title,
  description,
  canonical,
  keywords,
  ogImage = 'https://myct1.com/og-blog-creative-3.webp',
  ogType = 'website',
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = `${title} | myCT1`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = `https://myct1.com${canonical}`;
    }
    
    // Update keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
    
    // Update Open Graph tags
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) {
      ogTitleTag.setAttribute('content', `${title} | myCT1`);
    }
    
    const ogDescTag = document.querySelector('meta[property="og:description"]');
    if (ogDescTag) {
      ogDescTag.setAttribute('content', description);
    }
    
    const ogImageTag = document.querySelector('meta[property="og:image"]');
    if (ogImageTag) {
      ogImageTag.setAttribute('content', ogImage);
    }
    
    const ogTypeTag = document.querySelector('meta[property="og:type"]');
    if (ogTypeTag) {
      ogTypeTag.setAttribute('content', ogType);
    }
    
    const ogUrlTag = document.querySelector('meta[property="og:url"]');
    if (ogUrlTag && canonical) {
      ogUrlTag.setAttribute('content', `https://myct1.com${canonical}`);
    }
    
    // Update Twitter tags
    const twitterTitleTag = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleTag) {
      twitterTitleTag.setAttribute('content', `${title} | myCT1`);
    }
    
    const twitterDescTag = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescTag) {
      twitterDescTag.setAttribute('content', description);
    }
    
    const twitterImageTag = document.querySelector('meta[name="twitter:image"]');
    if (twitterImageTag) {
      twitterImageTag.setAttribute('content', ogImage);
    }
    
    // Add structured data if provided
    if (structuredData) {
      const existingScript = document.querySelector('script[data-seo-structured]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-structured', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
      
      return () => {
        script.remove();
      };
    }
  }, [title, description, canonical, keywords, ogImage, ogType, structuredData]);
  
  return null;
}

// Pre-built structured data generators
export const structuredDataGenerators = {
  service: (name: string, description: string, price?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: 'myCT1',
      url: 'https://myct1.com',
    },
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'USD',
      },
    }),
  }),
  
  faq: (faqs: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),
  
  product: (name: string, description: string, price: string, image?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image || 'https://myct1.com/og-blog-creative-3.webp',
    brand: {
      '@type': 'Brand',
      name: 'myCT1',
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }),
  
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://myct1.com${item.url}`,
    })),
  }),

  blogPosting: (title: string, description: string, slug: string, category: string, datePublished?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `https://myct1.com/blog/${slug}`,
    image: 'https://myct1.com/og-blog-creative-3.webp',
    datePublished: datePublished || new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: 'myCT1',
      url: 'https://myct1.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'myCT1',
      url: 'https://myct1.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://myct1.com/icons/icon-512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://myct1.com/blog/${slug}`,
    },
    articleSection: category,
  }),
};