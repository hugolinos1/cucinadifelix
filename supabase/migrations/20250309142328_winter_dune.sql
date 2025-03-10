/*
  # Set admin user role

  1. Changes
    - Updates the role of hugues.rabier@gmail.com to 'admin'
    
  2. Security
    - Only modifies a single user profile
    - Maintains existing RLS policies
*/

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'hugues.rabier@gmail.com';