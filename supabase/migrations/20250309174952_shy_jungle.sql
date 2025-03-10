/*
  # Fix available seats triggers

  1. Changes
    - Drop existing triggers
    - Create new, more robust triggers for managing available seats
    - Add constraints to prevent negative available seats
    
  2. Security
    - Maintain existing RLS policies
    - Add validation to prevent overbooking
*/

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS check_available_seats_trigger ON bookings;
DROP TRIGGER IF EXISTS update_available_seats_trigger ON bookings;

-- Drop existing trigger functions
DROP FUNCTION IF EXISTS check_available_seats();
DROP FUNCTION IF EXISTS update_available_seats();

-- Create new trigger function to manage available seats
CREATE OR REPLACE FUNCTION manage_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'confirmed' THEN
      -- Check if there are available seats
      IF (SELECT available_seats FROM courses WHERE id = NEW.course_id) <= 0 THEN
        RAISE EXCEPTION 'No available seats for this course';
      END IF;
      
      -- Decrease available seats
      UPDATE courses 
      SET available_seats = available_seats - 1
      WHERE id = NEW.course_id;
    END IF;
  
  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If status changed to confirmed
    IF NEW.status = 'confirmed' AND (OLD.status != 'confirmed' OR OLD.status IS NULL) THEN
      -- Check if there are available seats
      IF (SELECT available_seats FROM courses WHERE id = NEW.course_id) <= 0 THEN
        RAISE EXCEPTION 'No available seats for this course';
      END IF;
      
      -- Decrease available seats
      UPDATE courses 
      SET available_seats = available_seats - 1
      WHERE id = NEW.course_id;
    
    -- If status changed from confirmed to something else
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Increase available seats
      UPDATE courses 
      SET available_seats = available_seats + 1
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

-- Add constraint to prevent negative available seats
ALTER TABLE courses ADD CONSTRAINT non_negative_available_seats 
  CHECK (available_seats >= 0);