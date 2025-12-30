import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Nano Banana Pro via WaveSpeed AI
// Uses async mode with polling to avoid gateway timeouts
const MODEL = {
    id: 'google/nano-banana-pro/edit',
    name: 'Nano Banana Pro',
    endpoint: 'https://api.wavespeed.ai/api/v3/google/nano-banana-pro/edit',
    pricing: {
        '1k': '$0.14/image',
        '2k': '$0.14/image',
        '4k': '$0.24/image',
    },
} as const;

interface GenerateRequest {
    mode: 'generate' | 'edit';
    prompt: string;
    images?: string[]; // Required for 'edit' mode
    hasReferenceImage?: boolean; // True if second image is a style reference
    aspectRatio?: '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
    resolution?: '1k' | '2k' | '4k';
    outputFormat?: 'png' | 'jpeg';
}

// Text placement instructions to prevent cut-off text
const TEXT_PLACEMENT_INSTRUCTIONS = `IMPORTANT TEXT PLACEMENT: Any text in the thumbnail MUST be placed within a safe zone with at least 5% margin from all edges. Never place text at the very edge of the image - keep all text, titles, and labels well inside the frame so nothing gets cut off. Text should be fully visible and not cropped at any edge.`;

/**
 * Build a prompt that instructs the AI to replace the person(s) in the reference
 * image with the person(s) from the user's uploaded image(s).
 *
 * @param userPrompt - Additional instructions from the user
 * @param hasReferenceImage - Whether a reference/style image is provided
 * @param userImageCount - Number of user images (people to insert) - excluding reference
 */
function buildPersonReplacementPrompt(userPrompt: string, hasReferenceImage: boolean, userImageCount: number = 1): string {
    if (hasReferenceImage && userImageCount > 0) {
        // Build people description based on count
        const peopleDescription = userImageCount === 1
            ? 'the person from image 1'
            : userImageCount === 2
                ? 'the 2 people from images 1 and 2'
                : `the ${userImageCount} people from images 1-${userImageCount}`;

        const replacementInstructions = userImageCount === 1
            ? `The person from image 1 should wear the same clothes and have the same expression/pose as the MAIN CHARACTER in the reference.`
            : `Position all ${userImageCount} people naturally in the scene as the MAIN CHARACTERS. Each person should be clearly visible and recognizable, wearing similar clothes and poses as the characters they replace.`;

        // For person replacement: recreate the reference but with user's person(s) as the MAIN CHARACTER(S)
        return `Recreate the LAST reference image EXACTLY as a YouTube thumbnail, but REPLACE the MAIN CHARACTER(S) with ${peopleDescription}.

CRITICAL - IDENTIFYING THE MAIN CHARACTER(S):
- The MAIN CHARACTER(S) are the LARGEST/most prominent people in the image, usually in the FOREGROUND
- They are the FOCAL POINT(S) - the star(s)/protagonist(s) of the thumbnail
- They are typically CLOSEST to the camera and most prominently positioned
- DO NOT replace children, crowds, or people in the background - ONLY the main focal person(s)

Keep the reference's background, text, colors, lighting, and composition. ${replacementInstructions} Keep ALL other elements exactly as they are - only replace the main focal character(s). Replace the entire character(s), not just the face(s). The final result should look like the reference thumbnail but with the user(s) as the star(s). ${TEXT_PLACEMENT_INSTRUCTIONS}`;
    }

    // For image editing without reference, include user prompt
    return `Edit this image while keeping the person's face exactly the same. ${userPrompt} ${TEXT_PLACEMENT_INSTRUCTIONS}`;
}

interface GenerateResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
    prompt: string;
    model: string;
}

/**
 * Poll WaveSpeed API for result completion
 * Uses fast polling (100ms) like the official sample code
 * Max wait time: 5 minutes (3000 attempts at 100ms each)
 */
