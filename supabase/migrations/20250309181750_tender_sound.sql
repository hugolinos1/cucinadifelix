/*
  # Fix seat management trigger
  
  1. Changes
    - Separate seat management and logging logic
    - Fix double seat decrease issue
    - Improve transaction handling
    
  2. Security
    - Maintain SECURITY DEFINER for proper permissions
    - Keep RLS policies intact
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

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS manage_available_seats_before_trigger ON bookings;
DROP TRIGGER IF EXISTS manage_available_seats_after_trigger ON bookings;
DROP FUNCTION IF EXISTS manage_available_seats();
DROP FUNCTION IF EXISTS log_booking_changes();

-- Create function for managing seats
CREATE OR REPLACE FUNCTION manage_available_seats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_course_record RECORD;
BEGIN
  -- Get course record with row lock
  SELECT c.* INTO v_course_record
  FROM courses c
  WHERE c.id = COALESCE(NEW.course_id, OLD.course_id)
  FOR UPDATE;

  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'confirmed' THEN
      IF v_course_record.available_seats <= 0 THEN
        -- Auto-switch to waitlist if no seats available
        NEW.status := 'waitlist';
      ELSE
        -- Decrease available seats
        UPDATE courses c
        SET available_seats = c.available_seats - 1,
            updated_at = now()
        WHERE c.id = NEW.course_id
        AND c.available_seats > 0;
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
      SET available_seats = c.available_seats - 1,
          updated_at = now()
      WHERE c.id = NEW.course_id
      AND c.available_seats > 0;
    
    -- Status changed from confirmed to something else
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Increase available seats
      UPDATE courses c
      SET available_seats = LEAST(c.available_seats + 1, c.max_seats),
          updated_at = now()
      WHERE c.id = NEW.course_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF OLD.status = 'confirmed' THEN
      -- Increase available seats
      UPDATE courses c
      SET available_seats = LEAST(c.available_seats + 1, c.max_seats),
          updated_at = now()
      WHERE c.id = OLD.course_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create function for logging changes
CREATE OR REPLACE FUNCTION log_booking_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_course_record RECORD;
BEGIN
  -- Get current course state
  SELECT * INTO v_course_record
  FROM courses
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);

  -- Log the change
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
    CASE WHEN TG_OP = 'DELETE' THEN OLD.status
         WHEN TG_OP = 'UPDATE' THEN OLD.status
         ELSE NULL END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL
         ELSE NEW.status END,
    v_course_record.available_seats,
    v_course_record.available_seats
  );

  RETURN NULL;
END;
$$;

-- Create BEFORE trigger for seat management
CREATE TRIGGER manage_available_seats_before_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION manage_available_seats();

-- Create AFTER trigger for logging
CREATE TRIGGER log_booking_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_changes();

-- Enable RLS on booking_logs if not already enabled
ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage booking logs" ON booking_logs;

-- Create comprehensive policy for booking_logs
CREATE POLICY "Admins can manage booking logs"
  ON booking_logs
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR email = 'hugues.rabier@gmail.com')
    )
  );