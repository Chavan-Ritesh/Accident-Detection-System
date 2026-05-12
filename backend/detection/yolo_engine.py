import cv2
import torch
import numpy as np
from ultralytics import YOLO
from datetime import datetime
import os


class YOLOEngine:
    def __init__(self, model_path='yolov8n.pt', confidence=0.5):
        print("🔄 Loading YOLOv8 model...")
        self.model = YOLO(model_path)
        self.confidence = confidence
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"✅ YOLOv8 loaded! Running on: {self.device}")

        # Vehicle & person classes from COCO dataset
        self.vehicle_classes = {
            2: 'car',
            3: 'motorcycle',
            5: 'bus',
            7: 'truck',
            1: 'bicycle',
        }
        self.person_class = 0  # person

        # Upload folder for screenshots
        self.upload_folder = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'uploads'
        )
        os.makedirs(self.upload_folder, exist_ok=True)

    def detect(self, frame):
        """Run YOLOv8 detection on a frame"""
        try:
            results = self.model(
                frame,
                conf=0.25,  # Use the confidence threshold from .env
                device=self.device,
                verbose=False
            )

            vehicles = []
            persons = []
            annotated_frame = frame.copy()

            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    bbox = [x1, y1, x2, y2]

                    if class_id == self.person_class:
                        persons.append({
                            'bbox': bbox,
                            'confidence': confidence,
                            'label': 'person'
                        })

                    elif class_id in self.vehicle_classes:
                        vehicles.append({
                            'bbox': bbox,
                            'confidence': confidence,
                            'label': self.vehicle_classes[class_id]
                        })

            # Draw all detections
            for obj in persons + vehicles:
                x1, y1, x2, y2 = obj['bbox']
                color = (0, 255, 0)  # Green by default
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                label_text = f"{obj['label']} {obj['confidence']:.0%}"
                cv2.putText(
                    annotated_frame,
                    label_text,
                    (x1, y1 - 8),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

            # Add timestamp
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cv2.putText(
                annotated_frame,
                timestamp,
                (10, annotated_frame.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )

            return annotated_frame, vehicles, persons

        except Exception as e:
            print(f"❌ Detection error: {e}")
            return frame, [], []

    def save_screenshot(self, frame, accident_type, camera_id):
        """Save screenshot as evidence"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'{accident_type}_{camera_id}_{timestamp}.jpg'
            filepath = os.path.join(self.upload_folder, filename)
            cv2.imwrite(filepath, frame)
            print(f"📸 Screenshot saved: {filename}")
            return filename
        except Exception as e:
            print(f"❌ Screenshot error: {e}")
            return None

    def draw_accident(self, frame, accident_type, boxes):
        """Draw accident overlay on frame"""
        # Red overlay for accident area
        overlay = frame.copy()
        for box in boxes:
            x1, y1, x2, y2 = box
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 255), -1)
        cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)

        # Accident label
        label_map = {
            'COLLISION': '🚗 COLLISION DETECTED!',
            'ROLLOVER': '🔄 ROLLOVER DETECTED!',
            'PERSON_HIT': '🚨 PERSON HIT DETECTED!'
        }
        label = label_map.get(accident_type, '⚠ ACCIDENT DETECTED!')

        cv2.putText(
            frame,
            label,
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 255),
            3
        )
        return frame


# Singleton instance
yolo_engine = None


def get_yolo_engine():
    global yolo_engine
    if yolo_engine is None:
        confidence = float(os.getenv('DETECTION_CONFIDENCE', 0.5))
        yolo_engine = YOLOEngine(confidence=confidence)
    return yolo_engine