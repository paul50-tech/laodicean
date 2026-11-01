/**
 * SEO, Open Graph, Twitter Cards, and WhatsApp sharing utilities for Laodicean.
 * Formats URLs, teasers, and dynamically injects social meta tags into the document head.
 */

import { FeedPost } from '../types';

export const DEFAULT_SITE_NAME = 'Laodicean';
export const DEFAULT_CANONICAL_DOMAIN = 'https://laodicean.online';
export const DEFAULT_CAMPUS_IMAGE =
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&h=630&fit=crop&q=80';

export interface PostShareDetails {
  title: string;
  teaser: string;
  shareUrl: string;
  whatsappUrl: string;
  shareText: string;
  imageUrl: string;
  authorLabel: string;
}

/**
 * Builds the canonical or preview share URL for a given post.
 * Prefers the active window origin in development / preview, or canonical domain in production.
 */
export function generatePostShareUrl(postId: string, customOrigin?: string): string {
  let origin = customOrigin;

  if (!origin) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      origin = window.location.origin;
    } else {
      origin = DEFAULT_CANONICAL_DOMAIN;
    }
  }

  // Strip trailing slash
  const cleanOrigin = origin.replace(/\/+$/, '');
  return `${cleanOrigin}/p/${encodeURIComponent(postId)}`;
}

/**
 * Generates a clean, compact teaser for WhatsApp and social previews.
 * Strips excessive whitespace and newlines, truncating at clean word boundaries.
 */
export function generatePostTeaser(body: string, maxLength = 140): string {
  if (!body) return '';

  // Collapse multiple spaces, tabs, and newlines into single spaces
  const normalized = body.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}...`;
  }

  return `${slice.trim()}...`;
}

/**
 * Generates all sharing metadata and WhatsApp click-to-chat intent URLs for a post.
 */
export function generatePostShareDetails(
  post: FeedPost,
  customOrigin?: string
): PostShareDetails {
  const shareUrl = generatePostShareUrl(post.id, customOrigin);
  const teaser = generatePostTeaser(post.body, 140);
  const title = post.title?.trim() || `${post.post_type.toUpperCase()}: Juja Campus Post`;
  const authorLabel = post.is_persona
    ? `${post.persona_avatar || '🎭'} ${post.persona_name}`
    : `${post.author_real_name || 'Campus Member'}`;

  const imageUrl = post.image_url || DEFAULT_CAMPUS_IMAGE;

  // Optimized for WhatsApp preview & message bubble
  const shareText = `*${title}*\n_${authorLabel} in Juja (JKUAT)_\n\n${teaser}\n\n👉 Read & react: ${shareUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return {
    title,
    teaser,
    shareUrl,
    whatsappUrl,
    shareText,
    imageUrl,
    authorLabel,
  };
}

/**
 * Dynamically updates or creates <meta> tags in document.head.
 * Used for Open Graph (WhatsApp, Facebook) and Twitter Card tags.
 */
export function setOrUpdateMetaTag(
  selectorAttr: 'name' | 'property',
  selectorValue: string,
  content: string
): void {
  if (typeof document === 'undefined') return;

  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${selectorAttr}="${selectorValue}"]`
  );

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(selectorAttr, selectorValue);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Injects Open Graph and Twitter meta tags for a specific post.
 * Returns a cleanup function that restores standard campus meta tags when the component unmounts.
 */
export function updateSocialMetaTags(
  post: FeedPost,
  customOrigin?: string
): () => void {
  if (typeof document === 'undefined') return () => {};

  const previousTitle = document.title;
  const details = generatePostShareDetails(post, customOrigin);

  // Set document title
  const pageTitle = `${details.title} | Juja · Laodicean`;
  document.title = pageTitle;

  // Open Graph
  setOrUpdateMetaTag('property', 'og:site_name', DEFAULT_SITE_NAME);
  setOrUpdateMetaTag('property', 'og:type', 'article');
  setOrUpdateMetaTag('property', 'og:title', pageTitle);
  setOrUpdateMetaTag('property', 'og:description', details.teaser);
  setOrUpdateMetaTag('property', 'og:url', details.shareUrl);
  setOrUpdateMetaTag('property', 'og:image', details.imageUrl);

  // Twitter
  setOrUpdateMetaTag('name', 'twitter:card', 'summary_large_image');
  setOrUpdateMetaTag('name', 'twitter:title', pageTitle);
  setOrUpdateMetaTag('name', 'twitter:description', details.teaser);
  setOrUpdateMetaTag('name', 'twitter:image', details.imageUrl);

  // Return cleanup function to restore default tags
  return () => {
    resetSocialMetaTags(previousTitle);
  };
}

/**
 * Resets document title and Open Graph tags back to default Juja community values.
 */
export function resetSocialMetaTags(customTitle?: string): void {
  if (typeof document === 'undefined') return;

  const defaultTitle =
    customTitle || 'Laodicean — Community Social Blogging (Juja · JKUAT)';
  const defaultDesc =
    'Mobile-first community social blogging starting in Juja (JKUAT). Read campus stories, quick gists, photos, and notices built for fast loading and WhatsApp sharing.';

  document.title = defaultTitle;

  setOrUpdateMetaTag('property', 'og:site_name', DEFAULT_SITE_NAME);
  setOrUpdateMetaTag('property', 'og:type', 'website');
  setOrUpdateMetaTag('property', 'og:title', defaultTitle);
  setOrUpdateMetaTag('property', 'og:description', defaultDesc);
  setOrUpdateMetaTag('property', 'og:url', DEFAULT_CANONICAL_DOMAIN);
  setOrUpdateMetaTag('property', 'og:image', DEFAULT_CAMPUS_IMAGE);

  setOrUpdateMetaTag('name', 'twitter:card', 'summary_large_image');
  setOrUpdateMetaTag('name', 'twitter:title', defaultTitle);
  setOrUpdateMetaTag('name', 'twitter:description', defaultDesc);
  setOrUpdateMetaTag('name', 'twitter:image', DEFAULT_CAMPUS_IMAGE);
}
