import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Euro, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Database } from '../types/database.types';
import { Button } from './Button';

type Course = Database['public']['Tables']['courses']['Row'];

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {course.image_url && (
        <img
          src={course.image_url}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-2" />
            <span>
              {course.available_seats} place{course.available_seats > 1 ? 's' : ''}{' '}
              disponible{course.available_seats > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span>{course.location}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Euro className="h-5 w-5 mr-2" />
            <span>{course.price} €</span>
          </div>
        </div>
        <p className="mt-4 text-gray-600 line-clamp-2">{course.description}</p>
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">
            {format(new Date(course.date), "EEEE d MMMM yyyy 'à' HH'h'mm", {
              locale: fr,
            })}
          </p>
          <Link to={`/courses/${course.id}`}>
            <Button className="w-full">
              {course.available_seats > 0 ? 'Réserver' : "Liste d'attente"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}