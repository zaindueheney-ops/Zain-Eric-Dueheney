# Security Specification: Belize Emergency Incident Network (BERIN)

## 1. Data Invariants

1. **User Identity Isolation**: A user profile document `/users/{userId}` can only be created or modified if `request.auth.uid == userId`. Standard citizens cannot escalate their role to `admin` or `dispatcher` during registration.
2. **Admin Supremacy**: Users with verified email `zaindueheney@gmail.com` have administrative clearance to assign roles and manage incidents.
3. **Emergency Report Integrity**: An emergency incident report must originate from an authenticated user (`request.auth.uid == incoming().reporterId`).
4. **Geolocation Bounds Guard**: Incident coordinates must be valid numbers within or closely bounding the territory of Belize (Latitude: 15.0 to 19.0 N, Longitude: -90.0 to -87.0 W).
5. **Action-Based Updates**:
   - The original reporter can update their report description/photo if still in `reported` status.
   - Responders, Dispatchers, and Admins can update the `status`, `assignedUnit`, `responderNotes`, and `updatedAt`.
   - Terminal state: Once an incident is marked `resolved` or `false_alarm`, only an Admin or Dispatcher can reopen or edit it.
6. **Subcollection Relational Guard**: An incident update log in `/emergencies/{emergencyId}/logs/{logId}` must reference an existing parent emergency incident and authenticate `incoming().authorId == request.auth.uid`.

---

## 2. The Dirty Dozen Payloads (Adversarial Security Test Cases)

1. **Payload 1 (Identity Spoofing - Impersonate Reporter)**: Citizen A tries to create an emergency incident where `reporterId: "victim_user_id"`.
   - Expected Result: `PERMISSION_DENIED`
2. **Payload 2 (Privilege Escalation in Self-Registration)**: Citizen signs up and sends `role: "admin"` in `/users/{userId}`.
   - Expected Result: `PERMISSION_DENIED`
3. **Payload 3 (Profile Hijacking)**: User A attempts to write to `/users/{userB}`.
   - Expected Result: `PERMISSION_DENIED`
4. **Payload 4 (Unauthenticated Incident Creation)**: An unauthenticated caller attempts to post an incident to `/emergencies/inc_99`.
   - Expected Result: `PERMISSION_DENIED`
5. **Payload 5 (Ghost Field Injection / Shadow Update)**: Reporter attempts an update with an unwhitelisted field `isSuperVerified: true`.
   - Expected Result: `PERMISSION_DENIED`
6. **Payload 6 (Terminal State Bypass)**: Citizen attempts to change the notes of an incident that has status `resolved`.
   - Expected Result: `PERMISSION_DENIED`
7. **Payload 7 (Denial of Wallet - Giant String Flooding)**: Malicious client sends a 2MB string in `title` or `locationName`.
   - Expected Result: `PERMISSION_DENIED`
8. **Payload 8 (Coordinate Poisoning)**: Malicious client submits latitude: 999.0 and longitude: -5000.0.
   - Expected Result: `PERMISSION_DENIED`
9. **Payload 9 (Log Identity Spoofing)**: Attendant logs an action under another officer's badge/UID in `/emergencies/{id}/logs/{logId}`.
   - Expected Result: `PERMISSION_DENIED`
10. **Payload 10 (Direct Field Tampering - Immutable Creation Time)**: User modifies `createdAt` on an existing incident report during status update.
    - Expected Result: `PERMISSION_DENIED`
11. **Payload 11 (Orphan Subcollection Write)**: Writing a log entry under `/emergencies/non_existent_id/logs/log1`.
    - Expected Result: `PERMISSION_DENIED`
12. **Payload 12 (Unauthorized Deletion)**: Regular user attempts to delete an emergency incident or another user's profile.
    - Expected Result: `PERMISSION_DENIED`
