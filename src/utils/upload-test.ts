// Test utility to verify upload functionality
import { useUploadManager } from '@/hooks/use-upload-manager';

export const testUploadFunctionality = () => {
  console.log('🧪 Testing upload functionality...');
  
  // Test batch upload configuration
  const uploadManager = useUploadManager({
    enableBatching: true,
    batchSize: 3,
    maxFiles: 10,
  });
  
  console.log('✅ Upload manager initialized with batch configuration');
  console.log('📊 Config:', uploadManager.config);
  
  return uploadManager;
};

// Test file creation for upload testing
export const createTestFiles = (count: number = 3): File[] => {
  const files: File[] = [];
  
  for (let i = 0; i < count; i++) {
    // Create a small test image file
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw a simple test pattern
      ctx.fillStyle = `hsl(${i * 60}, 70%, 50%)`;
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`${i + 1}`, 40, 55);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `test-image-${i + 1}.png`, { type: 'image/png' });
        files.push(file);
      }
    }, 'image/png');
  }
  
  return files;
};

// Test batch upload progress tracking
export const testBatchProgress = async () => {
  console.log('🧪 Testing batch upload progress tracking...');
  
  const uploadManager = testUploadFunctionality();
  const testFiles = createTestFiles(3);
  
  // Simulate adding files
  const result = uploadManager.addFiles(testFiles);
  console.log('📁 Added files:', result);
  
  // Monitor progress
  const progressInterval = setInterval(() => {
    const progress = uploadManager.getProgress();
    console.log('📊 Upload progress:', progress);
    
    if (progress.completed === progress.total && progress.total > 0) {
      clearInterval(progressInterval);
      console.log('✅ All uploads completed!');
    }
  }, 1000);
  
  return uploadManager;
};

// Development mode testing
if (import.meta.env.DEV) {
  console.log('🔧 Development mode: Upload test utilities loaded');
  
  // Make test functions available globally for debugging
  (window as any).testUpload = {
    testUploadFunctionality,
    createTestFiles,
    testBatchProgress,
  };
}
