#!/usr/bin/env python3
"""
Comprehensive Authorization Boundary & RBAC Unit Tests for NudgePoint
Tests verify:
1. PBKDF2 Password Hashing & Salt Verification
2. User Signup, Authentication, and Session Lifecycle
3. 401 Unauthorized for Unauthenticated Requests
4. 403 Forbidden for Students Attempting Teacher Routes (State, Analytics)
5. 403 Forbidden for Cross-Teacher Access (Teacher B accessing Teacher A's class)
6. 200 OK for Verified Teacher Owner
7. Data Isolation: Student state returns only own pulse, zero peer pulse leakage
8. Tamper Proofing: Student cannot resolve or overwrite another student's pulse
"""

import unittest
import os
import sys
import time
import json
import sqlite3
from io import BytesIO
from unittest.mock import MagicMock

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import server

class TestAuthRBAC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure database is initialized with tables and seeds
        server.init_db()

    def setUp(self):
        # Create a fresh test database connection for isolated assertions if needed
        self.conn = server.get_db()

    def tearDown(self):
        self.conn.close()

    # -----------------------------------------------------------------------
    # 1. Cryptographic & User Primitives
    # -----------------------------------------------------------------------
    def test_password_hashing_and_verification(self):
        password = "SecurePassword456!"
        pw_hash, salt = server.hash_password(password)
        self.assertTrue(len(pw_hash) > 30)
        self.assertTrue(len(salt) > 20)
        # Correct password passes
        self.assertTrue(server.verify_password(password, pw_hash, salt))
        # Wrong password fails
        self.assertFalse(server.verify_password("WrongPassword123!", pw_hash, salt))
        # Tampered salt fails
        self.assertFalse(server.verify_password(password, pw_hash, "0" * len(salt)))

    def test_create_user_validation(self):
        # Invalid role
        with self.assertRaises(ValueError):
            server.db_create_user("bad@test.edu", "password123", "Bad Role", "admin")
        # Short password
        with self.assertRaises(ValueError):
            server.db_create_user("short@test.edu", "123", "Short Pass", "student")
        # Invalid email
        with self.assertRaises(ValueError):
            server.db_create_user("not-an-email", "password123", "No Email", "student")

    def test_session_lifecycle(self):
        # Create unique user
        email = f"session_test_{int(time.time()*1000)}@test.edu"
        user = server.db_create_user(email, "Password123!", "Session Test", "student")
        
        # Create session
        token = server.db_create_session(user["id"], user["role"], ttl_days=1)
        self.assertTrue(len(token) > 20)

        # Retrieve user from token
        fetched = server.db_get_user_from_token(token)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["id"], user["id"])
        self.assertEqual(fetched["role"], "student")

        # Revoke session
        self.assertTrue(server.db_revoke_session(token))
        # Cannot retrieve after revocation
        self.assertIsNone(server.db_get_user_from_token(token))

    # -----------------------------------------------------------------------
    # 2. Data Scoping & Cross-Student Tamper Protection
    # -----------------------------------------------------------------------
    def test_student_data_isolation_no_peer_pulse_leakage(self):
        """Student endpoint must return ONLY the calling student's pulse, never peers'."""
        room_id = "CALC"
        now = int(time.time() * 1000)

        # Insert pulses for student A and student B
        server.db_save_pulse({"id": f"p_test_a_{now}", "room": room_id, "studentId": "stu_a", "tag": "step", "topic": "Limits", "timestamp": now}, "127.0.0.1")
        server.db_save_pulse({"id": f"p_test_b_{now}", "room": room_id, "studentId": "stu_b", "tag": "pace", "topic": "Limits", "timestamp": now}, "127.0.0.1")

        # Student A fetches state
        state_a = server.db_get_student_room_state(room_id, "stu_a")
        self.assertIsNotNone(state_a)
        self.assertIsNotNone(state_a["myPulse"])
        self.assertEqual(state_a["myPulse"]["tag"], "step")
        # Must NOT contain a 'pulses' array with peer data
        self.assertNotIn("pulses", state_a)

        # Student C (who has not pulsed) fetches state
        state_c = server.db_get_student_room_state(room_id, "stu_c")
        self.assertIsNone(state_c["myPulse"])
        self.assertNotIn("pulses", state_c)

    def test_cross_student_resolve_tamper_protection(self):
        """Resolving pulse for Student A must never resolve Student B's pulse."""
        room_id = "CALC"
        now = int(time.time() * 1000)
        p_a = f"p_iso_a_{now}"
        p_b = f"p_iso_b_{now}"

        server.db_save_pulse({"id": p_a, "room": room_id, "studentId": "victim_student", "tag": "step", "topic": "Limits", "timestamp": now}, "127.0.0.1")
        server.db_save_pulse({"id": p_b, "room": room_id, "studentId": "attacker_student", "tag": "pace", "topic": "Limits", "timestamp": now}, "127.0.0.1")

        # Attacker resolves their OWN pulse
        server.db_resolve_pulse(room_id, "attacker_student")

        # Check in DB: victim_student's pulse must STILL be active (resolved = 0)
        cur = self.conn.cursor()
        cur.execute("SELECT resolved FROM pulses WHERE id = ?", (p_a,))
        self.assertEqual(cur.fetchone()["resolved"], 0)

        # Attacker's pulse is resolved (resolved = 1)
        cur.execute("SELECT resolved FROM pulses WHERE id = ?", (p_b,))
        self.assertEqual(cur.fetchone()["resolved"], 1)

    # -----------------------------------------------------------------------
    # 3. HTTP Server-Side Guard & RBAC Authorization Boundaries
    # -----------------------------------------------------------------------
    def _create_mock_handler(self, path, method="GET", token=None, body=None):
        """Helper to create a mock HTTP request handler with custom headers and path."""
        handler = server.NudgePointHTTPHandler.__new__(server.NudgePointHTTPHandler)
        handler.path = path
        handler.command = method
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if body:
            raw_body = json.dumps(body).encode("utf-8")
            headers["Content-Length"] = str(len(raw_body))
            handler.rfile = BytesIO(raw_body)
        else:
            handler.rfile = BytesIO(b"")
        handler.headers = headers
        handler.wfile = BytesIO()
        handler.send_response = MagicMock()
        handler.send_header = MagicMock()
        handler.end_headers = MagicMock()
        return handler

    def test_unauthenticated_request_rejected_401(self):
        """Teacher endpoints must return 401 when called with no Authorization token."""
        # Teacher state route
        handler = self._create_mock_handler("/api/rooms/CALC/state")
        handler.do_GET()
        handler.send_response.assert_called_with(401)
        response_data = json.loads(handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("Authentication required", response_data["error"])

        # Analytics route
        handler2 = self._create_mock_handler("/api/sessions/CALC/analytics")
        handler2.do_GET()
        handler2.send_response.assert_called_with(401)

        # Profile route
        handler3 = self._create_mock_handler("/api/auth/me")
        handler3.do_GET()
        handler3.send_response.assert_called_with(401)

    def test_student_forbidden_from_teacher_state_and_analytics_403(self):
        """A logged-in student attempting to read teacher-only data must get 403 Forbidden."""
        # Create student and token
        email = f"student_guard_{int(time.time()*1000)}@test.edu"
        student = server.db_create_user(email, "Pass1234!", "Student Guard", "student")
        student_token = server.db_create_session(student["id"], student["role"])

        # Student calls /api/rooms/CALC/state -> 403
        handler = self._create_mock_handler("/api/rooms/CALC/state", token=student_token)
        handler.do_GET()
        handler.send_response.assert_called_with(403)
        response_data = json.loads(handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("Access denied", response_data["error"])

        # Student calls /api/sessions/CALC/analytics -> 403
        handler2 = self._create_mock_handler("/api/sessions/CALC/analytics", token=student_token)
        handler2.do_GET()
        handler2.send_response.assert_called_with(403)

    def test_cross_teacher_isolation_403(self):
        """Teacher B must NOT be able to view or manage Teacher A's classroom."""
        # Prof. Euler owns CALC
        # Create a second teacher: Prof. Gauss
        email_gauss = f"prof.gauss_{int(time.time()*1000)}@test.edu"
        gauss = server.db_create_user(email_gauss, "GaussPass123!", "Prof. Carl Gauss", "teacher")
        gauss_token = server.db_create_session(gauss["id"], gauss["role"])

        # Prof. Gauss attempts to view Prof. Euler's room CALC state
        handler = self._create_mock_handler("/api/rooms/CALC/state", token=gauss_token)
        handler.do_GET()
        handler.send_response.assert_called_with(403)
        response_data = json.loads(handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("You do not own this lecture room", response_data["error"])

        # Prof. Gauss attempts to view Prof. Euler's room analytics
        handler2 = self._create_mock_handler("/api/sessions/CALC/analytics", token=gauss_token)
        handler2.do_GET()
        handler2.send_response.assert_called_with(403)

    def test_teacher_owner_success_200(self):
        """The teacher who owns the room succeeds with 200 OK."""
        # Find owner of CALC
        cur = self.conn.cursor()
        cur.execute("SELECT teacher_id FROM rooms WHERE id = 'CALC'")
        teacher_id = cur.fetchone()["teacher_id"]
        euler_token = server.db_create_session(teacher_id, "teacher")

        # Owner calls state
        handler = self._create_mock_handler("/api/rooms/CALC/state", token=euler_token)
        handler.do_GET()
        handler.send_response.assert_called_with(200)
        data = json.loads(handler.wfile.getvalue().decode("utf-8"))
        self.assertEqual(data["room"], "CALC")
        self.assertIn("pulses", data)

        # Owner calls analytics
        handler2 = self._create_mock_handler("/api/sessions/CALC/analytics", token=euler_token)
        handler2.do_GET()
        handler2.send_response.assert_called_with(200)
        analytics = json.loads(handler2.wfile.getvalue().decode("utf-8"))
        self.assertEqual(analytics["room"], "CALC")

    def test_student_scoped_endpoint_success_200(self):
        """Student successfully retrieves student-scoped state."""
        email = f"student_scoped_{int(time.time()*1000)}@test.edu"
        student = server.db_create_user(email, "Pass1234!", "Student Scoped", "student")
        student_token = server.db_create_session(student["id"], student["role"])

        handler = self._create_mock_handler("/api/rooms/CALC/student-state", token=student_token)
        handler.do_GET()
        handler.send_response.assert_called_with(200)
        data = json.loads(handler.wfile.getvalue().decode("utf-8"))
        self.assertEqual(data["room"], "CALC")
        self.assertEqual(data["student"]["id"], student["id"])
        self.assertNotIn("pulses", data)

    def test_api_auth_signup_login_flow(self):
        """Full REST signup, login, profile check, and logout flow."""
        email = f"flow_user_{int(time.time()*1000)}@test.edu"

        # 1. Signup
        signup_handler = self._create_mock_handler(
            "/api/auth/signup",
            method="POST",
            body={"email": email, "password": "SecurePass123!", "fullName": "Flow Tester", "role": "student"}
        )
        signup_handler.do_POST()
        signup_handler.send_response.assert_called_with(201)
        res1 = json.loads(signup_handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("token", res1)
        self.assertEqual(res1["user"]["email"], email)
        self.assertEqual(res1["user"]["role"], "student")

        # 2. Login
        login_handler = self._create_mock_handler(
            "/api/auth/login",
            method="POST",
            body={"email": email, "password": "SecurePass123!"}
        )
        login_handler.do_POST()
        login_handler.send_response.assert_called_with(200)
        res2 = json.loads(login_handler.wfile.getvalue().decode("utf-8"))
        token = res2["token"]

        # 3. Check /api/auth/me
        me_handler = self._create_mock_handler("/api/auth/me", token=token)
        me_handler.do_GET()
        me_handler.send_response.assert_called_with(200)
        me_data = json.loads(me_handler.wfile.getvalue().decode("utf-8"))
        self.assertEqual(me_data["user"]["email"], email)

        # 4. Logout
        logout_handler = self._create_mock_handler("/api/auth/logout", method="POST", token=token)
        logout_handler.do_POST()
        logout_handler.send_response.assert_called_with(200)

        # 5. Token is now invalid
        me_handler_after = self._create_mock_handler("/api/auth/me", token=token)
        me_handler_after.do_GET()
        me_handler_after.send_response.assert_called_with(401)

    # -----------------------------------------------------------------------
    # 5. Role-Split Portal Enforcement (Part A)
    # -----------------------------------------------------------------------
    def test_cross_role_login_rejection_student_at_teacher_portal_403(self):
        """Student attempting to authenticate via the Teacher Portal must be rejected with 403."""
        login_handler = self._create_mock_handler(
            "/api/auth/login",
            method="POST",
            body={
                "email": "alex.rivera@nudgepoint.edu",
                "password": "StudentPass123!",
                "expectedRole": "teacher"
            }
        )
        login_handler.do_POST()
        login_handler.send_response.assert_called_with(403)
        res = json.loads(login_handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("error", res)
        self.assertIn("Student", res["error"])
        self.assertNotIn("token", res)

    def test_cross_role_login_rejection_teacher_at_student_portal_403(self):
        """Teacher attempting to authenticate via the Student Portal must be rejected with 403."""
        login_handler = self._create_mock_handler(
            "/api/auth/login",
            method="POST",
            body={
                "email": "prof.euler@nudgepoint.edu",
                "password": "PodiumPass123!",
                "expectedRole": "student"
            }
        )
        login_handler.do_POST()
        login_handler.send_response.assert_called_with(403)
        res = json.loads(login_handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("error", res)
        self.assertIn("Instructor", res["error"])
        self.assertNotIn("token", res)

    def test_matching_role_login_success_200(self):
        """Teacher at Teacher Portal and Student at Student Portal succeed with 200."""
        # Teacher at Teacher Portal
        tch_handler = self._create_mock_handler(
            "/api/auth/login",
            method="POST",
            body={
                "email": "prof.euler@nudgepoint.edu",
                "password": "PodiumPass123!",
                "expectedRole": "teacher"
            }
        )
        tch_handler.do_POST()
        tch_handler.send_response.assert_called_with(200)
        tch_res = json.loads(tch_handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("token", tch_res)
        self.assertEqual(tch_res["user"]["role"], "teacher")

        # Student at Student Portal
        stu_handler = self._create_mock_handler(
            "/api/auth/login",
            method="POST",
            body={
                "email": "alex.rivera@nudgepoint.edu",
                "password": "StudentPass123!",
                "expectedRole": "student"
            }
        )
        stu_handler.do_POST()
        stu_handler.send_response.assert_called_with(200)
        stu_res = json.loads(stu_handler.wfile.getvalue().decode("utf-8"))
        self.assertIn("token", stu_res)
        self.assertEqual(stu_res["user"]["role"], "student")

if __name__ == "__main__":
    unittest.main()
