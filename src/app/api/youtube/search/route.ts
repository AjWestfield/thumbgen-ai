import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';

interface YouTubeVideo {
    title: string;
    author: string;
    videoId: string;
    viewCount: number;
    publishedText: string;
    lengthSeconds: number;
    thumbnailUrl: string;
    channelId?: string;
    channelAvatarUrl?: string;
}

interface AIKeywordResponse {
    niche?: string;       // The detected content niche
    keywords: string;
    category: string;
    searchTerms: string[];
    fallback?: boolean;
}

interface GeneratedMetadata {
    title: string;
    channel: string;
    views: string;
    published: string;
}

// Minimum number of videos to return
const MIN_VIDEOS = 20;

/**
 * Generate viral video metadata (title, channel, views) using AI
 */
async function generateVideoMetadata(prompt: string): Promise<GeneratedMetadata> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    // Default fallback
    const fallback: GeneratedMetadata = {
        title: `Insane ${prompt} Transformation!`,
        channel: 'Viral Creator',
        views: '1.2M views',
        published: '2 days ago'
    };

    if (!apiKey) {
        console.log('No OPENROUTER_API_KEY, using fallback metadata');
        return fallback;
    }

    try {
        const systemPrompt = `You are a YouTube viral expert. Generate realistic, high-CTR metadata for a video about the user's topic.
      
      RETURN JSON ONLY:
      {
          "title": "A catchy, clickbaity viral title (max 60 chars)",
          "channel": "A realistic channel name",
          "views": "A realistic view count (e.g. '1.5M views', '890K views')",
          "published": "A realistic relative time (e.g. '2 days ago', '5 hours ago')"
      }`;

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
                    { role: 'user', content: `Topic: "${prompt}"` }
                ],
                temperature: 0.7,
                max_tokens: 200,
            })
        });

        if (!response.ok) {
            console.error('Metadata generation API error:', response.status);
            return fallback;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) return fallback;

        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanContent);
    } catch (error) {
        console.error('Metadata generation failed:', error);
        return fallback;
    }
}

/**
 * Generate optimized YouTube search keywords using AI (Gemini 2.0 Flash)
 */
async function getAIKeywords(prompt: string): Promise<AIKeywordResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.log('No OPENROUTER_API_KEY, using basic keyword extraction');
        return {
            keywords: prompt,
            category: 'general',
            searchTerms: [prompt],
            fallback: true
        };
    }

    try {
        const systemPrompt = `You are a YouTube content niche detection expert. Your job is to identify the VIDEO CONTENT NICHE from user prompts and generate search keywords.

CRITICAL: Users are asking to CREATE thumbnails. You must IGNORE all meta-language about thumbnail creation and extract the ACTUAL VIDEO TOPIC.

META-LANGUAGE TO COMPLETELY IGNORE:
- "make a thumbnail", "create thumbnail", "generate thumbnail"
- "YouTube thumbnail", "video thumbnail"
- "with this character", "with this image", "with this photo"
- "3D", "Pixar style", "anime style", "realistic" (style descriptors)
- "viral", "clickbait", "eye-catching"
- Any references to the thumbnail itself

EXAMPLES OF NICHE EXTRACTION:
- "Make a YouTube thumbnail with this character in a cooking video" → NICHE: cooking
  Keywords: cooking recipes 2025 chef tutorial Gordon Ramsay easy meals dinner ideas food prep kitchen tips homemade dishes cuisine culinary baking

- "Create a thumbnail for my gaming video about Minecraft builds" → NICHE: gaming/minecraft
  Keywords: minecraft builds 2025 building tutorial survival creative mode base designs architecture structures redstone

- "Generate a fitness thumbnail showing workout results" → NICHE: fitness
  Keywords: workout fitness 2025 transformation results gym training exercise routine weight loss muscle building home workout

- "Make a thumbnail for a tech unboxing video" → NICHE: tech
  Keywords: tech unboxing 2025 gadgets review smartphone laptop MKBHD new technology devices electronics

- "Create a travel vlog thumbnail about Japan" → NICHE: travel/japan
  Keywords: japan travel 2025 vlog tokyo kyoto japanese culture food trip guide sightseeing

RULES:
1. FIRST identify the content niche by ignoring all thumbnail-related language
2. Generate 15-20 search terms for that niche
3. Include popular creators, trending terms, and "2025" for recency
4. The keywords should find videos IN THAT NICHE, not videos about thumbnails

Respond ONLY with JSON: {"niche": "detected_niche", "keywords": "search string 15-20 terms", "category": "category_name", "searchTerms": ["term1", "term2", ...]}

Categories: tech, gaming, cooking, fitness, travel, music, education, entertainment, lifestyle, business, beauty, automotive, sports, finance`;

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
                    { role: 'user', content: `Extract the VIDEO CONTENT NICHE from this thumbnail request and generate search keywords for that niche: "${prompt}"` }
                ],
                temperature: 0.3,
                max_tokens: 500,
            })
        });

        if (!response.ok) {
            console.error('OpenRouter API error:', response.status);
            return { keywords: prompt, category: 'general', searchTerms: [prompt], fallback: true };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return { keywords: prompt, category: 'general', searchTerms: [prompt], fallback: true };
        }

        // Parse JSON response
        const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanContent);

        console.log(`AI niche detection for "${prompt}": niche=${parsed.niche}, category=${parsed.category}, keywords=${parsed.keywords}`);
        return parsed;

    } catch (error) {
        console.error('AI keyword generation failed:', error);
        return { keywords: prompt, category: 'general', searchTerms: [prompt], fallback: true };
    }
}

