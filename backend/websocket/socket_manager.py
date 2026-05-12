from flask_socketio import SocketIO, emit
from datetime import datetime

socketio = SocketIO()


class SocketManager:
    def __init__(self):
        self.socketio = None
        self.connected_clients = 0

    def initialize(self, socketio_instance):
        """Initialize with Flask-SocketIO instance"""
        self.socketio = socketio_instance
        self._register_events()
        print("✅ WebSocket Manager initialized!")

    def _register_events(self):
        """Register WebSocket events"""

        @self.socketio.on('connect')
        def on_connect():
            self.connected_clients += 1
            print(f"✅ Client connected! Total: {self.connected_clients}")
            emit('connected', {
                'message': '✅ Connected to Accident Detection System!',
                'timestamp': datetime.now().isoformat()
            })

        @self.socketio.on('disconnect')
        def on_disconnect():
            self.connected_clients -= 1
            print(f"🔌 Client disconnected! Total: {self.connected_clients}")

        @self.socketio.on('ping')
        def on_ping():
            emit('pong', {
                'timestamp': datetime.now().isoformat()
            })

    def emit_accident(self, accident_data):
        """Push accident alert to all connected clients"""
        try:
            if not self.socketio:
                print("⚠ WebSocket not initialized!")
                return

            self.socketio.emit('accident_detected', {
                'type': 'ACCIDENT',
                'data': accident_data,
                'timestamp': datetime.now().isoformat()
            })
            print(f"📡 Accident pushed to {self.connected_clients} clients!")

        except Exception as e:
            print(f"❌ WebSocket emit error: {e}")

    def emit_camera_status(self, camera_data):
        """Push camera status update to all clients"""
        try:
            if not self.socketio:
                return
            self.socketio.emit('camera_status', {
                'type': 'CAMERA_STATUS',
                'data': camera_data,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            print(f"❌ Camera status emit error: {e}")

    def emit_system_stats(self, stats):
        """Push system stats to all clients"""
        try:
            if not self.socketio:
                return
            self.socketio.emit('system_stats', {
                'type': 'STATS',
                'data': stats,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            print(f"❌ Stats emit error: {e}")


# Singleton instance
socket_manager = SocketManager()


def get_socket_manager():
    return socket_manager