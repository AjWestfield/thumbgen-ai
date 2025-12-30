import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MODEL = {
    id: 'gpt-image-1.5',
    name: 'GPT Image 1.5',
} as const;

interface GenerateRequest {
    mode: 'generate' | 'edit';
    prompt: string;
    images?: string[]; // Array of Base64 or URLs - user's face/subject images (up to 3)
    referenceImage?: string; // URL - reference style image (e.g., MrBeast thumbnail)
    size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
}

interface GenerateResponse {
    success: boolean;
    imageUrl?: string;
    // Used only for debugging/dev tooling (not relied on by the UI)
    timingsMs?: {
        openai?: number;
        upload?: number;
        total?: number;
    };
    error?: string;
    prompt: string;
    model: string;
}

type OpenAIImageResponse = {
    data?: Array<{
        b64_json?: string;
        url?: string;
    }>;
    error?: {
        message?: string;
        type?: string;
        param?: string;
        code?: string;
    };
};

async function readOpenAiErrorMessage(response: Response): Promise<string> {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const json = (await response.json().catch(() => null)) as OpenAIImageResponse | null;
        const message = json?.error?.message;
        if (message) return message;
    }
    const text = await response.text().catch(() => '');
    return text || `OpenAI API error (${response.status})`;
}

async function openAiRequestJson(apiKey: string, path: string, body: unknown): Promise<OpenAIImageResponse> {
    const response = await fetch(`https://api.openai.com/v1${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const message = await readOpenAiErrorMessage(response);
        return { error: { message } };
    }

    return (await response.json()) as OpenAIImageResponse;
}

async function openAiRequestFormData(apiKey: string, path: string, formData: FormData): Promise<OpenAIImageResponse> {
    const response = await fetch(`https://api.openai.com/v1${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const message = await readOpenAiErrorMessage(response);
        return { error: { message } };
    }

    return (await response.json()) as OpenAIImageResponse;
}

// Helper to fetch URL as File (handles both HTTP URLs and base64)
async function fetchAsFile(url: string): Promise<File> {
    if (url.startsWith('http')) {
        const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const blob = await response.blob();
        return new File([blob], 'image.png', { type: 'image/png' });
    } else {
        const base64Data = url.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/png' });
        return new File([blob], 'image.png', { type: 'image/png' });
    }
}

