'use client';

import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { ListeningHistory } from '@/services/dashboard';

interface ListeningChartProps {
    data: ListeningHistory[];
    period: 'week' | 'month' | 'year' | 'all';
    loading?: boolean;
}

export function ListeningChart({ data, period, loading = false }: ListeningChartProps) {
    // Process data for chart
    const processDataForChart = () => {
        if (!data || data.length === 0) return [];

        // Group data by date
        const groupedData: { [key: string]: number } = {};

        data.forEach(item => {
            const date = new Date(item.playedAt).toLocaleDateString('fr-FR');
            if (!groupedData[date]) {
                groupedData[date] = 0;
            }
            groupedData[date] += item.duration / (1000 * 60); // Convert to minutes
        });

        // Convert to array and sort by date
        return Object.entries(groupedData)
            .map(([date, minutes]) => ({
                date,
                minutes: Math.round(minutes),
                hours: Math.round(minutes / 60 * 10) / 10
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30); // Show last 30 days
    };

    const chartData = processDataForChart();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-blue-600">
                        {data.hours}h d'écoute ({data.minutes} min)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-80 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                        Activité d'écoute
                    </h3>
                    <span className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {period === 'week' ? '7 derniers jours' :
                            period === 'month' ? '30 derniers jours' :
                                period === 'year' ? 'Cette année' : 'Depuis le début'}
                    </span>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune donnée d'écoute disponible</p>
                        <p className="text-sm text-gray-400">Écoutez de la musique pour voir votre activité</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalMinutes = chartData.reduce((sum, item) => sum + item.minutes, 0);
    const averageMinutes = Math.round(totalMinutes / chartData.length);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                        Activité d'écoute
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Moyenne: {averageMinutes} min/jour • Total: {Math.round(totalMinutes / 60)}h
                    </p>
                </div>
                <span className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {period === 'week' ? '7 derniers jours' :
                        period === 'month' ? '30 derniers jours' :
                            period === 'year' ? 'Cette année' : 'Depuis le début'}
                </span>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value: string) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit'
                                });
                            }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tickFormatter={(value: number) => `${value}min`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="minutes"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
