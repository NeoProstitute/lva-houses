CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,48}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  house_id uuid REFERENCES houses(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  username text NOT NULL CHECK (username ~ '^[a-z0-9][a-z0-9._-]{2,30}$'),
  email text NOT NULL,
  role user_role NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, email),
  UNIQUE (school_id, username)
);
CREATE INDEX users_school_role_idx ON users (school_id, role) WHERE is_active;

CREATE TABLE point_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  max_points integer NOT NULL DEFAULT 100 CHECK (max_points BETWEEN 1 AND 10000),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);

CREATE TABLE point_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES users(id),
  house_id uuid NOT NULL REFERENCES houses(id),
  category_id uuid NOT NULL REFERENCES point_categories(id),
  awarded_by uuid NOT NULL REFERENCES users(id),
  points integer NOT NULL CHECK (points <> 0 AND abs(points) <= 10000),
  reason text CHECK (char_length(reason) <= 500),
  reversal_of uuid UNIQUE REFERENCES point_awards(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((reversal_of IS NULL AND points > 0) OR (reversal_of IS NOT NULL AND points < 0))
);
CREATE INDEX point_awards_student_idx ON point_awards (school_id, student_id, created_at DESC);
CREATE INDEX point_awards_house_idx ON point_awards (school_id, house_id, created_at DESC);
CREATE INDEX point_awards_awarder_idx ON point_awards (school_id, awarded_by, created_at DESC);

CREATE TABLE refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_sessions_valid_idx ON refresh_sessions (user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 120),
  target_type text NOT NULL CHECK (char_length(target_type) BETWEEN 1 AND 80),
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_school_created_idx ON audit_events (school_id, created_at DESC);
