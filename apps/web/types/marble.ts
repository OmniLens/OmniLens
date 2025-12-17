// ============================================================================
// Marble CMS Type Definitions
// ============================================================================

/**
 * Base post structure from Marble CMS
 */
export interface MarblePost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  publishedAt?: string;
  updatedAt?: string;
  authorId?: string;
  categoryId?: string;
  tagIds?: string[];
  coverImage?: string;
  status?: string;
  // Author data may be expanded in API response (as array or single object)
  authors?: MarbleAuthor[];
  author?: MarbleAuthor;
}

/**
 * Base tag structure from Marble CMS
 */
export interface MarbleTag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Base category structure from Marble CMS
 */
export interface MarbleCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * Base author structure from Marble CMS
 */
export interface MarbleAuthor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response type for fetching a list of posts
 */
export interface MarblePostListResponse {
  posts: MarblePost[];
}

/**
 * Response type for fetching a single post
 */
export interface MarblePostResponse {
  post: MarblePost;
}

/**
 * Response type for fetching a list of tags
 */
export interface MarbleTagListResponse {
  tags: MarbleTag[];
}

/**
 * Response type for fetching a list of categories
 */
export interface MarbleCategoryListResponse {
  categories: MarbleCategory[];
}

/**
 * Response type for fetching a list of authors
 */
export interface MarbleAuthorListResponse {
  authors: MarbleAuthor[];
}

