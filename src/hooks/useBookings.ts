import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  courses: Database['public']['Tables']['courses']['Row'];
};

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function fetchBookings() {
      try {
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            *,
            courses (
              id,
              title,
              date,
              location,
              price
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setBookings(data as Booking[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();

    const subscription = supabase
      .channel('user-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createBooking = async (courseId: string) => {
    if (!user) throw new Error('Vous devez être connecté pour réserver un cours');

    try {
      // Check for existing bookings
      const { data: existingBookings, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      if (checkError) throw checkError;

      if (existingBookings && existingBookings.length > 0) {
        throw new Error('Vous avez déjà réservé ce cours');
      }

      // Get course details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      if (!course) throw new Error('Cours non trouvé');

      // Create booking with appropriate status
      const status = course.available_seats > 0 ? 'confirmed' : 'waitlist';
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          course_id: courseId,
          user_id: user.id,
          status,
        });

      if (bookingError) throw bookingError;

      // Send booking notification
      try {
        const notificationRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            userId: user.id,
            status,
          }),
        });

        if (!notificationRes.ok) {
          const errorData = await notificationRes.json();
          console.error('Notification error:', errorData);
          // Don't throw here to avoid affecting the booking process
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't throw here to avoid affecting the booking process
      }

      // Fetch updated bookings
      const { data: updatedBookings, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          courses (
            id,
            title,
            date,
            location,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setBookings(updatedBookings as Booking[]);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Une erreur est survenue');
    }
  };

  return { bookings, loading, error, createBooking };
}