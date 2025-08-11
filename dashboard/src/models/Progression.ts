import { progressionApi } from '@/lib/api';

export interface Progression {
  id: string;
  gameId: string;
  userId: string;
  level: number;
  experience: number;
  achievements: string[];
  createdAt: string;
}

export interface ProgressionMetrics {
  averageLevel: number;
  levelDistribution: Array<{
    level: number;
    count: number;
  }>;
  topAchievements: Array<{
    achievement: string;
    count: number;
  }>;
}

export async function getProgressionByGameId(
  gameId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 100
): Promise<Progression[]> {
  try {
    const response = await progressionApi.getByGameId(gameId, {
      startDate,
      endDate,
      limit
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching progression data for game ${gameId}:`, error);
    return [];
  }
}

export async function getProgressionMetrics(
  gameId: string,
  startDate?: string,
  endDate?: string
): Promise<ProgressionMetrics> {
  try {
    const response = await progressionApi.getByGameId(gameId, {
      startDate,
      endDate,
      metrics: true
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching progression metrics for game ${gameId}:`, error);
    return {
      averageLevel: 0,
      levelDistribution: [],
      topAchievements: []
    };
  }
}

export interface LevelCompletion {
  levelNumber: number
  levelName: string
  completedCount: number
  failedCount: number
  startedCount: number
  completionRate: number
  avgScore: number | null
  avgStars: number | null
  avgAttempts: number
}

/**
 * Get level completion statistics for a game
 */
export async function getLevelCompletionStats(
  gameId: string,
  startDate?: Date,
  endDate?: Date
): Promise<LevelCompletion[]> {
  try {
    let sql = `
      SELECT 
        level_number,
        MAX(level_name) as level_name,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN completion_status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN completion_status = 'started' THEN 1 ELSE 0 END) as started_count,
        AVG(score) as avg_score,
        AVG(stars) as avg_stars,
        AVG(attempts) as avg_attempts,
        SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(*), 0) as completion_rate
      FROM progression 
      WHERE game_id = $1
    `
    const params: (string | Date)[] = [gameId]
    
    if (startDate) {
      sql += ` AND start_time >= $${params.length + 1}`
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ` AND start_time <= $${params.length + 1}`
      params.push(endDate)
    }
    
    sql += ` GROUP BY level_number ORDER BY level_number`
    
    const result = await query<LevelCompletion>(sql, params)
    return result.rows
  } catch (error) {
    console.error('Error fetching level completion stats:', error)
    return []
  }
}

/**
 * Get user progression for a specific level
 */
export async function getUserProgressionForLevel(
  gameId: string,
  userId: string,
  levelNumber: number
): Promise<Progression[]> {
  try {
    const sql = `
      SELECT * FROM progression 
      WHERE game_id = $1 AND user_id = $2 AND level_number = $3
      ORDER BY start_time DESC
    `
    
    const result = await query<Progression>(sql, [gameId, userId, levelNumber])
    return result.rows
  } catch (error) {
    console.error('Error fetching user progression for level:', error)
    return []
  }
}

/**
 * Get user progression summary across all levels
 */
export async function getUserProgressionSummary(
  gameId: string,
  userId: string
): Promise<{
  levelsCompleted: number,
  totalLevels: number,
  avgScore: number | null,
  avgStars: number | null,
  highestLevel: number
}> {
  try {
    // Get the total number of levels in the game
    const levelCountResult = await query<{ count: string }>(`
      SELECT COUNT(DISTINCT level_number) as count
      FROM progression
      WHERE game_id = $1
    `, [gameId])
    
    // Get user's highest level and average scores
    const userStatsResult = await query<{
      levels_completed: string,
      avg_score: string | null,
      avg_stars: string | null,
      highest_level: string
    }>(`
      SELECT 
        COUNT(DISTINCT CASE WHEN completion_status = 'completed' THEN level_number END) as levels_completed,
        AVG(score) as avg_score,
        AVG(stars) as avg_stars,
        MAX(level_number) as highest_level
      FROM progression
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])
    
    const totalLevels = parseInt(levelCountResult.rows[0]?.count || '0')
    const userStats = userStatsResult.rows[0]
    
    return {
      levelsCompleted: parseInt(userStats?.levels_completed || '0'),
      totalLevels,
      avgScore: userStats?.avg_score ? parseFloat(userStats.avg_score) : null,
      avgStars: userStats?.avg_stars ? parseFloat(userStats.avg_stars) : null,
      highestLevel: parseInt(userStats?.highest_level || '0')
    }
  } catch (error) {
    console.error('Error fetching user progression summary:', error)
    return {
      levelsCompleted: 0,
      totalLevels: 0,
      avgScore: null,
      avgStars: null,
      highestLevel: 0
    }
  }
} 