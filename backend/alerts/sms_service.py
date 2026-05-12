import os
from datetime import datetime


class SMSService:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.to_number = os.getenv('ALERT_PHONE_NUMBER')
        self.client = None
        self._initialize()

    def _initialize(self):
        """Initialize Twilio client"""
        try:
            if self.account_sid and self.auth_token:
                from twilio.rest import Client
                self.client = Client(self.account_sid, self.auth_token)
                print("✅ Twilio SMS service initialized!")
            else:
                print("⚠ Twilio not configured — SMS alerts disabled")
        except Exception as e:
            print(f"⚠ Twilio initialization error: {e}")

    def send_alert(self, accident_data):
        """Send SMS alert to authorities"""
        try:
            if not self.client:
                print("⚠ SMS not configured — skipping SMS alert")
                return False

            message = self._build_message(accident_data)

            sms = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=self.to_number
            )

            print(f"✅ SMS sent! SID: {sms.sid}")
            return True

        except Exception as e:
            print(f"❌ SMS error: {e}")
            return False

    def _build_message(self, data):
        """Build SMS message text"""
        severity = data.get('severity', 'HIGH')
        accident_type = data.get('accident_type', 'ACCIDENT')
        location = data.get('camera_location', 'Highway')
        road_name = data.get('road_name', 'Highway')
        vehicles = data.get('vehicles_involved', 0)
        persons = data.get('persons_involved', 0)
        confidence = data.get('confidence', 0)
        camera = data.get('camera_name', 'Unknown')
        timestamp = datetime.now().strftime('%H:%M:%S')

        emoji = {
            'CRITICAL': '🔴',
            'HIGH': '🟠',
            'MEDIUM': '🟡',
            'LOW': '🟢'
        }.get(severity, '🔴')

        type_label = {
            'COLLISION': 'Vehicle Collision',
            'PERSON_HIT': 'Person Hit by Vehicle',
            'ROLLOVER': 'Vehicle Rollover'
        }.get(accident_type, 'Accident')

        message = f"""
{emoji} ACCIDENT ALERT [{severity}]

Type: {type_label}
Road: {road_name}
Location: {location}
Camera: {camera}
Time: {timestamp}
Vehicles: {vehicles}
Persons: {persons}
Confidence: {int(confidence * 100)}%

IMMEDIATE RESPONSE REQUIRED!
— Accident Detection System
        """.strip()

        return message


# Singleton instance
sms_service = SMSService()


def get_sms_service():
    return sms_service