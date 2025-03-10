import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type BookingWithDetails = Database['public']['Tables']['bookings']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  courses: Database['public']['Tables']['courses']['Row'];
};

export function useAdminBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

  const fetchBookings = useCallback(async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verify course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .single();

      if (courseError) {
        throw new Error('Cours non trouvé');
      }

      if (!course) {
        throw new Error('Cours non trouvé');
      }

      // Get bookings with details
      const { data, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles (
            id,
            email,
            full_name
          ),
          courses (
            id,
            title,
            date,
            location,
            price,
            max_seats,
            available_seats
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (bookingsError) {
        throw bookingsError;
      }

      const typedBookings = data as BookingWithDetails[];
      setBookings(typedBookings);
      return typedBookings;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Une erreur est survenue lors de la récupération des réservations';
      setError(errorMessage);
      console.error('Error fetching bookings:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingsByCourse = useCallback(async (courseId: string) => {
    if (!courseId) {
      setError('ID du cours manquant');
      return [];
    }

    setCurrentCourseId(courseId);
    return fetchBookings(courseId);
  }, [fetchBookings]);

  useEffect(() => {
    if (!currentCourseId) return;

    // Set up real-time subscription for bookings
    const subscription = supabase
      .channel(`bookings-${currentCourseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `course_id=eq.${currentCourseId}`
        },
        () => {
          // Refetch bookings when changes occur
          fetchBookings(currentCourseId);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentCourseId, fetchBookings]);

  const updateBookingStatus = useCallback(async (
    bookingId: string,
    status: 'confirmed' | 'cancelled' | 'waitlist'
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      if (currentCourseId) {
        await fetchBookings(currentCourseId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Une erreur est survenue lors de la mise à jour du statut";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentCourseId, fetchBookings]);

  return {
    bookings,
    getBookingsByCourse,
    updateBookingStatus,
    loading,
    error,
  };
}