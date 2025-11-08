import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  Divider,
  Container,
} from '@mui/material';
import {
  SwapHoriz,
  PlayArrow,
  Download,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import FaceSwapUploader from '@/components/FaceSwapUploader';
import FaceSelector from '@/components/FaceSelector';
import ProcessingStatus from '@/components/ProcessingStatus';
import ResultViewer from '@/components/ResultViewer';

import { useAppStore, useSelectedFiles, useDetectedFaces, useJobState } from '@/store/appStore';
import { FileInfo, FaceInfo, JobInfo } from '@/types';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [detectingSourceFaces, setDetectingSourceFaces] = useState(false);
  const [detectingTargetFaces, setDetectingTargetFaces] = useState(false);
  const [processingJob, setProcessingJob] = useState(false);

  const {
    selectedSourceFile,
    selectedTargetFile,
    detectedSourceFaces,
    detectedTargetFaces,
    selectedSourceFace,
    selectedTargetFace,
    currentJob,
    isProcessing,
  } = useAppStore();

  const {
    addUploadedFile,
    setSelectedSourceFile,
    setSelectedTargetFile,
    setDetectedSourceFaces,
    setDetectedTargetFaces,
    setSelectedSourceFace,
    setSelectedTargetFace,
    setCurrentJob,
    setIsProcessing,
  } = useAppStore();

  // Update active step based on state
  useEffect(() => {
    if (currentJob) {
      if (currentJob.status === 'completed') {
        setActiveStep(4);
      } else {
        setActiveStep(3);
      }
    } else if (selectedSourceFace && selectedTargetFace) {
      setActiveStep(2);
    } else if (selectedSourceFile && selectedTargetFile) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  }, [selectedSourceFile, selectedTargetFile, selectedSourceFace, selectedTargetFace, currentJob]);

  const steps = [
    'Upload Files',
    'Select Faces',
    'Start Processing',
    'View Results',
  ];

  const handleSourceFileUpload = async (fileData: FileInfo) => {
    setSelectedSourceFile(fileData);
    addUploadedFile(fileData);
    toast.success('Source file uploaded!');
  };

  const handleTargetFileUpload = async (fileData: FileInfo) => {
    setSelectedTargetFile(fileData);
    addUploadedFile(fileData);
    toast.success('Target file uploaded!');
  };

  const detectFacesInFile = async (file: FileInfo, isSource: boolean) => {
    try {
      if (isSource) {
        setDetectingSourceFaces(true);
      } else {
        setDetectingTargetFaces(true);
      }

      const response = await apiService.detectFaces(file.file_id);

      if (isSource) {
        setDetectedSourceFaces(response.faces);
        // Auto-select best face
        if (response.best_face && response.faces.length > 0) {
          setSelectedSourceFace(response.best_face);
        }
      } else {
        setDetectedTargetFaces(response.faces);
        // Auto-select best face
        if (response.best_face && response.faces.length > 0) {
          setSelectedTargetFace(response.best_face);
        }
      }

      toast.success(`Detected ${response.total_faces} face${response.total_faces !== 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to detect faces');
    } finally {
      setDetectingSourceFaces(false);
      setDetectingTargetFaces(false);
    }
  };

  useEffect(() => {
    if (selectedSourceFile && detectedSourceFaces.length === 0 && !detectingSourceFaces) {
      detectFacesInFile(selectedSourceFile, true);
    }
  }, [selectedSourceFile]);

  useEffect(() => {
    if (selectedTargetFile && detectedTargetFaces.length === 0 && !detectingTargetFaces) {
      detectFacesInFile(selectedTargetFile, false);
    }
  }, [selectedTargetFile]);

  const handleStartProcessing = async () => {
    if (!selectedSourceFile || !selectedTargetFile || !selectedSourceFace || !selectedTargetFace) {
      toast.error('Please select source and target faces');
      return;
    }

    try {
      setProcessingJob(true);
      setIsProcessing(true);

      const request = {
        source_file_id: selectedSourceFile.file_id,
        target_file_id: selectedTargetFile.file_id,
        source_face_coords: selectedSourceFace.bbox,
        target_face_coords: selectedTargetFace.bbox,
        model: 'inswapper_128',
      };

      const response = await apiService.swapFaces(request);
      setCurrentJob({
        id: response.job_id,
        original_filename: `${selectedSourceFile.original_name} → ${selectedTargetFile.original_name}`,
        file_type: response.file_type,
        status: 'queued',
        progress: 0,
        source_face_coords: selectedSourceFace.bbox,
        target_face_coords: selectedTargetFace.bbox,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      toast.success('Face swap started! This may take a few moments...');
    } catch (error) {
      toast.error('Failed to start face swap');
    } finally {
      setProcessingJob(false);
    }
  };

  const handleJobComplete = (resultFile: FileInfo) => {
    setIsProcessing(false);
    toast.success('Face swap completed successfully!');
  };

  const handleReset = () => {
    setSelectedSourceFile(null);
    setSelectedTargetFile(null);
    setDetectedSourceFaces([]);
    setDetectedTargetFaces([]);
    setSelectedSourceFace(null);
    setSelectedTargetFace(null);
    setCurrentJob(null);
    setIsProcessing(false);
    setActiveStep(0);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AI Face Swap Technology
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Transform your photos and videos with advanced AI-powered face swapping
            </Typography>
          </motion.div>
        </Box>

        {/* Progress Stepper */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Source File Upload */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Typography variant="h6" gutterBottom>
                1. Source Face (The face to use)
              </Typography>
              <FaceSwapUploader
                onFileSelect={() => {}}
                onUploadComplete={handleSourceFileUpload}
                title="Upload Source File"
                description="Upload an image or video containing the face you want to apply"
                disabled={isProcessing}
              />
            </motion.div>

            {selectedSourceFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FaceSelector
                  file={selectedSourceFile}
                  detectedFaces={detectedSourceFaces}
                  selectedFace={selectedSourceFace}
                  onFaceSelect={setSelectedSourceFace}
                  title="Select Source Face"
                  subtitle="Choose the face you want to use from the source file"
                  disabled={isProcessing}
                />
              </motion.div>
            )}
          </Grid>

          {/* Target File Upload */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Typography variant="h6" gutterBottom>
                2. Target File (Where to apply the face)
              </Typography>
              <FaceSwapUploader
                onFileSelect={() => {}}
                onUploadComplete={handleTargetFileUpload}
                title="Upload Target File"
                description="Upload the image or video where you want to apply the face swap"
                disabled={isProcessing}
              />
            </motion.div>

            {selectedTargetFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FaceSelector
                  file={selectedTargetFile}
                  detectedFaces={detectedTargetFaces}
                  selectedFace={selectedTargetFace}
                  onFaceSelect={setSelectedTargetFace}
                  title="Select Target Face"
                  subtitle="Choose the face you want to replace in the target file"
                  disabled={isProcessing}
                />
              </motion.div>
            )}
          </Grid>
        </Grid>

        {/* Processing Controls */}
        {selectedSourceFace && selectedTargetFace && !currentJob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper elevation={3} sx={{ p: 3, mt: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Ready to Start Face Swap
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Source: {selectedSourceFile.original_name} → Target: {selectedTargetFile.original_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStartProcessing}
                  disabled={processingJob}
                  sx={{ px: 4 }}
                >
                  {processingJob ? 'Starting...' : 'Start Face Swap'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  disabled={processingJob}
                >
                  Reset
                </Button>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* Processing Status */}
        {currentJob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProcessingStatus
              job={currentJob}
              onComplete={handleJobComplete}
              onCancel={handleReset}
            />
          </motion.div>
        )}

        {/* Results */}
        {currentJob && currentJob.status === 'completed' && currentJob.result_file && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ResultViewer
              resultFile={currentJob.result_file}
              sourceFile={selectedSourceFile!}
              targetFile={selectedTargetFile!}
              onReprocess={handleReset}
            />
          </motion.div>
        )}

        {/* Help Section */}
        {!selectedSourceFile && !selectedTargetFile && (
          <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              How to Use Face Swap AI
            </Typography>
            <Box component="ol" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Upload a source file containing the face you want to use
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Upload a target file where you want to apply the face swap
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Select the specific faces you want to swap (auto-detected for convenience)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Click "Start Face Swap" and wait for processing to complete
              </Typography>
              <Typography component="li" variant="body2">
                Download your amazing result!
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;