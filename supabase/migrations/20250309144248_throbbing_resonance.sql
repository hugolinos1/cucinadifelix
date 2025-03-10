/*
  # Fix courses table RLS policies

  1. Security Changes
    - Enable RLS on courses table
    - Add policies for:
      - Anyone can view courses
      - Only admins can create/update/delete courses
*/

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Only admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Only admins can update courses" ON courses;
DROP POLICY IF EXISTS "Only admins can delete courses" ON courses;

-- Create new policies
CREATE POLICY "Anyone can view courses"
ON courses FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can insert courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'hugues.rabier@gmail.com'
  )
);

CREATE POLICY "Only admins can update courses"
ON courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'hugues.rabier@gmail.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'hugues.rabier@gmail.com'
  )
);

CREATE POLICY "Only admins can delete courses"
ON courses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = 'hugues.rabier@gmail.com'
  )
);