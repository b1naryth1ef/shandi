import {
  Encounter,
  SkillBuffInfo,
  getEncounter,
  getNPCInfo,
  getSkillBuffInfo,
} from "@shandi/data/data";
import * as lsb from "@shandi/lsb/lsb";
import { enableMapSet, immerable } from "immer";

enableMapSet();

export type BattleStatsOpts = {
  battle?: lsb.Battle;
  filterTarget?: (target: number) => boolean;
};

export const filterOnlyBossTargets = (target: number) => {
  const info = getNPCInfo(target);
  return (
    info !== undefined &&
    (info.grade === "boss" ||
      info.grade === "commander" ||
      info.grade === "raid")
  );
};

export function getDefaultBattleStatsOpts(): BattleStatsOpts {
  return {
    filterTarget: filterOnlyBossTargets,
  };
}

export class BattleStats {
  [immerable] = true;

  id: string | null;
  battle: lsb.Battle;
  playerStats: Map<string, PlayerStats> = new Map();
  targetStats: Map<string, TargetStats> = new Map();
  totalDamage: number = 0;
  opts: BattleStatsOpts;

  encounter?: Encounter;

  private buffs = new BuffTracker((info) => {
    const sourcePlayerId = this.getId(info.sourceId);
    const sourcePlayer = this.battle.players[sourcePlayerId];
    if (!sourcePlayer) {
      return;
    }

    // NB: we do not want summons so this is intentionally not getId(...)
    const targetPlayer = this.battle.players[info.targetId];
    const targetEntity = this.battle.entities[info.targetId];

    if (!targetPlayer && !targetEntity) {
      return;
    }

    if (
      targetEntity &&
      targetEntity.ownerId &&
      this.battle.players[targetEntity.ownerId]
    ) {
      return;
    }

    if (
      targetEntity &&
      this.opts.filterTarget &&
      !this.opts.filterTarget(targetEntity.typeId)
    ) {
      return;
    }

    const sourcePlayerStats = this.getPlayerStats(sourcePlayerId);
    const castedBuff = this.getCastedBuffStats(
      sourcePlayerStats,
      info.statusEffectId
    );
    castedBuff.totalUptime +=
      (info.end!!.getTime() - info.start.getTime()) / 1000;
    castedBuff.totalCount += info.count;
    castedBuff.totalValue += info.initialValue;
    castedBuff.totalValueDelta += info.initialValue - info.currentValue;
    castedBuff.uniqueTargetIds.add(this.getId(info.targetId));

    for (const [sourceId, damage] of Array.from(
      info.damageDoneBySourceId.entries()
    )) {
      const value =
        (castedBuff.damageDoneBySourceId.get(sourceId) || 0) + damage;
      castedBuff.damageDoneBySourceId.set(sourceId, value);
    }
  });

  constructor(id?: string | null, opts?: BattleStatsOpts) {
    this.opts = { ...getDefaultBattleStatsOpts(), ...(opts || {}) };
    const battle = opts?.battle || lsb.Battle.create();
    this.battle = battle;
    this.id = id || null;

    if (this.battle.encounterId !== 0) {
      this.encounter = getEncounter(this.battle.encounterId);
    }

    if (this.battle.events && this.battle.events.length > 0) {
      (async () => {
        for (const ev of battle.events) {
          this.processEvent(ev);
        }
      })();
    }
  }

  copy(opts?: BattleStatsOpts): BattleStats {
    return new BattleStats(this.id, { battle: this.battle, ...opts });
  }

  duration() {
    return (this.battle.end!!.getTime() - this.battle.start!!.getTime()) / 1000;
  }

  getPlayerStatsList(onlyShowPlayers?: boolean): Array<[string, PlayerStats]> {
    return Array.from(this.playerStats.entries())
      .filter(([key, stats]) => {
        if (key === "0") {
          return false;
        }

        if (onlyShowPlayers && this.battle.players[key] === undefined) {
          return false;
        }

        return stats.damage > 0;
      })
      .sort(([_, a], [_2, b]) => {
        return b.damage - a.damage;
      });
  }

