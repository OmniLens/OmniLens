// External library imports
// (none)

// Internal component imports
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import BlogPostCard from "@/components/BlogPostCard";

// Utility imports
import { getPosts, getAuthors } from "@/lib/query";

// ============================================================================
// Page Configuration
// ============================================================================

// Revalidate this page every hour
export const revalidate = 3600;

// ============================================================================
// Main Component
// ============================================================================

/**
 * BlogPage component
 * Displays a list of all blog posts from Marble CMS
 * Server component that fetches posts and renders them in a list
 * Uses Header component for consistent navigation
 */
export default async function BlogPage() {
  const [data, authorsData] = await Promise.all([
    getPosts(),
    getAuthors(),
  ]);

  // Create a map of author IDs to author objects for quick lookup
  const authorsMap = new Map(
    authorsData?.authors?.map((author) => [author.id, author]) || []
  );

  // Enrich posts with author data if authorId exists
  // Marble CMS may return authors as an array, single author object, or just authorId
  const enrichedPosts = data?.posts?.map((post) => {
    // Check if authors array exists (Marble returns authors as array)
    const author = post.authors?.[0] 
      || post.author 
      || (post.authorId ? authorsMap.get(post.authorId) : undefined);
    
    return {
      ...post,
      author,
    };
  }) || [];

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  if (!data || !enrichedPosts || enrichedPosts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section - Back button and page title */}
          <div className="flex items-center justify-between mb-8">
            <BackButton />
            <h1 className="text-4xl font-bold">Blog</h1>
            <div className="w-[72px]"></div> {/* Spacer to center the heading */}
          </div>
          <p className="text-muted-foreground">No posts found.</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section - Back button and page title */}
        <div className="flex items-center justify-between mb-8">
          <BackButton />
          <h1 className="text-4xl font-bold">Blog</h1>
          <div className="w-[72px]"></div> {/* Spacer to center the heading */}
        </div>

        {/* Posts Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

