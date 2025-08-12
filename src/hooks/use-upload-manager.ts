import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import { UploadFile, UploadResult, UploadManagerConfig, UploadProgress, UploadStatus } from '@/types/upload';

// Client-side timeout (prevents indefinite "Uploading..." when upstream hangs)
const DEFAULT_UPLOAD_TIMEOUT_MS = 120000; // 2 minutes

// Get configuration from environment or use defaults
const getDefaultConfig = async (): Promise<UploadManagerConfig> => {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      return {
        maxFiles: parseInt(config.maxFiles) || 50,
        maxFileSize: parseInt(config.maxFileSize) || 256 * 1024 * 1024,
        allowedTypes: config.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
        concurrency: 3,
        uploadEndpoint: config.webhookUrl || '/upload',
      };
    }
  } catch (error) {
    console.warn('Failed to fetch config from server, using defaults:', error);
  }

  // Fallback to hardcoded defaults
  return {
    maxFiles: 50,
    maxFileSize: 256 * 1024 * 1024, // 256MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
    concurrency: 3,
    uploadEndpoint: '/upload',
  };
};

export const useUploadManager = (config: Partial<UploadManagerConfig> = {}) => {
  const [finalConfig, setFinalConfig] = useState<UploadManagerConfig>({
    maxFiles: 50,
    maxFileSize: 256 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
    concurrency: 3,
    uploadEndpoint: '/upload',
    ...config
  });
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const uploadQueueRef = useRef<UploadFile[]>([]);
  const activeUploadsRef = useRef<Set<string>>(new Set());

  // Load configuration from server on mount
  useEffect(() => {
    getDefaultConfig().then(serverConfig => {
      setFinalConfig(prev => ({ ...serverConfig, ...config }));
    });
  }, [config]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const validateFile = (file: File, t?: any): string | null => {
    if (!finalConfig.allowedTypes.includes(file.type)) {
      const allowedTypesStr = finalConfig.allowedTypes.join(', ');
      return t ? `${t.fileTypeNotAllowed} ${allowedTypesStr}` : `File type ${file.type} is not allowed. Allowed types: ${allowedTypesStr}`;
    }
    if (file.size > finalConfig.maxFileSize) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      const limitMB = (finalConfig.maxFileSize / 1024 / 1024).toFixed(0);
      return t ? `${t.fileSizeExceeds} ${limitMB}MB` : `File size ${sizeMB}MB exceeds limit of ${limitMB}MB`;
    }
    return null;
  };

  const calculateETA = (uploadFile: UploadFile): number => {
    if (!uploadFile.startTime || uploadFile.progress === 0) return 0;

    const elapsed = (Date.now() - uploadFile.startTime) / 1000;
    const rate = uploadFile.progress / elapsed;
    const remaining = 100 - uploadFile.progress;
    return Math.round(remaining / rate);
  };

  const updateFileProgress = useCallback((id: string, progress: number) => {
    setFiles(prev => prev.map(file => {
      if (file.id === id) {
        const updatedFile = { ...file, progress };
        return { ...updatedFile, eta: calculateETA(updatedFile) };
      }
      return file;
    }));
  }, []);

  const updateFileStatus = useCallback((id: string, status: UploadStatus, error?: string, uploadedUrl?: string) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, status, error, uploadedUrl } : file
    ));

    if (status === 'success' && uploadedUrl) {
      const file = files.find(f => f.id === id);
      if (file) {
        setResults(prev => [...prev, {
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: uploadedUrl,
          uploadedAt: new Date(),
        }]);
      }
    }
  }, [files]);

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    const abortController = new AbortController();

    setFiles(prev => prev.map(file =>
      file.id === uploadFile.id
        ? { ...file, status: 'uploading', abortController, startTime: Date.now() }
        : file
    ));

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('filename', uploadFile.name);
      formData.append('path', 'ce39975d-f592-43d2-9680-76dd8f26af23');

      const response = await axios.post(finalConfig.uploadEndpoint!, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortController.signal,
        timeout: DEFAULT_UPLOAD_TIMEOUT_MS,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            updateFileProgress(uploadFile.id, progress);
          }
        },
      });

      // Assuming the webhook returns a URL or file info
      const uploadedUrl = response.data?.url || response.data?.file_url || URL.createObjectURL(uploadFile.file);
      updateFileStatus(uploadFile.id, 'success', undefined, uploadedUrl);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        updateFileStatus(uploadFile.id, 'cancelled');
      } else if (error?.code === 'ECONNABORTED') {
        updateFileStatus(uploadFile.id, 'error', 'Upload timed out');
      } else {
        updateFileStatus(uploadFile.id, 'error', error instanceof Error ? error.message : 'Upload failed');
      }
    } finally {
      activeUploadsRef.current.delete(uploadFile.id);
      processQueue();
    }
  };

  const processQueue = useCallback(() => {
    const availableSlots = finalConfig.concurrency - activeUploadsRef.current.size;
    const pendingFiles = uploadQueueRef.current.filter(file =>
      file.status === 'pending' && !activeUploadsRef.current.has(file.id)
    );

    for (let i = 0; i < Math.min(availableSlots, pendingFiles.length); i++) {
      const file = pendingFiles[i];
      activeUploadsRef.current.add(file.id);
      uploadFile(file);
    }
  }, [finalConfig.concurrency]);

  const addFiles = useCallback((fileList: FileList | File[], t?: any) => {
    const newFiles: UploadFile[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      if (files.length + newFiles.length >= finalConfig.maxFiles) {
        const errorMsg = t ? `${t.maxFilesExceeded}: ${finalConfig.maxFiles}` : `Maximum ${finalConfig.maxFiles} files allowed`;
        errors.push(errorMsg);
        return;
      }

      const validationError = validateFile(file, t);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        return;
      }

      const uploadFile: UploadFile = {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        eta: 0,
        status: 'pending',
      };

      newFiles.push(uploadFile);
    });

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      uploadQueueRef.current = [...uploadQueueRef.current, ...newFiles];

      // Auto-start uploads
      setTimeout(processQueue, 100);
    }

    return { addedFiles: newFiles.length, errors };
  }, [files.length, finalConfig.maxFiles, processQueue]);

  const removeFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file?.abortController && file.status === 'uploading') {
      file.abortController.abort();
    }

    setFiles(prev => prev.filter(f => f.id !== id));
    uploadQueueRef.current = uploadQueueRef.current.filter(f => f.id !== id);
    activeUploadsRef.current.delete(id);
    setResults(prev => prev.filter(r => r.id !== id));
  }, [files]);

  const retryFile = useCallback((id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      const resetFile = {
        ...file,
        status: 'pending' as UploadStatus,
        progress: 0,
        eta: 0,
        error: undefined,
        abortController: undefined,
        startTime: undefined,
      };

      setFiles(prev => prev.map(f => f.id === id ? resetFile : f));
      uploadQueueRef.current = uploadQueueRef.current.map(f => f.id === id ? resetFile : f);

      setTimeout(processQueue, 100);
    }
  }, [files, processQueue]);

  const clearAll = useCallback(() => {
    files.forEach(file => {
      if (file.abortController && file.status === 'uploading') {
        file.abortController.abort();
      }
    });

    setFiles([]);
    setResults([]);
    uploadQueueRef.current = [];
    activeUploadsRef.current.clear();
  }, [files]);

  const getProgress = useCallback((): UploadProgress => {
    const totalFiles = files.length;
    const completedFiles = files.filter(f => f.status === 'success').length;
    const failedFiles = files.filter(f => f.status === 'error').length;
    const uploadingFiles = files.filter(f => f.status === 'uploading');

    let overallProgress = 0;
    if (totalFiles > 0) {
      const completedProgress = completedFiles * 100;
      const uploadingProgress = uploadingFiles.reduce((sum, file) => sum + file.progress, 0);
      overallProgress = Math.round((completedProgress + uploadingProgress) / totalFiles);
    }

    return {
      totalFiles,
      completedFiles,
      failedFiles,
      overallProgress,
      isUploading: uploadingFiles.length > 0,
    };
  }, [files]);

  const getResults = useCallback((): Promise<UploadResult[]> => {
    return new Promise((resolve) => {
      const successfulResults = results.filter(result =>
        files.find(f => f.id === result.id)?.status === 'success'
      );
      resolve(successfulResults);
    });
  }, [results, files]);

  return {
    files,
    addFiles,
    removeFile,
    retryFile,
    clearAll,
    getProgress,
    getResults,
    config: finalConfig,
  };
};
