import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'YolNext Kargo Platform - Modern Kargo ve Lojistik Marketplace',
  description = 'YolNext ile güvenilir, hızlı ve uygun fiyatlı kargo hizmeti. Bireysel, kurumsal, nakliyeci ve taşıyıcılar için kapsamlı lojistik çözümleri.',
  keywords = 'kargo, lojistik, taşımacılık, nakliye, gönderi, teslimat, marketplace, YolNext',
  image = '/hero-banner.png',
  url = 'https://YolNext.com',
  type = 'website',
  author = 'YolNext',
  publishedTime,
  modifiedTime,
}) => {
  const fullTitle = title.includes('YolNext')
    ? title
    : `${title} | YolNext Kargo Platform`;
  const fullUrl = url.startsWith('http') ? url : `https://YolNext.com${url}`;
  const fullImage = image.startsWith('http')
    ? image
    : `https://YolNext.com${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('theme-color', '#2563eb');

    // Open Graph
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', fullUrl, true);
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImage, true);
    updateMetaTag('og:site_name', 'YolNext Kargo Platform', true);
    updateMetaTag('og:locale', 'tr_TR', true);

    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:url', fullUrl, true);
    updateMetaTag('twitter:title', fullTitle, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', fullImage, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Structured data
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'YolNext Kargo Platform',
      url: 'https://YolNext.com',
      description: description,
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://YolNext.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: 'YolNext',
        logo: {
          '@type': 'ImageObject',
          url: 'https://YolNext.com/img/yolnext-logo.svg',
        },
      },
    });
  }, [fullTitle, description, keywords, author, type, fullUrl, fullImage]);

  return null;
};

export default SEO;