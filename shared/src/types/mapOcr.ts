export interface OcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrDetectedRoom {
  id: string;
  label: string; // e.g., "1", "12B", "Cripta", "Armory"
  rawText: string;
  confidence: number; // 0 to 100
  labelCenter: { x: number; y: number };
  labelBbox: OcrBoundingBox;
  suggestedZone: {
    type: 'rect' | 'ellipse' | 'polygon';
    x: number;
    y: number;
    w: number;
    h: number;
    points?: number[];
    title: string;
    desc?: string;
    category?: 'room' | 'corridor' | 'hazard' | 'secret' | 'treasure';
  };
  suggestedMarker: {
    x: number;
    y: number;
    text: string;
    iconType: 'pin' | 'sword' | 'chest' | 'skull' | 'jewel';
    color: string;
  };
  isApproved: boolean;
  isRejected: boolean;
}

export interface MapOcrPipelineConfig {
  language: 'eng' | 'por' | 'osd';
  whitelist: string;
  psm: number;
  targetDpi: number;
  preprocessing: {
    grayscale: boolean;
    contrast: number; // 1.0 = normal, 1.5 - 2.5 typical for maps
    brightness: number;
    binarizationMethod: 'otsu' | 'adaptive' | 'fixed' | 'none';
    thresholdCutoff: number; // 0-255
    invertLuminance: boolean;
    denoise: boolean;
    upscaleMultiplier: number; // e.g. 1.5 - 2.0 for low-res room numbers
  };
  detectionFilter: {
    minConfidence: number;
    patternRegex?: string;
    minBoxDimension: number;
    maxBoxDimension: number;
  };
  zoningStrategy: {
    method: 'grid_snap' | 'fixed_padding' | 'flood_fill_walls';
    paddingPx: number;
    snapToGrid: boolean;
    gridCellSize: number;
    defaultStyle: {
      borderColor: string;
      fillColor: string;
      textColor: string;
    };
    autoCreateMarker: boolean;
    markerIconType: 'pin' | 'sword' | 'chest' | 'skull' | 'jewel';
  };
}

export interface MapOcrPipelineProgress {
  stage:
    | 'idle'
    | 'preprocessing'
    | 'ocr_running'
    | 'post_processing'
    | 'room_detection'
    | 'completed'
    | 'error';
  percentage: number; // 0 - 100
  message: string;
  elapsedMs: number;
  error?: string;
}

export interface MapOcrPipelineResult {
  success: boolean;
  detectedRooms: OcrDetectedRoom[];
  stats: {
    totalFound: number;
    filteredOut: number;
    approvedCount: number;
    processingTimeMs: number;
    imageWidth: number;
    imageHeight: number;
  };
  debugImageUrls?: {
    preprocessed?: string;
    thresholded?: string;
    annotatedBoxes?: string;
  };
}

// Web Worker Communication Messages
export type MapOcrWorkerRequest =
  | {
      type: 'PROCESS_MAP';
      payload: {
        imageData: ImageData | string; // Base64 or ImageData
        config: MapOcrPipelineConfig;
      };
    }
  | {
      type: 'ABORT_PROCESS';
    };

export type MapOcrWorkerResponse =
  | {
      type: 'OCR_PROGRESS';
      payload: MapOcrPipelineProgress;
    }
  | {
      type: 'OCR_SUCCESS';
      payload: MapOcrPipelineResult;
    }
  | {
      type: 'OCR_FAILURE';
      payload: { error: string };
    };
