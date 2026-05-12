import os
from datetime import datetime
from database import db
from auth.models import Accident, Alert


class AlertEngine:
    def __init__(self):
        self.email_service = None
        self.sms_service = None
        self.socket_manager = None

    def initialize(self, email_service, sms_service, socket_manager):
        """Initialize with services"""
        self.email_service = email_service
        self.sms_service = sms_service
        self.socket_manager = socket_manager
        print("✅ Alert Engine initialized!")

    def process_accident(self, app, accident_data):
        """Main function — process detected accident"""
        with app.app_context():
            try:
                print(f"🚨 Processing accident: {accident_data['accident_type']}")

                # Step 1 — Save accident to database
                accident = self._save_accident(accident_data)
                if not accident:
                    return

                # Step 2 — Create alert
                alert = self._create_alert(accident, accident_data['severity'])
                if not alert:
                    return

                # Step 3 — Send email
                if self.email_service:
                    email_sent = self.email_service.send_alert(
                        accident_data,
                        accident.id
                    )
                    alert.email_sent = email_sent
                    db.session.commit()

                # Step 4 — Send SMS
                if self.sms_service:
                    sms_sent = self.sms_service.send_alert(accident_data)
                    alert.sms_sent = sms_sent
                    db.session.commit()

                # Step 5 — Push to dashboard via WebSocket
                if self.socket_manager:
                    self.socket_manager.emit_accident({
                        'accident_id': accident.id,
                        'alert_id': alert.id,
                        'accident_type': accident_data['accident_type'],
                        'severity': accident_data['severity'],
                        'camera_name': accident_data['camera_name'],
                        'location': accident_data['camera_location'],
                        'timestamp': accident_data['timestamp'],
                        'screenshot': accident_data.get('screenshot_path'),
                    })

                print(f"✅ Alert processed successfully!")
                print(f"   Accident ID: {accident.id}")
                print(f"   Alert ID: {alert.id}")
                print(f"   Email sent: {alert.email_sent}")
                print(f"   SMS sent: {alert.sms_sent}")

            except Exception as e:
                print(f"❌ Alert processing error: {e}")

    def _save_accident(self, data):
        """Save accident to database"""
        try:
            accident = Accident(
                camera_id=data['camera_id'],
                accident_type=data['accident_type'],
                vehicles_involved=data.get('vehicles_involved', 0),
                persons_involved=data.get('persons_involved', 0),
                confidence=data['confidence'],
                screenshot_path=data.get('screenshot_path'),
                road_name=data.get('road_name', 'Highway'),
                location_lat=data.get('location_lat'),
                location_lng=data.get('location_lng'),
                timestamp=datetime.utcnow()
            )
            db.session.add(accident)
            db.session.commit()
            print(f"✅ Accident saved to database! ID: {accident.id}")
            return accident
        except Exception as e:
            print(f"❌ Error saving accident: {e}")
            return None

    def _create_alert(self, accident, severity):
        """Create alert record"""
        try:
            alert = Alert(
                accident_id=accident.id,
                severity=severity,
                email_sent=False,
                sms_sent=False,
                acknowledged=False,
                created_at=datetime.utcnow()
            )
            db.session.add(alert)
            db.session.commit()
            print(f"✅ Alert created! ID: {alert.id} Severity: {severity}")
            return alert
        except Exception as e:
            print(f"❌ Error creating alert: {e}")
            return None

    def acknowledge_alert(self, alert_id, username):
        """Acknowledge an alert"""
        try:
            alert = Alert.query.get(alert_id)
            if not alert:
                return False, "Alert not found"

            alert.acknowledged = True
            alert.acknowledged_by = username
            alert.acknowledged_at = datetime.utcnow()
            db.session.commit()

            print(f"✅ Alert {alert_id} acknowledged by {username}")
            return True, "Alert acknowledged!"
        except Exception as e:
            print(f"❌ Error acknowledging alert: {e}")
            return False, str(e)


# Singleton instance
alert_engine = AlertEngine()


def get_alert_engine():
    return alert_engine