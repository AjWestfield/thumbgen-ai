import { NextRequest, NextResponse } from 'next/server';

// Gemini 2.5 Flash for thumbnail analysis
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface ScoreRequest {
    imageUrl: string;
    title?: string;
}

interface PillarScore {
    name: string;
    score: number; // 0-100
    description: string;
    icon: string;
}

interface ScoreResponse {
    success: boolean;
    overallScore?: number;
    pillars?: PillarScore[];
    summary?: string;
    improvements?: string[];
    error?: string;
}

const SCORING_PROMPT = `You are an expert YouTube thumbnail analyst. Analyze this thumbnail image and provide a detailed score based on the following 5 pillars that determine click-through rate (CTR) performance.

Score each pillar from 0-100 and provide a brief explanation for each score.

THE 5 PILLARS:

1. **VIRALITY** (Stopping Power)
   - Does it grab attention instantly?
   - Is there visual intensity/drama?
   - Does it stand out from other thumbnails?
   - Is there emotional impact?

2. **CLARITY** (Message Clarity)
   - Is the main subject/topic immediately clear?
   - Is the visual hierarchy effective?
   - Can you understand what the video is about in 1-2 seconds?
   - Is the text (if any) readable and well-placed?

3. **CURIOSITY** (Click Trigger)
   - Does it create an information gap?
   - Does it make viewers want to know more?
   - Is there intrigue or mystery?
   - Does it trigger FOMO or urgency?

4. **EMOTION** (Emotional Appeal)
   - Does it evoke strong emotions?
   - Are facial expressions compelling (if present)?
   - Does it connect with the viewer emotionally?
   - Is there relatability or aspirational content?

5. **COMPOSITION** (Technical Quality)
   - Is the layout balanced and professional?
   - Are colors vibrant and contrasting?
   - Is the image quality high?
   - Does it follow the rule of thirds or other design principles?

Respond in this exact JSON format:
{
    "overallScore": <number 0-100>,
    "pillars": [
        {
            "name": "Virality",
            "score": <number 0-100>,
            "description": "<brief 1-2 sentence explanation>",
            "icon": "flame"
        },
        {
            "name": "Clarity",
            "score": <number 0-100>,
            "description": "<brief 1-2 sentence explanation>",
            "icon": "eye"
        },
        {
            "name": "Curiosity",
            "score": <number 0-100>,
            "description": "<brief 1-2 sentence explanation>",
            "icon": "sparkles"
        },
        {
            "name": "Emotion",
            "score": <number 0-100>,
            "description": "<brief 1-2 sentence explanation>",
            "icon": "heart"
        },
        {
            "name": "Composition",
            "score": <number 0-100>,
            "description": "<brief 1-2 sentence explanation>",
            "icon": "layout"
        }
    ],
    "summary": "<2-3 sentence overall assessment>",
    "improvements": [
        "<specific improvement suggestion 1>",
        "<specific improvement suggestion 2>",
        "<specific improvement suggestion 3>"
    ]
}

Be honest and critical. A score of 50 is average, 70+ is good, 85+ is excellent, 95+ is viral-worthy.`;

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return base64;
}

function getMimeType(url: string): string {
    if (url.includes('.png')) return 'image/png';
    if (url.includes('.webp')) return 'image/webp';
    if (url.includes('.gif')) return 'image/gif';
    return 'image/jpeg';
}

export async function POST(request: NextRequest): Promise<NextResponse<ScoreResponse>> {
    try {
        const body: ScoreRequest = await request.json();
        const { imageUrl, title } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { success: false, error: 'Image URL is required' },
                { status: 400 }
            );
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Gemini API key not configured' },
                { status: 500 }
            );
        }

        console.log('[Score] Analyzing thumbnail:', imageUrl.substring(0, 50) + '...');

        // Fetch image and convert to base64
        const imageBase64 = await fetchImageAsBase64(imageUrl);
        const mimeType = getMimeType(imageUrl);

        // Build prompt with optional title context
        let fullPrompt = SCORING_PROMPT;
        if (title) {
            fullPrompt += `\n\nThe video title is: "${title}"\nConsider how well the thumbnail matches and complements this title.`;
        }

        // Call Gemini API
        const geminiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: fullPrompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64,
                                },
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('[Score] Gemini API error:', errorText);
            return NextResponse.json(
                { success: false, error: `Gemini API error: ${geminiResponse.status}` },
                { status: 500 }
            );
        }

        const geminiResult = await geminiResponse.json();

        // Extract the text response
        const textResponse = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            console.error('[Score] No text in Gemini response:', geminiResult);
            return NextResponse.json(
                { success: false, error: 'No response from Gemini' },
                { status: 500 }
            );
        }

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = textResponse;
        if (jsonStr.includes('```json')) {
            jsonStr = jsonStr.split('```json')[1].split('```')[0];
        } else if (jsonStr.includes('```')) {
            jsonStr = jsonStr.split('```')[1].split('```')[0];
        }

        const scoreData = JSON.parse(jsonStr.trim());

        console.log('[Score] Analysis complete. Overall score:', scoreData.overallScore);

        return NextResponse.json({
            success: true,
            overallScore: scoreData.overallScore,
            pillars: scoreData.pillars,
            summary: scoreData.summary,
            improvements: scoreData.improvements,
        });

    } catch (error) {
        console.error('[Score] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// GET endpoint to check API status
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        status: GEMINI_API_KEY ? 'configured' : 'missing_api_key',
        model: 'Gemini 2.5 Flash',
        pillars: ['Virality', 'Clarity', 'Curiosity', 'Emotion', 'Composition'],
        description: 'AI-powered thumbnail scoring using 5-pillar analysis',
    });
}
