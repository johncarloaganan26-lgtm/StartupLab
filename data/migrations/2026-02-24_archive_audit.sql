-- Archive (soft-delete) + audit log support.
-- Run this against your MySQL database (DB_NAME in .env.local).

-- 1) Events: soft-delete columns
ALTER TABLE events
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_by BIGINT NULL,
  ADD INDEX idx_events_deleted_at (deleted_at);

-- 2) Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NULL,
  details TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_audit_logs_created_at (created_at),
  INDEX idx_audit_logs_admin_user_id (admin_user_id)
);

-- 3) Archived registrations table (for deleted registration records)
CREATE TABLE IF NOT EXISTS archived_registrations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  registration_id BIGINT NULL,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL,
  registered_at DATETIME NULL,
  user_name VARCHAR(255) NULL,
  user_email VARCHAR(255) NULL,
  event_title VARCHAR(255) NULL,
  event_date DATE NULL,
  event_time VARCHAR(32) NULL,
  event_location VARCHAR(255) NULL,
  deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_by BIGINT NULL,
  deletion_source VARCHAR(64) NULL,
  PRIMARY KEY (id),
  INDEX idx_archived_registrations_deleted_at (deleted_at),
  INDEX idx_archived_registrations_event_id (event_id),
  INDEX idx_archived_registrations_user_id (user_id),
  INDEX idx_archived_registrations_registration_id (registration_id)
);

-- 4) Archived users table (for deleted user records)
CREATE TABLE IF NOT EXISTS archived_users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role VARCHAR(32) NOT NULL,
  company VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  bio TEXT NULL,
  created_at_original DATETIME NULL,
  deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_by BIGINT NULL,
  deletion_source VARCHAR(64) NULL,
  PRIMARY KEY (id),
  INDEX idx_archived_users_deleted_at (deleted_at),
  INDEX idx_archived_users_user_id (user_id),
  INDEX idx_archived_users_email (email)
);
