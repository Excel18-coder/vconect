/**
 * SEO Component
 * Dynamic SEO meta tags for pages
 */

import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  category?: string;
  product?: {
    price?: number;
    currency?: string;
    availability?: string;
    condition?: string;
  };
}

export function SEO({
  title = 'VCONECT - Buy & Sell in Kenya | Houses, Cars, Electronics & More',
  description = "Kenya's #1 marketplace for buying and selling. Find houses, cars, electronics, and more. Post free ads, connect with sellers, and discover amazing deals across Kenya.",
  keywords = 'Kenya marketplace, buy and sell Kenya, houses for sale Kenya, cars for sale Kenya, electronics Kenya, classified ads Kenya, online shopping Kenya',
  image = 'https://vconect.com/og-image.jpg',
  url = 'https://vconect.com',
  type = 'website',
  author = 'VCONECT',
  publishedTime,
  modifiedTime,
  category,
  product,
}: SEOProps) {
  const fullTitle = title.includes('VCONECT') ? title : `${title} | VCONECT`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="VCONECT" />
      <meta property="og:locale" content="en_KE" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {category && <meta property="article:section" content={category} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@vconect" />

      {/* Product Specific */}
      {product && (
        <>
          <meta property="og:type" content="product" />
          {product.price && (
            <>
              <meta property="product:price:amount" content={product.price.toString()} />
              <meta property="product:price:currency" content={product.currency || 'KES'} />
            </>
          )}
          {product.availability && (
            <meta property="product:availability" content={product.availability} />
          )}
          {product.condition && <meta property="product:condition" content={product.condition} />}
        </>
      )}

      {/* Mobile App Links */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="VCONECT" />

      {/* Geographic Targeting */}
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Kenya" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en-KE" />
    </Helmet>
  );
}

export default SEO;
