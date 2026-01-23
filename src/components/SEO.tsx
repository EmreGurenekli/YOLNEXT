<<<<<<< HEAD
import { useEffect } from 'react';
=======
import { Helmet } from 'react-helmet-async';
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

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

<<<<<<< HEAD
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
=======
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      <meta name='author' content={author} />
      <meta name='robots' content='index, follow' />
      <meta name='viewport' content='width=device-width, initial-scale=1.0' />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content={type} />
      <meta property='og:url' content={fullUrl} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={fullImage} />
      <meta property='og:site_name' content='YolNext Kargo Platform' />
      <meta property='og:locale' content='tr_TR' />

      {/* Twitter */}
      <meta property='twitter:card' content='summary_large_image' />
      <meta property='twitter:url' content={fullUrl} />
      <meta property='twitter:title' content={fullTitle} />
      <meta property='twitter:description' content={description} />
      <meta property='twitter:image' content={fullImage} />

      {/* Additional Meta Tags */}
      <meta name='theme-color' content='#2563eb' />
      <meta name='msapplication-TileColor' content='#2563eb' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      <meta name='apple-mobile-web-app-title' content='YolNext' />

      {/* Canonical URL */}
      <link rel='canonical' href={fullUrl} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property='article:published_time' content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property='article:modified_time' content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property='article:author' content={author} />
      )}

      {/* Structured Data */}
      <script type='application/ld+json'>
        {JSON.stringify({
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
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
