import { Helmet } from 'react-helmet-async';

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
