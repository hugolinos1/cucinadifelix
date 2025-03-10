/*
  # Fix profiles table RLS policies

  1. Security Changes
    - Enable RLS on profiles table
    - Add simplified policies for:
      - Users can read their own profile
      - Users can update their own profile (except role)
      - Admins can read all profiles
      - Only admins can update roles
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Only admins can update roles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own role" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON profiles;

-- Create new simplified policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id AND auth.email() != 'hugues.rabier@gmail.com')
WITH CHECK (auth.uid() = id AND auth.email() != 'hugues.rabier@gmail.com');

CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (auth.email() = 'hugues.rabier@gmail.com');

CREATE POLICY "Only admins can update roles"
ON profiles FOR UPDATE
TO authenticated
USING (auth.email() = 'hugues.rabier@gmail.com')
WITH CHECK (auth.email() = 'hugues.rabier@gmail.com');