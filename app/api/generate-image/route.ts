import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    // Convert the prompt to URL-safe format
    const urlSafePrompt = encodeURIComponent(prompt.replace(/\s+/g, '_').toLowerCase());
    
    // Using the direct image URL structure
    const imageUrl = `https://pollinations.ai/p/${urlSafePrompt}`;

    // First check if the URL is accessible
    const checkResponse = await fetch(imageUrl, { method: 'HEAD' });
    if (!checkResponse.ok) {
      throw new Error(`Failed to generate image: ${checkResponse.status}`);
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
} 