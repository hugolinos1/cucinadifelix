import { useCourses } from '../hooks/useCourses';
import { CourseCard } from '../components/CourseCard';

export function Courses() {
  const { courses, loading, error } = useCourses();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Chargement des cours...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600">
              Une erreur est survenue
            </h2>
            <p className="mt-4 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Nos Cours de Cuisine
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Découvrez nos prochains cours et réservez votre place
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-gray-600">Aucun cours n'est disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}