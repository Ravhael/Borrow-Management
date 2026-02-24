-- Migration: create Loans table
-- Manually added migration that creates the table used by the app to store loans fixture data

CREATE TABLE IF NOT EXISTS "Loans" (
  id TEXT PRIMARY KEY,
  submittedAt TIMESTAMPTZ NULL,
  isDraft BOOLEAN NOT NULL DEFAULT FALSE,
  entitasId TEXT NULL,
  borrowerPhone TEXT NULL,
  borrowerEmail TEXT NULL,
  borrowerName TEXT NULL,
  needType TEXT NULL,
  demo JSONB NULL,
  company TEXT[] NULL,
  outDate DATE NULL,
  useDate DATE NULL,
  returnDate DATE NULL,
  productDetailsText TEXT NULL,
  pickupMethod TEXT NULL,
  note TEXT NULL,
  approvalAgreementFlag BOOLEAN NOT NULL DEFAULT FALSE,

  submitNotifications JSONB NULL,
  approvalNotifications JSONB NULL,
  approvals JSONB NULL,
  reminderStatus JSONB NULL,
  warehouseStatus JSONB NULL,
  returnNotifications JSONB NULL,

  createdAt TIMESTAMPTZ NOT NULL DEFAULT now(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: create an index on submittedAt for list queries
CREATE INDEX IF NOT EXISTS idx_loans_submittedAt ON "Loans" (submittedAt);
