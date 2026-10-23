-- Demo seed for MVP operator + device.
-- Password plaintext (local demo only): demo_operator
-- Hash generated with PHP password_hash(..., PASSWORD_DEFAULT).

INSERT INTO users (username, password_hash)
VALUES (
    'operator',
    '$2y$12$5ToNRJp06DMK44r7uO8gneyKnMtELvqzbI5v0WVZyCKURLlTRCJ5G'
);

INSERT INTO devices (device_id, entity_id, active)
VALUES (
    'ESP32-DRAIN-0102',
    'BUEIRO-0102',
    1
);
