// Base API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// File types
export interface FileInfo {
  file_id: string;
  original_name: string;
  file_type: 'image' | 'video';
  file_size: number;
  mime_type: string;
  thumbnail_path?: string;
}

export interface FileUploadData {
  file_id: string;
  original_name: string;
  file_type: 'image' | 'video';
  file_size: number;
  mime_type: string;
  thumbnail_path?: string;
}

// Face detection types
export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
}

export interface FaceInfo {
  face_id: number;
  bbox: BoundingBox;
  confidence: number;
  quality_score: number;
  quality_label: 'excellent' | 'good' | 'fair' | 'poor';
  landmarks?: number[][];
  embedding?: number[];
  age?: number;
  gender?: string;
  face_area: number;
  frame_number?: number;
  timestamp?: number;
}

export interface FaceDetectionResponse {
  file_id: string;
  file_type: 'image' | 'video';
  total_faces: number;
  faces: FaceInfo[];
  best_face?: FaceInfo;
  confidence_threshold: number;
  min_quality: number;
}

// Job types
export interface JobInfo {
  id: string;
  original_filename: string;
  file_type: 'image' | 'video';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  source_face_coords?: BoundingBox;
  target_face_coords?: BoundingBox;
  created_at: string;
  updated_at: string;
  error_message?: string;
  result_file?: FileInfo;
  source_file?: FileInfo;
  target_file?: FileInfo;
}

export interface FaceSwapRequest {
  source_file_id: string;
  target_file_id: string;
  source_face_coords?: BoundingBox;
  target_face_coords?: BoundingBox;
  model?: string;
}

export interface FaceSwapResponse {
  job_id: string;
  status: string;
  file_type: 'image' | 'video';
  estimated_time: string;
}

export interface SwapFacesSyncResponse {
  job_id: null;
  result_file_id: string;
  file_type: 'image' | 'video';
}

// Store types
export interface AppState {
  darkMode: boolean;
  uploadedFiles: FileInfo[];
  selectedSourceFile: FileInfo | null;
  selectedTargetFile: FileInfo | null;
  detectedSourceFaces: FaceInfo[];
  detectedTargetFaces: FaceInfo[];
  selectedSourceFace: FaceInfo | null;
  selectedTargetFace: FaceInfo | null;
  currentJob: JobInfo | null;
  isProcessing: boolean;
}

// Component prop types
export interface FaceSwapUploaderProps {
  onFileSelect: (file: File) => void;
  onUploadComplete: (fileData: FileUploadData) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  disabled?: boolean;
  title?: string;
  description?: string;
}

export interface FaceSelectorProps {
  file: FileInfo;
  detectedFaces: FaceInfo[];
  selectedFace: FaceInfo | null;
  onFaceSelect: (face: FaceInfo) => void;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}

export interface ProcessingStatusProps {
  job: JobInfo;
  onCancel?: () => void;
  onComplete?: (resultFile: FileInfo) => void;
}

export interface ResultViewerProps {
  resultFile: FileInfo;
  sourceFile: FileInfo;
  targetFile: FileInfo;
  onReprocess?: () => void;
  onShare?: () => void;
}

// WebSocket message types
export interface JobUpdateMessage {
  job_id: string;
  status: string;
  progress: number;
  timestamp: string;
  error_message?: string;
}

// Utility types
export type FileWithPreview = File & {
  preview: string;
};

export interface ProcessingStats {
  job_counts: Record<string, number>;
  recent_activity: JobInfo[];
  total_jobs: number;
}

export interface HealthStatus {
  status: string;
  database: string;
  upload_folder: string;
  processed_folder: string;
}