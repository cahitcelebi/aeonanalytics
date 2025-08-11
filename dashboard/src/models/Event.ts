import { query } from '@/lib/db'

export interface EventParameters {
  [key: string]: string | number | boolean | null | undefined
}

export interface Event {
  id: number
  eventId: string
  sessionId: string | null
  userId: string | null
  eventName: string
  eventType: string
  timestamp: Date
  parameters: EventParameters
  createdAt: Date
  timezoneOffsetMinutes: number | null
  gameId: string | null
}

export async function getEventsByGameId(gameId: string, limit: number = 100): Promise<Event[]> {
  try {
    const result = await query<Event>(
      `SELECT * FROM events 
       WHERE game_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [gameId, limit]
    )
    return result.rows
  } catch (error) {
    console.error('Error fetching events by game ID:', error)
    return []
  }
}

export async function getEventsByUserAndType(
  gameId: string, 
  userId: string, 
  eventType: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<Event[]> {
  try {
    let sql = `
      SELECT * FROM events 
      WHERE game_id = $1 AND user_id = $2 AND event_type = $3
    `
    const params: (string | Date | number)[] = [gameId, userId, eventType]
    
    if (startDate) {
      sql += ` AND timestamp >= $${params.length + 1}`
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ` AND timestamp <= $${params.length + 1}`
      params.push(endDate)
    }
    
    sql += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`
    params.push(limit)
    
    const result = await query<Event>(sql, params)
    return result.rows
  } catch (error) {
    console.error('Error fetching events by user and type:', error)
    return []
  }
}

export async function countEventsByGameAndType(
  gameId: string,
  eventType: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    let sql = `
      SELECT COUNT(*) as count 
      FROM events 
      WHERE game_id = $1 AND event_type = $2
    `
    const params: (string | Date)[] = [gameId, eventType]
    
    if (startDate) {
      sql += ` AND timestamp >= $${params.length + 1}`
      params.push(startDate)
    }
    
    if (endDate) {
      sql += ` AND timestamp <= $${params.length + 1}`
      params.push(endDate)
    }
    
    const result = await query<{ count: string }>(sql, params)
    return parseInt(result.rows[0].count, 10)
  } catch (error) {
    console.error('Error counting events:', error)
    return 0
  }
} 