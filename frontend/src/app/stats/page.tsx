'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Music, User, Award,
    BarChart3, Activity
} from 'lucide-react';
import { ResponsiveDashboardLayout } from '@/components/layout/ResponsiveDashboardLayout';
import { useDashboard } from '@/hooks/useDashboard';
import { ListeningChart } from '@/components/stats/ListeningChart';
import { GenreDistribution } from '@/components/stats/GenreDistribution';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { StatsCard } from '@/components/stats/StatsCard';
import { TopTracksChart } from '@/components/stats/TopTracksChart';

type TimePeriod = 'week' | 'month' | 'year' | 'all';

export default function StatsPage() {
    const { data: dashboardData, stats, loading, error: _error } = useDashboard();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            setCurrentTime(timeString);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const formatDuration = (milliseconds: number) => {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    };

    const periodLabels = {
        week: 'Cette semaine',
        month: 'Ce mois',
        year: 'Cette année',
        all: 'Depuis le début'
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
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
        <ResponsiveDashboardLayout>
            <motion.div
                className="max-w-7xl mx-auto space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                                <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                                Statistiques d'écoute
                            </h1>
                            <p className="text-secondary-600 mt-2">
                                Analysez vos habitudes musicales • {currentTime}
                            </p>
                        </div>

                        {/* Period Filter */}
                        <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200">
                            {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedPeriod === period
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-600 hover:text-primary-600'
                                        }`}
                                >
                                    {periodLabels[period]}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Quick Stats Cards */}
                <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsCard
                            title="Temps d'écoute"
                            value={formatDuration(stats?.totalListeningTime || 0)}
                            icon={Clock}
                            trend="+12%"
                            trendUp={true}
                            color="blue"
                            loading={loading}
                        />
                        <StatsCard
                            title="Morceaux"
                            value={stats?.totalTracks?.toString() || '0'}
                            icon={Music}
                            trend="+8"
                            trendUp={true}
                            color="green"
                            loading={loading}
                        />
                        <StatsCard
                            title="Artistes"
                            value={stats?.totalArtists?.toString() || '0'}
                            icon={User}
                            trend="+3"
                            trendUp={true}
                            color="purple"
                            loading={loading}
                        />
                        <StatsCard
                            title="Playlists"
                            value={stats?.totalPlaylists?.toString() || '0'}
                            icon={Award}
                            trend="+2"
                            trendUp={true}
                            color="orange"
                            loading={loading}
                        />
                    </div>
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Listening Activity Chart */}
                    <motion.div variants={itemVariants}>
                        <ListeningChart
                            data={dashboardData?.listeningHistory || []}
                            period={selectedPeriod}
                            loading={loading}
                        />
                    </motion.div>

                    {/* Genre Distribution */}
                    <motion.div variants={itemVariants}>
                        <GenreDistribution
                            artists={dashboardData?.topArtists || []}
                            loading={loading}
                        />
                    </motion.div>
                </div>

                {/* Top Tracks Chart */}
                <motion.div variants={itemVariants}>
                    <TopTracksChart
                        tracks={dashboardData?.topTracks || []}
                        loading={loading}
                    />
                </motion.div>

                {/* Activity Heatmap */}
                <motion.div variants={itemVariants}>
                    <ActivityHeatmap
                        data={dashboardData?.listeningHistory || []}
                        loading={loading}
                    />
                </motion.div>

                {/* Detailed Statistics */}
                <motion.div variants={itemVariants}>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <Activity className="w-6 h-6 mr-2 text-primary-600" />
                                Statistiques détaillées
                            </h3>
                            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                Exporter les données
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Temps d'écoute</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Moyenne par jour:</span>
                                        <span className="font-medium">
                                            {formatDuration((stats?.totalListeningTime || 0) / 30)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Plus longue session:</span>
                                        <span className="font-medium">2h 45min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Heure préférée:</span>
                                        <span className="font-medium">20h-22h</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Découvertes</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nouveaux artistes:</span>
                                        <span className="font-medium">8 ce mois</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nouveaux genres:</span>
                                        <span className="font-medium">3 ce mois</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Taux de découverte:</span>
                                        <span className="font-medium">25%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Fidélité</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tracks en repeat:</span>
                                        <span className="font-medium">15</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Taux de completion:</span>
                                        <span className="font-medium">78%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tracks skipées:</span>
                                        <span className="font-medium">22%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </ResponsiveDashboardLayout>
    );
}
