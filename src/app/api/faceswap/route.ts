import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const FACESWAP_MODEL = {
    id: 'wavespeed-ai/image-face-swap-pro',
    name: 'WaveSpeed Face Swap Pro',
    endpoint: 'https://api.wavespeed.ai/api/v3/wavespeed-ai/image-face-swap-pro',
} as const;

interface FaceSwapRequest {
    faceImageUrl: string;  // Image containing the face to swap (user's face)
    targetImageUrl: string; // Image where face will be placed
}

interface FaceSwapResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
    model: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<FaceSwapResponse>> {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Please sign in to use face swap', model: FACESWAP_MODEL.name },
                { status: 401 }
            );
        }

        // Check credits
        const creditCheck = await convex.query(api.users.hasCredits);
        if (!creditCheck.hasCredits) {
            return NextResponse.json(
                { success: false, error: `Insufficient credits. You need ${creditCheck.required} credits but have ${creditCheck.available}. Please upgrade your plan.`, model: FACESWAP_MODEL.name },
                { status: 402 }
            );
        }

        const body: FaceSwapRequest = await request.json();
        const { faceImageUrl, targetImageUrl } = body;

        // Validate inputs
        if (!faceImageUrl) {
            return NextResponse.json(
                { success: false, error: 'Face image URL is required', model: FACESWAP_MODEL.name },
                { status: 400 }
            );
        }

        if (!targetImageUrl) {
            return NextResponse.json(
                { success: false, error: 'Target image URL is required', model: FACESWAP_MODEL.name },
                { status: 400 }
            );
        }

        const apiKey = process.env.WAVESPEED_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'WaveSpeed API key not configured', model: FACESWAP_MODEL.name },
                { status: 500 }
            );
        }

        console.log(`Face Swap: Swapping face from ${faceImageUrl.substring(0, 50)}...`);
        console.log(`Face Swap: Onto target ${targetImageUrl.substring(0, 50)}...`);

        // WaveSpeed Face Swap API request (sync mode - waits for completion)
        const payload = {
            face_image: faceImageUrl,  // Face to use
            image: targetImageUrl,      // Target image
            output_format: 'jpeg',
            enable_sync_mode: true,  // Wait for completion
            enable_base64_output: false,
        };

        console.log('Sending face swap request with sync mode...');

        const response = await fetch(FACESWAP_MODEL.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('WaveSpeed Face Swap API error:', errorText);
            return NextResponse.json(
                { success: false, error: `API error: ${response.status} - ${errorText}`, model: FACESWAP_MODEL.name },
                { status: 500 }
            );
        }

        const result = await response.json();

        // Check for API-level errors
        if (result.code !== 200) {
            console.error('WaveSpeed API returned error:', result);
            return NextResponse.json(
                { success: false, error: result.message || 'API returned an error', model: FACESWAP_MODEL.name },
                { status: 500 }
            );
        }

        const data = result.data;

        // Check status
        if (data.status === 'failed') {
            console.error('Face swap failed:', data.error);
            return NextResponse.json(
                { success: false, error: data.error || 'Face swap failed', model: FACESWAP_MODEL.name },
                { status: 500 }
            );
        }

        // Get the output URL
        const imageUrl = data.outputs?.[0];

        if (!imageUrl) {
            console.error('No image URL in response:', data);
            return NextResponse.json(
                { success: false, error: 'No image URL returned', model: FACESWAP_MODEL.name },
                { status: 500 }
            );
        }

        console.log(`Face Swap completed: ${imageUrl}`);
        console.log(`Execution time: ${data.executionTime}ms`);

        // Deduct credits after successful face swap
        try {
            await convex.mutation(api.users.deductCredits);
            console.log('[Face Swap] Credits deducted successfully');
        } catch (creditError) {
            console.error('[Face Swap] Failed to deduct credits:', creditError);
            // Don't fail the request, just log the error
        }

        return NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            model: FACESWAP_MODEL.name,
        });

    } catch (error) {
        console.error('Face swap error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage, model: FACESWAP_MODEL.name },
            { status: 500 }
        );
    }
}

// GET endpoint to check API status
export async function GET(): Promise<NextResponse> {
    const apiKey = process.env.WAVESPEED_API_KEY;

    return NextResponse.json({
        status: apiKey ? 'configured' : 'missing_api_key',
        model: FACESWAP_MODEL,
        description: 'Swap faces between images using WaveSpeed AI',
    });
}
