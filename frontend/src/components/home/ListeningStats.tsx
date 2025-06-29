'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Music, Headphones, Calendar, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Stats {
  totalListeningTime: number; // minutes
  tracksPlayed: number;
  favoriteGenre: string;
  topArtist: string;
  weeklyGoal: number; // minutes
  weeklyProgress: number; // minutes
  streak: number; // days
  monthlyRank: number;
}

export function ListeningStats() {
  const [stats] = useState<Stats>({
    totalListeningTime: 1247, // minutes this week
    tracksPlayed: 156,
    favoriteGenre: 'Indie Rock',
    topArtist: 'Arctic Monkeys',
    weeklyGoal: 1800, // 30 hours
    weeklyProgress: 1247,
    streak: 12,
    monthlyRank: 3
  });

  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('matin');
    else if (hour < 18) setTimeOfDay('après-midi');
    else setTimeOfDay('soir');
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getProgressPercentage = () => {
    return Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100);
  };

  const getStreakMessage = () => {
    if (stats.streak >= 30) return 'Incroyable ! 🔥';
    if (stats.streak >= 14) return 'Excellent ! 🎵';
    if (stats.streak >= 7) return 'Bien joué ! ⭐';
    return 'Continue ! 💪';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900">
          Vos statistiques
        </h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Voir tout
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Weekly Goal Progress */}
        <motion.div variants={itemVariants} className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Objectif hebdomadaire</h3>
                <p className="text-primary-100 text-sm">
                  Bon {timeOfDay} ! Vous progressez bien 🎯
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-primary-100">Progression</span>
                <span className="font-medium">
                  {formatTime(stats.weeklyProgress)} / {formatTime(stats.weeklyGoal)}
                </span>
              </div>

              <div className="w-full h-2 bg-primary-400 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-white rounded-full"
                />
              </div>

              <div className="text-right text-primary-100 text-sm">
                {getProgressPercentage().toFixed(0)}% terminé
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary-900">
                    {formatTime(stats.totalListeningTime)}
                  </div>
                  <div className="text-sm text-secondary-600">Cette semaine</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary-900">
                    {stats.tracksPlayed}
                  </div>
                  <div className="text-sm text-secondary-600">Titres écoutés</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Favorite Genre & Artist */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-body">
            <h3 className="font-semibold text-secondary-900 mb-4">Vos préférences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Music className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-900">Genre favori</div>
                    <div className="text-sm text-secondary-600">{stats.favoriteGenre}</div>
                  </div>
                </div>
                <div className="text-primary-600 text-sm font-medium">67%</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-secondary-900">Artiste top</div>
                    <div className="text-sm text-secondary-600">{stats.topArtist}</div>
                  </div>
                </div>
                <div className="text-primary-600 text-sm font-medium">23 écoutes</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Streak & Rank */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-secondary-900">
                    {stats.streak} jours
                  </div>
                  <div className="text-xs text-secondary-600">
                    {getStreakMessage()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-secondary-900">
                    #{stats.monthlyRank}
                  </div>
                  <div className="text-xs text-secondary-600">Ce mois-ci</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Listening Timeline */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-body">
            <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-secondary-500" />
              Votre rythme d'écoute
            </h3>

            <div className="space-y-3">
              {[
                { time: 'Matin (6h-12h)', percentage: 25, color: 'bg-yellow-400' },
                { time: 'Après-midi (12h-18h)', percentage: 45, color: 'bg-blue-400' },
                { time: 'Soirée (18h-24h)', percentage: 30, color: 'bg-purple-400' }
              ].map((period, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-700">{period.time}</span>
                    <span className="font-medium text-secondary-900">{period.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${period.percentage}%` }}
                      transition={{ duration: 1, delay: 0.2 * index }}
                      className={`h-full ${period.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
