import { NextRequest, NextResponse } from 'next/server';

interface ValidatedVideo {
    videoId: string;
    title: string;
    author: string;
    thumbnailUrl: string;
    viewCount: number;
    publishedText: string;
    lengthSeconds: number;
    isValid: boolean;
}

interface VideoInput {
    videoId: string;
    title: string;
    author: string;
    viewCount: number;
    publishedText: string;
    lengthSeconds: number;
}

/**
 * SIMPLE VALIDATION APPROACH:
 * - Use mqdefault.jpg (medium quality) - ALWAYS available for real videos
 * - Skip complex CDN checks which can fail due to rate limiting
 * - Just check if video ID looks valid (11 chars, alphanumeric)
 */

function isValidVideoId(videoId: string): boolean {
    // YouTube video IDs are always 11 characters
    // and contain alphanumeric characters, underscores, and hyphens
    if (!videoId || videoId.length !== 11) return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videos } = body as { videos: VideoInput[] };

        if (!videos || !Array.isArray(videos)) {
            return NextResponse.json(
                { error: 'videos array is required' },
                { status: 400 }
            );
        }

        // Simple validation - just check video ID format
        // and use mqdefault.jpg which is always available for real videos
        const validatedVideos: ValidatedVideo[] = videos
            .filter(video => isValidVideoId(video.videoId))
            .map(video => ({
                videoId: video.videoId,
                title: video.title,
                author: video.author,
                viewCount: video.viewCount,
                publishedText: video.publishedText,
                lengthSeconds: video.lengthSeconds,
                // mqdefault.jpg (320x180) is always available for real videos
                thumbnailUrl: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
                isValid: true,
            }));

        console.log(`Validated ${validatedVideos.length}/${videos.length} videos`);

        return NextResponse.json({ videos: validatedVideos });
    } catch (error) {
        console.error('Validation error:', error);
        return NextResponse.json(
            { error: 'Validation failed' },
            { status: 500 }
        );
    }
}

// Also support GET for simple video ID validation
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json(
            { error: 'videoId parameter is required' },
            { status: 400 }
        );
    }

    if (!isValidVideoId(videoId)) {
        return NextResponse.json(
            { error: 'Invalid video ID format' },
            { status: 400 }
        );
    }

    return NextResponse.json({
        videoId,
        title: 'Unknown',
        author: 'Unknown',
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        isValid: true,
    });
}
