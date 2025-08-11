import { revenueApi } from '@/lib/api';

export interface Revenue {
  id: string;
  gameId: string;
  userId: string;
  amount: number;
  currency: string;
  transactionId: string;
  createdAt: string;
}

export interface DailyRevenue {
  date: string;
  totalAmount: number;
  transactionCount: number;
}

export async function getRevenueByGameId(
  gameId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<Revenue[]> {
  try {
    const response = await revenueApi.getByGameId(gameId, {
      startDate,
      endDate,
      limit
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching revenue for game ${gameId}:`, error);
    return [];
  }
}

export async function getTotalRevenueByGame(gameId: string): Promise<number> {
  try {
    const response = await revenueApi.getByGameId(gameId, {
      total: true
    });
    return response.data.total;
  } catch (error) {
    console.error(`Error fetching total revenue for game ${gameId}:`, error);
    return 0;
  }
}

export async function getRevenueByDay(
  gameId: string,
  startDate?: string,
  endDate?: string
): Promise<DailyRevenue[]> {
  try {
    const response = await revenueApi.getByGameId(gameId, {
      startDate,
      endDate,
      groupBy: 'day'
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching daily revenue for game ${gameId}:`, error);
    return [];
  }
} 