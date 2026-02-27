-- Add profile fields to users table.
-- Run this against your MySQL database (DB_NAME in .env.local).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL AFTER role,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL AFTER company,
  ADD COLUMN IF NOT EXISTS bio TEXT NULL AFTER phone;
