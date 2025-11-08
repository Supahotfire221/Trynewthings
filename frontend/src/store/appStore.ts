import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FileInfo, FaceInfo, JobInfo } from '@/types';

interface AppStore {
  // UI State
  darkMode: boolean;
  toggleDarkMode: () => void;

  // File Management
  uploadedFiles: FileInfo[];
  addUploadedFile: (file: FileInfo) => void;
  removeUploadedFile: (fileId: string) => void;
  clearUploadedFiles: () => void;

  // File Selection
  selectedSourceFile: FileInfo | null;
  setSelectedSourceFile: (file: FileInfo | null) => void;
  selectedTargetFile: FileInfo | null;
  setSelectedTargetFile: (file: FileInfo | null) => void;

  // Face Detection
  detectedSourceFaces: FaceInfo[];
  setDetectedSourceFaces: (faces: FaceInfo[]) => void;
  detectedTargetFaces: FaceInfo[];
  setDetectedTargetFaces: (faces: FaceInfo[]) => void;

  // Face Selection
  selectedSourceFace: FaceInfo | null;
  setSelectedSourceFace: (face: FaceInfo | null) => void;
  selectedTargetFace: FaceInfo | null;
  setSelectedTargetFace: (face: FaceInfo | null) => void;

  // Job Processing
  currentJob: JobInfo | null;
  setCurrentJob: (job: JobInfo | null) => void;
  updateJobProgress: (progress: number) => void;
  updateJobStatus: (status: string, errorMessage?: string) => void;

  // UI State
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // UI State
      darkMode: true,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // File Management
      uploadedFiles: [],
      addUploadedFile: (file) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
        })),
      removeUploadedFile: (fileId) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.file_id !== fileId),
        })),
      clearUploadedFiles: () => set({ uploadedFiles: [] }),

      // File Selection
      selectedSourceFile: null,
      setSelectedSourceFile: (file) => set({ selectedSourceFile: file }),
      selectedTargetFile: null,
      setSelectedTargetFile: (file) => set({ selectedTargetFile: file }),

      // Face Detection
      detectedSourceFaces: [],
      setDetectedSourceFaces: (faces) => set({ detectedSourceFaces: faces }),
      detectedTargetFaces: [],
      setDetectedTargetFaces: (faces) => set({ detectedTargetFaces: faces }),

      // Face Selection
      selectedSourceFace: null,
      setSelectedSourceFace: (face) => set({ selectedSourceFace: face }),
      selectedTargetFace: null,
      setSelectedTargetFace: (face) => set({ selectedTargetFace: face }),

      // Job Processing
      currentJob: null,
      setCurrentJob: (job) => set({ currentJob: job }),
      updateJobProgress: (progress) =>
        set((state) => ({
          currentJob: state.currentJob
            ? { ...state.currentJob, progress }
            : null,
        })),
      updateJobStatus: (status, errorMessage) =>
        set((state) => ({
          currentJob: state.currentJob
            ? { ...state.currentJob, status: status as any, error_message: errorMessage }
            : null,
        })),

      // UI State
      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),

      // Reset
      reset: () =>
        set({
          selectedSourceFile: null,
          selectedTargetFile: null,
          detectedSourceFaces: [],
          detectedTargetFaces: [],
          selectedSourceFace: null,
          selectedTargetFace: null,
          currentJob: null,
          isProcessing: false,
        }),
    }),
    {
      name: 'faceswap-app-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        uploadedFiles: state.uploadedFiles,
      }),
    }
  )
);

// Selectors for commonly used combinations
export const useSelectedFiles = () => {
  const selectedSourceFile = useAppStore((state) => state.selectedSourceFile);
  const selectedTargetFile = useAppStore((state) => state.selectedTargetFile);
  return { selectedSourceFile, selectedTargetFile };
};

export const useDetectedFaces = () => {
  const detectedSourceFaces = useAppStore((state) => state.detectedSourceFaces);
  const detectedTargetFaces = useAppStore((state) => state.detectedTargetFaces);
  const selectedSourceFace = useAppStore((state) => state.selectedSourceFace);
  const selectedTargetFace = useAppStore((state) => state.selectedTargetFace);
  return {
    detectedSourceFaces,
    detectedTargetFaces,
    selectedSourceFace,
    selectedTargetFace,
  };
};

export const useJobState = () => {
  const currentJob = useAppStore((state) => state.currentJob);
  const isProcessing = useAppStore((state) => state.isProcessing);
  return { currentJob, isProcessing };
};