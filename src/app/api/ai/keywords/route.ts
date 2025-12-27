import { NextRequest, NextResponse } from 'next/server';

interface KeywordResponse {
    keywords: string;
    category: string;
    searchTerms: string[];
}

/**
 * Generate optimized YouTube search keywords using Gemini 2.0 Flash via OpenRouter
 */
export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.error('OPENROUTER_API_KEY not configured');
            // Fallback to simple extraction if no API key
            return NextResponse.json({
                keywords: prompt,
                category: 'general',
                searchTerms: [prompt],
                fallback: true
            });
        }

        const systemPrompt = `You are a YouTube search optimization expert. Your job is to convert user prompts into optimal YouTube search keywords that will return relevant video results.

RULES:
1. Extract the core topic/intent from the user's prompt
2. Generate 2-4 specific, relevant search terms that YouTube would understand
3. Avoid generic words that could return irrelevant results
4. Focus on what the user actually wants to see thumbnails for
5. Consider popular YouTube content creators and video styles in the category

EXAMPLES:
- "tech" -> "technology reviews gadgets 2024" (NOT "tech" which returns music)
- "cooking healthy meals" -> "healthy meal prep recipes"
- "workout at home" -> "home workout routine fitness"
- "gaming videos" -> "gaming gameplay walkthrough"
- "travel vlog ideas" -> "travel vlog cinematic"
- "productivity tips" -> "productivity tips work from home"

Respond ONLY with a JSON object in this exact format (no markdown, no code blocks):
{"keywords": "optimized search string", "category": "category_name", "searchTerms": ["term1", "term2", "term3"]}

Categories: tech, gaming, cooking, fitness, travel, music, education, entertainment, lifestyle, business`;

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
                    { role: 'user', content: `Convert this prompt to YouTube search keywords: "${prompt}"` }
                ],
                temperature: 0.3,
                max_tokens: 150,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', response.status, errorText);
            // Fallback to original prompt
            return NextResponse.json({
                keywords: prompt,
                category: 'general',
                searchTerms: [prompt],
                fallback: true,
                error: `API error: ${response.status}`
            });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('No content in OpenRouter response');
            return NextResponse.json({
                keywords: prompt,
                category: 'general',
                searchTerms: [prompt],
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

            const parsed: KeywordResponse = JSON.parse(cleanContent);

            console.log(`AI keywords for "${prompt}": ${parsed.keywords} (category: ${parsed.category})`);

            return NextResponse.json({
                keywords: parsed.keywords,
                category: parsed.category,
                searchTerms: parsed.searchTerms,
                originalPrompt: prompt
            });
        } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            // Extract keywords from the response text as fallback
            return NextResponse.json({
                keywords: content.slice(0, 100),
                category: 'general',
                searchTerms: [prompt],
                fallback: true
            });
        }

    } catch (error) {
        console.error('AI keyword generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate keywords' },
            { status: 500 }
        );
    }
}
