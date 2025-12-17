// External library imports
import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";

// Internal component imports
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MarblePost } from "@/types/marble";

// ============================================================================
// Type Definitions
// ============================================================================

export interface BlogPostCardProps {
  post: MarblePost;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * BlogPostCard component
 * Displays a blog post card with cover image, title, excerpt, and published date
 * Matches the application's card design patterns
 */
export default function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="block h-full">
      <Card className="relative h-full flex flex-col transition-all duration-200 border-border bg-card hover:border-border/80 hover:shadow-md overflow-hidden">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative w-full h-48 overflow-hidden bg-muted">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          </div>
        )}

        {/* Card Header */}
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold mb-2 line-clamp-2">
            {post.title}
          </CardTitle>
          <div className="flex items-center justify-between gap-2">
            {post.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
            )}
            {post.author && (
              <div className="text-sm text-muted-foreground">
                By {post.author.name}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Card Content */}
        {post.excerpt && (
          <CardContent className="flex-1 pt-0">
            <CardDescription className="line-clamp-3">
              {post.excerpt}
            </CardDescription>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}

