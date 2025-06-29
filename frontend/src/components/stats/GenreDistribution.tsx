'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Music, Palette } from 'lucide-react';
import { TopArtist } from '@/services/dashboard';

interface GenreDistributionProps {
    artists: TopArtist[];
    loading?: boolean;
}

const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // orange
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange-600
    '#ec4899', // pink
    '#6366f1'  // indigo
];

export function GenreDistribution({ artists, loading = false }: GenreDistributionProps) {
    // Process artists data to get genre distribution
    const processGenreData = () => {
        if (!artists || artists.length === 0) return [];

        const genreCount: { [key: string]: number } = {};

        artists.forEach(artist => {
            if (artist.genres && artist.genres.length > 0) {
                artist.genres.forEach(genre => {
                    if (genre && genre.trim()) {
                        const cleanGenre = genre.trim().toLowerCase();
                        genreCount[cleanGenre] = (genreCount[cleanGenre] || 0) + artist.playCount;
                    }
                });
            }
        });

        // Convert to array and sort by play count
        return Object.entries(genreCount)
            .map(([genre, count]) => ({
                name: genre.charAt(0).toUpperCase() + genre.slice(1),
                value: count,
                percentage: 0 // Will be calculated after sorting
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8) // Top 8 genres
            .map((item, index, array) => {
                const total = array.reduce((sum, i) => sum + i.value, 0);
                return {
                    ...item,
                    percentage: Math.round((item.value / total) * 100)
                };
            });
    };

    const genreData = processGenreData();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{data.name}</p>
                    <p className="text-sm text-purple-600">
                        {data.value} écoutes ({data.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        if (percent < 0.05) return null; // Don't show labels for slices < 5%

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs font-medium"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-80 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (genreData.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Palette className="w-5 h-5 mr-2 text-purple-600" />
                        Distribution des genres
                    </h3>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune donnée de genre disponible</p>
                        <p className="text-sm text-gray-400">Les genres seront affichés selon vos écoutes</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Palette className="w-5 h-5 mr-2 text-purple-600" />
                        Distribution des genres
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Basé sur {artists.length} artistes écoutés
                    </p>
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={genreData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={CustomLabel}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {genreData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value: string, entry: any) => (
                                <span className="text-sm text-gray-700">
                                    {value} ({entry.payload.percentage}%)
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Genre Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {genreData.length}
                    </div>
                    <div className="text-sm text-gray-500">Genres écoutés</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {genreData[0]?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Genre favori</div>
                </div>
            </div>
        </motion.div>
    );
}
