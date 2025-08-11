import { Request, Response } from 'express';
import Game from '../models/Game.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Event from '../models/Event.js';
import Device from '../models/Device.js';
import Progression from '../models/Progression.js';
import Monetization from '../models/Monetization.js';
import sequelize from '../config/database.js';
import { compareVersions } from '../utils/versionUtils.js';

export const createEvent = async (req: Request, res: Response) => {
  const events = Array.isArray(req.body.events) ? req.body.events : [req.body];
  const results = [];

  for (const eventData of events) {
    const transaction = await sequelize.transaction();
    try {
      // gameId mapping: apiKey desteği
      let gameId = eventData.gameId;
      if (typeof gameId === 'string' && isNaN(Number(gameId))) {
        const game = await Game.findOne({ where: { apiKey: gameId }, transaction });
        if (!game) {
          results.push({
            success: false,
            error: 'Invalid gameId or apiKey',
            event: eventData
          });
          await transaction.rollback();
          continue;
        }
        gameId = game.id;
      }
      const playerId = eventData.playerId || eventData.playerUid;
      if (!gameId || !playerId || !eventData.deviceId || !eventData.sessionId || !eventData.eventName || !eventData.eventType) {
        results.push({
          success: false,
          error: 'Missing required fields: gameId, playerId/playerUid, deviceId, sessionId, eventName, eventType',
          event: eventData
        });
        await transaction.rollback();
        continue;
      }

      // Her eventte games tablosunu güncel haliyle yeniden fetch et
      const game = await Game.findOne({ where: { id: gameId }, transaction });
      if (game && eventData.gameVersion) {
        // Eğer mevcut gameVersion null ise veya yeni gelen daha güncelse güncelle
        if (!game.gameVersion || compareVersions(eventData.gameVersion, game.gameVersion) > 0) {
          await game.update({ gameVersion: eventData.gameVersion }, { transaction });
        }
      }

      // Find or create player
      const playerCreatedAt = eventData.playerCreatedAt ? new Date(eventData.playerCreatedAt) : new Date();
      const [player] = await Player.findOrCreate({
        where: {
          gameId: gameId,
          playerUid: playerId
        },
        defaults: {
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          createdAt: playerCreatedAt
        },
        transaction
      });

      // Find or create device
      const [device] = await Device.findOrCreate({
        where: {
          deviceId: eventData.deviceId,
          gameId: gameId
        },
        defaults: {
          deviceId: eventData.deviceId,
          playerId: player.id,
          gameId: gameId,
          platform: eventData.platform || 'unknown',
          osVersion: eventData.osVersion,
          deviceModel: eventData.deviceModel,
          screenResolution: eventData.screenResolution,
          language: eventData.language,
          country: eventData.country
        },
        transaction
      });

      // Find or create session
      let session = await Session.findOne({
        where: {
          sessionId: eventData.sessionId,
          playerId: player.id,
          gameId: gameId,
          endTime: null
        },
        transaction
      });

      if (!session) {
        console.log(`[DEBUG] Yeni session insert: eventData.gameVersion=${eventData.gameVersion}`);
        session = await Session.create({
          sessionId: eventData.sessionId,
          playerId: player.id,
          deviceId: device.id,
          gameId: gameId,
          startTime: new Date(),
          gameVersion: eventData.gameVersion,
          timezoneOffsetMinutes: eventData.timezoneOffsetMinutes,
          createdAt: new Date(),
          updatedAt: new Date()
        }, { transaction });
      }

      // [YENİ EKLENDİ] Her eventte, session.gameVersion doluysa ve games.gameVersion NULL ise güncelle
      if (session && session.gameVersion) {
        const gameForUpdate = await Game.findOne({ where: { id: gameId }, transaction });
        if (gameForUpdate && (!gameForUpdate.gameVersion || compareVersions(session.gameVersion, gameForUpdate.gameVersion) > 0)) {
          await gameForUpdate.update({ gameVersion: session.gameVersion }, { transaction });
        }
      }

      // Create event
      const event = await Event.create({
        sessionId: session.id,
        playerId: player.id,
        gameId: gameId,
        eventName: eventData.eventName,
        eventType: eventData.eventType,
        timestamp: eventData.timestamp || new Date(),
        parameters: eventData.parameters || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction });

      // Progression event ise progression tablosuna da insert
      if (eventData.eventType === 'progression') {
        const p = eventData.parameters || {};
        await Progression.create({
          playerId: player.id,
          gameId: gameId,
          levelNumber: parseInt(p.levelNumber) || 0,
          levelName: p.levelName || null,
          startTime: session.startTime,
          endTime: eventData.timestamp || new Date(),
          completionStatus: p.status || 'unknown',
          score: p.score ? parseInt(p.score) : undefined,
          stars: p.stars ? parseInt(p.stars) : undefined,
          attempts: 1,
          createdAt: new Date()
        }, { transaction });
      }

      // Monetization event ise monetization tablosuna da insert
      if (eventData.eventType === 'monetization') {
        const p = eventData.parameters || {};
        await Monetization.create({
          transactionId: eventData.eventId || (Date.now() + '-' + Math.random()),
          playerId: player.id,
          gameId: gameId,
          productId: p.productId || '',
          productType: p.productType || 'consumable',
          amount: p.amount ? parseFloat(p.amount) : 0,
          currency: p.currency || 'USD',
          platform: p.platform || eventData.platform || 'unknown',
          timestamp: eventData.timestamp || new Date(),
          createdAt: new Date()
        }, { transaction });
      }

      // Update session end time for specific events
      if (["game_end", "session_end", "app_close"].includes(eventData.eventName)) {
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
        await session.update({
          endTime,
          durationSeconds,
          updatedAt: endTime
        }, { transaction });
        await player.update({
          lastSeenAt: endTime,
          totalSessions: sequelize.literal('"totalSessions" + 1'),
          totalPlaytimeSeconds: sequelize.literal(`"totalPlaytimeSeconds" + ${durationSeconds}`)
        }, { transaction });
        // Session end olduğunda games.gameVersion'u güncelle
        console.log(`[DEBUG] Session end: session.gameVersion=${session.gameVersion}`);
        if (session.gameVersion) {
          const gameForUpdate = await Game.findOne({ where: { id: gameId }, transaction });
          console.log(`[DEBUG] games.gameVersion (session_end): mevcut=${gameForUpdate ? gameForUpdate.gameVersion : 'game bulunamadı'}`);
          if (gameForUpdate && (!gameForUpdate.gameVersion || compareVersions(session.gameVersion, gameForUpdate.gameVersion) > 0)) {
            console.log(`[UPDATE] (session_end) games.gameVersion güncelleniyor: gameId=${gameId}, eski=${gameForUpdate.gameVersion}, yeni=${session.gameVersion}`);
            await gameForUpdate.update({ gameVersion: session.gameVersion }, { transaction });
          } else {
            console.log(`[SKIP] (session_end) games.gameVersion update atlanıyor: gameId=${gameId}, mevcut=${gameForUpdate ? gameForUpdate.gameVersion : 'game bulunamadı'}, session.gameVersion=${session.gameVersion}`);
          }
        }
      }

      await transaction.commit();
      console.log(`[COMMIT] Transaction başarılı: gameId=${gameId}, sessionId=${session.sessionId}`);
      results.push({
        success: true,
        message: 'Event created successfully',
        eventId: event.id,
        sessionId: session.id
      });
    } catch (error) {
      await transaction.rollback();
      const err: any = error;
      console.error('[ROLLBACK] Transaction hatası:', err, err.errors || '', err.stack || '');
      results.push({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        details: err.errors || '',
        event: eventData
      });
    }
  }

  return res.json({
    success: results.every(r => r.success),
    results
  });
}; 