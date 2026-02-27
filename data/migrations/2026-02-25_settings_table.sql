-- Create settings table to store platform-wide configurations.
-- Run this against your MySQL database.

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  org_name VARCHAR(255) NOT NULL DEFAULT 'Startup Lab',
  org_description TEXT NULL,
  contact_email VARCHAR(255) NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed initial settings
INSERT IGNORE INTO settings (id, org_name, org_description)
VALUES (1, 'Startup Lab', 'Building the next generation of entrepreneurs');
