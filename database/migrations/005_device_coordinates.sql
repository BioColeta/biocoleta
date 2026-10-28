ALTER TABLE devices
    ADD COLUMN latitude DECIMAL(9, 6) NULL AFTER entity_id,
    ADD COLUMN longitude DECIMAL(9, 6) NULL AFTER latitude;

UPDATE devices
SET latitude = -23.561414, longitude = -46.655881
WHERE device_id = 'ESP32-DRAIN-0102' AND latitude IS NULL;