  getId(sourceId: string): string {
    const entity = this.battle.entities[sourceId];
    if (entity !== undefined && entity.ownerId) {
      return entity.ownerId;
    }

    return sourceId;
  }

  getPartyId(playerId: string): number {
    const player = this.battle.players[this.getId(playerId)];
    if (!player) return -1;
    return player.partyId;
  }

  getPartyDamage(partyId: number): number {
    let damage = 0;
    for (const [playerId, player] of Object.entries(this.battle.players)) {
      if (player.partyId === partyId) {
        const stats = this.getPlayerStats(playerId);
        damage += stats.damage;
      }
    }
    return damage;
  }

  getPlayerStats(playerId: string): PlayerStats {
    if (!this.playerStats.has(playerId)) {
      this.playerStats = this.playerStats.set(playerId, {
        damage: 0,
        hits: 0,
        crits: 0,
        pos: 0,
        counters: 0,
        deathTime: null,
        skills: new Map(),
        skillDetails: new Map(),
        castedBuffs: new Map(),
      });
    }
    return this.playerStats.get(playerId)!!;
  }

  getSkillStats(
    playerStats: PlayerStats,
    skillEffectId: number,
    skillId: number
  ): SkillStats {
    const key = `${skillId}.${skillEffectId}`;
    if (!playerStats.skills.has(key)) {
      playerStats.skills.set(key, {
        skillEffectId,
        skillId,
        damage: 0,
        crits: 0,
        pos: 0,
        hits: 0,
        max: 0,
        casts: 0,
      });
    }
    return playerStats.skills.get(key)!!;
  }

  getCastedBuffStats(
    playerStats: PlayerStats,
    statusEffectId: number
  ): CastedBuffStats {
    const existing = playerStats.castedBuffs.get(statusEffectId);
    if (existing) {
      return existing;
    }

    const stats = {
      effectId: statusEffectId,
      totalUptime: 0,
      totalCount: 0,
      totalValue: 0,
      totalValueDelta: 0,
      uniqueTargetIds: new Set<string>(),
      damageDoneBySourceId: new Map(),
    };
    playerStats.castedBuffs.set(statusEffectId, stats);
    return stats;
  }

