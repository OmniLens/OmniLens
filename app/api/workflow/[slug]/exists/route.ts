import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWorkflows } from '@/lib/db-storage';

// Zod schema for slug parameter validation
const slugSchema = z.string().min(1, 'Repository slug is required');

// GET /api/workflow/{slug}/exists - Check if workflows exist in database (without triggering GitHub fetch)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Validate the slug parameter
    const validatedSlug = slugSchema.parse(params.slug);
    
    // Check if workflows exist in database (this doesn't trigger GitHub fetch)
    const savedWorkflows = await getWorkflows(validatedSlug);
    const hasWorkflows = savedWorkflows.length > 0;
    const workflowCount = savedWorkflows.length;
    
    return NextResponse.json({
      hasWorkflows,
      workflowCount,
      message: hasWorkflows 
        ? `Found ${workflowCount} saved workflows for ${validatedSlug}`
        : `No saved workflows found for ${validatedSlug}`
    });

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid repository slug',
        details: error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      }, { status: 400 });
    }
    
    console.error('Check workflows API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to check workflows',
      hasWorkflows: false,
      workflowCount: 0
    }, { status: 500 });
  }
}
