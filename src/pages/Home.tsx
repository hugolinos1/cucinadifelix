import { ChefHat, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden bg-cover bg-center py-32"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=2070&q=80")',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Découvrez l'Art de la Cuisine Italienne
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-100">
              Apprenez à cuisiner d'authentiques recettes italiennes dans une
              ambiance chaleureuse et conviviale
            </p>
            <div className="mt-10">
              <Link to="/courses">
                <Button size="lg" className="text-lg">
                  Réserver un cours
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center flex flex-col items-center">
              <div className="h-24 flex items-center justify-center">
                <a 
                  href="https://www.unjardinpourfelix.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://static.wixstatic.com/media/f5a669_ae2f72d78e634f989035ead13d22c5b4.jpg/v1/fill/w_229,h_189,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20un%20hjardin%20pour%20felix.jpg"
                    alt="Un Jardin pour Félix"
                    className="h-24 w-24 object-contain rounded-lg hover:opacity-80 transition-opacity"
                  />
                </a>
              </div>
              <h3 className="mt-6 text-lg font-medium">Une bonne cause</h3>
              <p className="mt-2 text-gray-600">
                Tous les bénéfices sont reversés à l'association "Un
                Jardin pour Félix"
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="h-24 flex items-center justify-center">
                <ChefHat className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium">Expert Passionné</h3>
              <p className="mt-2 text-gray-600">
                Des cours animés par Rocco, un passionné de cuisine italienne authentique
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="h-24 flex items-center justify-center">
                <Users className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium">Petits Groupes</h3>
              <p className="mt-2 text-gray-600">
                Des cours en petit comité pour un apprentissage personnalisé
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Notre Histoire
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
              L'association "Les amis d'un Jardin pour Félix", en partenariat avec
              l'épicerie italienne LA DOLCE VITA, est heureuse de proposer des cours
              de cuisine italienne. Ces cours sont animés bénévolement par le
              truculent Rocco. Les produits proviennent de l'épicerie La Dolce Vita,
              et les bénéfices sont intégralement reversés à l'association. Chaque
              participant peut déguster sur place ou repartir avec ses réalisations de la journée.
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Qui sommes-nous ? */}
      <footer className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Qui sommes-nous ?
            </h2>
            <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-8">
              <a 
                href="https://www.unjardinpourfelix.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://static.wixstatic.com/media/f5a669_ae2f72d78e634f989035ead13d22c5b4.jpg/v1/fill/w_229,h_189,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/logo%20un%20hjardin%20pour%20felix.jpg"
                  alt="Un Jardin pour Félix"
                  className="w-48 h-48 object-contain rounded-lg shadow-lg hover:opacity-80 transition-opacity"
                />
              </a>
              <p className="max-w-2xl text-lg text-gray-600 text-left">
                Nous sommes un collectif de bénévoles motivés qui mène des actions de collecte de fonds au profit de l'association Un jardin pour Félix. Félix Moulis est un jeune garçon atteint du syndrome Potocki lupski et d'un trouble autistique envahissant. L'association finance des aides à domicile pour l'aider à être autonome. Grâce à vos participations, vous contribuez aux progrès et au bien être de Félix.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
