import { useState, useEffect, useCallback } from 'react';
import { usePollinationsImage } from '@pollinations/react';
import PaintRollerAnimation from "@/components/paint-roller-animation";

interface ImageGeneratorProps {
  prompt: string;
  shouldGenerate: boolean;
  onImageGenerated: (imageUrl: string) => void;
}

export default function ImageGenerator({ prompt, shouldGenerate, onImageGenerated }: ImageGeneratorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Use the official Pollinations hook with the prompt directly
  const imageUrl = usePollinationsImage(shouldGenerate && !hasGenerated ? prompt : "", {
    width: 1024,
    height: 1024,
    seed: Math.floor(Math.random() * 999999),
    model: 'flux',
    nologo: true,
    enhance: true
  });

  // Memoize the image verification callback
  const verifyAndNotifyImage = useCallback(async (url: string) => {
    if (!url || hasGenerated) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      onImageGenerated(url);
      setHasGenerated(true);
    } catch (err) {
      setError('Failed to load generated image');
    } finally {
      setIsGenerating(false);
    }
  }, [onImageGenerated, hasGenerated]);

  // Handle image URL changes
  useEffect(() => {
    if (imageUrl && shouldGenerate && !hasGenerated) {
      verifyAndNotifyImage(imageUrl);
    }
  }, [imageUrl, shouldGenerate, verifyAndNotifyImage, hasGenerated]);

  // Reset generation state when prompt changes
  useEffect(() => {
    if (prompt) {
      setHasGenerated(false);
    }
  }, [prompt]);

  return (
    <div className="relative w-full h-64">
      {isGenerating && !error && (
        <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
          <PaintRollerAnimation />
          <p className="text-gray-500">Generating image...</p>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center">
          {error}
        </div>
      )}
    </div>
  );
} 