  processEvent(event: lsb.Event) {
    if (this.battle.start === undefined) {
      this.battle.start = event.ts;
    }
    this.battle.end = event.ts;

    if (event.spawn) {
      if (event.spawn.player) {
        const existing = this.battle.players[event.spawn.objectId];
        if (!existing) {
          this.battle.players[event.spawn.objectId] = event.spawn.player;
        }
        // TODO: update
      } else if (event.spawn.entity) {
        const existing = this.battle.entities[event.spawn.objectId];
        if (!existing) {
          this.battle.entities[event.spawn.objectId] = event.spawn.entity;
        }
        // TODO: update
      }
    }

    this.buffs.processEvent(event);

    if (event.damage) {
      const sourceId = this.getId(event.damage.sourceId);
      const sourceStats = this.getPlayerStats(sourceId);
      const skillStats = this.getSkillStats(
        sourceStats,
        event.damage.skillEffectId,
        event.damage.skillId
      );

      const sourcePartyId = this.getPartyId(sourceId);
      for (const hit of event.damage.hits) {
        const targetPlayer = this.battle.players[hit.targetId];
        if (targetPlayer !== undefined) {
          continue;
        }

        const targetEntity = this.battle.entities[hit.targetId];
        if (targetEntity === undefined) {
          continue;
        }

        if (
          this.opts.filterTarget &&
          !this.opts.filterTarget(targetEntity.typeId)
        ) {
          continue;
        }

        if (hit.crit) {
          sourceStats.crits += 1;
          skillStats.crits += 1;
        }

        if (hit.frontAttack || hit.backAttack) {
          sourceStats.pos += 1;
          skillStats.pos += 1;
        }

        sourceStats.hits += 1;
        skillStats.hits += 1;

        const hitTotalDamage = hit.damage + hit.dot;
        sourceStats.damage += hitTotalDamage;
        skillStats.damage += hitTotalDamage;
        this.totalDamage += hitTotalDamage;

        for (const buff of this.buffs.getForTargetId(targetEntity.objectId)) {
          const buffPartyId = this.getPartyId(buff.sourceId);
          if (buff.buffInfo?.target === "self" && buff.sourceId === sourceId) {
            const value =
              (buff.damageDoneBySourceId.get(sourceId) || 0) + hitTotalDamage;
            buff.damageDoneBySourceId.set(sourceId, value);
          } else if (
            (buff.buffInfo?.target === "self_party" ||
              buff.buffInfo?.target === "none") &&
            buffPartyId === sourcePartyId
          ) {
            const value =
              (buff.damageDoneBySourceId.get(sourceId) || 0) + hitTotalDamage;
            buff.damageDoneBySourceId.set(sourceId, value);
          } else if (
            buff.buffInfo?.target === "party" &&
            buffPartyId === sourcePartyId &&
            buff.sourceId !== sourceId
          ) {
            const value =
              (buff.damageDoneBySourceId.get(sourceId) || 0) + hitTotalDamage;
            buff.damageDoneBySourceId.set(sourceId, value);
          }
        }

        // add damage for any buffs applied to the source of this damage event
        for (const buff of this.buffs.getForTargetId(sourceId)) {
          const value =
            (buff.damageDoneBySourceId.get(sourceId) || 0) + hitTotalDamage;
          buff.damageDoneBySourceId.set(sourceId, value);
        }

        const damage = hit.damage + hit.dot;
        if (damage > skillStats.max) {
          skillStats.max = damage;
        }
      }
    } else if (event.counter) {
      const sourceId = this.getId(event.counter.sourceId);
      const sourceStats = this.getPlayerStats(sourceId);
      sourceStats.counters += 1;
    } else if (event.death) {
      const sourceStats = this.getPlayerStats(event.death.targetId);
      sourceStats.deathTime =
        (event.ts!!.getTime() - this.battle.start!!.getTime()) / 1000;
    } else if (event.skillUse && event.skillUse.skillInfo !== undefined) {
      const sourceId = this.getId(event.skillUse.sourceId);
      const sourceStats = this.getPlayerStats(sourceId);
      const skillStats = this.getSkillStats(
        sourceStats,
        0,
        event.skillUse.skillInfo.skillId
      );
      skillStats.casts += 1;
      sourceStats.skillDetails.set(
        event.skillUse.skillInfo.skillId,
        event.skillUse.skillInfo
      );
    }
  }
}

export type TargetStats = {};

export type PlayerStats = {
  damage: number;
  hits: number;
  crits: number;
  pos: number;
  counters: number;
  deathTime: number | null;
  skills: Map<string, SkillStats>;
  skillDetails: Map<number, lsb.SkillInfo>;
  castedBuffs: Map<number, CastedBuffStats>;
};

export type CastedBuffStats = {
  effectId: number;
  totalUptime: number;
  totalCount: number;
  totalValue: number;
  totalValueDelta: number;
  uniqueTargetIds: Set<string>;
  damageDoneBySourceId: Map<string, number>;
};

export type SkillStats = {
  skillEffectId: number;
  skillId: number;
  damage: number;
  crits: number;
  pos: number;
  hits: number;
  max: number;
  casts: number;
};

export function mergeSkillStats(a: SkillStats, b: SkillStats): SkillStats {
  return {
    skillEffectId: a.skillEffectId,
    skillId: a.skillId,
    damage: a.damage + b.damage,
    crits: a.crits + b.crits,
    pos: a.pos + b.pos,
    hits: a.hits + b.hits,
    max: a.max > b.max ? a.max : b.max,
    casts: a.casts + b.casts,
  };
}

