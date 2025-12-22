// External library imports
import Image from "next/image";

// Internal component imports
import BackButton from "@/components/BackButton";
import { Prose } from "@/components/prose";

// Utility imports
import { getSinglePost, getAuthors } from "@/lib/query";

// ============================================================================
// Type Definitions
// ============================================================================

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PostPage component
 * Displays a single blog post from Marble CMS
 * Server component that fetches post content by slug and renders it
 * Uses Header component for consistent navigation
 */
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [data, authorsData] = await Promise.all([
    getSinglePost(slug),
    getAuthors(),
  ]);

  // Create a map of author IDs to author objects for quick lookup
  const authorsMap = new Map(
    authorsData?.authors?.map((author) => [author.id, author]) || []
  );

  // Enrich post with author data if authorId exists
  // Marble CMS may return authors as an array, single author object, or just authorId
  const enrichedPost = data?.post
    ? {
        ...data.post,
        author: data.post.authors?.[0] 
          || data.post.author 
          || (data.post.authorId ? authorsMap.get(data.post.authorId) : undefined),
      }
    : undefined;

  // ============================================================================
  // Render Logic - Early Returns
  // ============================================================================

  if (!data || !enrichedPost) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section - Back button and page title */}
          <div className="flex items-center justify-between mb-8">
            <BackButton fallbackPath="/blog" />
            <h1 className="text-4xl font-bold">Post Not Found</h1>
            <div className="w-[72px]"></div> {/* Spacer to center the heading */}
          </div>
          <p className="text-muted-foreground">
            The post you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const post = enrichedPost;

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section - Back button and page title */}
        <div className="flex items-center justify-between mb-8">
          <BackButton fallbackPath="/blog" />
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <div className="w-[72px]"></div> {/* Spacer to center the heading */}
        </div>

        {/* Post Metadata */}
        {post.publishedAt && (
          <div className="mb-8 text-center">
            <p className="text-muted-foreground text-sm">
              Published on {new Date(post.publishedAt).toLocaleDateString()}
              {post.author && `, by ${post.author.name}`}
            </p>
          </div>
        )}

        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative w-full max-w-4xl mx-auto mb-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
              unoptimized
              priority
            />
          </div>
        )}

        {/* Post Content */}
        <div className="max-w-4xl mx-auto">
          <Prose html={post.content} />
        </div>
      </div>
    </div>
  );
}

