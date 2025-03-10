/*
  # Add role column to profiles table

  1. Changes
    - Add `role` column to `profiles` table with default value 'user'
    - Add check constraint to ensure role is either 'user' or 'admin'

  2. Security
    - Only authenticated users can read their own role
    - Only admins can update roles
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'user';
    ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Policy to allow users to read their own role
CREATE POLICY "Users can read their own role"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy to allow admins to update roles
CREATE POLICY "Only admins can update roles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');