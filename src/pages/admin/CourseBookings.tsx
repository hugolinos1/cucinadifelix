import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAdmin } from '../../hooks/useAdmin';
import { useCourses } from '../../hooks/useCourses';
import { useAdminBookings } from '../../hooks/useAdminBookings';
import { Button } from '../../components/Button';

export function CourseBookings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { courses } = useCourses();
  const { 
    getBookingsByCourse, 
    updateBookingStatus,
    loading: bookingsLoading, 
    error: bookingsError 
  } = useAdminBookings();
  const [bookings, setBookings] = useState<any[]>([]);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const course = courses.find((c) => c.id === id);

  useEffect(() => {
    let mounted = true;

    async function fetchBookings() {
      if (!isAdmin || !id) return;

      try {
        const data = await getBookingsByCourse(id);
        if (mounted) {
          setBookings(data);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    }

    fetchBookings();

    return () => {
      mounted = false;
    };
  }, [isAdmin, id, getBookingsByCourse]);

  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'waitlist') => {
    try {
      setUpdateError(null);
      await updateBookingStatus(bookingId, newStatus);
      // Rafraîchir les réservations
      const updatedBookings = await getBookingsByCourse(id!);
      setBookings(updatedBookings);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  if (adminLoading || bookingsLoading) {
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Accès refusé</h2>
            <p className="mt-4 text-gray-600">
              Vous n'avez pas les droits pour accéder à cette page.
            </p>
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
              onClick={() => navigate('/admin/courses')}
            >
              Retour à la liste des cours
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">Erreur</h2>
            <p className="mt-4 text-gray-600">{bookingsError}</p>
            <Button
              variant="secondary"
              className="mt-8"
              onClick={() => navigate('/admin/courses')}
            >
              Retour à la liste des cours
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const waitlistBookings = bookings.filter((b) => b.status === 'waitlist');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/courses')}
          >
            Retour à la liste des cours
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="mt-1 text-gray-600">
              {format(new Date(course.date), "EEEE d MMMM yyyy 'à' HH'h'mm", {
                locale: fr,
              })}
            </p>
          </div>

          {updateError && (
            <div className="m-6">
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{updateError}</p>
              </div>
            </div>
          )}

          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Liste des inscrits ({confirmedBookings.length})
            </h2>
            {confirmedBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {confirmedBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.profiles.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.profiles.full_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(
                            new Date(booking.created_at),
                            "d MMMM yyyy 'à' HH'h'mm",
                            { locale: fr }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          >
                            Annuler
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">Aucun inscrit pour le moment</p>
            )}

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
              Liste d'attente ({waitlistBookings.length})
            </h2>
            {waitlistBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {waitlistBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.profiles.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.profiles.full_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(
                            new Date(booking.created_at),
                            "d MMMM yyyy 'à' HH'h'mm",
                            { locale: fr }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            >
                              Confirmer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            >
                              Annuler
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">Aucune personne en liste d'attente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}