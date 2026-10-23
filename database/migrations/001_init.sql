-- BioColeta MVP initial schema (MariaDB)
-- Applies on empty database `biocoleta`.

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE devices (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_devices_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE telemetry (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    recorded_at DATETIME(3) NOT NULL,
    water_level DECIMAL(6, 2) NOT NULL,
    water_flow DECIMAL(10, 4) NOT NULL,
    quality DECIMAL(4, 3) NULL,
    tamper_alert TINYINT(1) NOT NULL DEFAULT 0,
    raw_json JSON NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_telemetry_device_recorded (device_id, recorded_at),
    KEY idx_telemetry_device_id_id (device_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alerts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    device_id VARCHAR(64) NOT NULL,
    status ENUM('pending', 'resolved') NOT NULL DEFAULT 'pending',
    rule_id VARCHAR(64) NOT NULL,
    classification_json JSON NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    resolved_at DATETIME(3) NULL,
    PRIMARY KEY (id),
    KEY idx_alerts_status_created (status, created_at),
    KEY idx_alerts_device_status (device_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE decisions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    alert_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    outcome ENUM('confirmado', 'falso_positivo') NOT NULL,
    note TEXT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_decisions_alert_id (alert_id),
    CONSTRAINT fk_decisions_alert
        FOREIGN KEY (alert_id) REFERENCES alerts (id),
    CONSTRAINT fk_decisions_user
        FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
