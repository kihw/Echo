'use client';

import { motion } from 'framer-motion';
import { Play, Music, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function WelcomeHero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="flex justify-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-xl">
              <Music className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Main Heading */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold text-secondary-900"
            >
              Bienvenue sur{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Echo
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl md:text-2xl text-secondary-600 max-w-2xl mx-auto leading-relaxed"
            >
              Votre lecteur de musique intelligent avec synchronisation multi-plateforme
              et recommandations personnalisées
            </motion.p>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 text-secondary-700"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span>Synchronisation Spotify, Deezer, YouTube Music</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>Recommandations IA personnalisées</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Gestion avancée des playlists</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth/register"
              className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/auth/login"
              className="bg-white text-secondary-900 px-8 py-4 rounded-xl font-semibold border-2 border-secondary-200 hover:border-secondary-300 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Se connecter</span>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="grid grid-cols-3 gap-8 max-w-md mx-auto pt-8"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">50M+</div>
              <div className="text-sm text-secondary-600">Titres disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">10K+</div>
              <div className="text-sm text-secondary-600">Utilisateurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">99.9%</div>
              <div className="text-sm text-secondary-600">Uptime garanti</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-20 right-20 w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl shadow-lg hidden lg:flex items-center justify-center"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 15, 0],
          rotate: [0, -3, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1
        }}
        className="absolute bottom-40 left-16 w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-500 rounded-xl shadow-lg hidden lg:flex items-center justify-center"
      >
        <Music className="w-6 h-6 text-white" />
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-secondary-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-secondary-400 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </div>
  );
}
