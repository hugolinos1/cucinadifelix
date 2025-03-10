/*
  # Fix available seats management
  
  1. Changes
    - Improve trigger function to properly handle seat counting
    - Add validation checks for seat management
    - Fix race conditions with proper locking
    - Add logging for debugging purposes
    
  2. Security
    - Maintain existing RLS policies
    - Ensure data consistency
*/

-- Create a table for logging if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  course_id uuid REFERENCES courses(id),
  operation text NOT NULL,
  old_status text,
  new_status text,
  old_seats integer,
  new_seats integer,
  created_at timestamptz DEFAULT now()
);

-- Drop existing trigger
DROP TRIGGER IF EXISTS manage_available_seats_trigger ON bookings;
DROP FUNCTION IF EXISTS manage_available_seats();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION manage_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  current_seats INTEGER;
  max_seats INTEGER;
BEGIN
  -- Get current and max seats with row lock
  SELECT available_seats, max_seats INTO current_seats, max_seats
  FROM courses
  WHERE id = COALESCE(NEW.course_id, OLD.course_id)
  FOR UPDATE;
  
  -- Log initial state
  INSERT INTO booking_logs (
    booking_id,
    course_id,
    operation,
    old_status,
    new_status,
    old_seats,
    new_seats
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.course_id, OLD.course_id),
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status ELSE OLD.status END,
    current_seats,
    current_seats
  );

  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'confirmed' THEN
      IF current_seats <= 0 THEN
        -- Auto-switch to waitlist if no seats available
        NEW.status := 'waitlist';
      ELSE
        -- Decrease available seats
        UPDATE courses 
        SET available_seats = available_seats - 1
        WHERE id = NEW.course_id
        AND available_seats > 0;
        
        -- Get updated seats count
        SELECT available_seats INTO current_seats
        FROM courses
        WHERE id = NEW.course_id;
        
        -- Update log with new seats count
        UPDATE booking_logs
        SET new_seats = current_seats
        WHERE booking_id = NEW.id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Status changed to confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
      IF current_seats <= 0 THEN
        RAISE EXCEPTION 'No available seats for this course';
      END IF;
      
      -- Decrease available seats
      UPDATE courses 
      SET available_seats = available_seats - 1
      WHERE id = NEW.course_id
      AND available_seats > 0;
    
    -- Status changed from confirmed to something else
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Increase available seats
      UPDATE courses 
      SET available_seats = LEAST(available_seats + 1, max_seats)
      WHERE id = NEW.course_id;
    END IF;
    
    -- Get final seats count
    SELECT available_seats INTO current_seats
    FROM courses
    WHERE id = NEW.course_id;
    
    -- Update log with new seats count
    UPDATE booking_logs
    SET new_seats = current_seats
    WHERE booking_id = NEW.id;
    
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.status = 'confirmed' THEN
      -- Increase available seats
      UPDATE courses 
      SET available_seats = LEAST(available_seats + 1, max_seats)
      WHERE id = OLD.course_id;
      
      -- Get final seats count
      SELECT available_seats INTO current_seats
      FROM courses
      WHERE id = OLD.course_id;
      
      -- Update log with new seats count
      UPDATE booking_logs
      SET new_seats = current_seats
      WHERE booking_id = OLD.id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER manage_available_seats_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION manage_available_seats();

-- Enable RLS on booking_logs
ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view logs
CREATE POLICY "Admins can view booking logs"
  ON booking_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR email = 'hugues.rabier@gmail.com')
    )
  );