// Upload base64 image to Convex storage
async function uploadBase64ToConvex(base64Data: string): Promise<string> {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
        throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    }

    const client = new ConvexHttpClient(convexUrl);
    const uploadUrl = await client.mutation(api.files.generateUploadUrl);
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: buffer,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to Convex: ${uploadResponse.statusText}`);
    }

    const { storageId } = await uploadResponse.json();
    const publicUrl = await client.mutation(api.files.getUrl, { storageId });

    if (!publicUrl) {
        throw new Error('Failed to get public URL from Convex');
    }

    return publicUrl;
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
    const startedAt = Date.now();
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
            mode = 'generate',
            prompt,
            images,
            referenceImage,
            size = '1536x1024', // Landscape 3:2 (closest to 16:9 that API accepts)
        } = body;

        // Prompt is optional when both user images AND reference image are provided
        // (person replacement mode - the prompt is built automatically)
        const hasUserImages = images && images.length > 0;
        const hasStyleTransfer = mode === 'edit' && hasUserImages && !!referenceImage;
        if (!prompt && !hasStyleTransfer) {
            return NextResponse.json(
                { success: false, error: 'Prompt is required', prompt: '', model: MODEL.name },
                { status: 400 }
            );
        }

        // Use empty string as placeholder for style transfer (prompt is built in stylePrompt)
        const userPrompt = prompt || '';

        // For edit mode, we need at least one image
        if (mode === 'edit' && !hasUserImages && !referenceImage) {
            return NextResponse.json(
                { success: false, error: 'At least one image is required for edit mode', prompt, model: MODEL.name },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'OpenAI API key not configured', prompt, model: MODEL.name },
                { status: 500 }
            );
        }

        console.log(`[GPT Image 1.5] Mode: ${mode}, Size: ${size}, userImages: ${images?.length || 0}, hasReference: ${!!referenceImage}`);
        console.log(`[GPT Image 1.5] Prompt: "${userPrompt ? userPrompt.substring(0, 100) + '...' : '(auto-generated)'}"`);

        // Text placement instructions to prevent cut-off text
        const textPlacementInstructions = `IMPORTANT TEXT PLACEMENT: Any text in the thumbnail MUST be placed within a safe zone with at least 5% margin from all edges. Never place text at the very edge of the image - keep all text, titles, and labels well inside the frame so nothing gets cut off. Text should be fully visible and not cropped at any edge.`;

        const openAiStartedAt = Date.now();
        let openAiResult: OpenAIImageResponse;

        if (mode === 'generate') {
            // Text-to-Image generation
            console.log('[GPT Image 1.5] Generating image from text...');
            const enhancedPrompt = `${userPrompt} ${textPlacementInstructions}`;
            openAiResult = await openAiRequestJson(apiKey, '/images/generations', {
                model: MODEL.id,
                prompt: enhancedPrompt,
                n: 1,
                size,
                quality: 'medium',
            });
        } else {
            // Image editing mode
            const hasStyleReference = hasUserImages && !!referenceImage;

            if (hasStyleReference) {
                // STYLE TRANSFER MODE: Send ALL images to the API
                // GPT Image 1.5 supports multiple images via FormData (append 'image' multiple times)
                const imageCount = images!.length;
                console.log(`[GPT Image 1.5] Style transfer mode: sending ${imageCount} user image(s) + reference`);

                // Fetch all user images as Files
                const userImageFiles: File[] = [];
                for (const imageUrl of images!) {
                    const file = await fetchAsFile(imageUrl);
                    userImageFiles.push(file);
                }
                const referenceImageFile = await fetchAsFile(referenceImage);

                // Build prompt for person replacement based on number of people
                const peopleDescription = imageCount === 1
                    ? 'the person from image 1'
                    : imageCount === 2
                        ? 'the 2 people from images 1 and 2'
                        : `the ${imageCount} people from images 1-${imageCount}`;

                const replacementInstructions = imageCount === 1
                    ? `- INSERT the person from image 1 into the MAIN CHARACTER's position`
                    : `- INSERT all ${imageCount} people from the user images into the thumbnail as the MAIN CHARACTERS
- Position them naturally in the scene, maintaining the reference thumbnail's style and composition
- Each person should be clearly visible and recognizable`;

                const stylePrompt = `Recreate the LAST reference image EXACTLY as a YouTube thumbnail, but REPLACE the MAIN CHARACTER(S) with ${peopleDescription}.

CRITICAL - IDENTIFYING THE MAIN CHARACTER(S):
- The MAIN CHARACTER(S) are the LARGEST/most prominent people in the image, usually in the FOREGROUND
- The MAIN CHARACTER(S) are the FOCAL POINT(S) - the star(s)/protagonist(s) of the thumbnail
- They are typically CLOSEST to the camera and most prominently positioned
- DO NOT replace children, crowds, or people in the background - ONLY the main focal person(s)

Instructions:
- Use the reference image (LAST image) as the TEMPLATE - keep its exact background, text, colors, lighting, effects, and composition
- IDENTIFY the main character(s) (largest, frontmost, most prominent person(s)) and REMOVE them
${replacementInstructions}
- The people should wear SIMILAR CLOTHES and have SIMILAR POSES as the main character(s) in the reference
- Keep ALL background elements and secondary people exactly as they are
- This is NOT a face swap - replace the ENTIRE main character(s) while keeping identities from the user images
- The final result should look like the reference thumbnail but with the user(s) as the star(s)
${userPrompt ? `\nAdditional instructions: ${userPrompt}` : ''}
${textPlacementInstructions}`;

                const formData = new FormData();
                formData.append('model', MODEL.id);
                formData.append('prompt', stylePrompt);
                // Send user images first (preserved with higher fidelity for faces)
                for (const userFile of userImageFiles) {
                    formData.append('image[]', userFile);
                }
                // Reference image last
                formData.append('image[]', referenceImageFile);
                formData.append('n', '1');
                formData.append('size', size);
                formData.append('quality', 'medium');

                openAiResult = await openAiRequestFormData(apiKey, '/images/edits', formData);
            } else {
                // Single or multiple image editing without reference (original flow)
                console.log(`[GPT Image 1.5] Image edit mode: ${images?.length || 0} user image(s), no reference`);

                const formData = new FormData();
                formData.append('model', MODEL.id);

                if (hasUserImages) {
                    // Multiple user images without reference
                    const enhancedPrompt = `${userPrompt} ${textPlacementInstructions}`;
                    formData.append('prompt', enhancedPrompt);
                    for (const imageUrl of images!) {
                        const file = await fetchAsFile(imageUrl);
                        formData.append('image[]', file);
                    }
                } else if (referenceImage) {
                    // Only reference image
                    const imageFile = await fetchAsFile(referenceImage);
                    const enhancedPrompt = `${userPrompt} ${textPlacementInstructions}`;
                    formData.append('prompt', enhancedPrompt);
                    formData.append('image', imageFile);
                }

                formData.append('n', '1');
                formData.append('size', size);
                formData.append('quality', 'medium');

                openAiResult = await openAiRequestFormData(apiKey, '/images/edits', formData);
            }
        }

        const openAiMs = Date.now() - openAiStartedAt;

        // Extract image from response - could be b64_json or url
        const base64Image = openAiResult.data?.[0]?.b64_json;
        const imageUrlFromApi = openAiResult.data?.[0]?.url;

        if (!base64Image && !imageUrlFromApi) {
            const err = openAiResult.error?.message || 'No image data returned from OpenAI';
            console.error('[GPT Image 1.5] No image in response:', openAiResult);
            return NextResponse.json(
                { success: false, error: err, prompt: userPrompt, model: MODEL.name },
                { status: 500 }
            );
        }

        console.log('[GPT Image 1.5] Image generated, uploading to Convex storage...');

        const uploadStartedAt = Date.now();
        let imageUrl: string;

        if (base64Image) {
            // Upload base64 to Convex
            imageUrl = await uploadBase64ToConvex(base64Image);
        } else {
            // Fetch URL and upload to Convex
            const response = await fetch(imageUrlFromApi!);
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            imageUrl = await uploadBase64ToConvex(base64);
        }

        const uploadMs = Date.now() - uploadStartedAt;

        console.log(`[GPT Image 1.5] Image uploaded: ${imageUrl}`);

        // Deduct credits after successful generation
        try {
            await convex.mutation(api.users.deductCredits);
            console.log('[GPT Image 1.5] Credits deducted successfully');
        } catch (creditError) {
            console.error('[GPT Image 1.5] Failed to deduct credits:', creditError);
            // Don't fail the request, just log the error
        }

        return NextResponse.json({
            success: true,
            imageUrl,
            timingsMs: {
                openai: openAiMs,
                upload: uploadMs,
                total: Date.now() - startedAt,
            },
            prompt: userPrompt || '(auto-generated)',
            model: MODEL.name,
        });

    } catch (error) {
        console.error('[GPT Image 1.5] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                prompt: '',
                model: MODEL.name,
                timingsMs: { total: Date.now() - startedAt },
            },
            { status: 500 }
        );
    }
}

export async function GET(): Promise<NextResponse> {
    const apiKey = process.env.OPENAI_API_KEY;

    return NextResponse.json({
        status: apiKey ? 'configured' : 'missing_api_key',
        model: MODEL,
        capabilities: {
            modes: ['generate', 'edit'],
            sizes: ['1536x1024 (landscape)', '1024x1024 (square)', '1024x1536 (portrait)', 'auto'],
            defaultSize: '1536x1024 (landscape 3:2, closest to 16:9)',
        },
    });
}
