'use client';

import { useState, useEffect } from 'react';
import { YouTubeVideo, validateVideosServerSide, THUMBNAIL_CONFIG } from '@/lib/youtube';

interface UseValidatedThumbnailsResult {
    validatedVideos: YouTubeVideo[];
    isValidating: boolean;
}

/**
 * Hook to validate YouTube thumbnails using server-side oEmbed validation
 * This provides more reliable thumbnail validation than client-side image loading
 */
export function useValidatedThumbnails(videos: YouTubeVideo[]): UseValidatedThumbnailsResult {
    const [validatedVideos, setValidatedVideos] = useState<YouTubeVideo[]>([]);
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function validate() {
            if (videos.length === 0) {
                setIsValidating(false);
                setValidatedVideos([]);
                return;
            }

            setIsValidating(true);

            try {
                // Use server-side oEmbed validation for reliable thumbnail checking
                const validated = await validateVideosServerSide(videos);

                if (isMounted) {
                    // Take up to TARGET_DISPLAY_COUNT validated videos
                    const finalVideos = validated.slice(0, THUMBNAIL_CONFIG.TARGET_DISPLAY_COUNT);

                    // If server validation returns empty, fall back to original videos
                    // (better to show potentially broken than nothing)
                    if (finalVideos.length === 0 && videos.length > 0) {
                        console.warn('Server validation returned no valid videos, using originals');
                        setValidatedVideos(videos.slice(0, THUMBNAIL_CONFIG.MIN_DISPLAY_COUNT));
                    } else {
                        setValidatedVideos(finalVideos);
                    }
                }
            } catch (err) {
                console.error('Thumbnail validation failed:', err);
                if (isMounted) {
                    // Fall back to unvalidated videos if validation fails
                    setValidatedVideos(videos.slice(0, THUMBNAIL_CONFIG.MIN_DISPLAY_COUNT));
                }
            } finally {
                if (isMounted) {
                    setIsValidating(false);
                }
            }
        }

        validate();

        return () => {
            isMounted = false;
        };
    }, [videos]);

    return { validatedVideos, isValidating };
}
