import { gamesApi } from '@/lib/api';

export interface Game {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export async function getGames(): Promise<Game[]> {
  try {
    const response = await gamesApi.getAll();
    return response.data;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

export async function getGameById(id: string): Promise<Game | null> {
  try {
    const response = await gamesApi.getById(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching game ${id}:`, error);
    return null;
  }
}

export async function createGame(game: Omit<Game, 'id' | 'apiKey' | 'createdAt' | 'updatedAt'>): Promise<Game | null> {
  try {
    const response = await gamesApi.create(game);
    return response.data;
  } catch (error) {
    console.error('Error creating game:', error);
    return null;
  }
}

export async function updateGame(id: string, game: Partial<Game>): Promise<Game | null> {
  try {
    const response = await gamesApi.update(id, game);
    return response.data;
  } catch (error) {
    console.error(`Error updating game ${id}:`, error);
    return null;
  }
}

export async function deleteGame(id: string): Promise<boolean> {
  try {
    await gamesApi.delete(id);
    return true;
  } catch (error) {
    console.error(`Error deleting game ${id}:`, error);
    return false;
  }
}

export async function refreshApiKey(id: string): Promise<string | null> {
  try {
    const response = await gamesApi.refreshApiKey(id);
    return response.data.apiKey;
  } catch (error) {
    console.error(`Error refreshing API key for game ${id}:`, error);
    return null;
  }
} 