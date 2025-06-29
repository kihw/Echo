'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardData, DashboardStats } from '@/services/dashboard';
import { toast } from 'react-hot-toast';

interface UseDashboardReturn {
  data: DashboardData | null;
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);
      setStats(dashboardData.stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      toast.error('Erreur lors du chargement du dashboard');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  const refreshStats = useCallback(async () => {
    try {
      const statsData = await dashboardService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Stats refresh error:', err);
      toast.error('Erreur lors du rafraîchissement des statistiques');
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    data,
    stats,
    loading,
    error,
    refreshData,
    refreshStats
  };
}
