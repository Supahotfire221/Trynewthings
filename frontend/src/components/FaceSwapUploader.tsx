import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, LinearProgress, Paper, Alert, IconButton, Tooltip } from '@mui/material';
import { CloudUpload, Close, InsertDriveFile, Image, Videocam } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { FaceSwapUploaderProps, FileWithPreview } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

const FaceSwapUploader: React.FC<FaceSwapUploaderProps> = ({
  onFileSelect,
  onUploadComplete,
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 500 * 1024 * 1024, // 500MB
  disabled = false,
  title = 'Upload File',
  description = 'Drag and drop an image or video here, or click to select',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);

      // File size validation
      if (file.size > maxSize) {
        setError(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
        return;
      }

      // Create preview for images
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }

      try {
        setUploading(true);
        setUploadProgress(0);
        onFileSelect(fileWithPreview);

        // Upload file
        const uploadPromise = apiService.uploadFile(file);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 10;
          });
        }, 500);

        const result = await uploadPromise;

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Cleanup preview URL if created
        if (fileWithPreview.preview) {
          URL.revokeObjectURL(fileWithPreview.preview);
        }

        onUploadComplete(result);
        toast.success('File uploaded successfully!');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        toast.error(errorMessage);

        // Cleanup preview URL if created
        if (fileWithPreview.preview) {
          URL.revokeObjectURL(fileWithPreview.preview);
        }
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [disabled, maxSize, onFileSelect, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      if (type === 'image/*') {
        acc['image/*'] = ['.jpg', '.jpeg', '.png', '.webp'];
      } else if (type === 'video/*') {
        acc['video/*'] = ['.mp4', '.mov', '.avi'];
      }
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false,
    disabled: disabled || uploading,
  });

  const getFileIcon = (file?: File) => {
    if (!file) return <CloudUpload />;
    return file.type.startsWith('video/') ? <Videocam /> : <Image />;
  };

  const getAcceptedFormats = () => {
    const formats = [];
    if (acceptedTypes.includes('image/*')) {
      formats.push('JPG, PNG, WebP');
    }
    if (acceptedTypes.includes('video/*')) {
      formats.push('MP4, MOV, AVI');
    }
    return formats.join(', ');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        border: '2px dashed',
        borderColor: isDragReject
          ? 'error.main'
          : isDragActive
          ? 'primary.main'
          : 'divider',
        background: isDragActive
          ? 'rgba(59, 130, 246, 0.04)'
          : isDragReject
          ? 'rgba(239, 68, 68, 0.04)'
          : 'background.paper',
        cursor: disabled || uploading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          textAlign: 'center',
          py: 4,
          opacity: disabled || uploading ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />

        {/* Upload Progress Overlay */}
        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                Uploading...
              </Typography>
              <Typography variant="body2" sx={{ minWidth: '45px' }}>
                {Math.round(uploadProgress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            severity="error"
            action={
              <IconButton size="small" onClick={() => setError(null)}>
                <Close />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ scale: 1 }}
          animate={{
            scale: isDragActive ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {getFileIcon()}
          </Box>

          <Typography variant="h6" gutterBottom>
            {uploading ? 'Processing...' : title}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {uploading
              ? 'Please wait while we upload your file...'
              : isDragActive
              ? 'Drop the file here...'
              : description}
          </Typography>

          {!uploading && !isDragActive && (
            <>
              <Typography variant="caption" color="text.secondary" display="block">
                Accepted formats: {getAcceptedFormats()}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Maximum size: {Math.round(maxSize / 1024 / 1024)}MB
              </Typography>
            </>
          )}

          {isDragReject && (
            <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
              File type not supported or file too large
            </Typography>
          )}
        </motion.div>
      </Box>
    </Paper>
  );
};

export default FaceSwapUploader;