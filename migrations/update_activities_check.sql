-- Update the check constraint for group_activities action column
-- Run this if you already created the table but need to add new action types

DO $$ 
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE group_activities DROP CONSTRAINT IF EXISTS group_activities_action_check;
  
  -- Add the updated constraint with all action types
  ALTER TABLE group_activities ADD CONSTRAINT group_activities_action_check 
  CHECK (action IN (
    'added_movie', 
    'removed_movie', 
    'marked_watched', 
    'showed_interest', 
    'joined_group', 
    'scheduled_movie', 
    'updated_group', 
    'removed_date'
  ));
END $$;
