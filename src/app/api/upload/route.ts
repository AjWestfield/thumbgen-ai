import { NextRequest, NextResponse } from 'next/server';

// Free image hosting via imgbb.com (more permissive for API access)
const IMGBB_API_KEY = '44d57878fd28d6978f53e5671ba67056';

interface UploadResponse {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No image provided' },
                { status: 400 }
            );
        }

        // Convert file to base64 for imgbb
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Upload to imgbb.com
        const uploadFormData = new FormData();
        uploadFormData.append('image', base64);
        uploadFormData.append('key', IMGBB_API_KEY);

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: uploadFormData,
        });

        const result = await response.json();

        if (!result.success) {
            console.error('imgbb upload failed:', result);
            return NextResponse.json(
                { success: false, error: result.error?.message || 'Failed to upload image' },
                { status: 500 }
            );
        }

        // Get the direct image URL
        const imageUrl = result.data?.url;
        console.log('Image uploaded to imgbb:', imageUrl);

        return NextResponse.json({
            success: true,
            imageUrl,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
