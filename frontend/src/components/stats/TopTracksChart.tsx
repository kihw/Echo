'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Play, Clock } from 'lucide-react';
import { TopTrack } from '@/services/dashboard';

interface TopTracksChartProps {
    tracks: TopTrack[];
    loading?: boolean;
}

export function TopTracksChart({ tracks, loading = false }: TopTracksChartProps) {
    // Process tracks data for chart
    const processTracksData = () => {
        if (!tracks || tracks.length === 0) return [];

        return tracks.slice(0, 10).map((track, index) => ({
            name: track.name.length > 20 ? track.name.substring(0, 20) + '...' : track.name,
            fullName: track.name,
            artist: track.artist,
            playCount: track.playCount,
            duration: Math.round(track.totalDuration / (1000 * 60)), // Convert to minutes
            rank: index + 1
        }));
    };

    const chartData = processTracksData();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
                    <p className="text-sm font-medium text-gray-900">{data.fullName}</p>
                    <p className="text-xs text-gray-600">{data.artist}</p>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-blue-600 flex items-center">
                            <Play className="w-3 h-3 mr-1" />
                            {data.playCount} écoutes
                        </p>
                        <p className="text-sm text-green-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {data.duration} min au total
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                        Top Tracks les plus écoutés
                    </h3>
                </div>
                <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun top track disponible</p>
                        <p className="text-sm text-gray-400">Écoutez de la musique pour voir votre classement</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalPlays = chartData.reduce((sum, track) => sum + track.playCount, 0);
    const averagePlays = Math.round(totalPlays / chartData.length);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                        Top Tracks les plus écoutés
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalPlays} écoutes au total • Moyenne: {averagePlays} écoutes/track
                    </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        Nombre d'écoutes
                    </div>
                </div>
            </div>

            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value: number) => `${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="playCount"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Track Rankings */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                        <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                        Top 3
                    </h4>
                    {chartData.slice(0, 3).map((track, index) => (
                        <div key={track.fullName} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                        'bg-amber-100 text-amber-700'
                                }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{track.fullName}</p>
                                <p className="text-xs text-gray-600 truncate">{track.artist}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{track.playCount}</p>
                                <p className="text-xs text-gray-500">écoutes</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Statistiques</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Track le plus écouté:</span>
                            <span className="font-medium">{chartData[0]?.playCount || 0} fois</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Temps total d'écoute:</span>
                            <span className="font-medium">
                                {Math.round(chartData.reduce((sum, track) => sum + track.duration, 0) / 60)}h
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Track moyen:</span>
                            <span className="font-medium">{averagePlays} écoutes</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
