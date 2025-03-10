/*
  # Fix courses table RLS policies

  1. Security Changes
    - Enable RLS on courses table
    - Add policies for:
      - Public read access for all courses
      - Admin-only write access (create/update/delete)
      - Simplified admin check using email
*/

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Only admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Only admins can update courses" ON courses;
DROP POLICY IF EXISTS "Only admins can delete courses" ON courses;

-- Create new policies with simplified admin check
CREATE POLICY "Anyone can view courses"
ON courses FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Only admins can insert courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (auth.email() = 'hugues.rabier@gmail.com');

CREATE POLICY "Only admins can update courses"
ON courses FOR UPDATE
TO authenticated
USING (auth.email() = 'hugues.rabier@gmail.com')
WITH CHECK (auth.email() = 'hugues.rabier@gmail.com');

CREATE POLICY "Only admins can delete courses"
ON courses FOR DELETE
TO authenticated
USING (auth.email() = 'hugues.rabier@gmail.com');