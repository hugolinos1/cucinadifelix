import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCourses() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('courses')
          .select('*')
          .order('date', { ascending: true });

        if (fetchError) throw fetchError;

        if (mounted) {
          setCourses(data || []);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchCourses();

    // Set up real-time subscription
    const subscription = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        async (payload) => {
          // Refetch all courses to ensure we have the latest state
          const { data } = await supabase
            .from('courses')
            .select('*')
            .order('date', { ascending: true });
          
          if (mounted && data) {
            setCourses(data);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { courses, loading, error };
}