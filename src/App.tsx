import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import Login from './pages/Login';
import { Register } from './pages/Register';
import { Courses } from './pages/Courses';
import { CourseDetails } from './pages/CourseDetails';
import { AdminCourses } from './pages/admin/AdminCourses';
import { CourseForm } from './pages/admin/CourseForm';
import { CourseBookings } from './pages/admin/CourseBookings';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/new" element={<CourseForm />} />
            <Route path="/admin/courses/:id/edit" element={<CourseForm />} />
            <Route path="/admin/courses/:id/bookings" element={<CourseBookings />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;