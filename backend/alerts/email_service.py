import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime


class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('MAIL_PORT', 587))
        self.username = os.getenv('MAIL_USERNAME')
        self.password = os.getenv('MAIL_PASSWORD')
        self.upload_folder = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'uploads'
        )

    def send_alert(self, accident_data, accident_id):
        """Send accident alert email with screenshot"""
        try:
            if not self.username or not self.password:
                print("⚠ Email not configured — skipping email alert")
                return False

            # Build email
            msg = MIMEMultipart('related')
            msg['Subject'] = self._get_subject(accident_data)
            msg['From'] = self.username
            msg['To'] = self.username  # Send to same email for now

            # HTML body
            html_body = self._build_html(accident_data, accident_id)
            msg.attach(MIMEText(html_body, 'html'))

            # Attach screenshot if exists
            screenshot = accident_data.get('screenshot_path')
            if screenshot:
                screenshot_path = os.path.join(self.upload_folder, screenshot)
                if os.path.exists(screenshot_path):
                    with open(screenshot_path, 'rb') as f:
                        img = MIMEImage(f.read())
                        img.add_header('Content-ID', '<screenshot>')
                        img.add_header(
                            'Content-Disposition',
                            'attachment',
                            filename=screenshot
                        )
                        msg.attach(img)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)

            print(f"✅ Email alert sent for accident {accident_id}!")
            return True

        except Exception as e:
            print(f"❌ Email error: {e}")
            return False

    def _get_subject(self, data):
        """Build email subject"""
        severity = data.get('severity', 'HIGH')
        accident_type = data.get('accident_type', 'ACCIDENT')
        location = data.get('camera_location', 'Highway')

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

        return f"{emoji} [{severity}] {type_label} Detected — {location}"

    def _build_html(self, data, accident_id):
        """Build HTML email body"""
        severity = data.get('severity', 'HIGH')
        accident_type = data.get('accident_type', 'UNKNOWN')
        camera_name = data.get('camera_name', 'Unknown Camera')
        location = data.get('camera_location', 'Unknown Location')
        road_name = data.get('road_name', 'Highway')
        vehicles = data.get('vehicles_involved', 0)
        persons = data.get('persons_involved', 0)
        confidence = data.get('confidence', 0)
        timestamp = data.get('timestamp', datetime.now().isoformat())

        severity_colors = {
            'CRITICAL': '#ef4444',
            'HIGH': '#f97316',
            'MEDIUM': '#eab308',
            'LOW': '#22c55e'
        }
        color = severity_colors.get(severity, '#ef4444')

        type_labels = {
            'COLLISION': '🚗 Vehicle Collision',
            'PERSON_HIT': '🚨 Person Hit by Vehicle',
            'ROLLOVER': '🔄 Vehicle Rollover'
        }
        type_label = type_labels.get(accident_type, '⚠ Accident')

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .header {{ background: {color}; padding: 24px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .header p {{ color: rgba(255,255,255,0.9); margin: 8px 0 0; }}
                .body {{ padding: 24px; }}
                .badge {{ display: inline-block; background: {color}20; color: {color}; border: 1px solid {color}40; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-bottom: 20px; }}
                .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }}
                .info-card {{ background: #f9fafb; border-radius: 8px; padding: 12px; }}
                .info-card .label {{ color: #6b7280; font-size: 12px; margin-bottom: 4px; }}
                .info-card .value {{ color: #111827; font-size: 16px; font-weight: bold; }}
                .screenshot {{ width: 100%; border-radius: 8px; margin: 16px 0; border: 2px solid {color}40; }}
                .footer {{ background: #f9fafb; padding: 16px 24px; text-align: center; color: #6b7280; font-size: 12px; }}
                .alert-btn {{ display: block; background: {color}; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Accident Alert</h1>
                    <p>Accident Detection System — {road_name}</p>
                </div>
                <div class="body">
                    <div class="badge">{severity} SEVERITY</div>
                    <h2 style="color: #111827; margin: 0 0 8px;">{type_label}</h2>
                    <p style="color: #6b7280; margin: 0 0 20px;">
                        An accident has been detected and requires immediate attention.
                    </p>

                    <div class="info-grid">
                        <div class="info-card">
                            <div class="label">📍 Location</div>
                            <div class="value">{location}</div>
                        </div>
                        <div class="info-card">
                            <div class="label">📹 Camera</div>
                            <div class="value">{camera_name}</div>
                        </div>
                        <div class="info-card">
                            <div class="label">🚗 Vehicles Involved</div>
                            <div class="value">{vehicles}</div>
                        </div>
                        <div class="info-card">
                            <div class="label">🚶 Persons Involved</div>
                            <div class="value">{persons}</div>
                        </div>
                        <div class="info-card">
                            <div class="label">📊 Confidence</div>
                            <div class="value">{int(confidence * 100)}%</div>
                        </div>
                        <div class="info-card">
                            <div class="label">🕒 Time</div>
                            <div class="value">{timestamp[:19].replace('T', ' ')}</div>
                        </div>
                    </div>

                    <img src="cid:screenshot" class="screenshot"
                        alt="Accident Screenshot"
                        onerror="this.style.display='none'" />

                    <a href="http://localhost:5173/alerts" class="alert-btn">
                        View Full Alert Details →
                    </a>
                </div>
                <div class="footer">
                    <p>Accident ID: #{accident_id} • Accident Detection System v1.0</p>
                    <p>This is an automated alert. Please respond immediately.</p>
                </div>
            </div>
        </body>
        </html>
        """


# Singleton instance
email_service = EmailService()


def get_email_service():
    return email_service