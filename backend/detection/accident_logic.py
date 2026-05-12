import numpy as np


class AccidentLogic:
    def __init__(self):
        # LOWERED thresholds for better detection
        self.collision_overlap_threshold = 0.05   # was 0.30
        self.person_hit_threshold = 0.05          # was 0.40
        self.rollover_ratio_threshold = 1.8       # was 2.5
        self.proximity_threshold = 0.3            # NEW — near miss

    # ─── Main Analysis Function ───────────────────────────
    def analyze(self, vehicles, persons):
        accidents = []

        # Check 1 — Collision
        collision = self._check_collision(vehicles)
        if collision:
            accidents.append(collision)

        # Check 2 — Person Hit
        person_hit = self._check_person_hit(vehicles, persons)
        if person_hit:
            accidents.append(person_hit)

        # Check 3 — Rollover
        rollover = self._check_rollover(vehicles)
        if rollover:
            accidents.append(rollover)

        # Check 4 — Proximity (near miss)
        if not accidents:
            proximity = self._check_proximity(vehicles, persons)
            if proximity:
                accidents.append(proximity)

        return accidents

    # ─── Collision Detection ──────────────────────────────
    def _check_collision(self, vehicles):
        if len(vehicles) < 2:
            return None

        for i in range(len(vehicles)):
            for j in range(i + 1, len(vehicles)):
                box1 = vehicles[i]['bbox']
                box2 = vehicles[j]['bbox']

                overlap = self._calculate_overlap(box1, box2)
                proximity = self._calculate_proximity(box1, box2)

                # Detect if overlapping OR very close
                if overlap > self.collision_overlap_threshold or proximity < 0.05:
                    avg_conf = (
                        vehicles[i]['confidence'] +
                        vehicles[j]['confidence']
                    ) / 2

                    return {
                        'accident_type': 'COLLISION',
                        'confidence': round(avg_conf, 2),
                        'vehicles_involved': 2,
                        'persons_involved': 0,
                        'overlap': round(overlap, 2),
                        'boxes': [box1, box2],
                        'severity': self._get_severity(
                            'COLLISION', avg_conf,
                            vehicles_involved=2
                        )
                    }
        return None

    # ─── Person Hit Detection ─────────────────────────────
    def _check_person_hit(self, vehicles, persons):
        if not vehicles or not persons:
            return None

        for person in persons:
            for vehicle in vehicles:
                overlap = self._calculate_overlap(
                    person['bbox'], vehicle['bbox']
                )
                proximity = self._calculate_proximity(
                    person['bbox'], vehicle['bbox']
                )

                # Detect if overlapping OR very close
                if overlap > self.person_hit_threshold or proximity < 0.08:
                    avg_conf = (
                        person['confidence'] +
                        vehicle['confidence']
                    ) / 2

                    return {
                        'accident_type': 'PERSON_HIT',
                        'confidence': round(avg_conf, 2),
                        'vehicles_involved': 1,
                        'persons_involved': 1,
                        'overlap': round(overlap, 2),
                        'boxes': [person['bbox'], vehicle['bbox']],
                        'severity': self._get_severity(
                            'PERSON_HIT', avg_conf
                        )
                    }
        return None

    # ─── Rollover Detection ───────────────────────────────
    def _check_rollover(self, vehicles):
        for vehicle in vehicles:
            x1, y1, x2, y2 = vehicle['bbox']
            width = x2 - x1
            height = y2 - y1

            if height == 0:
                continue

            ratio = width / height

            # More sensitive rollover detection
            if ratio > self.rollover_ratio_threshold:
                return {
                    'accident_type': 'ROLLOVER',
                    'confidence': round(vehicle['confidence'], 2),
                    'vehicles_involved': 1,
                    'persons_involved': 0,
                    'ratio': round(ratio, 2),
                    'boxes': [vehicle['bbox']],
                    'severity': self._get_severity(
                        'ROLLOVER', vehicle['confidence']
                    )
                }
        return None

    # ─── Proximity Check (near miss) ──────────────────────
    def _check_proximity(self, vehicles, persons):
        """Detect near miss — vehicles very close to each other"""
        if len(vehicles) < 2:
            return None

        for i in range(len(vehicles)):
            for j in range(i + 1, len(vehicles)):
                box1 = vehicles[i]['bbox']
                box2 = vehicles[j]['bbox']
                proximity = self._calculate_proximity(box1, box2)

                if proximity < self.proximity_threshold:
                    avg_conf = (
                        vehicles[i]['confidence'] +
                        vehicles[j]['confidence']
                    ) / 2

                    return {
                        'accident_type': 'COLLISION',
                        'confidence': round(avg_conf * 0.7, 2),
                        'vehicles_involved': 2,
                        'persons_involved': 0,
                        'proximity': round(proximity, 2),
                        'boxes': [box1, box2],
                        'severity': 'MEDIUM'
                    }
        return None

    # ─── IoU Calculator ───────────────────────────────────
    def _calculate_overlap(self, box1, box2):
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        if x2 < x1 or y2 < y1:
            return 0.0

        intersection = (x2 - x1) * (y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - intersection

        if union == 0:
            return 0.0

        return intersection / union

    # ─── Proximity Calculator ─────────────────────────────
    def _calculate_proximity(self, box1, box2):
        """Calculate normalized distance between centers of two boxes"""
        cx1 = (box1[0] + box1[2]) / 2
        cy1 = (box1[1] + box1[3]) / 2
        cx2 = (box2[0] + box2[2]) / 2
        cy2 = (box2[1] + box2[3]) / 2

        # Normalize by average box size
        avg_width = (
            (box1[2] - box1[0]) +
            (box2[2] - box2[0])
        ) / 2
        avg_height = (
            (box1[3] - box1[1]) +
            (box2[3] - box2[1])
        ) / 2
        avg_size = (avg_width + avg_height) / 2

        if avg_size == 0:
            return float('inf')

        distance = np.sqrt(
            (cx1 - cx2) ** 2 +
            (cy1 - cy2) ** 2
        )

        return distance / avg_size

    # ─── Severity Assignment ──────────────────────────────
    def _get_severity(self, accident_type, confidence,
                      vehicles_involved=1):
        if accident_type == 'PERSON_HIT':
            if confidence > 0.75:
                return 'CRITICAL'
            else:
                return 'HIGH'

        elif accident_type == 'COLLISION':
            if vehicles_involved > 2 or confidence > 0.80:
                return 'CRITICAL'
            elif confidence > 0.60:
                return 'HIGH'
            else:
                return 'MEDIUM'

        elif accident_type == 'ROLLOVER':
            if confidence > 0.65:
                return 'HIGH'
            else:
                return 'MEDIUM'

        return 'LOW'


# Singleton
accident_logic = AccidentLogic()


def get_accident_logic():
    return accident_logic