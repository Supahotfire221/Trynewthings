# Face Swap AI

An advanced AI-powered face swapping application for images and videos, built with Flask (backend) and React (frontend).

## Features

- 🖼️ **Image Face Swapping** - Swap faces in photos with amazing quality
- 🎥 **Video Face Swapping** - Apply face swaps to videos with frame-by-frame processing
- 🤖 **AI-Powered** - Uses InsightFace and FaceFusion for professional results
- 🚀 **Fast Processing** - Optimized algorithms for quick results
- 🔒 **Privacy-First** - Automatic file cleanup after 24 hours
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **High-Quality Downloads** - No watermarks, full resolution output

## Technology Stack

### Backend
- **Flask** - Web framework
- **InsightFace** - Advanced face detection
- **FaceFusion** - Professional face swapping
- **Celery** - Background job processing
- **Redis** - Queue management
- **PostgreSQL** - Database
- **OpenCV** - Computer vision
- **FFmpeg** - Video processing

### Frontend
- **React** with TypeScript
- **Material-UI** - Component library
- **Framer Motion** - Animations
- **React Query** - Data fetching
- **Zustand** - State management

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.9+ (for local development)
- Node.js 16+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Trynewthings
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Local Development

#### Backend Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up database**
   ```bash
   # Install PostgreSQL and create database
   # Then update DATABASE_URL in app/__init__.py
   ```

4. **Start Redis server**
   ```bash
   redis-server
   ```

5. **Start Celery worker**
   ```bash
   celery -A app.services.job_processor worker --loglevel=info
   ```

6. **Start the Flask app**
   ```bash
   python run.py
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

## API Endpoints

### File Management
- `POST /api/upload` - Upload files
- `GET /api/files/{file_id}` - Get file information
- `GET /api/download/{file_id}` - Download processed files

### Face Detection
- `POST /api/detect-faces` - Detect faces in files
- `POST /api/detect-faces-frame` - Detect faces in video frames

### Face Swapping
- `POST /api/swap-faces` - Start async face swap job
- `POST /api/swap-faces-sync` - Synchronous face swap

### Job Management
- `GET /api/status/{job_id}` - Get job status
- `GET /api/status` - Get all jobs
- `POST /api/cancel-job/{job_id}` - Cancel processing job

### System
- `GET /api/health` - Health check
- `GET /api/stats` - Processing statistics

## Supported Formats

### Images
- **Formats**: JPEG, PNG, WebP
- **Maximum size**: 50MB
- **Recommended resolution**: 720p or higher

### Videos
- **Formats**: MP4, MOV, AVI
- **Maximum size**: 500MB
- **Maximum duration**: 10 minutes
- **Recommended resolution**: 720p or higher

## Configuration

### Environment Variables

#### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `UPLOAD_FOLDER` - File upload directory
- `PROCESSED_FOLDER` - Processed files directory
- `MAX_CONTENT_LENGTH` - Maximum upload size (bytes)

#### Frontend
- `REACT_APP_API_URL` - Backend API URL

## AI Models

The application uses several AI models for face detection and swapping:

- **InsightFace** - Face detection and analysis
- **FaceFusion Models**:
  - `inswapper_128` - Fast processing (default)
  - `blendswap_256` - Higher quality
  - `simswap_256` - Balanced approach

## Security & Privacy

- **No Watermarks**: Results are clean without any watermarks
- **Automatic Cleanup**: Files are deleted after 24 hours
- **Secure Processing**: All processing happens in isolated environments
- **No User Tracking**: We don't collect personal information

## Development

### Project Structure

```
Trynewthings/
├── backend/                 # Flask API server
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── ai/              # AI model handlers
│   │   └── utils/           # Utility functions
│   ├── uploads/             # User uploaded files
│   ├── processed/           # Processed results
│   └── requirements.txt
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API calls
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   └── package.json
└── docker-compose.yml       # Development environment
```

### Adding New Features

1. **Backend**: Add new routes in `backend/app/routes/`
2. **Frontend**: Create components in `frontend/src/components/`
3. **AI Models**: Update handlers in `backend/app/ai/`

## Troubleshooting

### Common Issues

1. **Docker Issues**:
   ```bash
   docker-compose down -v  # Clean up volumes
   docker-compose up -d   # Restart services
   ```

2. **Memory Issues**:
   - Reduce `MAX_CONTENT_LENGTH` in backend config
   - Use smaller input files
   - Close unused applications

3. **AI Model Loading**:
   - Ensure sufficient disk space for model downloads
   - Check internet connectivity for first-time model download

4. **Database Issues**:
   ```bash
   docker-compose exec postgres psql -U faceswap -d faceswap
   ```

### Performance Tips

- Use GPU acceleration for AI models (CUDA setup required)
- Optimize input file sizes before uploading
- Use `inswapper_128` model for faster processing
- Monitor resource usage with `docker stats`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational and development purposes. Please ensure you have proper rights to use and modify face images and videos.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub

---

**Built with ❤️ using cutting-edge AI technology**