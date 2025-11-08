"""
InsightFace integration for face detection and analysis.
"""
import cv2
import numpy as np
import os
from typing import List, Dict, Tuple, Optional
import insightface
from insightface.app import FaceAnalysis

class InsightFaceHandler:
    """Handler for InsightFace face detection and analysis."""

    def __init__(self, model_name='buffalo_l', det_size=(640, 640)):
        """Initialize InsightFace handler."""
        self.model_name = model_name
        self.det_size = det_size
        self.face_analyzer = None
        self.model_loaded = False

    def load_model(self):
        """Load InsightFace model."""
        try:
            if self.model_loaded:
                return True

            print(f"Loading InsightFace model: {self.model_name}")
            self.face_analyzer = FaceAnalysis(name=self.model_name, root='models')
            self.face_analyzer.prepare(ctx_id=0, det_size=self.det_size)
            self.model_loaded = True
            print("InsightFace model loaded successfully")
            return True

        except Exception as e:
            print(f"Error loading InsightFace model: {e}")
            return False

    def detect_faces(self, image_path: str, confidence_threshold: float = 0.5) -> List[Dict]:
        """
        Detect faces in an image and return face information.

        Args:
            image_path: Path to the image file
            confidence_threshold: Minimum confidence score for face detection

        Returns:
            List of dictionaries containing face information
        """
        if not self.model_loaded:
            if not self.load_model():
                raise Exception("Failed to load InsightFace model")

        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")

            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Detect faces
            faces = self.face_analyzer.get(image_rgb)

            face_data = []
            for i, face in enumerate(faces):
                if face.det_score < confidence_threshold:
                    continue

                # Get face bounding box
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = bbox

                # Calculate face quality based on size and other factors
                face_width = x2 - x1
                face_height = y2 - y1
                face_area = face_width * face_height

                # Quality assessment based on face size and confidence
                quality_score = self._assess_face_quality(face_width, face_height, face.det_score)
                quality_label = self._get_quality_label(quality_score)

                face_info = {
                    'face_id': i,
                    'bbox': {
                        'x1': int(x1),
                        'y1': int(y1),
                        'x2': int(x2),
                        'y2': int(y2),
                        'width': int(face_width),
                        'height': int(face_height)
                    },
                    'confidence': float(face.det_score),
                    'quality_score': quality_score,
                    'quality_label': quality_label,
                    'landmarks': face.kps.astype(int).tolist() if hasattr(face, 'kps') else None,
                    'embedding': face.embedding.tolist() if hasattr(face, 'embedding') else None,
                    'age': int(face.age) if hasattr(face, 'age') else None,
                    'gender': face.gender if hasattr(face, 'gender') else None,
                    'face_area': int(face_area)
                }

                face_data.append(face_info)

            return face_data

        except Exception as e:
            print(f"Error detecting faces: {e}")
            raise

    def detect_faces_in_video_frame(self, frame: np.ndarray, confidence_threshold: float = 0.5) -> List[Dict]:
        """
        Detect faces in a video frame.

        Args:
            frame: Video frame as numpy array (BGR format)
            confidence_threshold: Minimum confidence score for face detection

        Returns:
            List of dictionaries containing face information
        """
        if not self.model_loaded:
            if not self.load_model():
                raise Exception("Failed to load InsightFace model")

        try:
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Detect faces
            faces = self.face_analyzer.get(frame_rgb)

            face_data = []
            for i, face in enumerate(faces):
                if face.det_score < confidence_threshold:
                    continue

                # Get face bounding box
                bbox = face.bbox.astype(int)
                x1, y1, x2, y2 = bbox

                # Calculate face quality
                face_width = x2 - x1
                face_height = y2 - y1
                face_area = face_width * face_height
                quality_score = self._assess_face_quality(face_width, face_height, face.det_score)
                quality_label = self._get_quality_label(quality_score)

                face_info = {
                    'face_id': i,
                    'bbox': {
                        'x1': int(x1),
                        'y1': int(y1),
                        'x2': int(x2),
                        'y2': int(y2),
                        'width': int(face_width),
                        'height': int(face_height)
                    },
                    'confidence': float(face.det_score),
                    'quality_score': quality_score,
                    'quality_label': quality_label,
                    'landmarks': face.kps.astype(int).tolist() if hasattr(face, 'kps') else None,
                    'embedding': face.embedding.tolist() if hasattr(face, 'embedding') else None,
                    'face_area': int(face_area)
                }

                face_data.append(face_info)

            return face_data

        except Exception as e:
            print(f"Error detecting faces in video frame: {e}")
            raise

    def _assess_face_quality(self, width: int, height: int, confidence: float) -> float:
        """
        Assess face quality based on size and detection confidence.

        Args:
            width: Face width in pixels
            height: Face height in pixels
            confidence: Detection confidence score

        Returns:
            Quality score between 0 and 1
        """
        # Size scoring (prefers faces between 100x100 and 500x500 pixels)
        size_score = min(1.0, (width * height) / (200 * 200))  # Normalize to 200x200 as baseline
        size_score = min(size_score, 1.0)  # Cap at 1.0

        # Penalize very large faces (likely too close)
        if width > 800 or height > 800:
            size_score *= 0.7

        # Combine size and confidence
        quality_score = (size_score * 0.4) + (confidence * 0.6)

        return min(1.0, quality_score)

    def _get_quality_label(self, quality_score: float) -> str:
        """Get quality label based on quality score."""
        if quality_score >= 0.8:
            return "excellent"
        elif quality_score >= 0.6:
            return "good"
        elif quality_score >= 0.4:
            return "fair"
        else:
            return "poor"

    def get_best_face(self, faces: List[Dict]) -> Optional[Dict]:
        """
        Get the best quality face from a list of detected faces.

        Args:
            faces: List of face dictionaries

        Returns:
            Best quality face dictionary or None
        """
        if not faces:
            return None

        # Sort by quality score
        sorted_faces = sorted(faces, key=lambda x: x['quality_score'], reverse=True)
        return sorted_faces[0]

    def filter_faces_by_quality(self, faces: List[Dict], min_quality: float = 0.4) -> List[Dict]:
        """
        Filter faces by minimum quality threshold.

        Args:
            faces: List of face dictionaries
            min_quality: Minimum quality score threshold

        Returns:
            Filtered list of faces
        """
        return [face for face in faces if face['quality_score'] >= min_quality]

    def compare_faces(self, face1_embedding: List[float], face2_embedding: List[float], threshold: float = 0.6) -> bool:
        """
        Compare two face embeddings to determine if they're the same person.

        Args:
            face1_embedding: First face embedding
            face2_embedding: Second face embedding
            threshold: Similarity threshold

        Returns:
            True if faces are likely the same person
        """
        try:
            # Convert to numpy arrays
            emb1 = np.array(face1_embedding)
            emb2 = np.array(face2_embedding)

            # Calculate cosine similarity
            dot_product = np.dot(emb1, emb2)
            norm1 = np.linalg.norm(emb1)
            norm2 = np.linalg.norm(emb2)

            if norm1 == 0 or norm2 == 0:
                return False

            cosine_similarity = dot_product / (norm1 * norm2)
            return cosine_similarity >= threshold

        except Exception as e:
            print(f"Error comparing faces: {e}")
            return False

# Global instance
face_detector = InsightFaceHandler()