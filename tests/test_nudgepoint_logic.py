#!/usr/bin/env python3
"""
Unit Tests for NudgePoint Core Pedagogical Algorithms & Threshold Logic
Verifies pure functions: friction rate formulas, sliding window filtration,
radar status transitions, and dominant factor aggregation.
"""

import unittest
import time

def calculate_friction_rate(distinct_active_count, total_enrolled):
    """Calculates aggregate classroom friction percentage clamped to [0, 100]."""
    if total_enrolled <= 0:
        return 0
    clamped_count = min(distinct_active_count, total_enrolled)
    return max(0, min(100, round((clamped_count / total_enrolled) * 100)))

def determine_radar_status(friction_rate):
    """Maps friction rate to pedagogical radar zones."""
    if friction_rate >= 30:
        return {
            "level": "red",
            "label": "Derailment Risk",
            "icon": "🔴",
            "color": "#C84B42"
        }
    if friction_rate >= 15:
        return {
            "level": "amber",
            "label": "Amber Pulse Active",
            "icon": "🟡",
            "color": "#C4761E"
        }
    return {
        "level": "neutral",
        "label": "Classroom in Flow",
        "icon": "🟢",
        "color": "#2B7A4B"
    }

def filter_active_pulses(pulses, now_ms, window_sec=90):
    """Filters pulses to those within the sliding window and unresolved."""
    cutoff = now_ms - (window_sec * 1000)
    return [
        p for p in pulses
        if p.get("timestamp", 0) >= cutoff and not p.get("resolved", False)
    ]

def get_distinct_active_students(active_pulses):
    """Extracts unique student IDs to prevent single-student double-counting."""
    return {p["studentId"] for p in active_pulses if "studentId" in p}

def aggregate_dominant_factor(active_pulses):
    """Finds the primary cause of student derailment."""
    if not active_pulses:
        return "step"
    counts = {}
    for p in active_pulses:
        tag = p.get("tag", "step")
        counts[tag] = counts.get(tag, 0) + 1
    return max(counts, key=counts.get)


class TestNudgePointLogic(unittest.TestCase):

    def test_friction_rate_calculation(self):
        total = 35
        self.assertEqual(calculate_friction_rate(0, total), 0)
        self.assertEqual(calculate_friction_rate(5, total), 14) # 5/35 = 14.28% -> 14%
        self.assertEqual(calculate_friction_rate(6, total), 17) # 6/35 = 17.14% -> 17%
        self.assertEqual(calculate_friction_rate(11, total), 31) # 11/35 = 31.42% -> 31%
        self.assertEqual(calculate_friction_rate(35, total), 100)
        # Guarantee strict 100% clamping even if active signals exceed base roster
        self.assertEqual(calculate_friction_rate(36, total), 100)
        self.assertEqual(calculate_friction_rate(50, total), 100)

    def test_division_by_zero_guard(self):
        self.assertEqual(calculate_friction_rate(5, 0), 0)
        self.assertEqual(calculate_friction_rate(0, -10), 0)

    def test_radar_threshold_transitions(self):
        # 0% - 14% -> Flow
        self.assertEqual(determine_radar_status(0)["level"], "neutral")
        self.assertEqual(determine_radar_status(14)["level"], "neutral")
        self.assertEqual(determine_radar_status(14)["icon"], "🟢")

        # 15% - 29% -> Amber Pulse
        self.assertEqual(determine_radar_status(15)["level"], "amber")
        self.assertEqual(determine_radar_status(29)["level"], "amber")
        self.assertEqual(determine_radar_status(15)["icon"], "🟡")

        # 30%+ -> Derailment Risk
        self.assertEqual(determine_radar_status(30)["level"], "red")
        self.assertEqual(determine_radar_status(85)["level"], "red")
        self.assertEqual(determine_radar_status(30)["icon"], "🔴")

    def test_sliding_window_filtering(self):
        now = int(time.time() * 1000)
        pulses = [
            {"id": "p1", "studentId": "s1", "timestamp": now - 30000, "resolved": False}, # 30s ago (Active)
            {"id": "p2", "studentId": "s2", "timestamp": now - 85000, "resolved": False}, # 85s ago (Active)
            {"id": "p3", "studentId": "s3", "timestamp": now - 95000, "resolved": False}, # 95s ago (Expired)
            {"id": "p4", "studentId": "s4", "timestamp": now - 10000, "resolved": True},  # 10s ago but Resolved (Excluded)
        ]

        active = filter_active_pulses(pulses, now, window_sec=90)
        self.assertEqual(len(active), 2)
        self.assertEqual({p["id"] for p in active}, {"p1", "p2"})

    def test_student_deduplication(self):
        # Same student sending 3 rapid pulses must only count as 1 distinct student
        now = int(time.time() * 1000)
        pulses = [
            {"id": "p1", "studentId": "s1", "timestamp": now - 5000},
            {"id": "p2", "studentId": "s1", "timestamp": now - 3000},
            {"id": "p3", "studentId": "s1", "timestamp": now - 1000},
            {"id": "p4", "studentId": "s2", "timestamp": now - 2000},
        ]
        distinct = get_distinct_active_students(pulses)
        self.assertEqual(len(distinct), 2)
        self.assertEqual(distinct, {"s1", "s2"})

    def test_dominant_factor_aggregation(self):
        pulses = [
            {"studentId": "s1", "tag": "step"},
            {"studentId": "s2", "tag": "pace"},
            {"studentId": "s3", "tag": "step"},
            {"studentId": "s4", "tag": "example"},
            {"studentId": "s5", "tag": "step"},
        ]
        self.assertEqual(aggregate_dominant_factor(pulses), "step")

        pulses_pace = [
            {"studentId": "s1", "tag": "pace"},
            {"studentId": "s2", "tag": "pace"},
            {"studentId": "s3", "tag": "notation"},
        ]
        self.assertEqual(aggregate_dominant_factor(pulses_pace), "pace")


if __name__ == "__main__":
    unittest.main()
