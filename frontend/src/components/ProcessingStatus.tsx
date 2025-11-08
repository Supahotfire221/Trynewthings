import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Button,
  Alert,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  Cancel,
  Download,
  Share,
  Refresh,
  CheckCircle,
  Error,
  Schedule,
  Pending,
  PlayArrow,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingStatusProps, JobInfo } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface ProcessingStep {
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  icon: React.ReactNode;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  job,
  onCancel,
  onComplete,
}) => {
  const [currentJob, setCurrentJob] = useState<JobInfo>(job);
  const [polling, setPolling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setCurrentJob(job);

    // Start polling if job is not completed or failed
    if (job.status === 'queued' || job.status === 'processing') {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [job]);

  useEffect(() => {
    // Call onComplete when job is completed
    if (currentJob.status === 'completed' && currentJob.result_file && onComplete) {
      onComplete(currentJob.result_file);
    }
  }, [currentJob.status, currentJob.result_file, onComplete]);

  const startPolling = () => {
    setPolling(true);
    pollJobStatus();
  };

  const stopPolling = () => {
    setPolling(false);
  };

  const pollJobStatus = async () => {
    try {
      const status = await apiService.getJobStatus(currentJob.id);
      setCurrentJob(status);

      if (status.status === 'completed' || status.status === 'failed') {
        stopPolling();
      } else if (polling) {
        // Continue polling
        setTimeout(pollJobStatus, 2000);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      if (polling) {
        setTimeout(pollJobStatus, 5000); // Retry after 5 seconds on error
      }
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;

    setCancelling(true);
    try {
      await apiService.cancelJob(currentJob.id);
      setCurrentJob(prev => ({ ...prev, status: 'failed', error_message: 'Cancelled by user' }));
      stopPolling();
      toast.success('Job cancelled successfully');
      if (onCancel) onCancel();
    } catch (error) {
      toast.error('Failed to cancel job');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownload = async () => {
    if (!currentJob.result_file) return;

    try {
      const blob = await apiService.downloadFile(currentJob.result_file.file_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentJob.result_file.original_name;
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
    if (!currentJob.result_file) return;

    try {
      const shareUrl = `${window.location.origin}/download/${currentJob.result_file.file_id}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Face Swap Result',
          text: 'Check out this face swap result!',
          url: shareUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to share file');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Schedule color="action" />;
      case 'processing':
        return <PlayArrow color="primary" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      default:
        return <Pending color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'warning';
      case 'processing':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getProcessingSteps = (): ProcessingStep[] => {
    const baseSteps: ProcessingStep[] = [
      {
        name: 'Upload',
        description: 'Uploading files',
        status: 'completed',
        icon: <CheckCircle />,
      },
      {
        name: 'Detection',
        description: 'Detecting faces',
        status: currentJob.progress >= 25 ? 'completed' :
                currentJob.progress >= 10 ? 'active' : 'pending',
        icon: currentJob.progress >= 25 ? <CheckCircle /> : <Pending />,
      },
      {
        name: 'Processing',
        description: 'Swapping faces',
        status: currentJob.progress >= 75 ? 'completed' :
                currentJob.progress >= 25 ? 'active' : 'pending',
        icon: currentJob.progress >= 75 ? <CheckCircle /> :
              currentJob.progress >= 25 ? <PlayArrow /> : <Pending />,
      },
      {
        name: 'Finalizing',
        description: 'Finalizing result',
        status: currentJob.progress >= 90 ? 'completed' :
                currentJob.progress >= 75 ? 'active' : 'pending',
        icon: currentJob.progress >= 90 ? <CheckCircle /> : <Pending />,
      },
    ];

    if (currentJob.status === 'failed') {
      return baseSteps.map((step, index) => ({
        ...step,
        status: index < 1 ? 'completed' :
                index === baseSteps.findIndex(s => s.status === 'active') ? 'active' :
                'pending',
      }));
    }

    return baseSteps;
  };

  const getEstimatedTime = () => {
    if (currentJob.status === 'completed') return 'Completed';
    if (currentJob.status === 'failed') return 'Failed';
    if (currentJob.status === 'queued') return 'Waiting to start...';

    // Estimate based on progress
    const remaining = 100 - currentJob.progress;
    if (currentJob.file_type === 'video') {
      const estimatedMinutes = Math.ceil(remaining / 20); // 5% per minute
      return `~${estimatedMinutes} minute${estimatedMinutes !== 1 ? 's' : ''} remaining`;
    } else {
      const estimatedSeconds = Math.ceil(remaining / 5); // 5% per 6 seconds
      return `~${estimatedSeconds} seconds remaining`;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getStatusIcon(currentJob.status)}
          <Box>
            <Typography variant="h6">
              Processing: {currentJob.original_filename}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                size="small"
                label={currentJob.status.toUpperCase()}
                color={getStatusColor(currentJob.status) as any}
              />
              <Typography variant="body2" color="text.secondary">
                {getEstimatedTime()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {currentJob.status === 'processing' && (
            <Tooltip title="Cancel Job">
              <IconButton onClick={handleCancel} disabled={cancelling}>
                <Cancel />
              </IconButton>
            </Tooltip>
          )}

          {currentJob.status === 'completed' && currentJob.result_file && (
            <>
              <Tooltip title="Download">
                <IconButton onClick={handleDownload}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton onClick={handleShare}>
                  <Share />
                </IconButton>
              </Tooltip>
            </>
          )}

          {currentJob.status === 'failed' && (
            <Tooltip title="Retry">
              <IconButton onClick={() => window.location.reload()}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Progress Bar */}
      <AnimatePresence>
        {currentJob.status === 'processing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Processing Progress
                </Typography>
                <Typography variant="body2">
                  {currentJob.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={currentJob.progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Steps */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {getProcessingSteps().map((step, index) => (
          <Grid item xs={12} sm={6} md={3} key={step.name}>
            <Card
              variant="outlined"
              sx={{
                borderColor: step.status === 'active' ? 'primary.main' : 'divider',
                background: step.status === 'active' ? 'rgba(59, 130, 246, 0.04)' : 'background.paper',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {step.icon}
                  <Typography variant="subtitle2">
                    {step.name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Status Messages */}
      <AnimatePresence>
        {currentJob.status === 'failed' && currentJob.error_message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {currentJob.error_message}
            </Alert>
          </motion.div>
        )}

        {currentJob.status === 'completed' && currentJob.result_file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert severity="success" sx={{ mb: 2 }}>
              Processing completed successfully! Your file is ready for download.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Info */}
      {currentJob.result_file && (
        <Box sx={{ mt: 2, p: 2, background: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Result File
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Name: {currentJob.result_file.original_name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Size: {(currentJob.result_file.file_size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default ProcessingStatus;