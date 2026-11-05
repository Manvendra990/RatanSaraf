-- Additive upgrade: existing products, balances, trades and KYC remain intact.
ALTER TABLE products ADD gender ENUM('Men','Women','Unisex','Children') NULL;
ALTER TABLE sales
 ADD bankName VARCHAR(120) NULL,
 ADD accountHolderName VARCHAR(120) NULL,
 ADD accountLast4 VARCHAR(4) NULL,
 ADD accountEncrypted TEXT NULL,
 ADD ifsc VARCHAR(11) NULL;
CREATE TABLE rate_notifications (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 rateId VARCHAR(36) NOT NULL UNIQUE,
 metal ENUM('Gold','Silver') NOT NULL,
 amountPaise BIGINT UNSIGNED NOT NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT notification_rate_fk FOREIGN KEY(rateId) REFERENCES rates(id)
) ENGINE=InnoDB;
CREATE TABLE notification_reads (
 userId VARCHAR(36) NOT NULL,
 notificationId BIGINT UNSIGNED NOT NULL,
 readAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(userId,notificationId),
 CONSTRAINT notification_read_user_fk FOREIGN KEY(userId) REFERENCES users(id),
 CONSTRAINT notification_read_event_fk FOREIGN KEY(notificationId) REFERENCES rate_notifications(id)
) ENGINE=InnoDB;
