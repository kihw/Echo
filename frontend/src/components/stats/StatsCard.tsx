'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    loading?: boolean;
}

const colorClasses = {
    blue: {
        bg: 'from-blue-50 to-blue-100',
        icon: 'text-blue-600',
        text: 'text-blue-900',
        trend: 'text-blue-700'
    },
    green: {
        bg: 'from-green-50 to-green-100',
        icon: 'text-green-600',
        text: 'text-green-900',
        trend: 'text-green-700'
    },
    purple: {
        bg: 'from-purple-50 to-purple-100',
        icon: 'text-purple-600',
        text: 'text-purple-900',
        trend: 'text-purple-700'
    },
    orange: {
        bg: 'from-orange-50 to-orange-100',
        icon: 'text-orange-600',
        text: 'text-orange-900',
        trend: 'text-orange-700'
    },
    red: {
        bg: 'from-red-50 to-red-100',
        icon: 'text-red-600',
        text: 'text-red-900',
        trend: 'text-red-700'
    }
};

export function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    color,
    loading = false
}: StatsCardProps) {
    const colors = colorClasses[color];

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className={`p-4 bg-gradient-to-br ${colors.bg} rounded-lg`}>
                <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${colors.icon}`} />
                    {trend && (
                        <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {trendUp ? '+' : '-'}{trend}
                        </span>
                    )}
                </div>

                <div className={`text-3xl font-bold ${colors.text} mb-2`}>
                    {value}
                </div>

                <div className={`text-sm ${colors.trend}`}>
                    {title}
                </div>
            </div>
        </motion.div>
    );
}
