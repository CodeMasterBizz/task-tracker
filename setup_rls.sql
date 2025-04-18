-- First drop all existing policies
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;

-- Delete all tasks that don't have a user_id
DELETE FROM tasks WHERE user_id IS NULL;

-- Add user_id column to tasks table if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Make user_id required for all tasks
ALTER TABLE tasks
ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own tasks
CREATE POLICY "Users can manage their own tasks"
ON tasks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
