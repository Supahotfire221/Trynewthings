"""
File utility functions for handling uploads and thumbnails.
"""
import os
import cv2
from PIL import Image, ImageOps
from moviepy.editor import VideoFileClip

def generate_thumbnail(file_path, file_id, file_type, upload_folder):
    """Generate thumbnail for images and videos."""
    if file_type == 'image':
        return generate_image_thumbnail(file_path, file_id, upload_folder)
    elif file_type == 'video':
        return generate_video_thumbnail(file_path, file_id, upload_folder)
    return None

def generate_image_thumbnail(file_path, file_id, upload_folder, size=(300, 300)):
    """Generate thumbnail for image files."""
    try:
        # Create thumbnails directory
        thumbnails_dir = os.path.join(upload_folder, 'thumbnails')
        os.makedirs(thumbnails_dir, exist_ok=True)

        # Open and process image
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')

            # Generate thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)

            # Create new image with white background
            thumbnail = Image.new('RGB', size, (255, 255, 255))

            # Calculate position to center the image
            img_width, img_height = img.size
            offset = ((size[0] - img_width) // 2, (size[1] - img_height) // 2)

            # Paste image onto background
            thumbnail.paste(img, offset)

            # Save thumbnail
            thumbnail_path = os.path.join(thumbnails_dir, f"{file_id}_thumb.jpg")
            thumbnail.save(thumbnail_path, 'JPEG', quality=85, optimize=True)

            return thumbnail_path

    except Exception as e:
        print(f"Error generating image thumbnail: {e}")
        return None

def generate_video_thumbnail(file_path, file_id, upload_folder, size=(300, 300), time_offset=1):
    """Generate thumbnail for video files."""
    try:
        # Create thumbnails directory
        thumbnails_dir = os.path.join(upload_folder, 'thumbnails')
        os.makedirs(thumbnails_dir, exist_ok=True)

        thumbnail_path = os.path.join(thumbnails_dir, f"{file_id}_thumb.jpg")

        # Use OpenCV to extract frame
        cap = cv2.VideoCapture(file_path)

        # Seek to time_offset seconds
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(time_offset * cap.get(cv2.CAP_PROP_FPS)))

        ret, frame = cap.read()
        cap.release()

        if not ret:
            return None

        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Create PIL Image
        img = Image.fromarray(frame_rgb)

        # Generate thumbnail
        img.thumbnail(size, Image.Resampling.LANCZOS)

        # Create new image with black background
        thumbnail = Image.new('RGB', size, (0, 0, 0))

        # Calculate position to center the image
        img_width, img_height = img.size
        offset = ((size[0] - img_width) // 2, (size[1] - img_height) // 2)

        # Paste image onto background
        thumbnail.paste(img, offset)

        # Save thumbnail
        thumbnail.save(thumbnail_path, 'JPEG', quality=85, optimize=True)

        return thumbnail_path

    except Exception as e:
        print(f"Error generating video thumbnail: {e}")
        return None

def validate_file_content(file_path, expected_type):
    """Validate that file content matches expected type."""
    try:
        if expected_type == 'image':
            # Try to open with PIL
            with Image.open(file_path) as img:
                img.verify()
            return True
        elif expected_type == 'video':
            # Try to open with OpenCV
            cap = cv2.VideoCapture(file_path)
            ret = cap.read()[0]
            cap.release()
            return ret
    except Exception as e:
        print(f"File validation error: {e}")
        return False

    return False

def cleanup_old_files(directory, max_age_hours=24):
    """Clean up files older than max_age_hours."""
    try:
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600

        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > max_age_seconds:
                    try:
                        os.remove(file_path)
                        print(f"Removed old file: {filename}")
                    except Exception as e:
                        print(f"Error removing file {filename}: {e}")
    except Exception as e:
        print(f"Error during cleanup: {e}")

def get_video_info(file_path):
    """Get video information like duration, resolution, fps."""
    try:
        cap = cv2.VideoCapture(file_path)

        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps if fps > 0 else 0

        cap.release()

        return {
            'duration': duration,
            'fps': fps,
            'frame_count': frame_count,
            'width': width,
            'height': height,
            'resolution': f"{width}x{height}"
        }
    except Exception as e:
        print(f"Error getting video info: {e}")
        return None

def get_image_info(file_path):
    """Get image information like dimensions, size."""
    try:
        with Image.open(file_path) as img:
            return {
                'width': img.width,
                'height': img.height,
                'mode': img.mode,
                'format': img.format,
                'resolution': f"{img.width}x{img.height}"
            }
    except Exception as e:
        print(f"Error getting image info: {e}")
        return None