import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, FileInfo, FaceDetectionResponse, JobInfo, FaceSwapRequest, FaceSwapResponse, SwapFacesSyncResponse, ProcessingStats, HealthStatus } from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // You can add auth tokens here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Handle unauthorized
          console.error('Unauthorized access');
        } else if (error.response?.status === 429) {
          // Handle rate limiting
          console.error('Rate limit exceeded');
        } else if (error.code === 'ECONNABORTED') {
          // Handle timeout
          console.error('Request timeout');
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(method: string, url: string, data?: any): Promise<T> {
    try {
      const response = await this.api.request<ApiResponse<T>>({
        method,
        url,
        data,
      });

      if (response.data.success) {
        return response.data.data as T;
      } else {
        throw new Error(response.data.error || 'Request failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  // File Upload
  async uploadFile(file: File): Promise<FileInfo> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for file uploads
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  // Face Detection
  async detectFaces(fileId: string, confidenceThreshold = 0.5, minQuality = 0.4): Promise<FaceDetectionResponse> {
    return this.request('POST', '/detect-faces', {
      file_id: fileId,
      confidence_threshold: confidenceThreshold,
      min_quality: minQuality,
    });
  }

  async detectFacesInFrame(imageData: string, confidenceThreshold = 0.5): Promise<FaceDetectionResponse> {
    return this.request('POST', '/detect-faces-frame', {
      image_data: imageData,
      confidence_threshold: confidenceThreshold,
    });
  }

  async detectFacesInVideoFrame(fileId: string, frameNumber: number, confidenceThreshold = 0.5): Promise<FaceDetectionResponse> {
    return this.request('POST', '/detect-faces-frame', {
      file_id: fileId,
      frame_number: frameNumber,
      confidence_threshold: confidenceThreshold,
    });
  }

  // Face Swap
  async swapFaces(request: FaceSwapRequest): Promise<FaceSwapResponse> {
    return this.request('POST', '/swap-faces', request);
  }

  async swapFacesSync(request: FaceSwapRequest): Promise<SwapFacesSyncResponse> {
    return this.request('POST', '/swap-faces-sync', request);
  }

  // Job Management
  async getJobStatus(jobId: string): Promise<JobInfo> {
    return this.request('GET', `/status/${jobId}`);
  }

  async getAllJobs(limit = 20, offset = 0, statusFilter?: string): Promise<{ jobs: JobInfo[]; total_count: number; limit: number; offset: number }> {
    const params: any = { limit, offset };
    if (statusFilter) {
      params.status = statusFilter;
    }
    return this.request('GET', '/status', params);
  }

  async cancelJob(jobId: string): Promise<{ job_id: string; status: string }> {
    return this.request('POST', `/cancel-job/${jobId}`);
  }

  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const response = await this.api.get(`/download/${fileId}`, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  // System
  async getProcessingStats(): Promise<ProcessingStats> {
    return this.request('GET', '/stats');
  }

  async healthCheck(): Promise<HealthStatus> {
    return this.request('GET', '/health');
  }

  // Utility methods
  getDownloadUrl(fileId: string): string {
    return `${this.api.defaults.baseURL}/download/${fileId}`;
  }

  getFileUrl(fileId: string): string {
    return `${this.api.defaults.baseURL}/files/${fileId}`;
  }

  // WebSocket connection (would need socket.io-client)
  connectToJobUpdates(jobId: string, callbacks: {
    onProgress?: (progress: number) => void;
    onComplete?: (data: any) => void;
    onError?: (error: string) => void;
  }) {
    // This would be implemented with socket.io-client
    // For now, return a mock object
    return {
      disconnect: () => {},
    };
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export individual methods for convenience
export const {
  uploadFile,
  detectFaces,
  detectFacesInFrame,
  detectFacesInVideoFrame,
  swapFaces,
  swapFacesSync,
  getJobStatus,
  getAllJobs,
  cancelJob,
  downloadFile,
  getProcessingStats,
  healthCheck,
  getDownloadUrl,
  getFileUrl,
  connectToJobUpdates,
} = apiService;

export default apiService;