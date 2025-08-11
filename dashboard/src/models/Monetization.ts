import { monetizationApi } from '@/lib/api';

export interface Monetization {
  id: string;
  gameId: string;
  userId: string;
  productId: string;
  productType: string;
  amount: number;
  currency: string;
  platform: string;
  createdAt: string;
}

export interface MonetizationMetrics {
  totalRevenue: number;
  averageTransactionValue: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    revenue: number;
    count: number;
  }>;
}

export async function getMonetizationByGameId(
  gameId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<Monetization[]> {
  try {
    const response = await monetizationApi.getByGameId(gameId, {
      startDate,
      endDate,
      limit
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching monetization data for game ${gameId}:`, error);
    return [];
  }
}

export async function getMonetizationMetrics(
  gameId: string,
  startDate?: string,
  endDate?: string
): Promise<MonetizationMetrics> {
  try {
    const response = await monetizationApi.getByGameId(gameId, {
      startDate,
      endDate,
      metrics: true
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching monetization metrics for game ${gameId}:`, error);
    return {
      totalRevenue: 0,
      averageTransactionValue: 0,
      conversionRate: 0,
      topProducts: []
    };
  }
} 