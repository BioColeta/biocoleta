ALTER TABLE alerts
    MODIFY status ENUM('new', 'investigating', 'resolved', 'false_positive')
    NOT NULL DEFAULT 'new';
