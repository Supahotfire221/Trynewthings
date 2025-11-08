import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Tooltip,
  IconButton,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  Face,
  ZoomIn,
  ZoomOut,
  Refresh,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceSelectorProps, FaceInfo } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

const FaceSelector: React.FC<FaceSelectorProps> = ({
  file,
  detectedFaces,
  selectedFace,
  onFaceSelect,
  title,
  subtitle,
  disabled = false,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file) {
      loadImage();
    }
  }, [file]);

  const loadImage = async () => {
    setLoading(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      if (file.file_type === 'image') {
        // For images, use the file URL or thumbnail
        img.src = file.thumbnail_path || `/api/files/${file.file_id}`;
      } else {
        // For videos, use thumbnail
        img.src = file.thumbnail_path || '';
      }

      img.onload = () => {
        setImage(img);
        setLoading(false);

        // Auto-detect faces if not already detected
        if (detectedFaces.length === 0) {
          detectFaces();
        }
      };

      img.onerror = () => {
        setLoading(false);
        toast.error('Failed to load image');
      };
    } catch (error) {
      setLoading(false);
      toast.error('Error loading image');
    }
  };

  const detectFaces = async () => {
    setDetecting(true);
    try {
      if (file.file_type === 'video') {
        // For videos, detect faces in the first frame
        const response = await apiService.detectFacesInVideoFrame(file.file_id, 0);
        // The parent component would update detectedFaces based on this response
        // This is a simplified approach - in practice, you might want to emit an event
      } else {
        // For images, detect faces normally
        const response = await apiService.detectFaces(file.file_id);
        // Same as above - parent component would handle the response
      }
    } catch (error) {
      toast.error('Failed to detect faces');
    } finally {
      setDetecting(false);
    }
  };

  const handleFaceClick = (face: FaceInfo) => {
    if (disabled) return;
    onFaceSelect(face);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'info';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRedetect = () => {
    detectFaces();
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Loading {file.file_type}...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (!image) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load {file.file_type}
        </Typography>
        <Button variant="outlined" onClick={loadImage}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Controls */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={disabled} size="small">
              <ZoomIn />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={disabled} size="small">
              <ZoomOut />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item>
          <Tooltip title="Reset View">
            <IconButton onClick={handleReset} disabled={disabled} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRedetect}
            disabled={detecting || disabled}
            startIcon={<Face />}
          >
            {detecting ? 'Detecting...' : 'Redetect Faces'}
          </Button>
        </Grid>
      </Grid>

      {/* Face Detection Status */}
      <Box sx={{ mb: 2 }}>
        {detectedFaces.length === 0 ? (
          <Alert severity="info">
            No faces detected. Click "Redetect Faces" to try again.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {detectedFaces.length} face{detectedFaces.length !== 1 ? 's' : ''} detected
            </Typography>
            {selectedFace && (
              <Chip
                size="small"
                label="Selected"
                color="primary"
                icon={<CheckCircle />}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Image Viewer */}
      <Box
        ref={imageRef}
        sx={{
          position: 'relative',
          height: 400,
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Box
          component="img"
          src={image.src}
          alt={file.original_name}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            maxWidth: 'none',
            maxHeight: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Face Overlays */}
        <AnimatePresence>
          {detectedFaces.map((face) => (
            <motion.div
              key={face.face_id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`face-overlay ${
                selectedFace?.face_id === face.face_id ? 'selected' : ''
              }`}
              style={{
                position: 'absolute',
                left: `${(face.bbox.x1 / image.width) * 100}%`,
                top: `${(face.bbox.y1 / image.height) * 100}%`,
                width: `${((face.bbox.x2 - face.bbox.x1) / image.width) * 100}%`,
                height: `${((face.bbox.y2 - face.bbox.y1) / image.height) * 100}%`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                zIndex: 2,
              }}
              onClick={() => handleFaceClick(face)}
            >
              {/* Face Number */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -25,
                  left: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Face {face.face_id + 1}
              </Box>

              {/* Quality Indicator */}
              <Chip
                size="small"
                label={face.quality_label}
                color={getQualityColor(face.quality_label) as any}
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: 0,
                  fontSize: '10px',
                  height: 20,
                }}
              />

              {/* Selection Indicator */}
              {selectedFace?.face_id === face.face_id && (
                <CheckCircle
                  sx={{
                    position: 'absolute',
                    top: -25,
                    right: -25,
                    color: 'primary.main',
                    fontSize: 20,
                    background: 'white',
                    borderRadius: '50%',
                  }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* Face List */}
      {detectedFaces.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Detected Faces
          </Typography>
          <Grid container spacing={1}>
            {detectedFaces.map((face) => (
              <Grid item key={face.face_id}>
                <Button
                  variant={selectedFace?.face_id === face.face_id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handleFaceClick(face)}
                  disabled={disabled}
                  startIcon={
                    selectedFace?.face_id === face.face_id ? (
                      <CheckCircle />
                    ) : (
                      <RadioButtonUnchecked />
                    )
                  }
                >
                  Face {face.face_id + 1}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default FaceSelector;