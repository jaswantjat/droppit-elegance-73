export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'cancelled';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number; // 0-100
  eta: number; // seconds remaining
  status: UploadStatus;
  error?: string;
  uploadedUrl?: string;
  abortController?: AbortController;
  startTime?: number;
}

export interface UploadResult {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface UploadManagerConfig {
  maxFiles: number;
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  concurrency: number;
  uploadEndpoint?: string;
}

export interface UploadProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  overallProgress: number; // 0-100
  isUploading: boolean;
}
