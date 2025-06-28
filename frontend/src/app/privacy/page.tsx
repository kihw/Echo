import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Politique de Confidentialité</h1>
            <p className="text-gray-600 mt-2">Echo Music Player</p>
          </div>

          <div className="prose max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Chez Echo Music Player, nous respectons votre vie privée et nous nous engageons à protéger
              vos données personnelles. Cette politique de confidentialité explique comment nous collectons,
              utilisons et protégeons vos informations.
            </p>

            <h2>2. Informations que nous collectons</h2>
            <h3>Informations que vous nous fournissez</h3>
            <ul>
              <li>Informations de compte (nom, adresse email, mot de passe)</li>
              <li>Préférences musicales et paramètres</li>
              <li>Contenu que vous créez (playlists, favoris)</li>
            </ul>

            <h3>Informations collectées automatiquement</h3>
            <ul>
              <li>Historique d'écoute et habitudes musicales</li>
              <li>Informations sur votre appareil et navigateur</li>
              <li>Adresse IP et données de localisation approximative</li>
              <li>Cookies et technologies similaires</li>
            </ul>

            <h2>3. Comment nous utilisons vos informations</h2>
            <p>Nous utilisons vos informations pour :</p>
            <ul>
              <li>Fournir et améliorer notre service</li>
              <li>Personnaliser votre expérience musicale</li>
              <li>Générer des recommandations personnalisées</li>
              <li>Communiquer avec vous sur le service</li>
              <li>Analyser l'utilisation pour améliorer nos fonctionnalités</li>
            </ul>

            <h2>4. Partage de vos informations</h2>
            <p>Nous ne vendons pas vos données personnelles. Nous pouvons partager vos informations avec :</p>
            <ul>
              <li>
                <strong>Services musicaux partenaires</strong> : Spotify, Deezer, YouTube Music
                (selon vos connexions)
              </li>
              <li>
                <strong>Prestataires de services</strong> : Hébergement, analytics, support client
              </li>
              <li>
                <strong>Autorités légales</strong> : Si requis par la loi
              </li>
            </ul>

            <h2>5. Sécurité des données</h2>
            <p>
              Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations
              contre l'accès non autorisé, la modification, la divulgation ou la destruction, notamment :
            </p>
            <ul>
              <li>Chiffrement des données sensibles</li>
              <li>Accès limité aux données personnelles</li>
              <li>Surveillance continue de la sécurité</li>
              <li>Audits de sécurité réguliers</li>
            </ul>

            <h2>6. Vos droits</h2>
            <p>Vous avez le droit de :</p>
            <ul>
              <li>Accéder à vos données personnelles</li>
              <li>Corriger des informations inexactes</li>
              <li>Supprimer vos données (droit à l'oubli)</li>
              <li>Limiter le traitement de vos données</li>
              <li>Portabilité de vos données</li>
              <li>Vous opposer au traitement</li>
            </ul>

            <h2>7. Cookies et technologies de suivi</h2>
            <p>
              Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience.
              Vous pouvez contrôler les cookies via les paramètres de votre navigateur.
            </p>

            <h2>8. Services tiers</h2>
            <p>
              Notre service s'intègre avec des plateformes musicales tierces. Chaque service a sa propre
              politique de confidentialité que nous vous encourageons à consulter :
            </p>
            <ul>
              <li>Spotify : spotify.com/privacy</li>
              <li>Deezer : deezer.com/legal/personal-datas</li>
              <li>YouTube : policies.google.com/privacy</li>
            </ul>

            <h2>9. Conservation des données</h2>
            <p>
              Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos
              services et respecter nos obligations légales. Vous pouvez demander la suppression de vos
              données à tout moment.
            </p>

            <h2>10. Modifications de cette politique</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité de temps à autre. Nous vous
              notifierons des changements importants par email ou via notre service.
            </p>

            <h2>11. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles,
              contactez-nous à :
            </p>
            <ul>
              <li>Email : privacy@echo-music.com</li>
              <li>Adresse : Echo Music Player, Département Confidentialité</li>
            </ul>
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
