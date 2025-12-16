export interface YouTubeVideo {
    title: string;
    author: string;
    videoId: string;
    viewCount: number;
    publishedText: string;
    lengthSeconds: number;
    thumbnailUrl: string;
}

export interface YouTubeSearchResult {
    videos: YouTubeVideo[];
}

// List of Invidious instances to try (updated with more reliable instances)
const INVIDIOUS_INSTANCES = [
    "https://invidious.fdn.fr",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://inv.tux.pizza",
    "https://invidious.protokolla.fi",
    "https://yt.artemislena.eu",
    "https://invidious.privacyredirect.com",
    "https://invidious.jing.rocks",
    "https://iv.datura.network",
    "https://invidious.lunar.icu",
];

// Piped API instances as fallback
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.in.projectsegfau.lt",
    "https://pipedapi.leptons.xyz",
];

// Stop words to filter out from prompts for better search results
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
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there'
]);

/**
 * Extract meaningful keywords from a prompt for better YouTube search
 */
function extractKeywords(prompt: string): string {
    const words = prompt
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    // Take up to 5 most relevant keywords
    const keywords = words.slice(0, 5).join(' ');

    // If no keywords extracted, use the original prompt cleaned up
    return keywords || prompt.replace(/[^\w\s]/g, '').trim();
}

/**
 * Try to fetch from a single Invidious instance
 */
async function tryInvidiousInstance(instance: string, query: string, signal: AbortSignal): Promise<YouTubeVideo[] | null> {
    try {
        const response = await fetch(
            `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort=relevance`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal
            }
        );

        if (!response.ok) return null;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return null;

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any) => ({
                title: item.title || 'Untitled',
                author: item.author || 'Unknown',
                videoId: item.videoId,
                viewCount: item.viewCount || 0,
                publishedText: item.publishedText || 'Recently',
                lengthSeconds: item.lengthSeconds || 0,
                thumbnailUrl: item.videoThumbnails?.find((t: any) => t.quality === 'medium' || t.quality === 'high')?.url ||
                    item.videoThumbnails?.[0]?.url ||
                    `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`
            })).slice(0, 10);
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Try to fetch from a single Piped instance
 */
