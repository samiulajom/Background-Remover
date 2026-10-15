import { removeBackground, Config } from '@imgly/background-removal';

export interface RemovalProgress {
  step: string;
  percent: number;
}

export type ProgressCallback = (progress: RemovalProgress) => void;

/**
 * Executes client-side AI background removal using @imgly/background-removal.
 * Runs completely in the browser via WebAssembly & ONNX Runtime (100% Free, zero cloud cost).
 */
export async function executeBackgroundRemoval(
  imageSource: Blob | File | string,
  model: 'medium' | 'small' | 'large' = 'medium',
  onProgress?: ProgressCallback
): Promise<Blob> {
  let currentPercent = 10;
  onProgress?.({ step: 'Initializing AI Engine...', percent: currentPercent });

  const modelMap: Record<'medium' | 'small' | 'large', 'isnet_fp16' | 'isnet_quint8' | 'isnet'> = {
    medium: 'isnet_fp16',
    small: 'isnet_quint8',
    large: 'isnet'
  };

  const config: Config = {
    model: modelMap[model],
    device: 'cpu', // wide compatibility across all devices (mobile, tablet, desktop)
    rescale: true,
    progress: (key: string, current: number, total: number) => {
      let stepName = 'Processing...';
      let percent = currentPercent;

      if (key.includes('fetch') || key.includes('download')) {
        stepName = 'Downloading AI neural weights...';
        const fraction = total > 0 ? Math.min(1, current / total) : 0.5;
        percent = Math.round(15 + fraction * 45); // 15% -> 60%
      } else if (key.includes('decode')) {
        stepName = 'Decoding image tensor...';
        percent = 65;
      } else if (key.includes('inference')) {
        stepName = 'Executing AI subject segmentation...';
        percent = 80;
      } else if (key.includes('mask') || key.includes('encode')) {
        stepName = 'Refining alpha edges & creating cutout...';
        percent = 92;
      } else {
        stepName = `Processing (${key})...`;
        percent = Math.min(95, currentPercent + 5);
      }

      currentPercent = Math.max(currentPercent, percent);
      onProgress?.({ step: stepName, percent: currentPercent });
    }
  };

  try {
    const resultBlob = await removeBackground(imageSource, config);
    onProgress?.({ step: 'Complete!', percent: 100 });
    return resultBlob;
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Background removal error:', err);

    // If medium failed due to memory or wasm, try once with 'small' if it wasn't already small
    if (model !== 'small') {
      try {
        onProgress?.({ step: 'Retrying with lightweight AI model...', percent: 20 });
        const fallbackBlob = await removeBackground(imageSource, {
          ...config,
          model: 'isnet_quint8'
        });
        onProgress?.({ step: 'Complete!', percent: 100 });
        return fallbackBlob;
      } catch (fallbackError) {
        console.error('Fallback failed too:', fallbackError);
      }
    }

    throw new Error(
      err?.message || 'Failed to remove background. Please check your internet connection for initial model download.'
    );
  }
}