type BuffInfo = {
  start: Date;
  end?: Date;
  lastRefresh: Date;
  count: number;
  statusEffectId: number;
  effectInstanceId: number;
  sourceId: string;
  targetId: string;
  endTick: string;
  totalTime: number;
  initialValue: number;
  currentValue: number;
  damageDoneBySourceId: Map<string, number>;
  buffInfo?: SkillBuffInfo;
};

export class BuffTracker {
  private buffs: Map<number, BuffInfo> = new Map();
  private byTargetId: Map<string, Set<BuffInfo>> = new Map();

  constructor(public finalizer: (buff: BuffInfo) => void) {}

  getForTargetId(targetId: string): Array<BuffInfo> {
    const result = this.byTargetId.get(targetId);
    if (!result) {
      return [];
    }
    return Array.from(result);
  }

  processEvent(event: lsb.Event) {
    if (event.statusEffectAdd) {
      this.onBuffAdded(event.ts!!, event.statusEffectAdd);
    } else if (event.statusEffectRemove) {
      for (const effectInstanceId of event.statusEffectRemove.statusEffectIds) {
        this.onBuffFinalized(event.ts!!, effectInstanceId);
      }
    } else if (event.statusEffectUpdate) {
      this.onBuffUpdate(event.ts!!, event.statusEffectUpdate);
    } else if (event.death) {
      this.onTargetFinalized(event.ts!!, event.death.targetId);
    } else if (event.remove) {
      for (const targetId of event.remove.objectIds) {
        this.onTargetFinalized(event.ts!!, targetId);
      }
    }
  }

  flush(time: Date) {
    for (const buff of Array.from(this.buffs.values())) {
      this.onBuffFinalized(time, buff.effectInstanceId);
    }
  }

  private onBuffAdded(time: Date, data: lsb.EventStatusEffectAdd) {
    const existing = this.buffs.get(data.effectInstanceId);
    if (existing) {
      existing.count += 1;
      existing.lastRefresh = time;
      return;
    }

    const buff = {
      start: time,
      lastRefresh: time,
      count: 1,
      statusEffectId: data.statusEffectId,
      effectInstanceId: data.effectInstanceId,
      sourceId: data.sourceId,
      targetId: data.targetId,
      initialValue: data.value,
      currentValue: data.value,
      endTick: data.endTick,
      totalTime: data.totalTime,
      buffInfo: getSkillBuffInfo(data.statusEffectId),
      damageDoneBySourceId: new Map(),
    };

    this.buffs.set(data.effectInstanceId, buff);

    const byTargetId = this.byTargetId.get(data.targetId);
    if (byTargetId) {
      byTargetId.add(buff);
    } else {
      this.byTargetId.set(data.targetId, new Set([buff]));
    }
  }

  private onBuffUpdate(time: Date, data: lsb.EventStatusEffectUpdate) {
    const existing = this.buffs.get(data.effectInstanceId);
    if (!existing) {
      console.warn("Received update for buff we don't have tracked");
      return;
    }

    if (data.value !== undefined) {
      existing.currentValue = data.value;
    }

    if (data.expiration !== undefined) {
      existing.endTick = data.expiration;
    }
  }

  private onBuffFinalized(time: Date, effectInstanceId: number) {
    const info = this.buffs.get(effectInstanceId);
    if (!info) {
      return;
    }

    info.end = time;
    this.finalizer(info);
    this.buffs.delete(effectInstanceId);

    const byTargetId = this.byTargetId.get(info.targetId);
    byTargetId?.delete(info);
  }

  private onTargetFinalized(time: Date, targetId: string) {
    for (const buff of Array.from(this.buffs.values())) {
      if (buff.targetId === targetId) {
        this.onBuffFinalized(time, buff.effectInstanceId);
      }
    }
  }
}
