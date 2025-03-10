import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useCourses } from '../../hooks/useCourses';
import { useAdminCourses } from '../../hooks/useAdminCourses';
import { Button } from '../../components/Button';

export function CourseForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { courses } = useCourses();
  const { createCourse, updateCourse, loading } = useAdminCourses();
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const course = courses.find((c) => c.id === id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    date: '',
    location: '',
    price: '',
    max_seats: '',
  });

  useEffect(() => {
    if (isEditing && course) {
      setFormData({
        title: course.title,
        description: course.description || '',
        image_url: course.image_url || '',
        date: new Date(course.date).toISOString().slice(0, 16),
        location: course.location,
        price: course.price.toString(),
        max_seats: course.max_seats.toString(),
      });
    }
  }, [isEditing, course]);

  if (adminLoading) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        price: parseFloat(formData.price),
        max_seats: parseInt(formData.max_seats, 10),
      };

      if (isEditing && id) {
        await updateCourse(id, courseData);
      } else {
        await createCourse(courseData);
      }

      navigate('/admin/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Modifier le cours' : 'Nouveau cours'}
          </h1>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Titre
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="image_url"
                className="block text-sm font-medium text-gray-700"
              >
                URL de l'image
              </label>
              <input
                type="url"
                id="image_url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Date et heure
              </label>
              <input
                type="datetime-local"
                id="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Lieu
              </label>
              <input
                type="text"
                id="location"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Prix (€)
              </label>
              <input
                type="number"
                id="price"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="max_seats"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre de places
              </label>
              <input
                type="number"
                id="max_seats"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.max_seats}
                onChange={(e) =>
                  setFormData({ ...formData, max_seats: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/courses')}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? 'Enregistrement...'
                  : isEditing
                  ? 'Modifier'
                  : 'Créer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}