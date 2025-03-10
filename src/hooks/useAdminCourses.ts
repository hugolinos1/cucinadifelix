import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

export function useAdminCourses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = async (course: Omit<CourseInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.from('courses').insert({
        ...course,
        available_seats: course.max_seats,
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (id: string, updates: Partial<CourseUpdate>) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.from('courses').delete().eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCourse,
    updateCourse,
    deleteCourse,
    loading,
    error,
  };
}