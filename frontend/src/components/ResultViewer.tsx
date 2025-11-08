import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download,
  Share,
  ZoomIn,
  ZoomOut,
  Refresh,
  CompareArrows,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultViewerProps, FileInfo } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

const ResultViewer: React.FC<ResultViewerProps> = ({
  resultFile,
  sourceFile,
  targetFile,
  onReprocess,
  onShare,
}) => {
  const [beforeView, setBeforeView] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Generate share URL
    const url = `${window.location.origin}/download/${resultFile.file_id}`;
    setShareUrl(url);
  }, [resultFile.file_id]);

  useEffect(() => {
    // Handle keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (resultFile.file_type === 'video') {
            toggleVideoPlayPause();
          }
          break;
        case 'ArrowLeft':
          setBeforeView(true);
          break;
        case 'ArrowRight':
          setBeforeView(false);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resultFile.file_type]);

  const toggleVideoPlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }

    if (beforeVideoRef.current && afterVideoRef.current) {
      if (beforeVideoRef.current.paused) {
        beforeVideoRef.current.play();
        afterVideoRef.current.play();
      } else {
        beforeVideoRef.current.pause();
        afterVideoRef.current.pause();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const blob = await apiService.downloadFile(resultFile.file_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resultFile.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Face Swap Result',
          text: 'Check out this amazing face swap result!',
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
        setShareDialogOpen(true);
      }
    } catch (error) {
      toast.error('Failed to share file');
    }
  };

  const renderImageComparison = () => (
    <Box
      sx={{
        position: 'relative',
        height: 500,
        background: 'black',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Before Image (Target) */}
      <Box
        component="img"
        src={`/api/files/${targetFile.file_id}`}
        alt="Before"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          maxWidth: 'none',
          maxHeight: 'none',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      {/* After Image (Result) with slider */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <Box
          component="img"
          src={`/api/download/${resultFile.file_id}`}
          alt="After"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            maxWidth: 'none',
            maxHeight: 'none',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Box>

      {/* Slider Handle */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPosition}%`,
          width: 4,
          background: 'white',
          cursor: 'ew-resize',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            background: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
          }}
        >
          <CompareArrows sx={{ color: 'black' }} />
        </Box>
      </Box>

      {/* Labels */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          px: 2,
          py: 1,
          borderRadius: 1,
        }}
      >
        Before
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          px: 2,
          py: 1,
          borderRadius: 1,
        }}
      >
        After
      </Box>
    </Box>
  );

  const renderVideoComparison = () => (
    <Box
      sx={{
        position: 'relative',
        height: 500,
        background: 'black',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Side-by-side video comparison */}
      <Grid container sx={{ height: '100%' }}>
        <Grid item xs={6} sx={{ position: 'relative' }}>
          <video
            ref={beforeVideoRef}
            src={`/api/files/${targetFile.file_id}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            muted={muted}
            controls={false}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
            }}
          >
            Before
          </Box>
        </Grid>
        <Grid item xs={6} sx={{ position: 'relative' }}>
          <video
            ref={afterVideoRef}
            src={`/api/download/${resultFile.file_id}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            muted={muted}
            controls={false}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1,
            }}
          >
            After
          </Box>
        </Grid>
      </Grid>

      {/* Video Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          background: 'rgba(0, 0, 0, 0.7)',
          p: 1,
          borderRadius: 2,
        }}
      >
        <Tooltip title="Play/Pause">
          <IconButton size="small" onClick={toggleVideoPlayPause}>
            <PlayArrow sx={{ color: 'white' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Mute/Unmute">
          <IconButton size="small" onClick={() => setMuted(!muted)}>
            {muted ? (
              <VolumeOff sx={{ color: 'white' }} />
            ) : (
              <VolumeUp sx={{ color: 'white' }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Face Swap Result
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              size="small"
              label={resultFile.file_type.toUpperCase()}
              color="primary"
            />
            <Chip
              size="small"
              label={`${(resultFile.file_size / 1024 / 1024).toFixed(1)} MB`}
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset View">
            <IconButton onClick={handleReset}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            variant="contained"
            startIcon={<Share />}
            onClick={handleShare}
          >
            Share
          </Button>
          {onReprocess && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onReprocess}
            >
              Reprocess
            </Button>
          )}
        </Box>
      </Box>

      {/* Comparison Slider for Images */}
      {resultFile.file_type === 'image' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Drag slider to compare before and after
          </Typography>
          <Slider
            value={sliderPosition}
            onChange={(_, value) => setSliderPosition(value as number)}
            min={0}
            max={100}
            step={1}
            sx={{ mb: 2 }}
          />
        </Box>
      )}

      {/* Viewer */}
      <Box ref={containerRef} sx={{ mb: 3 }}>
        {resultFile.file_type === 'image' ? renderImageComparison() : renderVideoComparison()}
      </Box>

      {/* File Information */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" gutterBottom>
            Source File
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sourceFile.original_name}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" gutterBottom>
            Target File
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {targetFile.original_name}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" gutterBottom>
            Result File
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {resultFile.original_name}
          </Typography>
        </Grid>
      </Grid>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Result</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Share link copied to clipboard!
          </Alert>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {shareUrl}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ResultViewer;