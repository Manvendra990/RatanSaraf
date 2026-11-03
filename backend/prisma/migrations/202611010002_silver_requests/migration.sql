-- Preserve all existing Gold balances and records.
ALTER TABLE accounts ADD silverGrams BIGINT UNSIGNED NOT NULL DEFAULT 0, ADD silverReserved BIGINT UNSIGNED NOT NULL DEFAULT 0, ADD CONSTRAINT silver_reservation CHECK(silverReserved<=silverGrams);
ALTER TABLE ledger ADD metal ENUM('Gold','Silver') NOT NULL DEFAULT 'Gold';
