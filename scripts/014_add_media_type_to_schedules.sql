-- Add media_type column to group_schedules table
ALTER TABLE group_schedules 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'movie';

-- Update existing records to have 'movie' as media_type (already covered by default, but good to be explicit if needed)
-- UPDATE group_schedules SET media_type = 'movie' WHERE media_type IS NULL;
