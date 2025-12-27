import { NextRequest, NextResponse } from 'next/server';

interface AnalyzeImageResponse {
    keywords: string;
    description: string;
    searchTerms: string[];
    category: string;
}

/**
 * Analyze an image using Gemini 2.0 Flash vision to extract keywords for YouTube search
 */
export async function POST(request: NextRequest) {
    try {
        const { imageUrl, youtubeVideoId } = await request.json();

        if (!imageUrl && !youtubeVideoId) {
            return NextResponse.json(
                { error: 'Either imageUrl or youtubeVideoId is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY not configured');
            return NextResponse.json({
                keywords: 'viral thumbnail',
                description: 'thumbnail',
                searchTerms: ['viral thumbnail'],
                category: 'general',
                fallback: true
            });
        }

        // Get the image URL to analyze
        let analyzeUrl = imageUrl;
        if (youtubeVideoId && !imageUrl) {
            // Use YouTube thumbnail
            analyzeUrl = `https://i.ytimg.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
        }

        const systemPrompt = `You are an expert at analyzing images to understand their content and context. Your job is to analyze thumbnail images and generate relevant YouTube search keywords.

TASK:
1. Describe what you see in the image (people, objects, text, style, mood)
2. Identify the likely content category (tech, gaming, cooking, fitness, travel, etc.)
3. Generate 2-4 specific YouTube search terms that would return similar content

EXAMPLES:
- Image of person with surprised face next to iPhone: {"keywords": "iPhone review unboxing", "category": "tech", "searchTerms": ["iPhone review", "tech unboxing reaction"]}
- Image of food with recipe text overlay: {"keywords": "cooking recipe tutorial", "category": "cooking", "searchTerms": ["easy recipes", "cooking tutorial"]}
- Gaming screenshot with player: {"keywords": "gaming gameplay walkthrough", "category": "gaming", "searchTerms": ["gaming highlights", "gameplay walkthrough"]}

Respond ONLY with a JSON object (no markdown, no code blocks):
{"keywords": "optimized search string", "description": "brief image description", "category": "category_name", "searchTerms": ["term1", "term2", "term3"]}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://thumbzap.com',
                'X-Title': 'ThumbZap',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this thumbnail image and generate YouTube search keywords:'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: analyzeUrl
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.3,
                max_tokens: 200,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter Vision API error:', response.status, errorText);
            return NextResponse.json({
                keywords: 'viral thumbnail',
                description: 'thumbnail',
                searchTerms: ['viral thumbnail'],
                category: 'general',
                fallback: true,
                error: `API error: ${response.status}`
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('No content in OpenRouter vision response');
            return NextResponse.json({
                keywords: 'viral thumbnail',
                description: 'thumbnail',
                searchTerms: ['viral thumbnail'],
                category: 'general',
                fallback: true
            });
        }

        // Parse the JSON response from the AI
        try {
            // Clean up potential markdown formatting
            const cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const parsed: AnalyzeImageResponse = JSON.parse(cleanContent);

            console.log(`Image analysis: "${parsed.description}" -> keywords: ${parsed.keywords}`);

            return NextResponse.json({
                keywords: parsed.keywords,
                description: parsed.description,
                category: parsed.category,
                searchTerms: parsed.searchTerms,
                imageUrl: analyzeUrl
            });
        } catch (parseError) {
            console.error('Failed to parse AI vision response:', content);
            // Extract keywords from the response text as fallback
            const extractedKeywords = content.slice(0, 50).replace(/[^a-zA-Z\s]/g, '').trim();
            return NextResponse.json({
                keywords: extractedKeywords || 'viral thumbnail',
                description: content.slice(0, 100),
                searchTerms: [extractedKeywords || 'viral thumbnail'],
                category: 'general',
                fallback: true
            });
        }

    } catch (error) {
        console.error('Image analysis error:', error);
        return NextResponse.json({
            keywords: 'viral thumbnail',
            description: 'thumbnail',
            searchTerms: ['viral thumbnail'],
            category: 'general',
            fallback: true,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
