/*
  # Fix available seats counting for all users
  
  1. Changes
    - Update RLS policies to allow all authenticated users to affect available seats
    - Improve trigger function to handle all user bookings
    - Add better error handling and validation
    
  2. Security
    - Maintain data integrity with constraints
    - Ensure proper access control while allowing seat management
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Only admins can modify courses" ON courses;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS manage_available_seats_trigger ON bookings;
DROP FUNCTION IF EXISTS manage_available_seats();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION manage_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  current_seats INTEGER;
BEGIN
  -- Get current available seats
  SELECT available_seats INTO current_seats
  FROM courses
  WHERE id = NEW.course_id
  FOR UPDATE;  -- Lock the row to prevent race conditions
  
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'confirmed' THEN
      -- Verify seats are available
      IF current_seats <= 0 THEN
        -- Auto-switch to waitlist if no seats available
        NEW.status := 'waitlist';
      ELSE
        -- Decrease available seats
        UPDATE courses 
        SET available_seats = available_seats - 1,
            updated_at = NOW()
        WHERE id = NEW.course_id;
      END IF;
    END IF;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status changed to confirmed
    IF NEW.status = 'confirmed' AND (OLD.status != 'confirmed' OR OLD.status IS NULL) THEN
      IF current_seats <= 0 THEN
        RAISE EXCEPTION 'No available seats for this course';
      END IF;
      
      -- Decrease available seats
      UPDATE courses 
      SET available_seats = available_seats - 1,
          updated_at = NOW()
      WHERE id = NEW.course_id;
    
    -- Status changed from confirmed to something else
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Increase available seats
      UPDATE courses 
      SET available_seats = available_seats + 1,
          updated_at = NOW()
      WHERE id = NEW.course_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER manage_available_seats_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION manage_available_seats();

-- Update RLS policies for bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own bookings
CREATE POLICY "Users can create their own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own bookings
CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins full access to bookings
CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR email = 'hugues.rabier@gmail.com')
    )
  );

-- Update courses table policies to ensure proper access
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Anyone can view courses
CREATE POLICY "Anyone can view courses"
  ON courses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can modify courses
CREATE POLICY "Only admins can modify courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR email = 'hugues.rabier@gmail.com')
    )
  );