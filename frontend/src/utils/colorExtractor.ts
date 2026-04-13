/**
 * colorExtractor.ts
 *
 * Extracts dominant colors from images for particle generation.
 */

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
  palette: string[];
}

/**
 * Convert an image URL to a data URL to avoid CORS issues with canvas
 */
async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Extract dominant colors from an image using canvas sampling.
 */
export async function extractColorsFromImage(
  imageSource: string | File
): Promise<ExtractedColors> {
  // Convert URL to data URL to avoid CORS canvas taint issues
  let imageSrc: string;

  if (typeof imageSource === 'string') {
    // If it's a URL (not already a data URL), fetch and convert
    if (imageSource.startsWith('http')) {
      console.log('Converting URL to data URL to avoid CORS...');
      try {
        imageSrc = await urlToDataUrl(imageSource);
        console.log('Converted to data URL');
      } catch (error) {
        console.error('Failed to fetch image, using fallback colors:', error);
        // Return vibrant fallback colors based on the URL hash
        return generateFallbackColors(imageSource);
      }
    } else {
      imageSrc = imageSource;
    }
  } else {
    // File - convert to data URL
    imageSrc = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Sample at reasonable resolution
        const sampleSize = 100;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        let imageData: ImageData;
        try {
          imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        } catch (e) {
          console.error('Canvas tainted, using fallback colors:', e);
          resolve(generateFallbackColors(imageSrc));
          return;
        }

        const pixels = imageData.data;

        // Collect color samples
        const colorMap = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.round(pixels[i] / 32) * 32;
          const g = Math.round(pixels[i + 1] / 32) * 32;
          const b = Math.round(pixels[i + 2] / 32) * 32;

          // Skip very dark or very light colors
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 240) continue;

          const key = `${r},${g},${b}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key]) => {
            const [r, g, b] = key.split(',').map(Number);
            return rgbToHex(r, g, b);
          });

        // Ensure we have enough colors
        if (sortedColors.length < 3) {
          console.log('Not enough colors extracted, using vibrant defaults');
          resolve(generateFallbackColors(imageSrc));
          return;
        }

        // Pick diverse colors for primary, secondary, accent
        const primary = sortedColors[0];
        const secondary = sortedColors[1];
        const accent = sortedColors[2];

        console.log('Extracted colors:', { primary, secondary, accent });

        resolve({
          primary,
          secondary,
          accent,
          palette: sortedColors,
        });
      } catch (error) {
        console.error('Color extraction failed:', error);
        resolve(generateFallbackColors(imageSrc));
      }
    };

    img.onerror = () => {
      console.error('Failed to load image');
      resolve(generateFallbackColors(imageSrc));
    };

    img.src = imageSrc;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate fallback colors based on a seed string (deterministic but varied)
 */
function generateFallbackColors(seed: string): ExtractedColors {
  // Hash the seed to get a number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  // Generate vibrant colors using the hash
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 120) % 360; // Complementary
  const hue3 = (hue1 + 240) % 360; // Triadic

  const primary = hslToHex(hue1, 80, 55);
  const secondary = hslToHex(hue2, 75, 50);
  const accent = hslToHex(hue3, 85, 60);

  console.log('Using generated fallback colors:', { primary, secondary, accent });

  return {
    primary,
    secondary,
    accent,
    palette: [primary, secondary, accent],
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return rgbToHex(r, g, b);
}

// Gemini API key storage
const GEMINI_KEY_STORAGE = '3dme_gemini_key';

export function getGeminiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_KEY_STORAGE);
}

export function setGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_KEY_STORAGE, key);
}

export function hasGeminiKey(): boolean {
  return !!getGeminiKey();
}

/**
 * Generate an image from text using Pollinations.ai (free, no API key needed)
 */
export async function generateImageFromText(prompt: string): Promise<string> {
  // Pollinations.ai provides free image generation
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&nologo=true`;

  console.log('Generating image from Pollinations.ai:', imageUrl);

  // Pre-load the image to ensure it's generated
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      console.log('Image generated successfully');
      resolve(imageUrl);
    };

    img.onerror = () => {
      console.error('Failed to generate image from Pollinations');
      reject(new Error('Failed to generate image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Generate an image from text using Google Gemini 3 (Nano Banana Pro)
 * Uses the generateContent API with image generation capability
 */
export async function generateImageWithGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not set');
  }

  console.log('Generating image with Nano Banana Pro (Gemini 3)...');

  // Use Gemini 3 Pro Image (Nano Banana Pro)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a high-quality image of: ${prompt}. Make it detailed, colorful, and suitable for 3D conversion.`
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini image generation failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('Gemini response:', JSON.stringify(data, null, 2));

  // Extract image from response - handle multiple response formats
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    console.error('No candidates in response. Full response:', data);
    throw new Error('No response from Gemini');
  }

  const candidate = candidates[0];
  console.log('First candidate:', JSON.stringify(candidate, null, 2));

  // Check for content policy blocks or generation failures
  if (candidate.finishReason === 'IMAGE_OTHER' || candidate.finishReason === 'SAFETY') {
    const message = candidate.finishMessage || 'Image generation was blocked by content policy';
    console.warn('Gemini blocked image:', message);
    throw new Error(`Gemini couldn't generate this image. Try a different prompt (avoid celebrities, politicians, copyrighted characters).`);
  }

  if (candidate.finishReason === 'RECITATION') {
    throw new Error('Prompt too similar to copyrighted content. Try rephrasing.');
  }

  // Try different response structures
  const parts = candidate?.content?.parts || candidate?.parts || [];

  if (!parts || parts.length === 0) {
    console.error('No parts found. Candidate structure:', candidate);
    throw new Error(`No image generated. Reason: ${candidate.finishReason || 'unknown'}`);
  }

  // Find the image part
  for (const part of parts) {
    console.log('Checking part:', Object.keys(part));

    // Standard inlineData format
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      const base64Image = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      console.log('Gemini image generated successfully');
      return dataUrl;
    }

    // Alternative: direct image data
    if (part.image?.data) {
      const dataUrl = `data:image/png;base64,${part.image.data}`;
      console.log('Gemini image generated (alt format)');
      return dataUrl;
    }

    // Alternative: file data
    if (part.fileData?.mimeType?.startsWith('image/')) {
      console.log('Image available as file:', part.fileData);
    }
  }

  console.error('No image found in parts:', parts);
  throw new Error('No image in Gemini response');
}
