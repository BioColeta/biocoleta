ALTER TABLE alerts
    MODIFY status ENUM('new', 'investigating', 'resolved', 'false_positive', 'cleared')
    NOT NULL DEFAULT 'new';
