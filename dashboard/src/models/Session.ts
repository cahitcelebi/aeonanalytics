import { sessionsApi } from '@/lib/api';

export interface Session {
  id: string;
  gameId: string;
  userId: string;
  deviceId: string;
  platform: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  createdAt: string;
}

export async function getSessionsByGameId(
  gameId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<Session[]> {
  try {
    const response = await sessionsApi.getByGameId(gameId, {
      startDate,
      endDate,
      limit
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching sessions for game ${gameId}:`, error);
    return [];
  }
}

export async function getSessionsByUserId(
  gameId: string,
  userId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<Session[]> {
  try {
    const response = await sessionsApi.getByGameId(gameId, {
      userId,
      startDate,
      endDate,
      limit
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching sessions for user ${userId}:`, error);
    return [];
  }
}

export async function getAverageSessionDuration(
  gameId: string,
  startDate?: string,
  endDate?: string
): Promise<number> {
  try {
    const response = await sessionsApi.getByGameId(gameId, {
      startDate,
      endDate,
      averageDuration: true
    });
    return response.data.averageDuration;
  } catch (error) {
    console.error(`Error fetching average session duration for game ${gameId}:`, error);
    return 0;
  }
} 