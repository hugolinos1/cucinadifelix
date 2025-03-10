/*
  # Fix seats management trigger and logging
  
  1. Changes
    - Add booking logs table if not exists
    - Update trigger function with improved seat management
    - Add proper error handling and logging
    
  2. Security
    - Add RLS policy for admin access to logs
    - Ensure data consistency with row locking
*/

-- Create booking logs table if it doesn't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS manage_available_seats_trigger ON bookings;
DROP FUNCTION IF EXISTS manage_available_seats();

-- Create improved trigger function
CREATE OR REPLACE FUNCTION manage_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  v_course_record RECORD;
BEGIN
  -- Get course record with row lock
  SELECT c.* INTO v_course_record
  FROM courses c
  WHERE c.id = COALESCE(NEW.course_id, OLD.course_id)
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
    v_course_record.available_seats,
    v_course_record.available_seats
  );

  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'confirmed' THEN
      IF v_course_record.available_seats <= 0 THEN
        -- Auto-switch to waitlist if no seats available
        NEW.status := 'waitlist';
      ELSE
        -- Decrease available seats
        UPDATE courses c
        SET available_seats = c.available_seats - 1
        WHERE c.id = NEW.course_id
        AND c.available_seats > 0;
        
        -- Get updated seats count
        SELECT c.available_seats INTO v_course_record.available_seats
        FROM courses c
        WHERE c.id = NEW.course_id;
        
        -- Update log with new seats count
        UPDATE booking_logs
        SET new_seats = v_course_record.available_seats
        WHERE booking_id = NEW.id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Status changed to confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
      IF v_course_record.available_seats <= 0 THEN
        RAISE EXCEPTION 'No available seats for this course';
      END IF;
      
      -- Decrease available seats
      UPDATE courses c
      SET available_seats = c.available_seats - 1
      WHERE c.id = NEW.course_id
      AND c.available_seats > 0;
    
    -- Status changed from confirmed to something else
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Increase available seats
      UPDATE courses c
      SET available_seats = LEAST(c.available_seats + 1, c.max_seats)
      WHERE c.id = NEW.course_id;
    END IF;
    
    -- Get final seats count
    SELECT c.available_seats INTO v_course_record.available_seats
    FROM courses c
    WHERE c.id = NEW.course_id;
    
    -- Update log with new seats count
    UPDATE booking_logs
    SET new_seats = v_course_record.available_seats
    WHERE booking_id = NEW.id;
    
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.status = 'confirmed' THEN
      -- Increase available seats
      UPDATE courses c
      SET available_seats = LEAST(c.available_seats + 1, c.max_seats)
      WHERE c.id = OLD.course_id;
      
      -- Get final seats count
      SELECT c.available_seats INTO v_course_record.available_seats
      FROM courses c
      WHERE c.id = OLD.course_id;
      
      -- Update log with new seats count
      UPDATE booking_logs
      SET new_seats = v_course_record.available_seats
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

-- Enable RLS on booking_logs if not already enabled
DO $$ BEGIN
  ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Drop existing policy if it exists and create new one
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view booking logs" ON booking_logs;
  
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
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;