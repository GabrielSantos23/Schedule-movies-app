-- Change scheduled_date to TIMESTAMP WITH TIME ZONE to support time
ALTER TABLE group_schedules
ALTER COLUMN scheduled_date TYPE TIMESTAMP WITH TIME ZONE
USING scheduled_date::TIMESTAMP WITH TIME ZONE;
