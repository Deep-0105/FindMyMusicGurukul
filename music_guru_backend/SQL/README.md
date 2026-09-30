# 🗄️ Database Architecture & SQL Scripts (FindMyMusicGurukul Platform)

This folder contains the complete SQL database table structure, seed data, search queries, views, and schema definitions for the **FindMyMusicGurukul** platform.

---

## 📁 File Structure

```
SQL/
├── 01_schema.sql                  # Core DDL table structure (Roles, Subscriptions, Users, User Subscriptions, Cities, Areas, Skills, Academies, Inquiries, Reviews)
├── 02_seed_data.sql               # Seed data populating master records (Roles, Subscriptions, Cities, Areas, Skills, Sample Academies, Inquiries)
├── 03_procedures_and_queries.sql  # SQL views, search queries, and administrative reporting scripts
├── create_database_and_tables.sql # Master single-execution SQL script for MS SQL Server
└── README.md                      # Database documentation & ER diagrams
```

---

## 🌐 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    ROLES ||--|{ USERS : "assigned to"
    SUBSCRIPTIONS ||--o{ USERS : "subscribed by"
    SUBSCRIPTIONS ||--o{ USER_SUBSCRIPTIONS : "has history"
    USERS ||--o{ USER_SUBSCRIPTIONS : "subscribes to"
    USERS ||--o{ ACADEMIES : "manages"
    SUBSCRIPTIONS ||--o{ ACADEMIES : "tier"
    CITIES ||--|{ AREAS : "contains"
    CITIES ||--o{ ACADEMIES : "located in"
    AREAS ||--o{ ACADEMIES : "located in"
    ACADEMIES ||--|{ ACADEMY_SKILLS : "offers"
    SKILLS ||--|{ ACADEMY_SKILLS : "offered by"
    ACADEMIES ||--o{ INQUIRIES : "receives"
    SKILLS ||--o{ INQUIRIES : "subject of"
    ACADEMIES ||--o{ REVIEWS : "rated by"
    USERS ||--o{ REVIEWS : "writes"

    ROLES {
        string id PK
        string name UK
        string description
        bit deleted
        datetime updated_at
    }

    SUBSCRIPTIONS {
        string id PK
        string name
        string target_role
        decimal price
        int duration_months
        bit deleted
        datetime updated_at
    }

    USERS {
        string id PK
        string username UK
        string email UK
        string password_hash
        string role_id FK
        string subscription_id FK
        bit deleted
        datetime updated_at
    }

    USER_SUBSCRIPTIONS {
        string id PK
        string user_id FK
        string subscription_id FK
        datetime start_date
        datetime expiry_date
        string status
        bit deleted
        datetime updated_at
    }

    CITIES {
        string id PK
        string name UK
        string state
        bit deleted
        datetime updated_at
    }

    AREAS {
        string id PK
        string city_id FK
        string name
        bit deleted
        datetime updated_at
    }

    SKILLS {
        string id PK
        string name UK
        string slug UK
        string icon
        bit deleted
        datetime updated_at
    }

    ACADEMIES {
        string id PK
        string slug UK
        string academy_name
        string teacher_name
        string city_id FK
        string area_id FK
        string subscription_id FK
        decimal rating
        string status
        bit deleted
        datetime updated_at
    }

    INQUIRIES {
        string id PK
        string academy_id FK
        string student_name
        string student_email
        string student_phone
        string status
        bit deleted
        datetime updated_at
    }

    REVIEWS {
        string id PK
        string academy_id FK
        int rating
        string comment
        bit deleted
        datetime updated_at
    }
```

---

## 📊 Summary of Tables

*Note: All tables include standard audit soft-delete and timestamp columns (`deleted BIT DEFAULT 0`, `created_at DATETIME`, `updated_at DATETIME`).*

| Table Name | Description | Key Relationships |
| :--- | :--- | :--- |
| `roles` | Master table defining user access roles (`superadmin`, `admin`, `student`). | Parent of `users` |
| `subscriptions` | Master table defining student passes & academy listing packages. | Parent of `users`, `user_subscriptions`, `academies` |
| `users` | Stores student, academy owner, and admin user credentials. | Foreign Keys to `roles` & `subscriptions` |
| `user_subscriptions` | Tracks active & historical subscriptions for students & academies. | Foreign Keys to `users` & `subscriptions` |
| `cities` | Master table for operational cities (e.g., Pune, Mumbai, Delhi, Bangalore). | Parent of `areas` and `academies` |
| `areas` | Master table for localities within cities (e.g., Wakad, Bandra, Indiranagar). | Child of `cities` |
| `skills` | Master table for instruments & vocals taught (e.g., Guitar, Piano, Vocals). | Parent of `academy_skills` |
| `academies` | Stores Music Academy / Guru profile details, status, and ratings. | Foreign Keys to `users`, `subscriptions`, `cities`, `areas` |
| `academy_skills` | Junction table mapping many-to-many relationship between Academies and Skills. | Foreign Keys to `academies`, `skills` |
| `inquiries` | Lead form submissions from interested students. | Foreign Keys to `academies`, `skills` |
| `reviews` | Student ratings and review feedback for academies. | Foreign Keys to `academies`, `users` |

---

## 🚀 How to Execute

### MS SQL Server
Execute [`create_database_and_tables.sql`](file:///c:/Users/deep/Desktop/WPMS_UI/music_guru_backend/SQL/create_database_and_tables.sql) directly inside **SQL Server Management Studio (SSMS)** or Azure Data Studio.

### PostgreSQL
```bash
psql -U postgres -d FindMyMusicGurukul -f SQL/01_schema.sql
psql -U postgres -d FindMyMusicGurukul -f SQL/02_seed_data.sql
psql -U postgres -d FindMyMusicGurukul -f SQL/03_procedures_and_queries.sql
```

### MySQL / MariaDB
```bash
mysql -u root -p FindMyMusicGurukul < SQL/01_schema.sql
mysql -u root -p FindMyMusicGurukul < SQL/02_seed_data.sql
mysql -u root -p FindMyMusicGurukul < SQL/03_procedures_and_queries.sql
```