async function pollForResult(requestId: string, apiKey: string, maxAttempts = 3000): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
}> {
    const pollUrl = `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`;
    const pollInterval = 100; // 100ms like official sample code
    const startTime = Date.now();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(pollUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[WaveSpeed] Poll error:', result);
            return { success: false, error: `Poll error: ${response.status}` };
        }

        const data = result.data;
        const status = data.status;

        if (status === 'completed') {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[WaveSpeed] Generation completed in ${elapsed}s after ${attempt + 1} poll(s)`);
            return { success: true, imageUrl: data.outputs?.[0] };
        } else if (status === 'failed') {
            console.error('[WaveSpeed] Generation failed:', data.error);
            return { success: false, error: data.error || 'Generation failed' };
        }

        // Log progress every 30 seconds (300 attempts at 100ms)
        if ((attempt + 1) % 300 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
            console.log(`[WaveSpeed] Still processing... ${elapsed}s elapsed, status = ${status}`);
        }

        // Wait 100ms between polls (matching official sample code)
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    return { success: false, error: `Generation timed out after ${elapsed}s. Please try again or use GPT Image 1.5.` };
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Please sign in to generate thumbnails', prompt: '', model: MODEL.name },
                { status: 401 }
            );
        }

        // Check credits
        const creditCheck = await convex.query(api.users.hasCredits);
        if (!creditCheck.hasCredits) {
            return NextResponse.json(
                { success: false, error: `Insufficient credits. You need ${creditCheck.required} credits but have ${creditCheck.available}. Please upgrade your plan.`, prompt: '', model: MODEL.name },
                { status: 402 }
            );
        }

        const body: GenerateRequest = await request.json();
        const {
            mode = 'edit', // Default to edit for backwards compatibility
            prompt,
            images,
            hasReferenceImage = false,
            aspectRatio = '16:9',
            resolution = '1k', // 1k is faster, still good quality for thumbnails
            outputFormat = 'png',
        } = body;

        // Prompt is optional when both user image AND reference image are provided
        // (person replacement mode - the prompt is built automatically)
        const hasStyleTransfer = mode === 'edit' && images && images.length >= 2 && hasReferenceImage;
        if (!prompt && !hasStyleTransfer) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required', prompt: '', model: MODEL.name },
                { status: 400 }
            );
        }

        // Use empty string as placeholder for style transfer
        const userPrompt = prompt || '';

        // Validate images for edit mode
        if (mode === 'edit' && (!images || images.length === 0)) {
            return NextResponse.json(
                { success: false, error: 'At least 1 image is required for editing', prompt: userPrompt, model: MODEL.name },
                { status: 400 }
            );
        }

        const apiKey = process.env.WAVESPEED_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'WaveSpeed API key not configured', prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        // WaveSpeed supports up to 14 images
        const imageInput = mode === 'generate' ? [] : images!.slice(0, 14);

        // Calculate number of user images (excluding reference if present)
        // The reference image is always appended last by the frontend
        const userImageCount = hasReferenceImage
            ? Math.max(0, imageInput.length - 1)
            : imageInput.length;

        // Build the appropriate prompt with text placement instructions
        const finalPrompt = mode === 'edit'
            ? buildPersonReplacementPrompt(userPrompt, hasReferenceImage, userImageCount)
            : `${userPrompt} ${TEXT_PLACEMENT_INSTRUCTIONS}`;

        console.log(`[WaveSpeed] Mode: ${mode}, Prompt: "${userPrompt ? userPrompt.substring(0, 50) + '...' : '(auto-generated)'}"`);
        console.log(`[WaveSpeed] Settings: ${aspectRatio}, ${resolution}, ${outputFormat}`);
        if (mode === 'edit') {
            console.log(`[WaveSpeed] Image inputs: ${imageInput.length} total (${userImageCount} user image(s), hasReference: ${hasReferenceImage})`);
            console.log(`[WaveSpeed] Image URLs:`, imageInput);
        }

        // WaveSpeed API request payload with async mode (poll for results)
        const payload = {
            prompt: finalPrompt,
            images: imageInput,
            aspect_ratio: aspectRatio,
            resolution: resolution,
            output_format: outputFormat,
            enable_sync_mode: false, // Use async mode to avoid gateway timeout
            enable_base64_output: false,
        };

        console.log('[WaveSpeed] Sending request with async mode...');

        const response = await fetch(MODEL.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[WaveSpeed] API error:', errorText);
            return NextResponse.json(
                { success: false, error: `API error: ${response.status} - ${errorText}`, prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        const result = await response.json();

        // Check for API-level errors
        if (result.code !== 200) {
            console.error('[WaveSpeed] API returned error:', result);
            return NextResponse.json(
                { success: false, error: result.message || 'API returned an error', prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        // Extract request ID for polling (async mode)
        const requestId = result.data?.id;
        if (!requestId) {
            console.error('[WaveSpeed] No request ID in response:', result);
            return NextResponse.json(
                { success: false, error: 'No request ID returned from API', prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        console.log(`[WaveSpeed] Task submitted. Request ID: ${requestId}`);
        console.log('[WaveSpeed] Polling for result...');

        // Poll for completion
        const pollResult = await pollForResult(requestId, apiKey);

        if (!pollResult.success) {
            return NextResponse.json(
                { success: false, error: pollResult.error || 'Generation failed', prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        const imageUrl = pollResult.imageUrl;

        if (!imageUrl) {
            console.error('[WaveSpeed] No image URL in poll result');
            return NextResponse.json(
                { success: false, error: 'No image URL returned', prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        console.log(`[WaveSpeed] Generated image: ${imageUrl}`);

        // Deduct credits after successful generation
        try {
            await convex.mutation(api.users.deductCredits);
            console.log('[WaveSpeed] Credits deducted successfully');
        } catch (creditError) {
            console.error('[WaveSpeed] Failed to deduct credits:', creditError);
            // Don't fail the request, just log the error
        }

        return NextResponse.json({
            success: true,
            imageUrl: imageUrl,
            prompt: userPrompt || '(auto-generated)',
            model: MODEL.name,
        });

    } catch (error) {
        console.error('[WaveSpeed] Error:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, error: errorMessage, prompt: '', model: 'Unknown' },
            { status: 500 }
        );
    }
}

// GET endpoint to check API status and capabilities
export async function GET(): Promise<NextResponse> {
    const apiKey = process.env.WAVESPEED_API_KEY;

    return NextResponse.json({
        status: apiKey ? 'configured' : 'missing_api_key',
        model: MODEL,
        capabilities: {
            modes: ['edit'],
            description: 'Image editing using natural language prompts via WaveSpeed AI',
            aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
            resolutions: ['1k', '2k', '4k'],
            outputFormats: ['png', 'jpeg'],
            maxImages: 14,
            features: [
                'Natural-language context-aware editing',
                'Async mode with reliable polling',
                'Multilingual on-image text',
                'Up to 4K resolution',
            ],
        },
    });
}
