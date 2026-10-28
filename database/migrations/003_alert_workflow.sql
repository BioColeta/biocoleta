ALTER TABLE alerts
    MODIFY status ENUM('pending', 'new', 'investigating', 'resolved', 'false_positive') NOT NULL DEFAULT 'new';

UPDATE alerts
SET status = 'new'
WHERE status = 'pending';

ALTER TABLE alerts
    MODIFY status ENUM('new', 'investigating', 'resolved', 'false_positive') NOT NULL DEFAULT 'new';
