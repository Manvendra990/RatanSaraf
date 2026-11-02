-- Additive only. Historical SIP rows, balances and banner data are preserved.
CREATE TABLE gold_purchases (
 id VARCHAR(36) NOT NULL PRIMARY KEY,
 userId VARCHAR(36) NOT NULL,
 rateId VARCHAR(36) NOT NULL,
 grams BIGINT UNSIGNED NOT NULL,
 amountPaise BIGINT UNSIGNED NOT NULL,
 reference VARCHAR(120) NOT NULL,
 status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
 allocationRef VARCHAR(190) NULL,
 note VARCHAR(500) NULL,
 createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewedAt DATETIME NULL,
 reviewedBy VARCHAR(36) NULL,
 UNIQUE KEY gold_purchase_reference(reference),
 UNIQUE KEY gold_purchase_allocation(allocationRef),
 INDEX gold_purchase_user_date(userId,createdAt),
 CONSTRAINT gold_purchase_user_fk FOREIGN KEY(userId) REFERENCES users(id),
 CONSTRAINT gold_purchase_rate_fk FOREIGN KEY(rateId) REFERENCES rates(id),
 CONSTRAINT gold_purchase_positive CHECK(grams>0 AND amountPaise>0)
) ENGINE=InnoDB;
CREATE TABLE trade_references (
 kind VARCHAR(20) NOT NULL,
 value VARCHAR(190) NOT NULL,
 recordId VARCHAR(36) NOT NULL,
 PRIMARY KEY(kind,value)
) ENGINE=InnoDB;
-- Keep existing bank and allocation references protected from reuse by new buys.
INSERT INTO trade_references(kind,value,recordId) SELECT 'PAYMENT',reference,id FROM payments;
INSERT INTO trade_references(kind,value,recordId) SELECT 'ALLOCATION',allocationRef,id FROM payments WHERE allocationRef IS NOT NULL;
