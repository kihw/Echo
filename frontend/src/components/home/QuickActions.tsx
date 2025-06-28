'use client';

import { motion } from 'framer-motion';
import { Shuffle, Music, TrendingUp, Zap, Plus, Download } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      id: 'generate',
      title: 'Générer une playlist',
      description: 'Créez une playlist personnalisée avec l\'IA',
      icon: Shuffle,
      color: 'primary',
      action: () => {
        // Navigate to playlist generation
        console.log('Generate playlist');
      },
    },
    {
      id: 'discover',
      title: 'Découvrir',
      description: 'Explorez de nouveaux artistes et genres',
      icon: TrendingUp,
      color: 'accent',
      action: () => {
        // Navigate to discovery
        console.log('Discover music');
      },
    },
    {
      id: 'create',
      title: 'Créer une playlist',
      description: 'Commencez une nouvelle playlist vide',
      icon: Plus,
      color: 'purple',
      action: () => {
        // Create new playlist
        console.log('Create playlist');
      },
    },
    {
      id: 'import',
      title: 'Importer',
      description: 'Synchronisez vos playlists depuis d\'autres services',
      icon: Download,
      color: 'green',
      action: () => {
        // Navigate to import
        console.log('Import playlists');
      },
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-700 hover:bg-primary-200';
      case 'accent':
        return 'bg-accent-100 text-accent-700 hover:bg-accent-200';
      case 'purple':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'green':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      default:
        return 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900">Actions rapides</h2>
        <Zap className="w-5 h-5 text-accent-500" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            variants={itemVariants}
            onClick={action.action}
            className={`group p-6 rounded-xl border border-secondary-200 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left ${getColorClasses(action.color)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${action.color === 'primary' ? 'bg-primary-200' :
                  action.color === 'accent' ? 'bg-accent-200' :
                    action.color === 'purple' ? 'bg-purple-200' :
                      action.color === 'green' ? 'bg-green-200' :
                        'bg-secondary-200'
                }`}>
                <action.icon className="w-6 h-6" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-current rounded-full"></div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-current">
                {action.title}
              </h3>
              <p className="text-sm opacity-80">
                {action.description}
              </p>
            </div>

            <div className="mt-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-medium">Commencer</span>
              <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-current rounded-full transform group-hover:translate-x-0.5 transition-transform"></div>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-xl p-6 mt-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Votre activité aujourd'hui
            </h3>
            <div className="flex items-center space-x-6 text-sm text-secondary-600">
              <div className="flex items-center space-x-2">
                <Music className="w-4 h-4" />
                <span>12 titres écoutés</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                <span>2h 34min d'écoute</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-accent-500 rounded-full"></div>
                <span>3 nouvelles découvertes</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
