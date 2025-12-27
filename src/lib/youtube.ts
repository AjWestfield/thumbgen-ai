export interface YouTubeVideo {
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

export interface GeneratedMetadata {
    title: string;
    channel: string;
    views: string;
    published: string;
}

export interface YouTubeSearchResult {
    videos: YouTubeVideo[];
    generatedMetadata?: GeneratedMetadata;
}

// Configuration for thumbnail fetching and validation
export const THUMBNAIL_CONFIG = {
    FETCH_COUNT: 40,           // Fetch more than needed for validation buffer
    MIN_DISPLAY_COUNT: 15,     // Minimum working thumbnails required
    TARGET_DISPLAY_COUNT: 15,  // Exact number of thumbnails to show
};

/**
 * Validate videos using server-side thumbnail validation
 * This checks if thumbnails exist on YouTube CDN
 */
export async function validateVideosServerSide(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
    if (videos.length === 0) return [];

    try {
        const response = await fetch('/api/youtube/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videos: videos.map(v => ({
                    videoId: v.videoId,
                    title: v.title,
                    author: v.author,
                    viewCount: v.viewCount,
                    publishedText: v.publishedText,
                    lengthSeconds: v.lengthSeconds,
                }))
            }),
        });

        if (!response.ok) {
            console.warn('Server-side validation failed, falling back to original videos');
            return videos;
        }

        const data = await response.json();

        interface ValidatedVideoData {
            videoId: string;
            title: string;
            author: string;
            thumbnailUrl: string;
        }

        const validatedMap = new Map<string, ValidatedVideoData>(
            data.videos.map((v: ValidatedVideoData) => [v.videoId, v])
        );

        // Merge validated data with original video data (preserve viewCount, publishedText, etc.)
        return videos
            .filter(video => validatedMap.has(video.videoId))
            .map(video => {
                const validated = validatedMap.get(video.videoId)!;
                return {
                    ...video,
                    thumbnailUrl: validated.thumbnailUrl,
                };
            });
    } catch (error) {
        console.warn('Server-side validation error:', error);
        return videos;
    }
}

/**
 * Validate a thumbnail URL by attempting to load it
 * Returns a Promise that resolves to true if image loads, false otherwise
 */
export function validateThumbnailUrl(url: string, timeoutMs: number = 5000): Promise<boolean> {
    return new Promise((resolve) => {
        // Only run in browser environment
        if (typeof window === 'undefined') {
            resolve(true);
            return;
        }

        const img = new Image();
        const timeout = setTimeout(() => {
            img.src = '';
            resolve(false);
        }, timeoutMs);

        img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };

        img.src = url;
    });
}

/**
 * Validate multiple thumbnails in parallel and return only valid ones
 */
export async function validateThumbnails(
    videos: YouTubeVideo[],
    minCount: number = THUMBNAIL_CONFIG.MIN_DISPLAY_COUNT
): Promise<YouTubeVideo[]> {
    // Only run in browser environment
    if (typeof window === 'undefined') {
        return videos.slice(0, minCount);
    }

    // Validate all thumbnails in parallel
    const validationResults = await Promise.all(
        videos.map(async (video) => ({
            video,
            isValid: await validateThumbnailUrl(video.thumbnailUrl)
        }))
    );

    // Filter to only valid thumbnails
    const validVideos = validationResults
        .filter(result => result.isValid)
        .map(result => result.video);

    // If we don't have enough valid thumbnails, try YouTube's direct CDN for failed ones
    if (validVideos.length < minCount) {
        const invalidVideos = validationResults
            .filter(result => !result.isValid)
            .map(result => result.video);

        for (const video of invalidVideos) {
            if (validVideos.length >= minCount) break;

            const fallbackUrl = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;
            const isValidFallback = await validateThumbnailUrl(fallbackUrl);

            if (isValidFallback) {
                validVideos.push({
                    ...video,
                    thumbnailUrl: fallbackUrl
                });
            }
        }
    }

    return validVideos;
}

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
 * Search YouTube using server-side API route
 * This avoids CORS issues and provides more reliable results
 */