// Stop words for basic fallback extraction
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'with', 'for', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'i', 'me', 'my',
    'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his',
    'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs',
    'create', 'make', 'generate', 'show', 'display', 'want', 'like', 'please',
    'thumbnail', 'thumbnails', 'video', 'videos', 'youtube', 'image', 'picture',
    'about', 'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
    'how', 'when', 'where', 'why', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
    // Style descriptors to ignore
    '3d', 'pixar', 'style', 'character', 'animated', 'animation', 'realistic',
    'anime', 'cartoon', 'illustration', 'render', 'rendered', 'cgi',
    // Thumbnail meta-language
    'viral', 'clickbait', 'eye-catching', 'attention', 'grabbing', 'catchy',
    'attractive', 'stunning', 'amazing', 'epic', 'awesome', 'best', 'perfect'
]);

// Fallback videos by category - used when youtube-sr returns fewer than MIN_VIDEOS
const FALLBACK_VIDEOS: Record<string, YouTubeVideo[]> = {
    fitness: [
        { title: "Full Body Workout - No Equipment", author: "THENX", videoId: "oAPCPjnU1wA", viewCount: 45000000, publishedText: "2 weeks ago", lengthSeconds: 612, thumbnailUrl: "https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg" },
        { title: "20 Min Full Body Workout", author: "MadFit", videoId: "UItWltVZZmE", viewCount: 32000000, publishedText: "1 week ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/UItWltVZZmE/mqdefault.jpg" },
        { title: "Beginner HIIT Workout", author: "Heather Robertson", videoId: "ml6cT4AZdqI", viewCount: 28000000, publishedText: "3 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg" },
        { title: "10 Min Workout - Full Body", author: "Pamela Reif", videoId: "cbKkB3POqaY", viewCount: 95000000, publishedText: "1 month ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/cbKkB3POqaY/mqdefault.jpg" },
        { title: "Yoga For Beginners", author: "Yoga With Adriene", videoId: "v7AYKMP6rOE", viewCount: 52000000, publishedText: "2 weeks ago", lengthSeconds: 1380, thumbnailUrl: "https://i.ytimg.com/vi/v7AYKMP6rOE/mqdefault.jpg" },
        { title: "10 Min Ab Workout", author: "Chloe Ting", videoId: "2pLT-olgUJs", viewCount: 42000000, publishedText: "5 days ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/2pLT-olgUJs/mqdefault.jpg" },
        { title: "15 Min Apartment Workout", author: "MadFit", videoId: "gC_L9qAHVJ8", viewCount: 18000000, publishedText: "1 week ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/gC_L9qAHVJ8/mqdefault.jpg" },
        { title: "20 Min Fat Burning", author: "growingannanas", videoId: "2MoGxae-zyo", viewCount: 35000000, publishedText: "3 weeks ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/2MoGxae-zyo/mqdefault.jpg" },
        { title: "Intense HIIT Workout", author: "Pamela Reif", videoId: "IT942dJcx6I", viewCount: 48000000, publishedText: "4 days ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/IT942dJcx6I/mqdefault.jpg" },
        { title: "Morning Stretch Routine", author: "MadFit", videoId: "g_tea8ZNk5A", viewCount: 22000000, publishedText: "6 days ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/g_tea8ZNk5A/mqdefault.jpg" },
        { title: "Flat Stomach Workout", author: "Chloe Ting", videoId: "4WqoHq8NEUU", viewCount: 55000000, publishedText: "2 weeks ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/4WqoHq8NEUU/mqdefault.jpg" },
        { title: "Full Body Stretch", author: "Yoga With Adriene", videoId: "SedzswEwpPw", viewCount: 25000000, publishedText: "1 month ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/SedzswEwpPw/mqdefault.jpg" },
        { title: "Standing Abs Workout", author: "growingannanas", videoId: "kBLA15Hmq48", viewCount: 15000000, publishedText: "1 week ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/kBLA15Hmq48/mqdefault.jpg" },
        { title: "Lower Body Workout", author: "Pamela Reif", videoId: "p-uUnrCdhR8", viewCount: 38000000, publishedText: "5 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/p-uUnrCdhR8/mqdefault.jpg" },
        { title: "Upper Body Dumbbell", author: "Caroline Girvan", videoId: "Fzv_hNlO8pY", viewCount: 8500000, publishedText: "3 days ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/Fzv_hNlO8pY/mqdefault.jpg" },
        { title: "Dance Workout", author: "POPSUGAR Fitness", videoId: "qvMIXLjVNLM", viewCount: 32000000, publishedText: "2 weeks ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/qvMIXLjVNLM/mqdefault.jpg" },
        { title: "Cardio Dance Workout", author: "MadFit", videoId: "diKlrEkb4pg", viewCount: 12000000, publishedText: "1 week ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/diKlrEkb4pg/mqdefault.jpg" },
        { title: "Quick Arm Workout", author: "Pamela Reif", videoId: "6Whgn_iE5uc", viewCount: 28000000, publishedText: "4 days ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/6Whgn_iE5uc/mqdefault.jpg" },
        { title: "Booty Workout At Home", author: "Chloe Ting", videoId: "ERr1PwlEqZI", viewCount: 42000000, publishedText: "6 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/ERr1PwlEqZI/mqdefault.jpg" },
        { title: "30 Min HIIT Workout", author: "Heather Robertson", videoId: "M0uO8X3_tEA", viewCount: 15000000, publishedText: "1 week ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/M0uO8X3_tEA/mqdefault.jpg" },
    ],
    gaming: [
        { title: "Minecraft Hardcore Day 1", author: "PewDiePie", videoId: "8X2kIfS6fb8", viewCount: 45000000, publishedText: "1 week ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/8X2kIfS6fb8/mqdefault.jpg" },
        { title: "I Spent 50 Hours In VR", author: "MrBeast Gaming", videoId: "2G_mWfG0DZE", viewCount: 89000000, publishedText: "3 days ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/2G_mWfG0DZE/mqdefault.jpg" },
        { title: "Minecraft Speedrunner VS Hunter", author: "Dream", videoId: "tlXHyyIpU84", viewCount: 78000000, publishedText: "2 weeks ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/tlXHyyIpU84/mqdefault.jpg" },
        { title: "GTA 6 Trailer Reaction", author: "jacksepticeye", videoId: "owK1qxDselE", viewCount: 8900000, publishedText: "6 days ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/owK1qxDselE/mqdefault.jpg" },
        { title: "Playing Scary Games", author: "Markiplier", videoId: "6Dh-RL__uN4", viewCount: 15000000, publishedText: "1 week ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/6Dh-RL__uN4/mqdefault.jpg" },
        { title: "Elden Ring All Bosses", author: "VaatiVidya", videoId: "9sLLgPe7R1Y", viewCount: 4200000, publishedText: "2 weeks ago", lengthSeconds: 3600, thumbnailUrl: "https://i.ytimg.com/vi/9sLLgPe7R1Y/mqdefault.jpg" },
        { title: "Fortnite Victory Royale", author: "Ninja", videoId: "r1XE5WuLKcI", viewCount: 32000000, publishedText: "4 days ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/r1XE5WuLKcI/mqdefault.jpg" },
        { title: "GTA Online Heist", author: "TheGentleman", videoId: "0xh6HvbhZXM", viewCount: 18000000, publishedText: "1 week ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/0xh6HvbhZXM/mqdefault.jpg" },
        { title: "Zelda TOTK Secrets", author: "Austin John Plays", videoId: "S7WaJ7fWDcU", viewCount: 5600000, publishedText: "5 days ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/S7WaJ7fWDcU/mqdefault.jpg" },
        { title: "Among Us With Friends", author: "Corpse Husband", videoId: "H8iJWYQy8UE", viewCount: 42000000, publishedText: "3 weeks ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/H8iJWYQy8UE/mqdefault.jpg" },
        { title: "Hogwarts Legacy Gameplay", author: "IGN", videoId: "BtyBjOW8sGY", viewCount: 12000000, publishedText: "1 week ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/BtyBjOW8sGY/mqdefault.jpg" },
        { title: "Building a Mega Base", author: "Grian", videoId: "gq5mUEtMibI", viewCount: 8900000, publishedText: "3 days ago", lengthSeconds: 2100, thumbnailUrl: "https://i.ytimg.com/vi/gq5mUEtMibI/mqdefault.jpg" },
        { title: "Cyberpunk 2077 Review", author: "Angry Joe", videoId: "61_SnDWWPpc", viewCount: 6500000, publishedText: "2 weeks ago", lengthSeconds: 2700, thumbnailUrl: "https://i.ytimg.com/vi/61_SnDWWPpc/mqdefault.jpg" },
        { title: "Valorant Pro Tips", author: "TenZ", videoId: "SXxNPaJmb6o", viewCount: 4800000, publishedText: "6 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/SXxNPaJmb6o/mqdefault.jpg" },
        { title: "Pokemon Guide Complete", author: "aDrive", videoId: "mGVGG_4n-VM", viewCount: 2500000, publishedText: "4 days ago", lengthSeconds: 3000, thumbnailUrl: "https://i.ytimg.com/vi/mGVGG_4n-VM/mqdefault.jpg" },
        { title: "Call of Duty Warzone", author: "NICKMERCS", videoId: "7kJ9t8RSEYM", viewCount: 7200000, publishedText: "1 week ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/7kJ9t8RSEYM/mqdefault.jpg" },
        { title: "Stardew Valley Tips", author: "DangerouslyFunny", videoId: "X-qxS-Uxq0c", viewCount: 3800000, publishedText: "5 days ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/X-qxS-Uxq0c/mqdefault.jpg" },
        { title: "Apex Legends Guide", author: "iiTzTimmy", videoId: "1YqWvEu4E1A", viewCount: 5100000, publishedText: "3 days ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/1YqWvEu4E1A/mqdefault.jpg" },
        { title: "Spider-Man 2 Gameplay", author: "IGN", videoId: "qIQ3xNqkVC4", viewCount: 9200000, publishedText: "1 week ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/qIQ3xNqkVC4/mqdefault.jpg" },
        { title: "Genshin Impact Guide", author: "Zy0x", videoId: "F6LG4aJJpT4", viewCount: 6700000, publishedText: "4 days ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/F6LG4aJJpT4/mqdefault.jpg" },
    ],
    cooking: [
        { title: "Perfect Scrambled Eggs", author: "Gordon Ramsay", videoId: "PUP7U5vTMM0", viewCount: 78000000, publishedText: "2 weeks ago", lengthSeconds: 180, thumbnailUrl: "https://i.ytimg.com/vi/PUP7U5vTMM0/mqdefault.jpg" },
        { title: "How To Cook Steak", author: "Joshua Weissman", videoId: "SrV4sA6b8OQ", viewCount: 8500000, publishedText: "3 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/SrV4sA6b8OQ/mqdefault.jpg" },
        { title: "Basics with Babish", author: "Binging with Babish", videoId: "bJUiWdM__Qw", viewCount: 12000000, publishedText: "1 week ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/bJUiWdM__Qw/mqdefault.jpg" },
        { title: "5 Meals for the Week", author: "Pro Home Cooks", videoId: "dBnniua6-oM", viewCount: 5400000, publishedText: "5 days ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/dBnniua6-oM/mqdefault.jpg" },
        { title: "Ultimate Burger Guide", author: "Guga Foods", videoId: "mCIYB6s0SfY", viewCount: 9800000, publishedText: "4 days ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/mCIYB6s0SfY/mqdefault.jpg" },
        { title: "Easy Pasta Recipe", author: "Tasty", videoId: "gj6Qnn9Lvow", viewCount: 21000000, publishedText: "1 week ago", lengthSeconds: 300, thumbnailUrl: "https://i.ytimg.com/vi/gj6Qnn9Lvow/mqdefault.jpg" },
        { title: "The BEST Fried Rice", author: "Uncle Roger", videoId: "FrUfwpaNNIM", viewCount: 39000000, publishedText: "6 days ago", lengthSeconds: 540, thumbnailUrl: "https://i.ytimg.com/vi/FrUfwpaNNIM/mqdefault.jpg" },
        { title: "Perfect Ramen At Home", author: "Joshua Weissman", videoId: "9WXIrnWsaCo", viewCount: 11000000, publishedText: "3 days ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/9WXIrnWsaCo/mqdefault.jpg" },
        { title: "Homemade Pizza Tutorial", author: "Brian Lagerstrom", videoId: "G-jPoROGHGE", viewCount: 4200000, publishedText: "1 week ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/G-jPoROGHGE/mqdefault.jpg" },
        { title: "Easy Chicken Recipes", author: "preppy kitchen", videoId: "3Y3GKY2v7dA", viewCount: 5500000, publishedText: "5 days ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/3Y3GKY2v7dA/mqdefault.jpg" },
        { title: "Beef Wellington", author: "Gordon Ramsay", videoId: "Cyskqnp1j64", viewCount: 28000000, publishedText: "2 weeks ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/Cyskqnp1j64/mqdefault.jpg" },
        { title: "Making Fresh Pasta", author: "Italia Squisita", videoId: "HdSLKZ6LN94", viewCount: 8900000, publishedText: "3 weeks ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/HdSLKZ6LN94/mqdefault.jpg" },
        { title: "Sushi Making Tutorial", author: "Tasty Japan", videoId: "oM7W2nPYjds", viewCount: 15000000, publishedText: "1 month ago", lengthSeconds: 660, thumbnailUrl: "https://i.ytimg.com/vi/oM7W2nPYjds/mqdefault.jpg" },
        { title: "Best Chocolate Cake", author: "Preppy Kitchen", videoId: "4qLpZg5QxS0", viewCount: 12000000, publishedText: "2 weeks ago", lengthSeconds: 480, thumbnailUrl: "https://i.ytimg.com/vi/4qLpZg5QxS0/mqdefault.jpg" },
        { title: "Japanese Curry Recipe", author: "JunsKitchen", videoId: "c9gNjvYAz4M", viewCount: 7800000, publishedText: "4 weeks ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/c9gNjvYAz4M/mqdefault.jpg" },
        { title: "BBQ Brisket Masterclass", author: "Aaron Franklin", videoId: "VmTzdMHu5KU", viewCount: 9200000, publishedText: "1 month ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/VmTzdMHu5KU/mqdefault.jpg" },
        { title: "Carbonara The Right Way", author: "Italia Squisita", videoId: "D_2DBLAt57c", viewCount: 18000000, publishedText: "3 weeks ago", lengthSeconds: 540, thumbnailUrl: "https://i.ytimg.com/vi/D_2DBLAt57c/mqdefault.jpg" },
        { title: "French Omelet Technique", author: "Jacques Pepin", videoId: "s10etP1p2bU", viewCount: 11000000, publishedText: "2 weeks ago", lengthSeconds: 360, thumbnailUrl: "https://i.ytimg.com/vi/s10etP1p2bU/mqdefault.jpg" },
        { title: "Bread Baking for Beginners", author: "Joshua Weissman", videoId: "eod5cUxAHRM", viewCount: 7200000, publishedText: "1 week ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/eod5cUxAHRM/mqdefault.jpg" },
        { title: "Taco Tuesday Recipes", author: "Sam the Cooking Guy", videoId: "Wzh7FN3WuuQ", viewCount: 3100000, publishedText: "5 days ago", lengthSeconds: 780, thumbnailUrl: "https://i.ytimg.com/vi/Wzh7FN3WuuQ/mqdefault.jpg" },
    ],
    tech: [
        { title: "iPhone Review", author: "MKBHD", videoId: "XQ7z57qrZU8", viewCount: 15000000, publishedText: "1 week ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/XQ7z57qrZU8/mqdefault.jpg" },
        { title: "Best Laptop for 2024", author: "Linus Tech Tips", videoId: "QRH8eimU_20", viewCount: 8900000, publishedText: "6 days ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/QRH8eimU_20/mqdefault.jpg" },
        { title: "Unboxing the Future", author: "Unbox Therapy", videoId: "J7GY1Xg6X20", viewCount: 12000000, publishedText: "3 days ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/J7GY1Xg6X20/mqdefault.jpg" },
        { title: "MacBook Pro Review", author: "Dave2D", videoId: "3wsCvC7lP0I", viewCount: 4500000, publishedText: "5 days ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/3wsCvC7lP0I/mqdefault.jpg" },
        { title: "Best Budget Phone", author: "Mr Whose The Boss", videoId: "s-gOJPjKn2o", viewCount: 6700000, publishedText: "4 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/s-gOJPjKn2o/mqdefault.jpg" },
        { title: "Tech You Need", author: "iJustine", videoId: "tkRjG_2LnQw", viewCount: 2100000, publishedText: "1 week ago", lengthSeconds: 660, thumbnailUrl: "https://i.ytimg.com/vi/tkRjG_2LnQw/mqdefault.jpg" },
        { title: "Galaxy S24 Ultra Review", author: "MKBHD", videoId: "5TBm2TFYOvk", viewCount: 9800000, publishedText: "2 weeks ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/5TBm2TFYOvk/mqdefault.jpg" },
        { title: "Setup Tour 2024", author: "Linus Tech Tips", videoId: "9Y5_HkL3B0U", viewCount: 11000000, publishedText: "6 days ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/9Y5_HkL3B0U/mqdefault.jpg" },
        { title: "AI PC Review", author: "Dave2D", videoId: "g5HfDluvJLI", viewCount: 3500000, publishedText: "3 days ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/g5HfDluvJLI/mqdefault.jpg" },
        { title: "Best Headphones 2024", author: "MKBHD", videoId: "wCdJQjpNpko", viewCount: 7200000, publishedText: "1 week ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/wCdJQjpNpko/mqdefault.jpg" },
        { title: "Home Lab Tour", author: "NetworkChuck", videoId: "HvKEmHPL7lM", viewCount: 2800000, publishedText: "5 days ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/HvKEmHPL7lM/mqdefault.jpg" },
        { title: "Steam Deck Review", author: "Linus Tech Tips", videoId: "HjZ4POvk14c", viewCount: 8100000, publishedText: "2 weeks ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/HjZ4POvk14c/mqdefault.jpg" },
        { title: "iPad Pro M4 Review", author: "MKBHD", videoId: "x0GAMoGqQz8", viewCount: 6500000, publishedText: "6 days ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/x0GAMoGqQz8/mqdefault.jpg" },
        { title: "Gaming Monitor Guide", author: "Hardware Unboxed", videoId: "luLS-I9lubg", viewCount: 2100000, publishedText: "1 week ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/luLS-I9lubg/mqdefault.jpg" },
        { title: "Building My Dream PC", author: "JayzTwoCents", videoId: "v7MYOpFONCU", viewCount: 3900000, publishedText: "4 days ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/v7MYOpFONCU/mqdefault.jpg" },
        { title: "Electric Car Review", author: "MKBHD", videoId: "LQdW45k9rQU", viewCount: 8800000, publishedText: "2 weeks ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/LQdW45k9rQU/mqdefault.jpg" },
        { title: "Apple Vision Pro", author: "MKBHD", videoId: "dtp6b76pMak", viewCount: 18000000, publishedText: "1 week ago", lengthSeconds: 1260, thumbnailUrl: "https://i.ytimg.com/vi/dtp6b76pMak/mqdefault.jpg" },
        { title: "Smart Home Setup", author: "Mrwhosetheboss", videoId: "qlH4-oHnBb8", viewCount: 4200000, publishedText: "5 days ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/qlH4-oHnBb8/mqdefault.jpg" },
        { title: "Camera Comparison", author: "MKBHD", videoId: "mQqUj-hOr9s", viewCount: 5600000, publishedText: "3 days ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/mQqUj-hOr9s/mqdefault.jpg" },
        { title: "Fold vs Flip Phone", author: "JerryRigEverything", videoId: "3HUZjkH8HLQ", viewCount: 3100000, publishedText: "6 days ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/3HUZjkH8HLQ/mqdefault.jpg" },
    ],
    default: [
        { title: "I Survived 100 Days", author: "MrBeast", videoId: "FM7MFYoylVs", viewCount: 245000000, publishedText: "1 week ago", lengthSeconds: 1020, thumbnailUrl: "https://i.ytimg.com/vi/FM7MFYoylVs/mqdefault.jpg" },
        { title: "Optimism - Kurzgesagt", author: "Kurzgesagt", videoId: "MBRqu0YOH14", viewCount: 18000000, publishedText: "3 days ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/MBRqu0YOH14/mqdefault.jpg" },
        { title: "History of the Universe", author: "Melodysheep", videoId: "uD4izuDMUQA", viewCount: 42000000, publishedText: "2 weeks ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/uD4izuDMUQA/mqdefault.jpg" },
        { title: "Day in My Life", author: "Casey Neistat", videoId: "La9oLLoI5Rc", viewCount: 8900000, publishedText: "5 days ago", lengthSeconds: 540, thumbnailUrl: "https://i.ytimg.com/vi/La9oLLoI5Rc/mqdefault.jpg" },
        { title: "What I Eat in a Day", author: "Emma Chamberlain", videoId: "oWyP-QVJmqc", viewCount: 15000000, publishedText: "1 week ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/oWyP-QVJmqc/mqdefault.jpg" },
        { title: "How to Start a Business", author: "Ali Abdaal", videoId: "qgIH1Aqdqfk", viewCount: 4200000, publishedText: "4 days ago", lengthSeconds: 1260, thumbnailUrl: "https://i.ytimg.com/vi/qgIH1Aqdqfk/mqdefault.jpg" },
        { title: "Epic Travel Montage", author: "Sam Kolder", videoId: "HvaeSWv0IS0", viewCount: 6700000, publishedText: "2 weeks ago", lengthSeconds: 180, thumbnailUrl: "https://i.ytimg.com/vi/HvaeSWv0IS0/mqdefault.jpg" },
        { title: "Never Gonna Give You Up", author: "Rick Astley", videoId: "dQw4w9WgXcQ", viewCount: 1500000000, publishedText: "3 weeks ago", lengthSeconds: 212, thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
        { title: "Despacito", author: "Luis Fonsi", videoId: "kJQP7kiw5Fk", viewCount: 8200000000, publishedText: "1 month ago", lengthSeconds: 282, thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg" },
        { title: "I Gave Away 1M Dollars", author: "MrBeast", videoId: "9bqk6ZUsKyA", viewCount: 188000000, publishedText: "6 days ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/9bqk6ZUsKyA/mqdefault.jpg" },
        { title: "Space Documentary", author: "Veritasium", videoId: "3mnSDifDSxQ", viewCount: 28000000, publishedText: "1 week ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/3mnSDifDSxQ/mqdefault.jpg" },
        { title: "Life Changing Advice", author: "GaryVee", videoId: "6rXNKf_Wee4", viewCount: 8500000, publishedText: "2 weeks ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/6rXNKf_Wee4/mqdefault.jpg" },
        { title: "Morning Routine", author: "Matt D'Avella", videoId: "XtDc_iJ-j-M", viewCount: 12000000, publishedText: "5 days ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/XtDc_iJ-j-M/mqdefault.jpg" },
        { title: "Blinding Lights", author: "The Weeknd", videoId: "4NRXx6U8ABQ", viewCount: 1100000000, publishedText: "3 weeks ago", lengthSeconds: 262, thumbnailUrl: "https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg" },
        { title: "Study With Me", author: "TheStrive Studies", videoId: "MTdVYFnSVwM", viewCount: 7800000, publishedText: "4 days ago", lengthSeconds: 3600, thumbnailUrl: "https://i.ytimg.com/vi/MTdVYFnSVwM/mqdefault.jpg" },
        { title: "How I Learn Anything", author: "Ali Abdaal", videoId: "Z-zNHHpXoMM", viewCount: 5400000, publishedText: "1 week ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/Z-zNHHpXoMM/mqdefault.jpg" },
        { title: "Shape of You", author: "Ed Sheeran", videoId: "JGwWNGJdvx8", viewCount: 6200000000, publishedText: "2 weeks ago", lengthSeconds: 263, thumbnailUrl: "https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg" },
        { title: "Uptown Funk", author: "Bruno Mars", videoId: "OPf0YbXqDm0", viewCount: 4900000000, publishedText: "1 month ago", lengthSeconds: 271, thumbnailUrl: "https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg" },
        { title: "See You Again", author: "Wiz Khalifa ft. Charlie Puth", videoId: "RgKAFK5djSk", viewCount: 5900000000, publishedText: "3 weeks ago", lengthSeconds: 237, thumbnailUrl: "https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg" },
        { title: "Sugar Music Video", author: "Maroon 5", videoId: "09R8_2nJtjg", viewCount: 3800000000, publishedText: "2 weeks ago", lengthSeconds: 306, thumbnailUrl: "https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg" },
    ],
};

/**
 * Detect the category based on query keywords
 */
function detectCategory(query: string): string {
    const queryLower = query.toLowerCase();

    if (queryLower.includes('fitness') || queryLower.includes('workout') || queryLower.includes('gym') ||
        queryLower.includes('exercise') || queryLower.includes('yoga') || queryLower.includes('hiit')) {
        return 'fitness';
    }
    if (queryLower.includes('game') || queryLower.includes('gaming') || queryLower.includes('minecraft') ||
        queryLower.includes('fortnite') || queryLower.includes('gta') || queryLower.includes('elden')) {
        return 'gaming';
    }
    if (queryLower.includes('cook') || queryLower.includes('recipe') || queryLower.includes('food') ||
        queryLower.includes('meal') || queryLower.includes('kitchen') || queryLower.includes('chef')) {
        return 'cooking';
    }
    if (queryLower.includes('tech') || queryLower.includes('phone') || queryLower.includes('iphone') ||
        queryLower.includes('laptop') || queryLower.includes('computer') || queryLower.includes('review') ||
        queryLower.includes('unbox')) {
        return 'tech';
    }

    return 'default';
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Validate a single thumbnail by checking if it exists and has valid content
 * YouTube returns a ~1KB placeholder for deleted/private videos
 */
async function validateThumbnail(videoId: string): Promise<boolean> {
    try {
        const url = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
        const response = await fetch(url, { method: 'HEAD' });

        if (!response.ok) return false;

        const contentLength = response.headers.get('content-length');
        // Valid thumbnails are typically > 2KB, placeholder is ~1KB
        return contentLength ? parseInt(contentLength) > 1500 : false;
    } catch {
        return false;
    }
}

/**
 * Validate thumbnails in parallel and filter out broken ones
 */
async function filterValidThumbnails(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
    const validationResults = await Promise.all(
        videos.map(async (video) => ({
            video,
            isValid: await validateThumbnail(video.videoId)
        }))
    );

    const validVideos = validationResults
        .filter(result => result.isValid)
        .map(result => result.video);

    const invalidCount = videos.length - validVideos.length;
    if (invalidCount > 0) {
        console.log(`Filtered out ${invalidCount} videos with broken thumbnails`);
    }

    return validVideos;
}

/**
 * Get fallback videos for a category, shuffled to avoid repetition
 */
function getFallbackVideos(category: string): YouTubeVideo[] {
    const videos = FALLBACK_VIDEOS[category] || FALLBACK_VIDEOS.default;
    return shuffleArray(videos);
}

/**
 * Get broader search terms to find more videos if initial search doesn't return enough
 */
function getBroaderSearchTerms(category: string, originalKeywords: string): string[] {
    const categorySearches: Record<string, string[]> = {
        'tech': [
            'best tech gadgets 2024',
            'smartphone review',
            'tech unboxing',
            'laptop review',
        ],
        'technology': [
            'technology review 2024',
            'gadgets review',
            'tech news',
        ],
        'gaming': [
            'best games 2024',
            'gaming review',
            'gameplay walkthrough',
        ],
        'cooking': [
            'easy recipes',
            'cooking tutorial',
            'chef recipes',
        ],
        'food': [
            'food recipes',
            'cooking at home',
            'best recipes',
        ],
        'fitness': [
            'workout routine',
            'home workout',
            'fitness training',
        ],
        'travel': [
            'travel vlog',
            'best destinations',
            'travel guide',
        ],
        'music': [
            'music video',
            'top songs',
            'music playlist',
        ],
        'education': [
            'tutorial',
            'how to learn',
            'educational video',
        ],
        'entertainment': [
            'entertainment news',
            'viral videos',
            'trending videos',
        ],
        'lifestyle': [
            'lifestyle vlog',
            'daily routine',
            'life tips',
        ],
        'business': [
            'business tips',
            'entrepreneur advice',
            'money tips',
        ],
    };

    // Get category-specific searches or use defaults
    const searches = categorySearches[category.toLowerCase()] || [
        'trending videos',
        'popular videos 2024',
        'best of youtube',
    ];

    // Don't repeat the original search
    return searches.filter(s => s.toLowerCase() !== originalKeywords.toLowerCase());
}

/**
 * Search YouTube using youtube-sr package
 * This is a free, open-source solution that doesn't require API keys
 */
async function searchYouTubeWithSR(query: string): Promise<YouTubeVideo[]> {
    // Add terms to favor longer-form content over Shorts
    const enhancedQuery = `${query} full video`;
    console.log(`youtube-sr searching for: "${enhancedQuery}"`);

    try {
        const results = await YouTube.search(enhancedQuery, {
            limit: 50, // Fetch more to have enough after filtering
            type: 'video',
            safeSearch: false,
            requestOptions: {
                headers: {
                    // Signal US region preference to YouTube
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': 'PREF=hl=en&gl=US',
                },
            },
        });

        if (!results || results.length === 0) {
            console.log('youtube-sr returned no results');
            return [];
        }

        const videos: YouTubeVideo[] = results
            .filter(video => {
                // Must have id and title
                if (!video.id || !video.title) return false;

                // Filter out Shorts:
                // 1. Check shorts property
                if (video.shorts) return false;

                // 2. Check if title contains #shorts or #short
                const titleLower = video.title.toLowerCase();
                if (titleLower.includes('#shorts')) return false;
                if (titleLower.includes('#short ')) return false;

                // 3. Filter very short videos (< 90 seconds = likely Shorts)
                // Duration from youtube-sr is in milliseconds
                const durationSeconds = (video.duration || 0) / 1000;
                if (durationSeconds > 0 && durationSeconds < 90) return false;

                // 4. Filter unreasonably long durations (likely live streams)
                if (durationSeconds > 10800) return false; // > 3 hours

                return true;
            })
            .map(video => {
                // Duration from youtube-sr is in MILLISECONDS, convert to seconds
                const durationMs = video.duration || 0;
                const durationSeconds = Math.floor(durationMs / 1000);

                // Extract channel avatar URL from youtube-sr
                // The channel object structure varies, so we try multiple properties
                let channelIcon = '';
                try {
                    const channel = video.channel as unknown as Record<string, unknown>;
                    if (channel) {
                        // Try icon.url first
                        const icon = channel.icon as { url?: string } | undefined;
                        if (icon?.url) {
                            channelIcon = icon.url;
                        } else {
                            // Try iconURL (can be string or function)
                            const iconURL = channel.iconURL;
                            if (typeof iconURL === 'function') {
                                channelIcon = iconURL();
                            } else if (typeof iconURL === 'string') {
                                channelIcon = iconURL;
                            }
                        }
                    }
                } catch {
                    // Fallback: no avatar
                    channelIcon = '';
                }

                return {
                    title: video.title || 'Untitled',
                    author: video.channel?.name || 'Unknown',
                    videoId: video.id || '',
                    viewCount: video.views || 0,
                    publishedText: video.uploadedAt || 'Recently',
                    lengthSeconds: durationSeconds,
                    // Use YouTube CDN for reliable landscape thumbnail
                    thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
                    channelId: video.channel?.id || '',
                    channelAvatarUrl: channelIcon
                };
            })
            .slice(0, 25); // Return up to 25 videos

        console.log(`youtube-sr found ${videos.length} regular videos (filtered out Shorts)`);
        return videos;
    } catch (error) {
        console.error('youtube-sr search failed:', error);
        return [];
    }
}

/**
 * Deduplicate videos by channel - ensures variety by limiting videos per channel
 * @param videos - Array of videos to deduplicate
 * @param maxPerChannel - Maximum videos allowed per channel (default: 2)
 */
function deduplicateByChannel(videos: YouTubeVideo[], maxPerChannel: number = 2): YouTubeVideo[] {
    const channelCounts = new Map<string, number>();
    return videos.filter(video => {
        const channelName = video.author.toLowerCase();
        const count = channelCounts.get(channelName) || 0;
        if (count >= maxPerChannel) return false;
        channelCounts.set(channelName, count + 1);
        return true;
    });
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json(
            { error: 'Query parameter "q" is required' },
            { status: 400 }
        );
    }

    // Use AI to generate optimized search keywords AND metadata in parallel
    console.log(`Processing query: "${query}"`);

    // Process everything in parallel for speed
    const [aiResult, generatedMetadata] = await Promise.all([
        getAIKeywords(query),
        generateVideoMetadata(query)
    ]);

    const keywords = aiResult.keywords;
    const category = aiResult.category;

    console.log(`AI optimized keywords: "${keywords}" (category: ${category}, fallback: ${aiResult.fallback || false})`);
    console.log(`Generated metadata:`, generatedMetadata);

    // Search YouTube with AI-optimized keywords
    let videos = await searchYouTubeWithSR(keywords);

    // Validate thumbnails - filter out any with broken/missing images
    console.log(`Validating ${videos.length} video thumbnails...`);
    videos = await filterValidThumbnails(videos);
    console.log(`${videos.length} videos have valid thumbnails`);

    // If we don't have enough valid videos, try broader searches
    if (videos.length < MIN_VIDEOS) {
        console.log(`Only ${videos.length} videos, trying broader searches...`);

        const existingIds = new Set(videos.map(v => v.videoId));

        // Try broader search terms based on category
        const broaderSearches = getBroaderSearchTerms(category, keywords);

        for (const searchTerm of broaderSearches) {
            if (videos.length >= MIN_VIDEOS) break;

            console.log(`Trying broader search: "${searchTerm}"`);
            let additionalVideos = await searchYouTubeWithSR(searchTerm);
            additionalVideos = await filterValidThumbnails(additionalVideos);

            for (const video of additionalVideos) {
                if (videos.length >= MIN_VIDEOS) break;
                if (!existingIds.has(video.videoId)) {
                    videos.push(video);
                    existingIds.add(video.videoId);
                }
            }
        }

        console.log(`After broader searches: ${videos.length} total videos`);
    }

    // Deduplicate by channel to ensure variety (max 2 videos per channel)
    const deduplicatedVideos = deduplicateByChannel(videos, 2);
    console.log(`After channel deduplication: ${deduplicatedVideos.length} videos (was ${videos.length})`);

    return NextResponse.json({
        query: keywords,
        originalQuery: query,
        category: category,
        generatedMetadata,
        aiOptimized: !aiResult.fallback,
        count: deduplicatedVideos.length,
        videos: deduplicatedVideos
    });
}
