-- Demo seed for MVP operator + device.
-- Password plaintext (local demo only): demo_operator
-- Hash generated with PHP password_hash(..., PASSWORD_DEFAULT).

INSERT INTO users (username, password_hash)
VALUES (
    'operator',
    '$2y$12$eYfbi5US2WACEl231lkt9eksLn8s8IM2BsUU7KhvYCg4AyMrj49mq'
);

INSERT INTO devices (device_id, entity_id, latitude, longitude, active)
VALUES
    ('ESP32-DRAIN-0102', 'BUEIRO-0102', -23.561414, -46.655881, 1),
    ('ESP32-DRAIN-0318', 'BUEIRO-0318', -23.558030, -46.661200, 1),
    ('ESP32-DRAIN-0450', 'BUEIRO-0450', -23.564900, -46.650100, 1),
    ('ESP32-DRAIN-0771', 'BUEIRO-0771', -23.566720, -46.659040, 1),
    ('ESP32-DRAIN-0893', 'BUEIRO-0893', -23.559220, -46.651700, 1),
    ('ESP32-DRAIN-1044', 'BUEIRO-1044', -23.563050, -46.658900, 1),
    ('ESP32-DRAIN-1207', 'BUEIRO-1207', -23.557100, -46.654300, 1),
    ('ESP32-DRAIN-1366', 'BUEIRO-1366', -23.565480, -46.653400, 1);
