'use client';

import { motion } from 'framer-motion';
import { Calendar, Activity } from 'lucide-react';
import { ListeningHistory } from '@/services/dashboard';

interface ActivityHeatmapProps {
    data: ListeningHistory[];
    loading?: boolean;
}

export function ActivityHeatmap({ data, loading = false }: ActivityHeatmapProps) {
    // Generate activity data for the heatmap
    const generateHeatmapData = () => {
        if (!data || data.length === 0) return { grid: [], maxValue: 0 };

        // Create a grid for the last 12 weeks (7 days x 12 weeks)
        const weeks = 12;
        const days = 7;
        const grid: number[][] = Array(weeks).fill(0).map(() => Array(days).fill(0));

        // Get the current date and calculate the start date
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (weeks * 7 - 1));

        // Process listening data
        const activityData: { [key: string]: number } = {};

        data.forEach(item => {
            const date = new Date(item.playedAt);
            const dateKey = date.toDateString();
            if (!activityData[dateKey]) {
                activityData[dateKey] = 0;
            }
            activityData[dateKey] += item.duration / (1000 * 60); // Convert to minutes
        });

        // Fill the grid
        let maxValue = 0;
        for (let week = 0; week < weeks; week++) {
            for (let day = 0; day < days; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                const dateKey = currentDate.toDateString();
                const minutes = Math.round(activityData[dateKey] || 0);
                grid[week][day] = minutes;
                maxValue = Math.max(maxValue, minutes);
            }
        }

        return { grid, maxValue, startDate };
    };

    const { grid, maxValue, startDate } = generateHeatmapData();

    // Get intensity class based on activity level
    const getIntensityClass = (value: number) => {
        if (value === 0) return 'bg-gray-100';
        const intensity = value / maxValue;
        if (intensity <= 0.25) return 'bg-green-200';
        if (intensity <= 0.5) return 'bg-green-400';
        if (intensity <= 0.75) return 'bg-green-600';
        return 'bg-green-800';
    };

    const getDayLabel = (dayIndex: number) => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return days[dayIndex];
    };

    const getWeekLabel = (weekIndex: number) => {
        if (!startDate) return '';
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (weekIndex * 7));
        return weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-40 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (grid.length === 0 || maxValue === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-green-600" />
                        Heatmap d'activité
                    </h3>
                </div>
                <div className="h-40 flex items-center justify-center">
                    <div className="text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune activité à afficher</p>
                        <p className="text-sm text-gray-400">Votre activité d'écoute apparaîtra ici</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalMinutes = grid.flat().reduce((sum, value) => sum + value, 0);
    const averageMinutes = Math.round(totalMinutes / (grid.length * 7));
    const activedays = grid.flat().filter(value => value > 0).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-green-600" />
                        Heatmap d'activité
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {activedays} jours actifs • Moyenne: {averageMinutes} min/jour
                    </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Moins</span>
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                        <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
                    </div>
                    <span>Plus</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Day labels */}
                    <div className="flex mb-2">
                        <div className="w-12"></div> {/* Space for week labels */}
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                            <div key={dayIndex} className="w-4 text-xs text-gray-500 text-center">
                                {getDayLabel(dayIndex)}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap grid */}
                    <div className="space-y-1">
                        {grid.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex items-center">
                                {/* Week label */}
                                <div className="w-10 text-xs text-gray-500 text-right pr-2">
                                    {weekIndex % 4 === 0 ? getWeekLabel(weekIndex) : ''}
                                </div>
                                {/* Day cells */}
                                <div className="flex space-x-1">
                                    {week.map((dayValue, dayIndex) => {
                                        const currentDate = new Date(startDate!);
                                        currentDate.setDate(startDate!.getDate() + (weekIndex * 7) + dayIndex);

                                        return (
                                            <div
                                                key={dayIndex}
                                                className={`w-3 h-3 rounded-sm ${getIntensityClass(dayValue)} cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all`}
                                                title={`${currentDate.toLocaleDateString('fr-FR')} - ${dayValue} min d'écoute`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {Math.round(totalMinutes / 60)}h
                    </div>
                    <div className="text-sm text-gray-500">Total d'écoute</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {activedays}
                    </div>
                    <div className="text-sm text-gray-500">Jours actifs</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {maxValue}min
                    </div>
                    <div className="text-sm text-gray-500">Jour le plus actif</div>
                </div>
            </div>
        </motion.div>
    );
}