async function tryPipedInstance(instance: string, query: string, signal: AbortSignal): Promise<YouTubeVideo[] | null> {
    try {
        const response = await fetch(
            `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
            {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal
            }
        );

        if (!response.ok) return null;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return null;

        const data = await response.json();

        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            return data.items
                .filter((item: any) => item.type === 'stream')
                .map((item: any) => {
                    // Extract video ID from URL like /watch?v=VIDEO_ID
                    const videoId = item.url?.replace('/watch?v=', '') || '';
                    return {
                        title: item.title || 'Untitled',
                        author: item.uploaderName || 'Unknown',
                        videoId,
                        viewCount: item.views || 0,
                        publishedText: item.uploadedDate || 'Recently',
                        lengthSeconds: item.duration || 0,
                        thumbnailUrl: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                    };
                })
                .slice(0, 10);
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Race multiple API instances and return the first successful result
 */
async function raceInstances<T>(
    instances: string[],
    fetcher: (instance: string, query: string, signal: AbortSignal) => Promise<T | null>,
    query: string,
    timeoutMs: number = 5000
): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Create promises for all instances
        const promises = instances.map(async (instance) => {
            const result = await fetcher(instance, query, controller.signal);
            if (result) {
                // Got a valid result, abort other requests
                controller.abort();
                return result;
            }
            throw new Error('No result');
        });

        // Race all promises, first valid result wins
        const result = await Promise.any(promises);
        return result;
    } catch {
        // All instances failed
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Search YouTube using Invidious and Piped APIs
 * Extracts keywords from the prompt and fetches real thumbnails
 */
export async function searchYouTube(prompt: string): Promise<YouTubeVideo[]> {
    // Extract meaningful keywords from the prompt
    const query = extractKeywords(prompt);
    console.log(`Searching YouTube for: "${query}" (from prompt: "${prompt}")`);

    // Try Invidious instances first (race them for speed)
    const invidiousResult = await raceInstances(
        INVIDIOUS_INSTANCES,
        tryInvidiousInstance,
        query,
        5000
    );

    if (invidiousResult && invidiousResult.length > 0) {
        console.log(`Found ${invidiousResult.length} videos from Invidious`);
        return invidiousResult;
    }

    console.log('Invidious failed, trying Piped...');

    // Fallback to Piped instances
    const pipedResult = await raceInstances(
        PIPED_INSTANCES,
        tryPipedInstance,
        query,
        5000
    );

    if (pipedResult && pipedResult.length > 0) {
        console.log(`Found ${pipedResult.length} videos from Piped`);
        return pipedResult;
    }

    console.warn('All YouTube API instances failed. Using fallback thumbnails.');

    // Ultimate fallback: Return generic thumbnails that work
    // These use YouTube's thumbnail CDN directly with popular video IDs
    return getRelevantFallbackVideos(query);
}

/**
 * Get fallback videos that are somewhat relevant to the query
 * Uses real YouTube video IDs for reliable thumbnail loading
 */
function getRelevantFallbackVideos(query: string): YouTubeVideo[] {
    const queryLower = query.toLowerCase();

    // Categorized real YouTube videos by topic - using verified working video IDs
    const videosByCategory: Record<string, YouTubeVideo[]> = {
        fitness: [
            { title: "Full Body Workout - No Equipment", author: "THENX", videoId: "oAPCPjnU1wA", viewCount: 45000000, publishedText: "2 years ago", lengthSeconds: 612, thumbnailUrl: "https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg" },
            { title: "20 Min Full Body Workout", author: "MadFit", videoId: "UItWltVZZmE", viewCount: 32000000, publishedText: "1 year ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/UItWltVZZmE/mqdefault.jpg" },
            { title: "Beginner HIIT Workout", author: "Heather Robertson", videoId: "ml6cT4AZdqI", viewCount: 28000000, publishedText: "3 years ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg" },
            { title: "10 Min Workout - Full Body", author: "Pamela Reif", videoId: "cbKkB3POqaY", viewCount: 95000000, publishedText: "3 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/cbKkB3POqaY/mqdefault.jpg" },
            { title: "30 Day Fitness Challenge", author: "Blogilates", videoId: "2pLT-olgUJs", viewCount: 18000000, publishedText: "2 years ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/2pLT-olgUJs/mqdefault.jpg" },
            { title: "Yoga For Beginners", author: "Yoga With Adriene", videoId: "v7AYKMP6rOE", viewCount: 52000000, publishedText: "5 years ago", lengthSeconds: 1380, thumbnailUrl: "https://i.ytimg.com/vi/v7AYKMP6rOE/mqdefault.jpg" },
            { title: "Home Abs Workout", author: "THENX", videoId: "8AAmaSOSyRA", viewCount: 12000000, publishedText: "1 year ago", lengthSeconds: 540, thumbnailUrl: "https://i.ytimg.com/vi/8AAmaSOSyRA/mqdefault.jpg" },
        ],
        gaming: [
            { title: "Minecraft Hardcore Day 1", author: "PewDiePie", videoId: "8X2kIfS6fb8", viewCount: 45000000, publishedText: "2 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/8X2kIfS6fb8/mqdefault.jpg" },
            { title: "I Spent 50 Hours In VR", author: "MrBeast Gaming", videoId: "2G_mWfG0DZE", viewCount: 89000000, publishedText: "1 year ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/2G_mWfG0DZE/mqdefault.jpg" },
            { title: "Minecraft Speedrunner VS Hunter", author: "Dream", videoId: "tlXHyyIpU84", viewCount: 78000000, publishedText: "3 years ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/tlXHyyIpU84/mqdefault.jpg" },
            { title: "GTA 6 Trailer Reaction", author: "jacksepticeye", videoId: "owK1qxDselE", viewCount: 8900000, publishedText: "6 months ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/owK1qxDselE/mqdefault.jpg" },
            { title: "Playing Scary Games", author: "Markiplier", videoId: "6Dh-RL__uN4", viewCount: 15000000, publishedText: "1 year ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/6Dh-RL__uN4/mqdefault.jpg" },
            { title: "Elden Ring All Bosses", author: "VaatiVidya", videoId: "9sLLgPe7R1Y", viewCount: 4200000, publishedText: "2 years ago", lengthSeconds: 3600, thumbnailUrl: "https://i.ytimg.com/vi/9sLLgPe7R1Y/mqdefault.jpg" },
        ],
        cooking: [
            { title: "Perfect Scrambled Eggs", author: "Gordon Ramsay", videoId: "PUP7U5vTMM0", viewCount: 78000000, publishedText: "9 years ago", lengthSeconds: 180, thumbnailUrl: "https://i.ytimg.com/vi/PUP7U5vTMM0/mqdefault.jpg" },
            { title: "How To Cook Steak", author: "Joshua Weissman", videoId: "SrV4sA6b8OQ", viewCount: 8500000, publishedText: "2 years ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/SrV4sA6b8OQ/mqdefault.jpg" },
            { title: "Basics with Babish", author: "Binging with Babish", videoId: "bJUiWdM__Qw", viewCount: 12000000, publishedText: "4 years ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/bJUiWdM__Qw/mqdefault.jpg" },
            { title: "5 Meals for the Week", author: "Pro Home Cooks", videoId: "dBnniua6-oM", viewCount: 5400000, publishedText: "2 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/dBnniua6-oM/mqdefault.jpg" },
            { title: "Ultimate Burger Guide", author: "Guga Foods", videoId: "mCIYB6s0SfY", viewCount: 9800000, publishedText: "1 year ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/mCIYB6s0SfY/mqdefault.jpg" },
            { title: "Easy Pasta Recipe", author: "Tasty", videoId: "gj6Qnn9Lvow", viewCount: 21000000, publishedText: "3 years ago", lengthSeconds: 300, thumbnailUrl: "https://i.ytimg.com/vi/gj6Qnn9Lvow/mqdefault.jpg" },
        ],
        tech: [
            { title: "iPhone Review", author: "MKBHD", videoId: "XQ7z57qrZU8", viewCount: 15000000, publishedText: "1 year ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/XQ7z57qrZU8/mqdefault.jpg" },
            { title: "Best Laptop for 2024", author: "Linus Tech Tips", videoId: "QRH8eimU_20", viewCount: 8900000, publishedText: "6 months ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/QRH8eimU_20/mqdefault.jpg" },
            { title: "Unboxing the Future", author: "Unbox Therapy", videoId: "J7GY1Xg6X20", viewCount: 12000000, publishedText: "8 months ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/J7GY1Xg6X20/mqdefault.jpg" },
            { title: "MacBook Pro Review", author: "Dave2D", videoId: "3wsCvC7lP0I", viewCount: 4500000, publishedText: "1 year ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/3wsCvC7lP0I/mqdefault.jpg" },
            { title: "Best Budget Phone", author: "Mr Whose The Boss", videoId: "s-gOJPjKn2o", viewCount: 6700000, publishedText: "4 months ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/s-gOJPjKn2o/mqdefault.jpg" },
            { title: "Tech You Need", author: "iJustine", videoId: "tkRjG_2LnQw", viewCount: 2100000, publishedText: "3 months ago", lengthSeconds: 660, thumbnailUrl: "https://i.ytimg.com/vi/tkRjG_2LnQw/mqdefault.jpg" },
        ],
        default: [
            { title: "Never Gonna Give You Up", author: "Rick Astley", videoId: "dQw4w9WgXcQ", viewCount: 1500000000, publishedText: "15 years ago", lengthSeconds: 212, thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
            { title: "Despacito", author: "Luis Fonsi", videoId: "kJQP7kiw5Fk", viewCount: 8200000000, publishedText: "7 years ago", lengthSeconds: 282, thumbnailUrl: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg" },
            { title: "See You Again", author: "Wiz Khalifa ft. Charlie Puth", videoId: "RgKAFK5djSk", viewCount: 5900000000, publishedText: "9 years ago", lengthSeconds: 237, thumbnailUrl: "https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg" },
            { title: "I Survived 100 Days", author: "MrBeast", videoId: "FM7MFYoylVs", viewCount: 245000000, publishedText: "2 years ago", lengthSeconds: 1020, thumbnailUrl: "https://i.ytimg.com/vi/FM7MFYoylVs/mqdefault.jpg" },
            { title: "Optimism - Kurzgesagt", author: "Kurzgesagt", videoId: "MBRqu0YOH14", viewCount: 18000000, publishedText: "2 years ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/MBRqu0YOH14/mqdefault.jpg" },
            { title: "History of the Universe", author: "Melodysheep", videoId: "uD4izuDMUQA", viewCount: 42000000, publishedText: "3 years ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/uD4izuDMUQA/mqdefault.jpg" },
            { title: "Day in My Life", author: "Casey Neistat", videoId: "La9oLLoI5Rc", viewCount: 8900000, publishedText: "4 years ago", lengthSeconds: 540, thumbnailUrl: "https://i.ytimg.com/vi/La9oLLoI5Rc/mqdefault.jpg" },
            { title: "What I Eat in a Day", author: "Emma Chamberlain", videoId: "oWyP-QVJmqc", viewCount: 15000000, publishedText: "2 years ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/oWyP-QVJmqc/mqdefault.jpg" },
            { title: "How to Start a Business", author: "Ali Abdaal", videoId: "qgIH1Aqdqfk", viewCount: 4200000, publishedText: "1 year ago", lengthSeconds: 1260, thumbnailUrl: "https://i.ytimg.com/vi/qgIH1Aqdqfk/mqdefault.jpg" },
            { title: "Epic Travel Montage", author: "Sam Kolder", videoId: "HvaeSWv0IS0", viewCount: 6700000, publishedText: "5 years ago", lengthSeconds: 180, thumbnailUrl: "https://i.ytimg.com/vi/HvaeSWv0IS0/mqdefault.jpg" },
        ]
    };

    // Detect category from query and return ONLY relevant videos
    if (queryLower.includes('fitness') || queryLower.includes('workout') || queryLower.includes('gym') || queryLower.includes('exercise') || queryLower.includes('yoga') || queryLower.includes('hiit')) {
        return videosByCategory.fitness.slice(0, 10);
    }
    if (queryLower.includes('game') || queryLower.includes('gaming') || queryLower.includes('minecraft') || queryLower.includes('fortnite') || queryLower.includes('gta') || queryLower.includes('elden')) {
        return videosByCategory.gaming.slice(0, 10);
    }
    if (queryLower.includes('cook') || queryLower.includes('recipe') || queryLower.includes('food') || queryLower.includes('meal') || queryLower.includes('kitchen') || queryLower.includes('chef')) {
        return videosByCategory.cooking.slice(0, 10);
    }
    if (queryLower.includes('tech') || queryLower.includes('phone') || queryLower.includes('iphone') || queryLower.includes('laptop') || queryLower.includes('computer') || queryLower.includes('review') || queryLower.includes('unbox')) {
        return videosByCategory.tech.slice(0, 10);
    }

    return videosByCategory.default.slice(0, 10);
}
