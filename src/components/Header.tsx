import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LogOut } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

export function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 justify-between items-center">
          <div className="flex items-center space-x-4">
            <a
              href="https://www.unjardinpourfelix.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="https://static.wixstatic.com/media/f5a669_ae2f72d78e634f989035ead13d22c5b4.jpg/v1/fill/w_229,h_189,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20un%20hjardin%20pour%20felix.jpg"
                alt="Un Jardin pour Félix"
                className="h-16 w-auto rounded-lg"
              />
            </a>
            <Link to="/" className="flex items-center space-x-2">
              <UtensilsCrossed className="h-8 w-8 text-green-600" />
              <span className="text-xl font-semibold text-gray-900">
                Cuisine Italienne
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/courses">
              <Button variant="secondary">Voir les cours</Button>
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link to="/admin/courses">
                    <Button variant="secondary">Administration</Button>
                  </Link>
                )}
                <span className="text-sm text-gray-700">{user.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline">Se connecter</Button>
                </Link>
                <Link to="/register">
                  <Button>S'inscrire</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}