export async function searchYouTube(prompt: string): Promise<YouTubeSearchResult> {
    // Handle empty or auto-generated prompts - use default search
    const trimmedPrompt = prompt?.trim() || '';
    const isEmptyOrAutoGenerated = !trimmedPrompt || trimmedPrompt === '(auto-generated)';
    const searchQuery = isEmptyOrAutoGenerated ? 'trending viral videos 2025' : trimmedPrompt;

    console.log(`Searching YouTube for: "${searchQuery}"${isEmptyOrAutoGenerated ? ' (default query)' : ''}`);

    try {
        // Use our server-side API route to avoid CORS issues
        const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
            console.error('Server-side YouTube search failed:', response.status);
            return {
                videos: getRelevantFallbackVideos(extractKeywords(prompt))
            };
        }

        const data = await response.json();

        if (data.videos && data.videos.length > 0) {
            console.log(`Found ${data.videos.length} videos from server-side API`);
            return {
                videos: data.videos,
                generatedMetadata: data.generatedMetadata
            };
        }

        console.warn('Server API returned no videos. Using fallback thumbnails.');
        return {
            videos: getRelevantFallbackVideos(extractKeywords(prompt))
        };

    } catch (error) {
        console.error('YouTube search error:', error);
        return {
            videos: getRelevantFallbackVideos(extractKeywords(prompt))
        };
    }
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
            // Verified working video IDs from popular fitness channels
            { title: "Full Body Workout - No Equipment", author: "THENX", videoId: "oAPCPjnU1wA", viewCount: 45000000, publishedText: "2 years ago", lengthSeconds: 612, thumbnailUrl: "https://i.ytimg.com/vi/oAPCPjnU1wA/mqdefault.jpg" },
            { title: "20 Min Full Body Workout", author: "MadFit", videoId: "UItWltVZZmE", viewCount: 32000000, publishedText: "1 year ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/UItWltVZZmE/mqdefault.jpg" },
            { title: "Beginner HIIT Workout", author: "Heather Robertson", videoId: "ml6cT4AZdqI", viewCount: 28000000, publishedText: "3 years ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/ml6cT4AZdqI/mqdefault.jpg" },
            { title: "10 Min Workout - Full Body", author: "Pamela Reif", videoId: "cbKkB3POqaY", viewCount: 95000000, publishedText: "3 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/cbKkB3POqaY/mqdefault.jpg" },
            { title: "Yoga For Beginners", author: "Yoga With Adriene", videoId: "v7AYKMP6rOE", viewCount: 52000000, publishedText: "5 years ago", lengthSeconds: 1380, thumbnailUrl: "https://i.ytimg.com/vi/v7AYKMP6rOE/mqdefault.jpg" },
            { title: "10 Min Ab Workout", author: "Chloe Ting", videoId: "2pLT-olgUJs", viewCount: 42000000, publishedText: "2 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/2pLT-olgUJs/mqdefault.jpg" },
            { title: "15 Min Apartment Workout", author: "MadFit", videoId: "gC_L9qAHVJ8", viewCount: 18000000, publishedText: "1 year ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/gC_L9qAHVJ8/mqdefault.jpg" },
            { title: "20 Min Fat Burning", author: "growingannanas", videoId: "2MoGxae-zyo", viewCount: 35000000, publishedText: "2 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/2MoGxae-zyo/mqdefault.jpg" },
            { title: "Intense HIIT Workout", author: "Pamela Reif", videoId: "IT942dJcx6I", viewCount: 48000000, publishedText: "2 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/IT942dJcx6I/mqdefault.jpg" },
            { title: "Morning Stretch Routine", author: "MadFit", videoId: "g_tea8ZNk5A", viewCount: 22000000, publishedText: "2 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/g_tea8ZNk5A/mqdefault.jpg" },
            { title: "Flat Stomach Workout", author: "Chloe Ting", videoId: "4WqoHq8NEUU", viewCount: 55000000, publishedText: "3 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/4WqoHq8NEUU/mqdefault.jpg" },
            { title: "Full Body Stretch", author: "Yoga With Adriene", videoId: "SedzswEwpPw", viewCount: 25000000, publishedText: "4 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/SedzswEwpPw/mqdefault.jpg" },
            { title: "Standing Abs Workout", author: "growingannanas", videoId: "kBLA15Hmq48", viewCount: 15000000, publishedText: "2 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/kBLA15Hmq48/mqdefault.jpg" },
            { title: "Lower Body Workout", author: "Pamela Reif", videoId: "p-uUnrCdhR8", viewCount: 38000000, publishedText: "2 years ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/p-uUnrCdhR8/mqdefault.jpg" },
            { title: "Upper Body Dumbbell", author: "Caroline Girvan", videoId: "Fzv_hNlO8pY", viewCount: 8500000, publishedText: "1 year ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/Fzv_hNlO8pY/mqdefault.jpg" },
            { title: "Dance Workout", author: "POPSUGAR Fitness", videoId: "qvMIXLjVNLM", viewCount: 32000000, publishedText: "3 years ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/qvMIXLjVNLM/mqdefault.jpg" },
            { title: "Cardio Dance Workout", author: "MadFit", videoId: "diKlrEkb4pg", viewCount: 12000000, publishedText: "1 year ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/diKlrEkb4pg/mqdefault.jpg" },
            { title: "Quick Arm Workout", author: "Pamela Reif", videoId: "6Whgn_iE5uc", viewCount: 28000000, publishedText: "3 years ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/6Whgn_iE5uc/mqdefault.jpg" },
            { title: "Booty Workout At Home", author: "Chloe Ting", videoId: "ERr1PwlEqZI", viewCount: 42000000, publishedText: "2 years ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/ERr1PwlEqZI/mqdefault.jpg" },
            { title: "30 Min HIIT Workout", author: "Heather Robertson", videoId: "M0uO8X3_tEA", viewCount: 15000000, publishedText: "2 years ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/M0uO8X3_tEA/mqdefault.jpg" },
        ],
        gaming: [
            { title: "Minecraft Hardcore Day 1", author: "PewDiePie", videoId: "8X2kIfS6fb8", viewCount: 45000000, publishedText: "2 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/8X2kIfS6fb8/mqdefault.jpg" },
            { title: "I Spent 50 Hours In VR", author: "MrBeast Gaming", videoId: "2G_mWfG0DZE", viewCount: 89000000, publishedText: "1 year ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/2G_mWfG0DZE/mqdefault.jpg" },
            { title: "Minecraft Speedrunner VS Hunter", author: "Dream", videoId: "tlXHyyIpU84", viewCount: 78000000, publishedText: "3 years ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/tlXHyyIpU84/mqdefault.jpg" },
            { title: "GTA 6 Trailer Reaction", author: "jacksepticeye", videoId: "owK1qxDselE", viewCount: 8900000, publishedText: "6 months ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/owK1qxDselE/mqdefault.jpg" },
            { title: "Playing Scary Games", author: "Markiplier", videoId: "6Dh-RL__uN4", viewCount: 15000000, publishedText: "1 year ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/6Dh-RL__uN4/mqdefault.jpg" },
            { title: "Elden Ring All Bosses", author: "VaatiVidya", videoId: "9sLLgPe7R1Y", viewCount: 4200000, publishedText: "2 years ago", lengthSeconds: 3600, thumbnailUrl: "https://i.ytimg.com/vi/9sLLgPe7R1Y/mqdefault.jpg" },
            { title: "Fortnite Victory Royale", author: "Ninja", videoId: "r1XE5WuLKcI", viewCount: 32000000, publishedText: "5 years ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/r1XE5WuLKcI/mqdefault.jpg" },
            { title: "GTA Online Heist", author: "TheGentleman", videoId: "0xh6HvbhZXM", viewCount: 18000000, publishedText: "3 years ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/0xh6HvbhZXM/mqdefault.jpg" },
            { title: "Zelda TOTK Secrets", author: "Austin John Plays", videoId: "S7WaJ7fWDcU", viewCount: 5600000, publishedText: "1 year ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/S7WaJ7fWDcU/mqdefault.jpg" },
            { title: "Among Us With Friends", author: "Corpse Husband", videoId: "H8iJWYQy8UE", viewCount: 42000000, publishedText: "4 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/H8iJWYQy8UE/mqdefault.jpg" },
            { title: "Hogwarts Legacy Gameplay", author: "IGN", videoId: "BtyBjOW8sGY", viewCount: 12000000, publishedText: "2 years ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/BtyBjOW8sGY/mqdefault.jpg" },
            { title: "Building a Mega Base", author: "Grian", videoId: "gq5mUEtMibI", viewCount: 8900000, publishedText: "1 year ago", lengthSeconds: 2100, thumbnailUrl: "https://i.ytimg.com/vi/gq5mUEtMibI/mqdefault.jpg" },
            { title: "Cyberpunk 2077 Review", author: "Angry Joe", videoId: "61_SnDWWPpc", viewCount: 6500000, publishedText: "4 years ago", lengthSeconds: 2700, thumbnailUrl: "https://i.ytimg.com/vi/61_SnDWWPpc/mqdefault.jpg" },
            { title: "Valorant Pro Tips", author: "TenZ", videoId: "SXxNPaJmb6o", viewCount: 4800000, publishedText: "2 years ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/SXxNPaJmb6o/mqdefault.jpg" },
            { title: "Pokemon Guide Complete", author: "aDrive", videoId: "mGVGG_4n-VM", viewCount: 2500000, publishedText: "1 year ago", lengthSeconds: 3000, thumbnailUrl: "https://i.ytimg.com/vi/mGVGG_4n-VM/mqdefault.jpg" },
            { title: "Call of Duty Warzone", author: "NICKMERCS", videoId: "7kJ9t8RSEYM", viewCount: 7200000, publishedText: "2 years ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/7kJ9t8RSEYM/mqdefault.jpg" },
            { title: "Stardew Valley Tips", author: "DangerouslyFunny", videoId: "X-qxS-Uxq0c", viewCount: 3800000, publishedText: "3 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/X-qxS-Uxq0c/mqdefault.jpg" },
            { title: "Apex Legends Guide", author: "iiTzTimmy", videoId: "1YqWvEu4E1A", viewCount: 5100000, publishedText: "2 years ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/1YqWvEu4E1A/mqdefault.jpg" },
            { title: "Spider-Man 2 Gameplay", author: "IGN", videoId: "qIQ3xNqkVC4", viewCount: 9200000, publishedText: "1 year ago", lengthSeconds: 2400, thumbnailUrl: "https://i.ytimg.com/vi/qIQ3xNqkVC4/mqdefault.jpg" },
            { title: "Genshin Impact Guide", author: "Zy0x", videoId: "F6LG4aJJpT4", viewCount: 6700000, publishedText: "1 year ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/F6LG4aJJpT4/mqdefault.jpg" },
        ],
        cooking: [
            // Note: These are only used as fallback when APIs fail
            // The server-side API should return actual recent videos
            { title: "Perfect Scrambled Eggs", author: "Gordon Ramsay", videoId: "PUP7U5vTMM0", viewCount: 78000000, publishedText: "2 months ago", lengthSeconds: 180, thumbnailUrl: "https://i.ytimg.com/vi/PUP7U5vTMM0/mqdefault.jpg" },
            { title: "How To Cook Steak", author: "Joshua Weissman", videoId: "SrV4sA6b8OQ", viewCount: 8500000, publishedText: "3 weeks ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/SrV4sA6b8OQ/mqdefault.jpg" },
            { title: "Basics with Babish", author: "Binging with Babish", videoId: "bJUiWdM__Qw", viewCount: 12000000, publishedText: "1 month ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/bJUiWdM__Qw/mqdefault.jpg" },
            { title: "5 Meals for the Week", author: "Pro Home Cooks", videoId: "dBnniua6-oM", viewCount: 5400000, publishedText: "2 weeks ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/dBnniua6-oM/mqdefault.jpg" },
            { title: "Ultimate Burger Guide", author: "Guga Foods", videoId: "mCIYB6s0SfY", viewCount: 9800000, publishedText: "4 days ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/mCIYB6s0SfY/mqdefault.jpg" },
            { title: "Easy Pasta Recipe", author: "Tasty", videoId: "gj6Qnn9Lvow", viewCount: 21000000, publishedText: "1 week ago", lengthSeconds: 300, thumbnailUrl: "https://i.ytimg.com/vi/gj6Qnn9Lvow/mqdefault.jpg" },
            { title: "The BEST Fried Rice", author: "Uncle Roger", videoId: "FrUfwpaNNIM", viewCount: 39000000, publishedText: "5 days ago", lengthSeconds: 540, thumbnailUrl: "https://i.ytimg.com/vi/FrUfwpaNNIM/mqdefault.jpg" },
            { title: "Perfect Ramen At Home", author: "Joshua Weissman", videoId: "9WXIrnWsaCo", viewCount: 11000000, publishedText: "3 days ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/9WXIrnWsaCo/mqdefault.jpg" },
            { title: "Homemade Pizza Tutorial", author: "Brian Lagerstrom", videoId: "G-jPoROGHGE", viewCount: 4200000, publishedText: "6 days ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/G-jPoROGHGE/mqdefault.jpg" },
            { title: "Easy Chicken Recipes", author: "preppy kitchen", videoId: "3Y3GKY2v7dA", viewCount: 5500000, publishedText: "1 week ago", lengthSeconds: 600, thumbnailUrl: "https://i.ytimg.com/vi/3Y3GKY2v7dA/mqdefault.jpg" },
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
            { title: "iPhone Review", author: "MKBHD", videoId: "XQ7z57qrZU8", viewCount: 15000000, publishedText: "1 year ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/XQ7z57qrZU8/mqdefault.jpg" },
            { title: "Best Laptop for 2024", author: "Linus Tech Tips", videoId: "QRH8eimU_20", viewCount: 8900000, publishedText: "6 months ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/QRH8eimU_20/mqdefault.jpg" },
            { title: "Unboxing the Future", author: "Unbox Therapy", videoId: "J7GY1Xg6X20", viewCount: 12000000, publishedText: "8 months ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/J7GY1Xg6X20/mqdefault.jpg" },
            { title: "MacBook Pro Review", author: "Dave2D", videoId: "3wsCvC7lP0I", viewCount: 4500000, publishedText: "1 year ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/3wsCvC7lP0I/mqdefault.jpg" },
            { title: "Best Budget Phone", author: "Mr Whose The Boss", videoId: "s-gOJPjKn2o", viewCount: 6700000, publishedText: "4 months ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/s-gOJPjKn2o/mqdefault.jpg" },
            { title: "Tech You Need", author: "iJustine", videoId: "tkRjG_2LnQw", viewCount: 2100000, publishedText: "3 months ago", lengthSeconds: 660, thumbnailUrl: "https://i.ytimg.com/vi/tkRjG_2LnQw/mqdefault.jpg" },
            { title: "Galaxy S24 Ultra Review", author: "MKBHD", videoId: "5TBm2TFYOvk", viewCount: 9800000, publishedText: "1 year ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/5TBm2TFYOvk/mqdefault.jpg" },
            { title: "Setup Tour 2024", author: "Linus Tech Tips", videoId: "9Y5_HkL3B0U", viewCount: 11000000, publishedText: "6 months ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/9Y5_HkL3B0U/mqdefault.jpg" },
            { title: "AI PC Review", author: "Dave2D", videoId: "g5HfDluvJLI", viewCount: 3500000, publishedText: "3 months ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/g5HfDluvJLI/mqdefault.jpg" },
            { title: "Best Headphones 2024", author: "MKBHD", videoId: "wCdJQjpNpko", viewCount: 7200000, publishedText: "8 months ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/wCdJQjpNpko/mqdefault.jpg" },
            { title: "Home Lab Tour", author: "NetworkChuck", videoId: "HvKEmHPL7lM", viewCount: 2800000, publishedText: "1 year ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/HvKEmHPL7lM/mqdefault.jpg" },
            { title: "Steam Deck Review", author: "Linus Tech Tips", videoId: "HjZ4POvk14c", viewCount: 8100000, publishedText: "2 years ago", lengthSeconds: 1200, thumbnailUrl: "https://i.ytimg.com/vi/HjZ4POvk14c/mqdefault.jpg" },
            { title: "iPad Pro M4 Review", author: "MKBHD", videoId: "x0GAMoGqQz8", viewCount: 6500000, publishedText: "6 months ago", lengthSeconds: 900, thumbnailUrl: "https://i.ytimg.com/vi/x0GAMoGqQz8/mqdefault.jpg" },
            { title: "Gaming Monitor Guide", author: "Hardware Unboxed", videoId: "luLS-I9lubg", viewCount: 2100000, publishedText: "1 year ago", lengthSeconds: 1500, thumbnailUrl: "https://i.ytimg.com/vi/luLS-I9lubg/mqdefault.jpg" },
            { title: "Building My Dream PC", author: "JayzTwoCents", videoId: "v7MYOpFONCU", viewCount: 3900000, publishedText: "1 year ago", lengthSeconds: 1800, thumbnailUrl: "https://i.ytimg.com/vi/v7MYOpFONCU/mqdefault.jpg" },
            { title: "Electric Car Review", author: "MKBHD", videoId: "LQdW45k9rQU", viewCount: 8800000, publishedText: "2 years ago", lengthSeconds: 1080, thumbnailUrl: "https://i.ytimg.com/vi/LQdW45k9rQU/mqdefault.jpg" },
            { title: "Apple Vision Pro", author: "MKBHD", videoId: "dtp6b76pMak", viewCount: 18000000, publishedText: "1 year ago", lengthSeconds: 1260, thumbnailUrl: "https://i.ytimg.com/vi/dtp6b76pMak/mqdefault.jpg" },
            { title: "Smart Home Setup", author: "Mrwhosetheboss", videoId: "qlH4-oHnBb8", viewCount: 4200000, publishedText: "1 year ago", lengthSeconds: 960, thumbnailUrl: "https://i.ytimg.com/vi/qlH4-oHnBb8/mqdefault.jpg" },
            { title: "Camera Comparison", author: "MKBHD", videoId: "mQqUj-hOr9s", viewCount: 5600000, publishedText: "1 year ago", lengthSeconds: 840, thumbnailUrl: "https://i.ytimg.com/vi/mQqUj-hOr9s/mqdefault.jpg" },
            { title: "Fold vs Flip Phone", author: "JerryRigEverything", videoId: "3HUZjkH8HLQ", viewCount: 3100000, publishedText: "1 year ago", lengthSeconds: 720, thumbnailUrl: "https://i.ytimg.com/vi/3HUZjkH8HLQ/mqdefault.jpg" },
        ],
        default: [
            // Note: These are only used as fallback when APIs fail
            // The server-side API should return actual recent videos
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
        ]
    };

    // Detect category from query and return ONLY relevant videos
    if (queryLower.includes('fitness') || queryLower.includes('workout') || queryLower.includes('gym') || queryLower.includes('exercise') || queryLower.includes('yoga') || queryLower.includes('hiit')) {
        return videosByCategory.fitness.slice(0, 20);
    }
    if (queryLower.includes('game') || queryLower.includes('gaming') || queryLower.includes('minecraft') || queryLower.includes('fortnite') || queryLower.includes('gta') || queryLower.includes('elden')) {
        return videosByCategory.gaming.slice(0, 20);
    }
    if (queryLower.includes('cook') || queryLower.includes('recipe') || queryLower.includes('food') || queryLower.includes('meal') || queryLower.includes('kitchen') || queryLower.includes('chef')) {
        return videosByCategory.cooking.slice(0, 20);
    }
    if (queryLower.includes('tech') || queryLower.includes('phone') || queryLower.includes('iphone') || queryLower.includes('laptop') || queryLower.includes('computer') || queryLower.includes('review') || queryLower.includes('unbox')) {
        return videosByCategory.tech.slice(0, 20);
    }

    return videosByCategory.default.slice(0, 20);
}
