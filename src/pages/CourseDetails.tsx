import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Euro, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useCourses';
import { useBookings } from '../hooks/useBookings';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

export function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const { createBooking } = useBookings();
  const [course, setCourse] = useState(courses.find((c) => c.id === id));
  const [booking, setBooking] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({
    loading: false,
    error: null,
    success: false
  });

  useEffect(() => {
    if (!id) return;

    // Subscribe to realtime changes for this course
    const subscription = supabase
      .channel(`course-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new) {
            setCourse(payload.new as any);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    setCourse(courses.find((c) => c.id === id));
  }, [courses, id]);

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Chargement...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Cours non trouvé</h2>
            <Button
              variant="secondary"
              className="mt-8"
              onClick={() => navigate('/courses')}
            >
              Retour aux cours
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setBooking({ loading: true, error: null, success: false });
      await createBooking(course.id);
      setBooking({ loading: false, error: null, success: true });
      setTimeout(() => {
        navigate('/courses');
      }, 5000);
    } catch (error) {
      setBooking({
        loading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
        success: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {course.image_url && (
            <div className="h-96 w-full">
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900">{course.title}</h1>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center text-gray-600">
                <Users className="h-6 w-6 mr-2" />
                <span>
                  {course.available_seats} place{course.available_seats > 1 ? 's' : ''}{' '}
                  disponible{course.available_seats > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-6 w-6 mr-2" />
                <span>{course.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Euro className="h-6 w-6 mr-2" />
                <span>{course.price} €</span>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Date</h2>
              <p className="mt-2 text-gray-600">
                {format(new Date(course.date), "EEEE d MMMM yyyy 'à' HH'h'mm", {
                  locale: fr,
                })}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900">Description</h2>
              <p className="mt-2 text-gray-600 whitespace-pre-line">
                {course.description}
              </p>
            </div>

            {booking.success && (
              <div className="mt-8 rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-700">
                  {course.available_seats > 0
                    ? "Votre réservation est bien confirmée. Nous vous attendons avec impatience ! Merci"
                    : "Merci pour votre intérêt. Nous enregistrons votre souhait de participer à une prochaine session. Nous vous tiendrons informé des nouvelles sessions"}
                </p>
              </div>
            )}

            {booking.error && (
              <div className="mt-8 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{booking.error}</p>
              </div>
            )}

            <div className="mt-8 flex space-x-4">
              <Button
                onClick={handleBooking}
                disabled={booking.loading || booking.success}
                className="flex-1"
                size="lg"
              >
                {booking.loading
                  ? 'Réservation en cours...'
                  : course.available_seats > 0
                  ? 'Réserver ma place'
                  : "M'inscrire sur la liste d'attente"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/courses')}
                className="flex-1"
                size="lg"
              >
                Retour aux cours
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}