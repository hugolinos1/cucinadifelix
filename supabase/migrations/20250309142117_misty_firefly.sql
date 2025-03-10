/*
  # Add admin role to user profile

  1. Changes
    - Updates the role of a specific user to 'admin'
    
  2. Security
    - Only modifies a single user profile
    - Maintains existing RLS policies
*/

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your.email@example.com';