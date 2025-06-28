import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
            <p className="text-gray-600 mt-2">Echo Music Player</p>
          </div>

          <div className="prose max-w-none">
            <h2>1. Acceptation des conditions</h2>
            <p>
              En utilisant Echo Music Player, vous acceptez d'être lié par ces conditions générales d'utilisation.
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>

            <h2>2. Description du service</h2>
            <p>
              Echo Music Player est une application de streaming musical qui vous permet d'écouter de la musique,
              de créer des playlists et de découvrir de nouveaux artistes. Notre service se connecte à diverses
              plateformes musicales pour vous offrir une expérience unifiée.
            </p>

            <h2>3. Compte utilisateur</h2>
            <p>
              Pour utiliser certaines fonctionnalités de notre service, vous devez créer un compte. Vous êtes
              responsable de maintenir la confidentialité de vos informations de connexion et de toutes les
              activités qui se produisent sous votre compte.
            </p>

            <h2>4. Utilisation acceptable</h2>
            <p>
              Vous vous engagez à utiliser Echo Music Player uniquement à des fins légales et conformément à
              ces conditions. Vous ne devez pas :
            </p>
            <ul>
              <li>Violer les droits de propriété intellectuelle</li>
              <li>Utiliser le service pour des activités illégales</li>
              <li>Tenter de compromettre la sécurité du service</li>
              <li>Harceler ou intimider d'autres utilisateurs</li>
            </ul>

            <h2>5. Propriété intellectuelle</h2>
            <p>
              Tout le contenu et les technologies utilisés dans Echo Music Player sont protégés par des droits
              d'auteur et d'autres lois sur la propriété intellectuelle. Vous ne pouvez pas copier, modifier
              ou distribuer ce contenu sans autorisation.
            </p>

            <h2>6. Confidentialité</h2>
            <p>
              Votre vie privée est importante pour nous. Veuillez consulter notre{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                Politique de Confidentialité
              </Link>{' '}
              pour comprendre comment nous collectons et utilisons vos informations.
            </p>

            <h2>7. Modification du service</h2>
            <p>
              Nous nous réservons le droit de modifier ou d'interrompre notre service à tout moment, avec ou
              sans préavis. Nous ne serons pas responsables envers vous ou tout tiers de toute modification,
              suspension ou interruption du service.
            </p>

            <h2>8. Limitation de responsabilité</h2>
            <p>
              Echo Music Player est fourni "tel quel" sans garantie d'aucune sorte. Nous ne serons pas
              responsables des dommages directs, indirects, accessoires ou consécutifs résultant de
              l'utilisation de notre service.
            </p>

            <h2>9. Résiliation</h2>
            <p>
              Nous pouvons résilier ou suspendre votre compte et votre accès au service immédiatement,
              sans préavis ni responsabilité, pour quelque raison que ce soit, y compris si vous violez
              ces conditions.
            </p>

            <h2>10. Modifications des conditions</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
              entreront en vigueur immédiatement après leur publication sur cette page.
            </p>

            <h2>11. Contact</h2>
            <p>
              Si vous avez des questions concernant ces conditions, veuillez nous contacter à
              support@echo-music.com.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Retour à l'inscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
