import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Button,
  Container,
} from '@mui/material';
import {
  CheckCircle,
  Face,
  Image,
  VideoFile,
  Speed,
  Security,
  CloudUpload,
  Download,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Image />,
      title: 'Image Face Swapping',
      description: 'Swap faces in photos with amazing quality and natural results.',
    },
    {
      icon: <VideoFile />,
      title: 'Video Face Swapping',
      description: 'Apply face swaps to videos with frame-by-frame processing.',
    },
    {
      icon: <Speed />,
      title: 'Fast Processing',
      description: 'Advanced AI algorithms provide quick results without compromising quality.',
    },
    {
      icon: <Security />,
      title: 'Privacy First',
      description: 'Your files are processed securely and automatically cleaned up after 24 hours.',
    },
    {
      icon: <CloudUpload />,
      title: 'Easy Upload',
      description: 'Drag and drop interface supporting multiple image and video formats.',
    },
    {
      icon: <Download />,
      title: 'High-Quality Downloads',
      description: 'Get your results in high resolution with no watermarks.',
    },
  ];

  const supportedFormats = {
    images: ['JPEG', 'PNG', 'WebP'],
    videos: ['MP4', 'MOV', 'AVI'],
  };

  const technology = [
    'InsightFace - Advanced face detection',
    'FaceFusion - Professional face swapping',
    'OpenCV - Computer vision processing',
    'FFmpeg - Video handling',
    'Machine Learning - AI-powered results',
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h3"
            gutterBottom
            textAlign="center"
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            About Face Swap AI
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6 }}
          >
            Cutting-edge AI technology for seamless face swapping in images and videos
          </Typography>
        </motion.div>

        {/* Main Description */}
        <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>
                Revolutionary Face Swapping Technology
              </Typography>
              <Typography variant="body1" paragraph>
                Face Swap AI leverages state-of-the-art artificial intelligence to deliver
                professional-quality face swapping capabilities. Our advanced algorithms
                can detect, analyze, and seamlessly replace faces in both images and videos
                with stunning realism.
              </Typography>
              <Typography variant="body1" paragraph>
                Whether you're creating content for social media, working on film projects,
                or just having fun with friends, our technology provides an intuitive
                and powerful solution for all your face swapping needs.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Face />}
                onClick={() => navigate('/')}
                sx={{ mt: 2 }}
              >
                Try Face Swap Now
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  <Face
                    sx={{
                      fontSize: 120,
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      borderRadius: '50%',
                      p: 2,
                      color: 'white',
                    }}
                  />
                </motion.div>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Features Grid */}
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Key Features
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {React.cloneElement(feature.icon, { sx: { fontSize: 48 } })}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Supported Formats */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Supported Image Formats
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {supportedFormats.images.map((format) => (
                  <Chip key={format} label={format} variant="outlined" />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Maximum file size: 50MB
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="High-quality JPEG processing" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="PNG transparency support" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Modern WebP format" />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Supported Video Formats
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {supportedFormats.videos.map((format) => (
                  <Chip key={format} label={format} variant="outlined" />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Maximum file size: 500MB | Duration: 10 minutes
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Smart frame sampling" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Audio preservation" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Multiple resolution support" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Technology Stack */}
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Powered by Advanced AI Technology
          </Typography>
          <Typography variant="body1" paragraph>
            Our face swapping technology combines multiple state-of-the-art AI models
            and computer vision techniques to deliver the best possible results:
          </Typography>
          <Grid container spacing={2}>
            {technology.map((tech, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="body2">{tech}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Privacy & Security */}
        <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
          <Typography variant="h5" gutterBottom>
            Privacy & Security
          </Typography>
          <Typography variant="body1" paragraph>
            We take your privacy seriously. Our platform is designed with security
            and privacy protection as top priorities:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Automatic File Cleanup"
                secondary="All uploaded and processed files are automatically deleted after 24 hours"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Secure Processing"
                secondary="Files are processed in a secure environment with encryption"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="No User Tracking"
                secondary="We don't store personal information or track user behavior"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Local Processing Option"
                secondary="All processing happens on our secure servers"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Call to Action */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Ready to Try Face Swap AI?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Join thousands of users creating amazing content with our AI-powered face swapping technology
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Face />}
            onClick={() => navigate('/')}
            sx={{ px: 4 }}
          >
            Start Creating Now
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default AboutPage;