import cv2
import threading
import time
import os
from datetime import datetime
from detection.yolo_engine import get_yolo_engine
from detection.accident_logic import get_accident_logic


class CameraStream:
    def __init__(self, camera_id, url, name, location):
        self.camera_id = camera_id
        self.url = url
        self.name = name
        self.location = location
        self.cap = None
        self.frame = None
        self.is_running = False
        self.thread = None
        self.last_accident_time = {}
        self.cooldown = int(os.getenv('ALERT_COOLDOWN', 30))
        self.accident_callback = None

    # ─── Start Stream ─────────────────────────────────────────────────────────
    def start(self, accident_callback=None):
        """Start camera stream in background thread"""
        self.accident_callback = accident_callback
        self.is_running = True
        self.thread = threading.Thread(
            target=self._stream_loop,
            daemon=True
        )
        self.thread.start()
        print(f"✅ Camera {self.camera_id} started: {self.name}")

    # ─── Stop Stream ──────────────────────────────────────────────────────────
    def stop(self):
        """Stop camera stream"""
        self.is_running = False
        if self.cap:
            self.cap.release()
        print(f"🛑 Camera {self.camera_id} stopped!")

    # ─── Stream Loop ──────────────────────────────────────────────────────────
    def _stream_loop(self):
        """Main loop — reads frames and runs detection"""
        yolo = get_yolo_engine()
        logic = get_accident_logic()

        while self.is_running:
            try:
                # Connect to camera
                if self.cap is None or not self.cap.isOpened():
                    print(f"🔄 Connecting to {self.name}...")
                    self.cap = cv2.VideoCapture(self.url)
                    if not self.cap.isOpened():
                        print(f"❌ Cannot connect to {self.name}. Retrying in 5s...")
                        time.sleep(5)
                        continue
                    print(f"✅ Connected to {self.name}!")

                # Read frame
                ret, frame = self.cap.read()
                if not ret:
                    print(f"⚠ Frame read failed for {self.name}. Reconnecting...")
                    self.cap.release()
                    self.cap = None
                    time.sleep(2)
                    continue

                # Run YOLOv8 detection
                annotated_frame, vehicles, persons = yolo.detect(frame)

                # Run accident logic
                accidents = logic.analyze(vehicles, persons)

                # Process accidents
                for accident in accidents:
                    self._handle_accident(
                        accident,
                        annotated_frame,
                        yolo,
                        vehicles,
                        persons
                    )

                # Store latest frame
                self.frame = annotated_frame

            except Exception as e:
                print(f"❌ Stream error on {self.name}: {e}")
                time.sleep(2)

    # ─── Handle Accident ──────────────────────────────────────────────────────
    def _handle_accident(self, accident, frame, yolo, vehicles, persons):
        """Handle detected accident — save screenshot & trigger alert"""
        accident_type = accident['accident_type']

        # Check cooldown to avoid duplicate alerts
        now = time.time()
        last_time = self.last_accident_time.get(accident_type, 0)
        if now - last_time < self.cooldown:
            return

        # Update cooldown
        self.last_accident_time[accident_type] = now

        # Draw accident overlay
        annotated = yolo.draw_accident(
            frame.copy(),
            accident_type,
            accident.get('boxes', [])
        )

        # Save screenshot
        screenshot = yolo.save_screenshot(
            annotated,
            accident_type,
            self.camera_id
        )

        # Build accident data
        accident_data = {
            'camera_id': self.camera_id,
            'camera_name': self.name,
            'camera_location': self.location,
            'accident_type': accident_type,
            'confidence': accident['confidence'],
            'vehicles_involved': accident.get('vehicles_involved', 0),
            'persons_involved': accident.get('persons_involved', 0),
            'severity': accident['severity'],
            'screenshot_path': screenshot,
            'road_name': os.getenv('ROAD_NAME', 'Highway'),
            'location_lat': float(os.getenv('LOCATION_LAT', 19.8762)),
            'location_lng': float(os.getenv('LOCATION_LNG', 75.3433)),
            'timestamp': datetime.now().isoformat()
        }

        print(f"🚨 ACCIDENT DETECTED!")
        print(f"   Type: {accident_type}")
        print(f"   Severity: {accident['severity']}")
        print(f"   Camera: {self.name}")
        print(f"   Screenshot: {screenshot}")

        # Trigger alert callback
        if self.accident_callback:
            self.accident_callback(accident_data)

    # ─── Get Latest Frame ─────────────────────────────────────────────────────
    def get_frame(self):
        """Get latest annotated frame as JPEG bytes"""
        if self.frame is None:
            return None
        try:
            _, buffer = cv2.imencode('.jpg', self.frame)
            return buffer.tobytes()
        except Exception:
            return None

    # ─── Get Status ───────────────────────────────────────────────────────────
    def get_status(self):
        """Get camera status"""
        return {
            'camera_id': self.camera_id,
            'name': self.name,
            'location': self.location,
            'url': self.url,
            'is_running': self.is_running,
            'is_connected': (
                self.cap is not None and
                self.cap.isOpened() and
                self.frame is not None
            ),
            'has_frame': self.frame is not None
        }


# ─── Camera Manager ───────────────────────────────────────────────────────────
class CameraManager:
    def __init__(self):
        self.cameras = {}

    def add_camera(self, camera_id, url, name, location, accident_callback=None):
        """Add and start a camera"""
        camera = CameraStream(camera_id, url, name, location)
        camera.start(accident_callback)
        self.cameras[camera_id] = camera
        return camera

    def get_camera(self, camera_id):
        return self.cameras.get(camera_id)

    def get_all_status(self):
        return [cam.get_status() for cam in self.cameras.values()]

    def stop_all(self):
        for camera in self.cameras.values():
            camera.stop()


# Singleton instance
camera_manager = CameraManager()


def get_camera_manager():
    return camera_manager