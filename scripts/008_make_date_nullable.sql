-- Make scheduled_date nullable in group_schedules
ALTER TABLE public.group_schedules ALTER COLUMN scheduled_date DROP NOT NULL;

-- Update the unique constraint to allow multiple null dates (or just remove it if strictly unique non-null pairs aren't needed anymore, but for now let's keep it safe)
-- PostgreSQL treats NULLs as distinct for UNIQUE constraints, so we can have multiple movies without dates.
-- However, we likely want to prevent the same movie being added without a date multiple times if that's the intention, 
-- or maybe we DO want to allow "suggestions" (movies without dates) to be duplicates?
-- For now, let's just drop the constraint to be flexible, as "suggestions" implies a backlog.
-- But wait, the previous constraint was UNIQUE(group_id, movie_id, scheduled_date).
-- If we keep it, we can have one entry for Movie A on Date X, and one entry for Movie A on NULL (backlog).
-- That seems reasonable.

-- No changes needed to the Unique Index logic for Postgres, as NULL != NULL. 
-- But if the user wants to ensure a movie is only in the backlog ONCE, we might need a partial index.
-- Let's stick to the minimal schema change first: just dropping the NOT NULL constraint.

-- Just in case there are any dependent views or functions, but this is a simple table change.
