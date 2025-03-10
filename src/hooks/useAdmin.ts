import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Vérifier d'abord si c'est l'admin principal
        if (user.email === 'hugues.rabier@gmail.com') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Sinon, vérifier le rôle dans la table profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
}