-- Add a current-publication pointer without rewriting any historical quotes/trades.
CREATE TABLE rate_publications (
 metal ENUM('Gold','Silver') NOT NULL PRIMARY KEY,
 rateId VARCHAR(36) NOT NULL UNIQUE,
 CONSTRAINT rate_publication_rate_fk FOREIGN KEY(rateId) REFERENCES rates(id)
) ENGINE=InnoDB;
INSERT INTO rate_publications(metal,rateId)
 SELECT r.metal,r.id FROM rates r WHERE r.id=(SELECT latest.id FROM rates latest WHERE latest.metal=r.metal ORDER BY latest.createdAt DESC,latest.id DESC LIMIT 1);
