/*
  # Fix profiles table RLS policies

  1. Changes
    - Enables RLS on profiles table
    - Adds policy for profile creation on sign up
    - Adds policy for users to read their own profile
    - Adds policy for users to update their own profile
    - Adds policy for admins to read all profiles
    
  2. Security
    - Users can only access their own profile data
    - Admins can read all profiles
    - Users can only create their own profile
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow profile creation during signup
CREATE POLICY "Enable insert for authentication users only" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);