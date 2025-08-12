export type Language = 'es' | 'en';

export interface Translations {
  // Main interface
  uploadFiles: string;
  uploadedProjectAttachments: string;
  
  // Drag and drop
  dragAndDropFiles: string;
  selectFiles: string;
  maxFileSize: string;
  allowedTypes: string;
  
  // URL upload
  orUploadFromUrl: string;
  urlPlaceholder: string;
  upload: string;
  
  // File queue
  uploadQueue: string;
  clearAll: string;
  noFilesYet: string;
  
  // File actions
  retry: string;
  remove: string;
  cancel: string;
  attachFiles: string;
  uploadButton: string;

  // Success popup
  uploadSuccessTitle: string;
  uploadSuccessMessage: string;
  
  // Status messages
  uploadSuccessful: string;
  uploadFailed: string;
  uploading: string;
  cancelled: string;
  pending: string;
  waitingInQueue: string;
  
  // Progress
  overallProgress: string;
  filesCompleted: string;
  secondsLeft: string;
  minutesLeft: string;
  
  // File validation errors
  fileTypeNotAllowed: string;
  fileSizeExceeds: string;
  maxFilesExceeded: string;
  invalidUrl: string;
  couldNotFetchUrl: string;
  
  // Toast messages
  uploadErrors: string;
  filesAdded: string;
  filesAddedDescription: string;
  noFiles: string;
  noFilesDescription: string;
  filesAttached: string;
  filesAttachedDescription: string;
  invalidFileType: string;
  urlMustPointToImage: string;
  
  // Language switcher
  language: string;
  spanish: string;
  english: string;
  
  // File status badges
  success: string;
  error: string;
  unknown: string;
}

export const translations: Record<Language, Translations> = {
  es: {
    // Main interface
    uploadFiles: 'Subir Archivos',
    uploadedProjectAttachments: 'Archivos adjuntos del proyecto',
    
    // Drag and drop
    dragAndDropFiles: 'Arrastra y suelta tus archivos',
    selectFiles: 'Seleccionar archivos',
    maxFileSize: 'Tamaño máx. de archivo: 256 MB',
    allowedTypes: 'Solo imágenes: JPG, PNG, WebP, HEIC',
    
    // URL upload
    orUploadFromUrl: 'O subir desde URL',
    urlPlaceholder: 'https://...',
    upload: 'Subir',
    
    // File queue
    uploadQueue: 'Cola de Subida',
    clearAll: 'Limpiar Todo',
    noFilesYet: 'Aún no hay archivos',
    
    // File actions
    retry: 'Reintentar',
    remove: 'Eliminar',
    cancel: 'Cancelar',
    attachFiles: 'Adjuntar archivos',
    uploadButton: 'Subir',

    // Success popup
    uploadSuccessTitle: 'Subida Exitosa',
    uploadSuccessMessage: 'archivo(s) subido(s) exitosamente',
    
    // Status messages
    uploadSuccessful: 'Subida Exitosa | 100%',
    uploadFailed: 'Subida fallida',
    uploading: 'Subiendo...',
    cancelled: 'Cancelado',
    pending: 'pendiente',
    waitingInQueue: 'Esperando en cola...',
    
    // Progress
    overallProgress: 'Progreso General',
    filesCompleted: 'archivos',
    secondsLeft: 's restantes',
    minutesLeft: 'm restantes',
    
    // File validation errors
    fileTypeNotAllowed: 'Tipo de archivo no permitido. Tipos permitidos:',
    fileSizeExceeds: 'El tamaño del archivo excede el límite de',
    maxFilesExceeded: 'Máximo de archivos permitidos',
    invalidUrl: 'URL inválida',
    couldNotFetchUrl: 'No se pudo obtener el archivo desde la URL',
    
    // Toast messages
    uploadErrors: 'Errores de Subida',
    filesAdded: 'Archivos Agregados',
    filesAddedDescription: 'archivo(s) agregado(s) a la cola de subida',
    noFiles: 'Sin Archivos',
    noFilesDescription: 'No hay archivos subidos exitosamente para adjuntar',
    filesAttached: 'Archivos Adjuntados',
    filesAttachedDescription: 'archivo(s) adjuntado(s) exitosamente',
    invalidFileType: 'Tipo de Archivo Inválido',
    urlMustPointToImage: 'La URL debe apuntar a un archivo de imagen',
    
    // Language switcher
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    
    // File status badges
    success: 'exitoso',
    error: 'error',
    unknown: 'desconocido',
  },
  
  en: {
    // Main interface
    uploadFiles: 'Upload Files',
    uploadedProjectAttachments: 'Uploaded project attachments',
    
    // Drag and drop
    dragAndDropFiles: 'Drag and drop your files',
    selectFiles: 'Select files',
    maxFileSize: 'Max. file size: 256 MB',
    allowedTypes: 'Images only: JPG, PNG, WebP, HEIC',
    
    // URL upload
    orUploadFromUrl: 'Or upload from URL',
    urlPlaceholder: 'https://...',
    upload: 'Upload',
    
    // File queue
    uploadQueue: 'Upload Queue',
    clearAll: 'Clear All',
    noFilesYet: 'No files yet',
    
    // File actions
    retry: 'Retry',
    remove: 'Remove',
    cancel: 'Cancel',
    attachFiles: 'Attach files',
    uploadButton: 'Upload',

    // Success popup
    uploadSuccessTitle: 'Upload Successful',
    uploadSuccessMessage: 'file(s) uploaded successfully',
    
    // Status messages
    uploadSuccessful: 'Upload Successful | 100%',
    uploadFailed: 'Upload failed',
    uploading: 'Uploading...',
    cancelled: 'Cancelled',
    pending: 'pending',
    waitingInQueue: 'Waiting in queue...',
    
    // Progress
    overallProgress: 'Overall Progress',
    filesCompleted: 'files',
    secondsLeft: 's left',
    minutesLeft: 'm left',
    
    // File validation errors
    fileTypeNotAllowed: 'File type not allowed. Allowed types:',
    fileSizeExceeds: 'File size exceeds the limit of',
    maxFilesExceeded: 'Maximum files allowed',
    invalidUrl: 'Invalid URL',
    couldNotFetchUrl: 'Could not fetch file from URL',
    
    // Toast messages
    uploadErrors: 'Upload Errors',
    filesAdded: 'Files Added',
    filesAddedDescription: 'file(s) added to upload queue',
    noFiles: 'No Files',
    noFilesDescription: 'No successfully uploaded files to attach',
    filesAttached: 'Files Attached',
    filesAttachedDescription: 'file(s) attached successfully',
    invalidFileType: 'Invalid File Type',
    urlMustPointToImage: 'URL must point to an image file',
    
    // Language switcher
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    
    // File status badges
    success: 'success',
    error: 'error',
    unknown: 'unknown',
  },
};
