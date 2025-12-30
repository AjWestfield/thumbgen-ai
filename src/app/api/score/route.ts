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

const SCORING_PROMPT = `You are a brutally honest YouTube thumbnail analyst with expertise in viral content. Analyze this thumbnail and score it based on 5 pillars that determine click-through rate (CTR).

CRITICAL SCORING RULES:
- Use the FULL 0-100 scale. Don't cluster scores around 70-80.
- Be harsh and specific. Most thumbnails should score 40-65 (mediocre to decent).
- Only truly exceptional thumbnails get 80+. Viral-worthy thumbnails are rare (90+).
- Each pillar should have DIFFERENT scores based on actual strengths/weaknesses.
- The overall score should be a weighted average, NOT just an arbitrary number.

SCORE DISTRIBUTION GUIDE:
- 0-25: Poor/Amateur (major issues, would not click)
- 26-45: Below Average (several problems, needs work)
- 46-60: Average (decent but forgettable, blends in)
- 61-75: Good (solid thumbnail, some appeal)
- 76-85: Very Good (stands out, likely to get clicks)
- 86-95: Excellent (viral potential, highly compelling)
- 96-100: Perfect (extremely rare, MrBeast-level execution)

THE 5 PILLARS:

1. **VIRALITY** (Stopping Power) - Weight: 25%
   - Does it INSTANTLY grab attention in a crowded feed?
   - Is there visual drama, tension, or shock value?
   - Would it make someone stop mid-scroll?
   - Compare to top YouTubers: MrBeast, MKBHD, PewDiePie

2. **CLARITY** (Message Clarity) - Weight: 20%
   - Is the subject crystal clear within 0.5 seconds?
   - Is text readable at small sizes (mobile feed)?
   - Is there visual clutter or confusion?
   - Does it clearly communicate what the video is about?

3. **CURIOSITY** (Click Trigger) - Weight: 25%
   - Does it create an irresistible information gap?
   - Is there a "I NEED to know what happens" feeling?
   - Does it avoid clickbait while still intriguing?
   - Would YOU click on this thumbnail?

4. **EMOTION** (Emotional Appeal) - Weight: 15%
   - Are facial expressions genuine and compelling?
   - Does it trigger an emotional response (excitement, fear, joy)?
   - Is there human connection or relatability?
   - Does it make you FEEL something?

5. **COMPOSITION** (Technical Quality) - Weight: 15%
   - Is the color contrast optimized for YouTube's dark/light modes?
   - Is the rule of thirds applied effectively?
   - Are there any AI artifacts, blur, or quality issues?
   - Is the visual hierarchy professional?

Respond in this exact JSON format:
{
    "overallScore": <weighted average of pillars, rounded to nearest integer>,
    "pillars": [
        {
            "name": "Virality",
            "score": <0-100, be critical>,
            "description": "<specific reason for this score, reference what works or doesn't>",
            "icon": "flame"
        },
        {
            "name": "Clarity",
            "score": <0-100, be critical>,
            "description": "<specific reason for this score>",
            "icon": "eye"
        },
        {
            "name": "Curiosity",
            "score": <0-100, be critical>,
            "description": "<specific reason for this score>",
            "icon": "sparkles"
        },
        {
            "name": "Emotion",
            "score": <0-100, be critical>,
            "description": "<specific reason for this score>",
            "icon": "heart"
        },
        {
            "name": "Composition",
            "score": <0-100, be critical>,
            "description": "<specific reason for this score>",
            "icon": "layout"
        }
    ],
    "summary": "<honest 2-3 sentence assessment - be direct about what's working and what isn't>",
    "improvements": [
        "<actionable improvement with specific detail>",
        "<actionable improvement with specific detail>",
        "<actionable improvement with specific detail>"
    ]
}

Remember: Your job is to help creators improve. A honest 55 is more valuable than a flattering 78.`;

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
                    temperature: 0.7,  // Higher for more varied, nuanced scoring
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
