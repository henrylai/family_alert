# Data Model & API Specifications

## 1. Relational Entities (SQLite / PostgreSQL)

### `groups`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique group identifier |
| `name` | TEXT | NOT NULL | Friendly group name (e.g. "Lai Family") |
| `invite_code` | TEXT (6-8 chars) | UNIQUE, NOT NULL | Alphanumeric invite code (e.g. `FAM-4912`) |
| `admin_id` | TEXT | NOT NULL | Member ID of the creator |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### `members`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique member identifier |
| `group_id` | TEXT | REFERENCES `groups(id)` ON DELETE CASCADE | Associated family group |
| `display_name` | TEXT | NOT NULL | Member's chosen name |
| `role` | TEXT | DEFAULT 'member' | 'admin' or 'member' |
| `push_subscription` | JSON / TEXT | NULLABLE | VAPID push subscription object |
| `joined_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Join timestamp |
| `last_seen_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last activity heartbeat |

### `incidents`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique incident identifier |
| `group_id` | TEXT | REFERENCES `groups(id)` ON DELETE CASCADE | Associated family group |
| `sender_id` | TEXT | REFERENCES `members(id)` | Person who triggered the alert |
| `sender_name` | TEXT | NOT NULL | Name snapshot at time of trigger |
| `status` | TEXT | DEFAULT 'active' | 'active', 'resolved', 'cancelled' |
| `started_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Trigger timestamp |
| `resolved_at` | DATETIME | NULLABLE | Resolution timestamp |
| `resolved_by` | TEXT | NULLABLE | Member who resolved/cleared the alert |
| `notes` | TEXT | NULLABLE | Optional emergency details |

### `acknowledgments`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY | Unique acknowledgment ID |
| `incident_id` | TEXT | REFERENCES `incidents(id)` ON DELETE CASCADE | Associated incident |
| `member_id` | TEXT | REFERENCES `members(id)` | Member responding |
| `member_name` | TEXT | NOT NULL | Member name snapshot |
| `status` | TEXT | NOT NULL | 'safe', 'on_my_way', 'calling_911', 'seen' |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Response timestamp |

---

## 2. REST API Endpoints

### Groups
- `POST /api/groups`: Create a new group. Body: `{ name: string, creatorName: string }` -> Returns `{ group, member, token }`
- `POST /api/groups/join`: Join with invite code. Body: `{ inviteCode: string, displayName: string }` -> Returns `{ group, member, token }`
- `GET /api/groups/:id`: Retrieve group details and member roster. Header: `Authorization: Bearer <token>`

### Incidents
- `POST /api/incidents/trigger`: Broadcast an emergency alert. Body: `{ groupId: string, notes?: string }`
- `POST /api/incidents/:id/acknowledge`: Acknowledge an active emergency. Body: `{ status: string }`
- `POST /api/incidents/:id/resolve`: Resolve an emergency. Body: `{}`
- `GET /api/incidents/active/:groupId`: Get current active incident (if any) for a group.

### Web Push
- `GET /api/push/public-key`: Return the server's VAPID public key.
- `POST /api/push/subscribe`: Register or update device push subscription. Body: `{ subscription: object }`

### Health & Monitoring
- `GET /health`: Returns `{ status: 'ok', uptime: number, timestamp: string }` for Railway health checks.

---

## 3. Real-Time WebSocket Events (Socket.IO)

- Client -> Server:
  - `join_group`: `{ groupId, memberId }`
  - `trigger_alert`: `{ groupId, memberId }`
  - `acknowledge_alert`: `{ incidentId, memberId, status }`
  - `resolve_alert`: `{ incidentId, memberId }`
- Server -> Client (broadcasted to room `group_{groupId}`):
  - `alert_triggered`: Active incident object
  - `member_acknowledged`: Acknowledgment update
  - `alert_resolved`: Resolution payload
  - `roster_updated`: Active member count and statuses
