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
    enableBatching: true, // Enable batch uploads by default
    batchSize: 5, // Upload up to 5 files in a single batch
  };
};

export const useUploadManager = (config?: Partial<UploadManagerConfig>) => {
  const [finalConfig, setFinalConfig] = useState<UploadManagerConfig>({
    maxFiles: 50,
    maxFileSize: 256 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
    concurrency: 3,
    uploadEndpoint: '/upload',
    enableBatching: true,
    batchSize: 5,
    ...config
  });
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const uploadQueueRef = useRef<UploadFile[]>([]);
  const activeUploadsRef = useRef<Set<string>>(new Set());
  const autoUploadRef = useRef<boolean>(false);

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

  // ✅ AUTO-UPLOAD: Trigger upload when files are added
  useEffect(() => {
    if (autoUploadRef.current && files.some(f => f.status === 'pending')) {
      autoUploadRef.current = false;
      setTimeout(() => {
        startBatchUpload();
      }, 100);
    }
  }, [files]);

  // ✅ NEW: Single batch upload function - uploads ALL pending files in ONE request
  const startBatchUpload = useCallback(async (): Promise<void> => {
    const pendingFiles = files.filter(file => file.status === 'pending');

    if (pendingFiles.length === 0) {
      console.warn('No pending files to upload');
      return;
    }

    // Generate unique batch ID for idempotency
    const batchId = crypto.randomUUID();
    const abortController = new AbortController();

    // Update ALL pending files to uploading status
    const fileIds = pendingFiles.map(f => f.id);
    setFiles(prev => prev.map(file =>
      fileIds.includes(file.id)
        ? { ...file, status: 'uploading', abortController, startTime: Date.now() }
        : file
    ));

    try {
      const formData = new FormData();

      // ✅ Add ALL files to the SAME FormData (key insight from your diagnosis)
      pendingFiles.forEach((uploadFile) => {
        // Use 'file' as the field name for each file; many webhooks expect this
        formData.append('file', uploadFile.file);
      });

      // Add batch metadata for idempotency and tracking
      formData.append('batchId', batchId);
      formData.append('fileCount', pendingFiles.length.toString());
      formData.append('path', 'ce39975d-f592-43d2-9680-76dd8f26af23');

      console.log(`🚀 Starting batch upload: ${pendingFiles.length} files, batchId: ${batchId}`);

      // ✅ ONE single POST request for ALL files
      const response = await axios.post(finalConfig.uploadEndpoint!, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Idempotency-Key': batchId, // ✅ Prevent duplicate requests
        },
        signal: abortController.signal,
        timeout: DEFAULT_UPLOAD_TIMEOUT_MS,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const overallProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Distribute progress across all files in the batch
            pendingFiles.forEach(file => {
              updateFileProgress(file.id, overallProgress);
            });
          }
        },
      });

      console.log(`✅ Batch upload completed successfully`);

      // Handle batch response
      const results = response.data?.results || response.data?.files || [];

      if (Array.isArray(results) && results.length === pendingFiles.length) {
        // Handle individual file results
        pendingFiles.forEach((file, index) => {
          const result = results[index];
          if (result && (result.success !== false)) {
            const uploadedUrl = result.url || result.file_url || URL.createObjectURL(file.file);
            updateFileStatus(file.id, 'success', undefined, uploadedUrl);
          } else {
            const error = result?.error || 'Upload failed';
            updateFileStatus(file.id, 'error', error);
          }
        });
      } else {
        // Fallback: assume all files succeeded if we get a successful response
        const baseUrl = response.data?.url || response.data?.file_url;
        pendingFiles.forEach(file => {
          const uploadedUrl = baseUrl || URL.createObjectURL(file.file);
          updateFileStatus(file.id, 'success', undefined, uploadedUrl);
        });
      }

    } catch (error: any) {
      console.error('❌ Batch upload failed:', error);

      // Fallback: try uploading files one-by-one (some webhooks don't accept multi-file form)
      try {
        for (const file of pendingFiles) {
          const perFileForm = new FormData();
          perFileForm.append('file', file.file);
          perFileForm.append('path', 'ce39975d-f592-43d2-9680-76dd8f26af23');

          const idKey = `${batchId}:${file.id}`;
          await axios.post(finalConfig.uploadEndpoint!, perFileForm, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Idempotency-Key': idKey,
            },
            timeout: DEFAULT_UPLOAD_TIMEOUT_MS,
            onUploadProgress: (evt: AxiosProgressEvent) => {
              if (evt.total) {
                const p = Math.round((evt.loaded * 100) / evt.total);
                updateFileProgress(file.id, p);
              }
            },
          }).then((resp) => {
            const result = resp.data?.result || resp.data;
            const uploadedUrl = result?.url || result?.file_url || URL.createObjectURL(file.file);
            updateFileStatus(file.id, 'success', undefined, uploadedUrl);
          }).catch((err) => {
            const msg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Upload failed');
            updateFileStatus(file.id, 'error', msg);
          });
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback single-file uploads failed:', fallbackErr);
        pendingFiles.forEach(file => {
          if (axios.isCancel(error)) {
            updateFileStatus(file.id, 'cancelled');
          } else if (error?.code === 'ECONNABORTED') {
            updateFileStatus(file.id, 'error', 'Upload timed out');
          } else {
            updateFileStatus(file.id, 'error', error instanceof Error ? error.message : 'Upload failed');
          }
        });
      }
    } finally {
      // Clean up active uploads tracking
      pendingFiles.forEach(file => {
        activeUploadsRef.current.delete(file.id);
      });
    }
  }, [files, finalConfig.uploadEndpoint, updateFileProgress, updateFileStatus]);

  // ❌ REMOVED: Individual uploadFile function that caused multiple webhook calls
  // ✅ REPLACED: With single startBatchUpload function

  // ❌ REMOVED: Reactive processQueue that caused infinite loops
  // ✅ REPLACED: With explicit startBatchUpload that user triggers via button

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

      // ✅ AUTO-UPLOAD: Set flag to trigger upload after state update
      autoUploadRef.current = true;
    }

    return { addedFiles: newFiles.length, errors };
  }, [files.length, finalConfig.maxFiles]);

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

      // ❌ REMOVED: Auto-retry processing - now requires explicit user action
      // setTimeout(processQueue, 100);
    }
  }, [files]);

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
    startBatchUpload, // ✅ NEW: Explicit upload trigger
    config: finalConfig,
  };
};
