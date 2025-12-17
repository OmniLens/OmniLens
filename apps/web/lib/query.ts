// External library imports
// (none)

// Type imports
import type {
  MarbleAuthorListResponse,
  MarbleCategoryListResponse,
  MarblePostResponse,
  MarblePostListResponse,
  MarbleTagListResponse,
} from "@/types/marble";

// ============================================================================
// Configuration
// ============================================================================

const url = process.env.MARBLE_API_URL;
const key = process.env.MARBLE_WORKSPACE_KEY;

// ============================================================================
// API Query Functions
// ============================================================================

/**
 * Fetch all posts from Marble CMS
 * @returns Promise resolving to post list response or undefined on error
 */
export async function getPosts(): Promise<MarblePostListResponse | undefined> {
  try {
    const raw = await fetch(`${url}/${key}/posts`);
    const data: MarblePostListResponse = await raw.json();
    return data;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * Fetch all tags from Marble CMS
 * @returns Promise resolving to tag list response or undefined on error
 */
export async function getTags(): Promise<MarbleTagListResponse | undefined> {
  try {
    const raw = await fetch(`${url}/${key}/tags`);
    const data: MarbleTagListResponse = await raw.json();
    return data;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * Fetch a single post by slug from Marble CMS
 * @param slug - The slug of the post to fetch
 * @returns Promise resolving to post response or undefined on error
 */
export async function getSinglePost(
  slug: string,
): Promise<MarblePostResponse | undefined> {
  try {
    const raw = await fetch(`${url}/${key}/posts/${slug}`);
    const data: MarblePostResponse = await raw.json();
    return data;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * Fetch all categories from Marble CMS
 * @returns Promise resolving to category list response or undefined on error
 */
export async function getCategories(): Promise<
  MarbleCategoryListResponse | undefined
> {
  try {
    const raw = await fetch(`${url}/${key}/categories`);
    const data: MarbleCategoryListResponse = await raw.json();
    return data;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

/**
 * Fetch all authors from Marble CMS
 * @returns Promise resolving to author list response or undefined on error
 */
export async function getAuthors(): Promise<
  MarbleAuthorListResponse | undefined
> {
  try {
    const raw = await fetch(`${url}/${key}/authors`);
    const data: MarbleAuthorListResponse = await raw.json();
    return data;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

