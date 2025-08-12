# Batch Upload Functionality Guide

## Overview

The upload manager now supports **batch uploads**, allowing multiple files to be uploaded together in a single webhook call instead of individual uploads for each file. This is more efficient and reduces webhook overhead.

## Key Features

### ✅ Fixed Critical Bug
- **Fixed progress tracking bug**: Ensured proper variable references in `onUploadProgress` handler
- **Added defensive coding**: Extra validation to prevent progress tracking issues
- **Robust error handling**: Better handling of edge cases in upload progress

### 🚀 New Batch Upload Features
- **Combined webhook calls**: Multiple files sent in a single request
- **Configurable batch size**: Control how many files to batch together
- **Progress tracking**: Proper progress distribution across batched files
- **Backward compatibility**: Single file uploads still work as before
- **Error handling**: Partial batch failure support

## Configuration

### Environment Variables

Add these to your `.env` file or Railway environment variables:

```bash
# Batch Upload Configuration
ENABLE_BATCHING=true    # Enable/disable batch uploads (default: true)
BATCH_SIZE=5           # Number of files per batch (default: 5)
```

### Client Configuration

```typescript
import { useUploadManager } from '@/hooks/use-upload-manager';

const uploadManager = useUploadManager({
  enableBatching: true,  // Enable batch uploads
  batchSize: 5,         // Upload up to 5 files per batch
  concurrency: 3,       // Number of concurrent batch uploads
});
```

## How It Works

### Single File Upload (Traditional)
```
File 1 → Webhook Call 1
File 2 → Webhook Call 2  
File 3 → Webhook Call 3
```

### Batch Upload (New)
```
Files 1,2,3,4,5 → Single Webhook Call
Files 6,7,8     → Single Webhook Call
```

## Implementation Details

### Client Side

1. **Queue Processing**: Files are grouped into batches based on `batchSize`
2. **Form Data**: Multiple files sent as `files[]` array in FormData
3. **Progress Tracking**: Overall progress distributed across all files in batch
4. **Error Handling**: Individual file status tracking within batches

### Server Side

1. **Batch Detection**: Server detects batch uploads via content analysis
2. **Webhook Forwarding**: Adds `x-batch-upload: true` header for webhook
3. **Response Handling**: Converts single responses to batch-compatible format
4. **Logging**: Enhanced logging for batch upload debugging

## Webhook Response Format

### Expected Batch Response
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "url": "https://example.com/file1.jpg",
      "index": 0
    },
    {
      "success": true, 
      "url": "https://example.com/file2.jpg",
      "index": 1
    }
  ]
}
```

### Fallback Handling
If your webhook doesn't return a `results` array, the server automatically converts single responses to batch format.

## Testing

### Development Testing
```typescript
// Test utilities are available in development mode
window.testUpload.testBatchProgress();
```

### Manual Testing
1. Select multiple files (5+ recommended)
2. Monitor network tab - should see fewer webhook calls
3. Check console for batch upload logs
4. Verify all files complete successfully

## Migration Guide

### From Single to Batch Uploads

**No code changes required!** The system is backward compatible.

To enable batch uploads:
1. Set `ENABLE_BATCHING=true` in environment
2. Optionally configure `BATCH_SIZE` (default: 5)
3. Deploy and test

### Webhook Compatibility

Your existing webhook should work without changes. The server handles response format conversion automatically.

## Troubleshooting

### Common Issues

1. **Files stuck at 0%**
   - ✅ **FIXED**: Progress tracking bug resolved
   - Check network connectivity
   - Verify webhook URL is accessible

2. **Batch uploads not working**
   - Verify `ENABLE_BATCHING=true` in environment
   - Check `batchSize` configuration
   - Monitor server logs for batch detection

3. **Partial batch failures**
   - Individual files can fail within a batch
   - Check webhook response format
   - Review server logs for error details

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development
```

This provides:
- Batch upload detection logs
- Progress tracking details
- Webhook response analysis
- Error stack traces

## Performance Benefits

### Before (Individual Uploads)
- 10 files = 10 webhook calls
- Higher latency per file
- More server resources used

### After (Batch Uploads)
- 10 files = 2 webhook calls (batch size 5)
- Lower overall latency
- Reduced server load
- Better user experience

## Best Practices

1. **Batch Size**: Start with 5, adjust based on file sizes and webhook performance
2. **File Size Limits**: Consider total batch size vs individual file limits
3. **Error Handling**: Monitor partial batch failures
4. **Testing**: Test with various file counts and sizes
5. **Monitoring**: Watch webhook response times with batching enabled

## Support

For issues or questions:
1. Check server logs for batch upload indicators
2. Verify environment variable configuration
3. Test with single file uploads first
4. Monitor network requests in browser dev tools
