/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Timestamp } from "./google/protobuf/timestamp";

export const protobufPackage = "lsb.v1";

export enum BattleResult {
  UNKNOWN = 0,
  DUNGEON_CLEAR = 1,
  DUNGEON_FAIL = 2,
  UNRECOGNIZED = -1,
}

export function battleResultFromJSON(object: any): BattleResult {
  switch (object) {
    case 0:
    case "UNKNOWN":
      return BattleResult.UNKNOWN;
    case 1:
    case "DUNGEON_CLEAR":
      return BattleResult.DUNGEON_CLEAR;
    case 2:
    case "DUNGEON_FAIL":
      return BattleResult.DUNGEON_FAIL;
    case -1:
    case "UNRECOGNIZED":
    default:
      return BattleResult.UNRECOGNIZED;
  }
}

export function battleResultToJSON(object: BattleResult): string {
  switch (object) {
    case BattleResult.UNKNOWN:
      return "UNKNOWN";
    case BattleResult.DUNGEON_CLEAR:
      return "DUNGEON_CLEAR";
    case BattleResult.DUNGEON_FAIL:
      return "DUNGEON_FAIL";
    case BattleResult.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Event {
  ts: Date | undefined;
  spawn?: EventSpawn | undefined;
  remove?: EventRemove | undefined;
  counter?: EventCounter | undefined;
  death?: EventDeath | undefined;
  damage?: EventDamage | undefined;
  trigger?: EventTrigger | undefined;
  statusEffectAdd?: EventStatusEffectAdd | undefined;
  statusEffectUpdate?: EventStatusEffectUpdate | undefined;
  statusEffectRemove?: EventStatusEffectRemove | undefined;
  skillUse?: EventSkillUse | undefined;
  staggerState?: EventStaggerState | undefined;
  playerHealth?: EventPlayerHealth | undefined;
}

export interface EventRotate {
  reason: string;
}

export interface EventSpawn {
  objectId: string;
  entity?: Entity | undefined;
  characterId?: string | undefined;
  player?: Player | undefined;
}

export interface EventRemove {
  objectIds: string[];
}

export interface EventTrigger {
  sourceId: string;
  triggerId: number;
  triggerSignalType: number;
  players: string[];
}

export interface EventCounter {
  targetId: string;
  sourceId: string;
  type: number;
}

export interface EventDeath {
  targetId: string;
  sourceId: string;
}

export interface EventDamage {
  sourceId: string;
  skillId: number;
  skillEffectId: number;
  hits: EventDamage_SingleDamageHit[];
}

export interface EventDamage_SingleDamageHit {
  targetId: string;
  damage: number;
  dot: number;
  crit: boolean;
  backAttack: boolean;
  frontAttack: boolean;
}

export interface EventStatusEffectAdd {
  statusEffectId: number;
  effectInstanceId: number;
  sourceId: string;
  targetId: string;
  endTick: string;
  value: number;
  totalTime: number;
}

export interface EventStatusEffectUpdate {
  effectInstanceId: number;
  playerId: string;
  value: number;
  expiration: string;
}

export interface EventStatusEffectRemove {
  objectId: string;
  reason: number;
  statusEffectIds: number[];
}

export interface EventSkillUse {
  sourceId: string;
  skillInfo: SkillInfo | undefined;
}

export interface EventStaggerState {
  objectId: string;
  decreasePoint: number;
  paralyzationPoint: number;
  paralyzationMaxPoint: number;
}

export interface EventPlayerHealth {
  playerId: string;
  currentHp: number;
  maxHp: number;
}

export interface Character {
  characterId: string;
  name: string;
  level: number;
  gearLevel: number;
  classId: number;
}

export interface Player {
  partyId: number;
  character: Character | undefined;
  isLocal: boolean;
}

export interface SkillInfo {
  skillId: number;
  level: number;
  tripodIndex1: number;
  tripodIndex2: number;
  tripodIndex3: number;
  tripodLevel1: number;
  tripodLevel2: number;
  tripodLevel3: number;
}

export interface Entity {
  objectId: string;
  ownerId: string;
  typeId: number;
  maxHp: number;
}

export interface Battle {
  start: Date | undefined;
  end: Date | undefined;
  encounterId: number;
  players: { [key: string]: Player };
  entities: { [key: string]: Entity };
  events: Event[];
  result: BattleResult;
}

export interface Battle_PlayersEntry {
  key: string;
  value: Player | undefined;
}

export interface Battle_EntitiesEntry {
  key: string;
  value: Entity | undefined;
}

export interface EventsBatch {
  events: Event[];
}

function createBaseEvent(): Event {
  return {
    ts: undefined,
    spawn: undefined,
    remove: undefined,
    counter: undefined,
    death: undefined,
    damage: undefined,
    trigger: undefined,
    statusEffectAdd: undefined,
    statusEffectUpdate: undefined,
    statusEffectRemove: undefined,
    skillUse: undefined,
    staggerState: undefined,
    playerHealth: undefined,
  };
}

export const Event = {
  encode(message: Event, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.ts !== undefined) {
      Timestamp.encode(toTimestamp(message.ts), writer.uint32(10).fork()).ldelim();
    }
    if (message.spawn !== undefined) {
      EventSpawn.encode(message.spawn, writer.uint32(26).fork()).ldelim();
    }
    if (message.remove !== undefined) {
      EventRemove.encode(message.remove, writer.uint32(34).fork()).ldelim();
    }
    if (message.counter !== undefined) {
      EventCounter.encode(message.counter, writer.uint32(42).fork()).ldelim();
    }
    if (message.death !== undefined) {
      EventDeath.encode(message.death, writer.uint32(50).fork()).ldelim();
    }
    if (message.damage !== undefined) {
      EventDamage.encode(message.damage, writer.uint32(58).fork()).ldelim();
    }
    if (message.trigger !== undefined) {
      EventTrigger.encode(message.trigger, writer.uint32(66).fork()).ldelim();
    }
    if (message.statusEffectAdd !== undefined) {
      EventStatusEffectAdd.encode(message.statusEffectAdd, writer.uint32(74).fork()).ldelim();
    }
    if (message.statusEffectUpdate !== undefined) {
      EventStatusEffectUpdate.encode(message.statusEffectUpdate, writer.uint32(82).fork()).ldelim();
    }
    if (message.statusEffectRemove !== undefined) {
      EventStatusEffectRemove.encode(message.statusEffectRemove, writer.uint32(90).fork()).ldelim();
    }
    if (message.skillUse !== undefined) {
      EventSkillUse.encode(message.skillUse, writer.uint32(98).fork()).ldelim();
    }
    if (message.staggerState !== undefined) {
      EventStaggerState.encode(message.staggerState, writer.uint32(106).fork()).ldelim();
    }
    if (message.playerHealth !== undefined) {
      EventPlayerHealth.encode(message.playerHealth, writer.uint32(122).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Event {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.ts = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.spawn = EventSpawn.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.remove = EventRemove.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.counter = EventCounter.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.death = EventDeath.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.damage = EventDamage.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.trigger = EventTrigger.decode(reader, reader.uint32());
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.statusEffectAdd = EventStatusEffectAdd.decode(reader, reader.uint32());
          continue;
        case 10:
          if (tag != 82) {
            break;
          }

          message.statusEffectUpdate = EventStatusEffectUpdate.decode(reader, reader.uint32());
          continue;
        case 11:
          if (tag != 90) {
            break;
          }

          message.statusEffectRemove = EventStatusEffectRemove.decode(reader, reader.uint32());
          continue;
        case 12:
          if (tag != 98) {
            break;
          }

          message.skillUse = EventSkillUse.decode(reader, reader.uint32());
          continue;
        case 13:
          if (tag != 106) {
            break;
          }

          message.staggerState = EventStaggerState.decode(reader, reader.uint32());
          continue;
        case 15:
          if (tag != 122) {
            break;
          }

          message.playerHealth = EventPlayerHealth.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Event {
    return {
      ts: isSet(object.ts) ? fromJsonTimestamp(object.ts) : undefined,
      spawn: isSet(object.spawn) ? EventSpawn.fromJSON(object.spawn) : undefined,
      remove: isSet(object.remove) ? EventRemove.fromJSON(object.remove) : undefined,
      counter: isSet(object.counter) ? EventCounter.fromJSON(object.counter) : undefined,
      death: isSet(object.death) ? EventDeath.fromJSON(object.death) : undefined,
      damage: isSet(object.damage) ? EventDamage.fromJSON(object.damage) : undefined,
      trigger: isSet(object.trigger) ? EventTrigger.fromJSON(object.trigger) : undefined,
      statusEffectAdd: isSet(object.statusEffectAdd)
        ? EventStatusEffectAdd.fromJSON(object.statusEffectAdd)
        : undefined,
      statusEffectUpdate: isSet(object.statusEffectUpdate)
        ? EventStatusEffectUpdate.fromJSON(object.statusEffectUpdate)
        : undefined,
      statusEffectRemove: isSet(object.statusEffectRemove)
        ? EventStatusEffectRemove.fromJSON(object.statusEffectRemove)
        : undefined,
      skillUse: isSet(object.skillUse) ? EventSkillUse.fromJSON(object.skillUse) : undefined,
      staggerState: isSet(object.staggerState) ? EventStaggerState.fromJSON(object.staggerState) : undefined,
      playerHealth: isSet(object.playerHealth) ? EventPlayerHealth.fromJSON(object.playerHealth) : undefined,
    };
  },

  toJSON(message: Event): unknown {
    const obj: any = {};
    message.ts !== undefined && (obj.ts = message.ts.toISOString());
    message.spawn !== undefined && (obj.spawn = message.spawn ? EventSpawn.toJSON(message.spawn) : undefined);
    message.remove !== undefined && (obj.remove = message.remove ? EventRemove.toJSON(message.remove) : undefined);
    message.counter !== undefined && (obj.counter = message.counter ? EventCounter.toJSON(message.counter) : undefined);
    message.death !== undefined && (obj.death = message.death ? EventDeath.toJSON(message.death) : undefined);
    message.damage !== undefined && (obj.damage = message.damage ? EventDamage.toJSON(message.damage) : undefined);
    message.trigger !== undefined && (obj.trigger = message.trigger ? EventTrigger.toJSON(message.trigger) : undefined);
    message.statusEffectAdd !== undefined &&
      (obj.statusEffectAdd = message.statusEffectAdd
        ? EventStatusEffectAdd.toJSON(message.statusEffectAdd)
        : undefined);
    message.statusEffectUpdate !== undefined && (obj.statusEffectUpdate = message.statusEffectUpdate
      ? EventStatusEffectUpdate.toJSON(message.statusEffectUpdate)
      : undefined);
    message.statusEffectRemove !== undefined && (obj.statusEffectRemove = message.statusEffectRemove
      ? EventStatusEffectRemove.toJSON(message.statusEffectRemove)
      : undefined);
    message.skillUse !== undefined &&
      (obj.skillUse = message.skillUse ? EventSkillUse.toJSON(message.skillUse) : undefined);
    message.staggerState !== undefined &&
      (obj.staggerState = message.staggerState ? EventStaggerState.toJSON(message.staggerState) : undefined);
    message.playerHealth !== undefined &&
      (obj.playerHealth = message.playerHealth ? EventPlayerHealth.toJSON(message.playerHealth) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Event>, I>>(base?: I): Event {
    return Event.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Event>, I>>(object: I): Event {
    const message = createBaseEvent();
    message.ts = object.ts ?? undefined;
    message.spawn = (object.spawn !== undefined && object.spawn !== null)
      ? EventSpawn.fromPartial(object.spawn)
      : undefined;
    message.remove = (object.remove !== undefined && object.remove !== null)
      ? EventRemove.fromPartial(object.remove)
      : undefined;
    message.counter = (object.counter !== undefined && object.counter !== null)
      ? EventCounter.fromPartial(object.counter)
      : undefined;
    message.death = (object.death !== undefined && object.death !== null)
      ? EventDeath.fromPartial(object.death)
      : undefined;
    message.damage = (object.damage !== undefined && object.damage !== null)
      ? EventDamage.fromPartial(object.damage)
      : undefined;
    message.trigger = (object.trigger !== undefined && object.trigger !== null)
      ? EventTrigger.fromPartial(object.trigger)
      : undefined;
    message.statusEffectAdd = (object.statusEffectAdd !== undefined && object.statusEffectAdd !== null)
      ? EventStatusEffectAdd.fromPartial(object.statusEffectAdd)
      : undefined;
    message.statusEffectUpdate = (object.statusEffectUpdate !== undefined && object.statusEffectUpdate !== null)
      ? EventStatusEffectUpdate.fromPartial(object.statusEffectUpdate)
      : undefined;
    message.statusEffectRemove = (object.statusEffectRemove !== undefined && object.statusEffectRemove !== null)
      ? EventStatusEffectRemove.fromPartial(object.statusEffectRemove)
      : undefined;
    message.skillUse = (object.skillUse !== undefined && object.skillUse !== null)
      ? EventSkillUse.fromPartial(object.skillUse)
      : undefined;
    message.staggerState = (object.staggerState !== undefined && object.staggerState !== null)
      ? EventStaggerState.fromPartial(object.staggerState)
      : undefined;
    message.playerHealth = (object.playerHealth !== undefined && object.playerHealth !== null)
      ? EventPlayerHealth.fromPartial(object.playerHealth)
      : undefined;
    return message;
  },
};

function createBaseEventRotate(): EventRotate {
  return { reason: "" };
}

export const EventRotate = {
  encode(message: EventRotate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.reason !== "") {
      writer.uint32(10).string(message.reason);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventRotate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventRotate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.reason = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventRotate {
    return { reason: isSet(object.reason) ? String(object.reason) : "" };
  },

  toJSON(message: EventRotate): unknown {
    const obj: any = {};
    message.reason !== undefined && (obj.reason = message.reason);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventRotate>, I>>(base?: I): EventRotate {
    return EventRotate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventRotate>, I>>(object: I): EventRotate {
    const message = createBaseEventRotate();
    message.reason = object.reason ?? "";
    return message;
  },
};

function createBaseEventSpawn(): EventSpawn {
  return { objectId: "0", entity: undefined, characterId: undefined, player: undefined };
}

export const EventSpawn = {
  encode(message: EventSpawn, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.objectId !== "0") {
      writer.uint32(8).uint64(message.objectId);
    }
    if (message.entity !== undefined) {
      Entity.encode(message.entity, writer.uint32(18).fork()).ldelim();
    }
    if (message.characterId !== undefined) {
      writer.uint32(24).uint64(message.characterId);
    }
    if (message.player !== undefined) {
      Player.encode(message.player, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventSpawn {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventSpawn();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.objectId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.entity = Entity.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.characterId = longToString(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.player = Player.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventSpawn {
    return {
      objectId: isSet(object.objectId) ? String(object.objectId) : "0",
      entity: isSet(object.entity) ? Entity.fromJSON(object.entity) : undefined,
      characterId: isSet(object.characterId) ? String(object.characterId) : undefined,
      player: isSet(object.player) ? Player.fromJSON(object.player) : undefined,
    };
  },

  toJSON(message: EventSpawn): unknown {
    const obj: any = {};
    message.objectId !== undefined && (obj.objectId = message.objectId);
    message.entity !== undefined && (obj.entity = message.entity ? Entity.toJSON(message.entity) : undefined);
    message.characterId !== undefined && (obj.characterId = message.characterId);
    message.player !== undefined && (obj.player = message.player ? Player.toJSON(message.player) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventSpawn>, I>>(base?: I): EventSpawn {
    return EventSpawn.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventSpawn>, I>>(object: I): EventSpawn {
    const message = createBaseEventSpawn();
    message.objectId = object.objectId ?? "0";
    message.entity = (object.entity !== undefined && object.entity !== null)
      ? Entity.fromPartial(object.entity)
      : undefined;
    message.characterId = object.characterId ?? undefined;
    message.player = (object.player !== undefined && object.player !== null)
      ? Player.fromPartial(object.player)
      : undefined;
    return message;
  },
};

function createBaseEventRemove(): EventRemove {
  return { objectIds: [] };
}

export const EventRemove = {
  encode(message: EventRemove, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(18).fork();
    for (const v of message.objectIds) {
      writer.uint64(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventRemove {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventRemove();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag == 16) {
            message.objectIds.push(longToString(reader.uint64() as Long));
            continue;
          }

          if (tag == 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.objectIds.push(longToString(reader.uint64() as Long));
            }

            continue;
          }

          break;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventRemove {
    return { objectIds: Array.isArray(object?.objectIds) ? object.objectIds.map((e: any) => String(e)) : [] };
  },

  toJSON(message: EventRemove): unknown {
    const obj: any = {};
    if (message.objectIds) {
      obj.objectIds = message.objectIds.map((e) => e);
    } else {
      obj.objectIds = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EventRemove>, I>>(base?: I): EventRemove {
    return EventRemove.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventRemove>, I>>(object: I): EventRemove {
    const message = createBaseEventRemove();
    message.objectIds = object.objectIds?.map((e) => e) || [];
    return message;
  },
};

function createBaseEventTrigger(): EventTrigger {
  return { sourceId: "0", triggerId: 0, triggerSignalType: 0, players: [] };
}

export const EventTrigger = {
  encode(message: EventTrigger, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sourceId !== "0") {
      writer.uint32(8).uint64(message.sourceId);
    }
    if (message.triggerId !== 0) {
      writer.uint32(16).uint32(message.triggerId);
    }
    if (message.triggerSignalType !== 0) {
      writer.uint32(24).uint32(message.triggerSignalType);
    }
    writer.uint32(34).fork();
    for (const v of message.players) {
      writer.uint64(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventTrigger {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventTrigger();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.sourceId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.triggerId = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.triggerSignalType = reader.uint32();
          continue;
        case 4:
          if (tag == 32) {
            message.players.push(longToString(reader.uint64() as Long));
            continue;
          }

          if (tag == 34) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.players.push(longToString(reader.uint64() as Long));
            }

            continue;
          }

          break;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventTrigger {
    return {
      sourceId: isSet(object.sourceId) ? String(object.sourceId) : "0",
      triggerId: isSet(object.triggerId) ? Number(object.triggerId) : 0,
      triggerSignalType: isSet(object.triggerSignalType) ? Number(object.triggerSignalType) : 0,
      players: Array.isArray(object?.players) ? object.players.map((e: any) => String(e)) : [],
    };
  },

  toJSON(message: EventTrigger): unknown {
    const obj: any = {};
    message.sourceId !== undefined && (obj.sourceId = message.sourceId);
    message.triggerId !== undefined && (obj.triggerId = Math.round(message.triggerId));
    message.triggerSignalType !== undefined && (obj.triggerSignalType = Math.round(message.triggerSignalType));
    if (message.players) {
      obj.players = message.players.map((e) => e);
    } else {
      obj.players = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EventTrigger>, I>>(base?: I): EventTrigger {
    return EventTrigger.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventTrigger>, I>>(object: I): EventTrigger {
    const message = createBaseEventTrigger();
    message.sourceId = object.sourceId ?? "0";
    message.triggerId = object.triggerId ?? 0;
    message.triggerSignalType = object.triggerSignalType ?? 0;
    message.players = object.players?.map((e) => e) || [];
    return message;
  },
};

function createBaseEventCounter(): EventCounter {
  return { targetId: "0", sourceId: "0", type: 0 };
}

export const EventCounter = {
  encode(message: EventCounter, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetId !== "0") {
      writer.uint32(8).uint64(message.targetId);
    }
    if (message.sourceId !== "0") {
      writer.uint32(16).uint64(message.sourceId);
    }
    if (message.type !== 0) {
      writer.uint32(24).uint32(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventCounter {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventCounter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.targetId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.sourceId = longToString(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.type = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventCounter {
    return {
      targetId: isSet(object.targetId) ? String(object.targetId) : "0",
      sourceId: isSet(object.sourceId) ? String(object.sourceId) : "0",
      type: isSet(object.type) ? Number(object.type) : 0,
    };
  },

  toJSON(message: EventCounter): unknown {
    const obj: any = {};
    message.targetId !== undefined && (obj.targetId = message.targetId);
    message.sourceId !== undefined && (obj.sourceId = message.sourceId);
    message.type !== undefined && (obj.type = Math.round(message.type));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventCounter>, I>>(base?: I): EventCounter {
    return EventCounter.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventCounter>, I>>(object: I): EventCounter {
    const message = createBaseEventCounter();
    message.targetId = object.targetId ?? "0";
    message.sourceId = object.sourceId ?? "0";
    message.type = object.type ?? 0;
    return message;
  },
};

function createBaseEventDeath(): EventDeath {
  return { targetId: "0", sourceId: "0" };
}

export const EventDeath = {
  encode(message: EventDeath, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetId !== "0") {
      writer.uint32(8).uint64(message.targetId);
    }
    if (message.sourceId !== "0") {
      writer.uint32(16).uint64(message.sourceId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventDeath {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventDeath();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.targetId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.sourceId = longToString(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventDeath {
    return {
      targetId: isSet(object.targetId) ? String(object.targetId) : "0",
      sourceId: isSet(object.sourceId) ? String(object.sourceId) : "0",
    };
  },

  toJSON(message: EventDeath): unknown {
    const obj: any = {};
    message.targetId !== undefined && (obj.targetId = message.targetId);
    message.sourceId !== undefined && (obj.sourceId = message.sourceId);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventDeath>, I>>(base?: I): EventDeath {
    return EventDeath.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventDeath>, I>>(object: I): EventDeath {
    const message = createBaseEventDeath();
    message.targetId = object.targetId ?? "0";
    message.sourceId = object.sourceId ?? "0";
    return message;
  },
};

function createBaseEventDamage(): EventDamage {
  return { sourceId: "0", skillId: 0, skillEffectId: 0, hits: [] };
}

export const EventDamage = {
  encode(message: EventDamage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sourceId !== "0") {
      writer.uint32(8).uint64(message.sourceId);
    }
    if (message.skillId !== 0) {
      writer.uint32(16).uint32(message.skillId);
    }
    if (message.skillEffectId !== 0) {
      writer.uint32(24).uint32(message.skillEffectId);
    }
    for (const v of message.hits) {
      EventDamage_SingleDamageHit.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventDamage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventDamage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.sourceId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.skillId = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.skillEffectId = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.hits.push(EventDamage_SingleDamageHit.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventDamage {
    return {
      sourceId: isSet(object.sourceId) ? String(object.sourceId) : "0",
      skillId: isSet(object.skillId) ? Number(object.skillId) : 0,
      skillEffectId: isSet(object.skillEffectId) ? Number(object.skillEffectId) : 0,
      hits: Array.isArray(object?.hits) ? object.hits.map((e: any) => EventDamage_SingleDamageHit.fromJSON(e)) : [],
    };
  },

  toJSON(message: EventDamage): unknown {
    const obj: any = {};
    message.sourceId !== undefined && (obj.sourceId = message.sourceId);
    message.skillId !== undefined && (obj.skillId = Math.round(message.skillId));
    message.skillEffectId !== undefined && (obj.skillEffectId = Math.round(message.skillEffectId));
    if (message.hits) {
      obj.hits = message.hits.map((e) => e ? EventDamage_SingleDamageHit.toJSON(e) : undefined);
    } else {
      obj.hits = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EventDamage>, I>>(base?: I): EventDamage {
    return EventDamage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventDamage>, I>>(object: I): EventDamage {
    const message = createBaseEventDamage();
    message.sourceId = object.sourceId ?? "0";
    message.skillId = object.skillId ?? 0;
    message.skillEffectId = object.skillEffectId ?? 0;
    message.hits = object.hits?.map((e) => EventDamage_SingleDamageHit.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEventDamage_SingleDamageHit(): EventDamage_SingleDamageHit {
  return { targetId: "0", damage: 0, dot: 0, crit: false, backAttack: false, frontAttack: false };
}

export const EventDamage_SingleDamageHit = {
  encode(message: EventDamage_SingleDamageHit, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetId !== "0") {
      writer.uint32(8).uint64(message.targetId);
    }
    if (message.damage !== 0) {
      writer.uint32(16).uint32(message.damage);
    }
    if (message.dot !== 0) {
      writer.uint32(24).uint32(message.dot);
    }
    if (message.crit === true) {
      writer.uint32(32).bool(message.crit);
    }
    if (message.backAttack === true) {
      writer.uint32(40).bool(message.backAttack);
    }
    if (message.frontAttack === true) {
      writer.uint32(48).bool(message.frontAttack);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventDamage_SingleDamageHit {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventDamage_SingleDamageHit();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.targetId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.damage = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.dot = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.crit = reader.bool();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.backAttack = reader.bool();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.frontAttack = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventDamage_SingleDamageHit {
    return {
      targetId: isSet(object.targetId) ? String(object.targetId) : "0",
      damage: isSet(object.damage) ? Number(object.damage) : 0,
      dot: isSet(object.dot) ? Number(object.dot) : 0,
      crit: isSet(object.crit) ? Boolean(object.crit) : false,
      backAttack: isSet(object.backAttack) ? Boolean(object.backAttack) : false,
      frontAttack: isSet(object.frontAttack) ? Boolean(object.frontAttack) : false,
    };
  },

  toJSON(message: EventDamage_SingleDamageHit): unknown {
    const obj: any = {};
    message.targetId !== undefined && (obj.targetId = message.targetId);
    message.damage !== undefined && (obj.damage = Math.round(message.damage));
    message.dot !== undefined && (obj.dot = Math.round(message.dot));
    message.crit !== undefined && (obj.crit = message.crit);
    message.backAttack !== undefined && (obj.backAttack = message.backAttack);
    message.frontAttack !== undefined && (obj.frontAttack = message.frontAttack);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventDamage_SingleDamageHit>, I>>(base?: I): EventDamage_SingleDamageHit {
    return EventDamage_SingleDamageHit.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventDamage_SingleDamageHit>, I>>(object: I): EventDamage_SingleDamageHit {
    const message = createBaseEventDamage_SingleDamageHit();
    message.targetId = object.targetId ?? "0";
    message.damage = object.damage ?? 0;
    message.dot = object.dot ?? 0;
    message.crit = object.crit ?? false;
    message.backAttack = object.backAttack ?? false;
    message.frontAttack = object.frontAttack ?? false;
    return message;
  },
};

function createBaseEventStatusEffectAdd(): EventStatusEffectAdd {
  return { statusEffectId: 0, effectInstanceId: 0, sourceId: "0", targetId: "0", endTick: "0", value: 0, totalTime: 0 };
}

export const EventStatusEffectAdd = {
  encode(message: EventStatusEffectAdd, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.statusEffectId !== 0) {
      writer.uint32(8).uint32(message.statusEffectId);
    }
    if (message.effectInstanceId !== 0) {
      writer.uint32(16).uint32(message.effectInstanceId);
    }
    if (message.sourceId !== "0") {
      writer.uint32(24).uint64(message.sourceId);
    }
    if (message.targetId !== "0") {
      writer.uint32(32).uint64(message.targetId);
    }
    if (message.endTick !== "0") {
      writer.uint32(40).uint64(message.endTick);
    }
    if (message.value !== 0) {
      writer.uint32(48).uint32(message.value);
    }
    if (message.totalTime !== 0) {
      writer.uint32(56).uint32(message.totalTime);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventStatusEffectAdd {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventStatusEffectAdd();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.statusEffectId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.effectInstanceId = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.sourceId = longToString(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.targetId = longToString(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.endTick = longToString(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.value = reader.uint32();
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.totalTime = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventStatusEffectAdd {
    return {
      statusEffectId: isSet(object.statusEffectId) ? Number(object.statusEffectId) : 0,
      effectInstanceId: isSet(object.effectInstanceId) ? Number(object.effectInstanceId) : 0,
      sourceId: isSet(object.sourceId) ? String(object.sourceId) : "0",
      targetId: isSet(object.targetId) ? String(object.targetId) : "0",
      endTick: isSet(object.endTick) ? String(object.endTick) : "0",
      value: isSet(object.value) ? Number(object.value) : 0,
      totalTime: isSet(object.totalTime) ? Number(object.totalTime) : 0,
    };
  },

  toJSON(message: EventStatusEffectAdd): unknown {
    const obj: any = {};
    message.statusEffectId !== undefined && (obj.statusEffectId = Math.round(message.statusEffectId));
    message.effectInstanceId !== undefined && (obj.effectInstanceId = Math.round(message.effectInstanceId));
    message.sourceId !== undefined && (obj.sourceId = message.sourceId);
    message.targetId !== undefined && (obj.targetId = message.targetId);
    message.endTick !== undefined && (obj.endTick = message.endTick);
    message.value !== undefined && (obj.value = Math.round(message.value));
    message.totalTime !== undefined && (obj.totalTime = Math.round(message.totalTime));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventStatusEffectAdd>, I>>(base?: I): EventStatusEffectAdd {
    return EventStatusEffectAdd.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventStatusEffectAdd>, I>>(object: I): EventStatusEffectAdd {
    const message = createBaseEventStatusEffectAdd();
    message.statusEffectId = object.statusEffectId ?? 0;
    message.effectInstanceId = object.effectInstanceId ?? 0;
    message.sourceId = object.sourceId ?? "0";
    message.targetId = object.targetId ?? "0";
    message.endTick = object.endTick ?? "0";
    message.value = object.value ?? 0;
    message.totalTime = object.totalTime ?? 0;
    return message;
  },
};

function createBaseEventStatusEffectUpdate(): EventStatusEffectUpdate {
  return { effectInstanceId: 0, playerId: "0", value: 0, expiration: "0" };
}

export const EventStatusEffectUpdate = {
  encode(message: EventStatusEffectUpdate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.effectInstanceId !== 0) {
      writer.uint32(8).uint32(message.effectInstanceId);
    }
    if (message.playerId !== "0") {
      writer.uint32(16).uint64(message.playerId);
    }
    if (message.value !== 0) {
      writer.uint32(24).uint32(message.value);
    }
    if (message.expiration !== "0") {
      writer.uint32(32).uint64(message.expiration);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventStatusEffectUpdate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventStatusEffectUpdate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.effectInstanceId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.playerId = longToString(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.value = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.expiration = longToString(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventStatusEffectUpdate {
    return {
      effectInstanceId: isSet(object.effectInstanceId) ? Number(object.effectInstanceId) : 0,
      playerId: isSet(object.playerId) ? String(object.playerId) : "0",
      value: isSet(object.value) ? Number(object.value) : 0,
      expiration: isSet(object.expiration) ? String(object.expiration) : "0",
    };
  },

  toJSON(message: EventStatusEffectUpdate): unknown {
    const obj: any = {};
    message.effectInstanceId !== undefined && (obj.effectInstanceId = Math.round(message.effectInstanceId));
    message.playerId !== undefined && (obj.playerId = message.playerId);
    message.value !== undefined && (obj.value = Math.round(message.value));
    message.expiration !== undefined && (obj.expiration = message.expiration);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventStatusEffectUpdate>, I>>(base?: I): EventStatusEffectUpdate {
    return EventStatusEffectUpdate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventStatusEffectUpdate>, I>>(object: I): EventStatusEffectUpdate {
    const message = createBaseEventStatusEffectUpdate();
    message.effectInstanceId = object.effectInstanceId ?? 0;
    message.playerId = object.playerId ?? "0";
    message.value = object.value ?? 0;
    message.expiration = object.expiration ?? "0";
    return message;
  },
};

function createBaseEventStatusEffectRemove(): EventStatusEffectRemove {
  return { objectId: "0", reason: 0, statusEffectIds: [] };
}

export const EventStatusEffectRemove = {
  encode(message: EventStatusEffectRemove, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.objectId !== "0") {
      writer.uint32(8).uint64(message.objectId);
    }
    if (message.reason !== 0) {
      writer.uint32(16).uint32(message.reason);
    }
    writer.uint32(26).fork();
    for (const v of message.statusEffectIds) {
      writer.uint32(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventStatusEffectRemove {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventStatusEffectRemove();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.objectId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reason = reader.uint32();
          continue;
        case 3:
          if (tag == 24) {
            message.statusEffectIds.push(reader.uint32());
            continue;
          }

          if (tag == 26) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.statusEffectIds.push(reader.uint32());
            }

            continue;
          }

          break;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventStatusEffectRemove {
    return {
      objectId: isSet(object.objectId) ? String(object.objectId) : "0",
      reason: isSet(object.reason) ? Number(object.reason) : 0,
      statusEffectIds: Array.isArray(object?.statusEffectIds) ? object.statusEffectIds.map((e: any) => Number(e)) : [],
    };
  },

  toJSON(message: EventStatusEffectRemove): unknown {
    const obj: any = {};
    message.objectId !== undefined && (obj.objectId = message.objectId);
    message.reason !== undefined && (obj.reason = Math.round(message.reason));
    if (message.statusEffectIds) {
      obj.statusEffectIds = message.statusEffectIds.map((e) => Math.round(e));
    } else {
      obj.statusEffectIds = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EventStatusEffectRemove>, I>>(base?: I): EventStatusEffectRemove {
    return EventStatusEffectRemove.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventStatusEffectRemove>, I>>(object: I): EventStatusEffectRemove {
    const message = createBaseEventStatusEffectRemove();
    message.objectId = object.objectId ?? "0";
    message.reason = object.reason ?? 0;
    message.statusEffectIds = object.statusEffectIds?.map((e) => e) || [];
    return message;
  },
};

function createBaseEventSkillUse(): EventSkillUse {
  return { sourceId: "0", skillInfo: undefined };
}

export const EventSkillUse = {
  encode(message: EventSkillUse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sourceId !== "0") {
      writer.uint32(8).uint64(message.sourceId);
    }
    if (message.skillInfo !== undefined) {
      SkillInfo.encode(message.skillInfo, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventSkillUse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventSkillUse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.sourceId = longToString(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.skillInfo = SkillInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventSkillUse {
    return {
      sourceId: isSet(object.sourceId) ? String(object.sourceId) : "0",
      skillInfo: isSet(object.skillInfo) ? SkillInfo.fromJSON(object.skillInfo) : undefined,
    };
  },

  toJSON(message: EventSkillUse): unknown {
    const obj: any = {};
    message.sourceId !== undefined && (obj.sourceId = message.sourceId);
    message.skillInfo !== undefined &&
      (obj.skillInfo = message.skillInfo ? SkillInfo.toJSON(message.skillInfo) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventSkillUse>, I>>(base?: I): EventSkillUse {
    return EventSkillUse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventSkillUse>, I>>(object: I): EventSkillUse {
    const message = createBaseEventSkillUse();
    message.sourceId = object.sourceId ?? "0";
    message.skillInfo = (object.skillInfo !== undefined && object.skillInfo !== null)
      ? SkillInfo.fromPartial(object.skillInfo)
      : undefined;
    return message;
  },
};

function createBaseEventStaggerState(): EventStaggerState {
  return { objectId: "0", decreasePoint: 0, paralyzationPoint: 0, paralyzationMaxPoint: 0 };
}

export const EventStaggerState = {
  encode(message: EventStaggerState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.objectId !== "0") {
      writer.uint32(8).uint64(message.objectId);
    }
    if (message.decreasePoint !== 0) {
      writer.uint32(16).uint32(message.decreasePoint);
    }
    if (message.paralyzationPoint !== 0) {
      writer.uint32(24).uint32(message.paralyzationPoint);
    }
    if (message.paralyzationMaxPoint !== 0) {
      writer.uint32(32).uint32(message.paralyzationMaxPoint);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventStaggerState {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventStaggerState();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.objectId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.decreasePoint = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.paralyzationPoint = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.paralyzationMaxPoint = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventStaggerState {
    return {
      objectId: isSet(object.objectId) ? String(object.objectId) : "0",
      decreasePoint: isSet(object.decreasePoint) ? Number(object.decreasePoint) : 0,
      paralyzationPoint: isSet(object.paralyzationPoint) ? Number(object.paralyzationPoint) : 0,
      paralyzationMaxPoint: isSet(object.paralyzationMaxPoint) ? Number(object.paralyzationMaxPoint) : 0,
    };
  },

  toJSON(message: EventStaggerState): unknown {
    const obj: any = {};
    message.objectId !== undefined && (obj.objectId = message.objectId);
    message.decreasePoint !== undefined && (obj.decreasePoint = Math.round(message.decreasePoint));
    message.paralyzationPoint !== undefined && (obj.paralyzationPoint = Math.round(message.paralyzationPoint));
    message.paralyzationMaxPoint !== undefined && (obj.paralyzationMaxPoint = Math.round(message.paralyzationMaxPoint));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventStaggerState>, I>>(base?: I): EventStaggerState {
    return EventStaggerState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventStaggerState>, I>>(object: I): EventStaggerState {
    const message = createBaseEventStaggerState();
    message.objectId = object.objectId ?? "0";
    message.decreasePoint = object.decreasePoint ?? 0;
    message.paralyzationPoint = object.paralyzationPoint ?? 0;
    message.paralyzationMaxPoint = object.paralyzationMaxPoint ?? 0;
    return message;
  },
};

function createBaseEventPlayerHealth(): EventPlayerHealth {
  return { playerId: "0", currentHp: 0, maxHp: 0 };
}

export const EventPlayerHealth = {
  encode(message: EventPlayerHealth, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.playerId !== "0") {
      writer.uint32(8).uint64(message.playerId);
    }
    if (message.currentHp !== 0) {
      writer.uint32(16).uint32(message.currentHp);
    }
    if (message.maxHp !== 0) {
      writer.uint32(24).uint32(message.maxHp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventPlayerHealth {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventPlayerHealth();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.playerId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.currentHp = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.maxHp = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventPlayerHealth {
    return {
      playerId: isSet(object.playerId) ? String(object.playerId) : "0",
      currentHp: isSet(object.currentHp) ? Number(object.currentHp) : 0,
      maxHp: isSet(object.maxHp) ? Number(object.maxHp) : 0,
    };
  },

  toJSON(message: EventPlayerHealth): unknown {
    const obj: any = {};
    message.playerId !== undefined && (obj.playerId = message.playerId);
    message.currentHp !== undefined && (obj.currentHp = Math.round(message.currentHp));
    message.maxHp !== undefined && (obj.maxHp = Math.round(message.maxHp));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventPlayerHealth>, I>>(base?: I): EventPlayerHealth {
    return EventPlayerHealth.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventPlayerHealth>, I>>(object: I): EventPlayerHealth {
    const message = createBaseEventPlayerHealth();
    message.playerId = object.playerId ?? "0";
    message.currentHp = object.currentHp ?? 0;
    message.maxHp = object.maxHp ?? 0;
    return message;
  },
};

function createBaseCharacter(): Character {
  return { characterId: "0", name: "", level: 0, gearLevel: 0, classId: 0 };
}

export const Character = {
  encode(message: Character, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.characterId !== "0") {
      writer.uint32(8).uint64(message.characterId);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.level !== 0) {
      writer.uint32(24).uint32(message.level);
    }
    if (message.gearLevel !== 0) {
      writer.uint32(37).float(message.gearLevel);
    }
    if (message.classId !== 0) {
      writer.uint32(40).uint32(message.classId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Character {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCharacter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.characterId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.level = reader.uint32();
          continue;
        case 4:
          if (tag != 37) {
            break;
          }

          message.gearLevel = reader.float();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.classId = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Character {
    return {
      characterId: isSet(object.characterId) ? String(object.characterId) : "0",
      name: isSet(object.name) ? String(object.name) : "",
      level: isSet(object.level) ? Number(object.level) : 0,
      gearLevel: isSet(object.gearLevel) ? Number(object.gearLevel) : 0,
      classId: isSet(object.classId) ? Number(object.classId) : 0,
    };
  },

  toJSON(message: Character): unknown {
    const obj: any = {};
    message.characterId !== undefined && (obj.characterId = message.characterId);
    message.name !== undefined && (obj.name = message.name);
    message.level !== undefined && (obj.level = Math.round(message.level));
    message.gearLevel !== undefined && (obj.gearLevel = message.gearLevel);
    message.classId !== undefined && (obj.classId = Math.round(message.classId));
    return obj;
  },

  create<I extends Exact<DeepPartial<Character>, I>>(base?: I): Character {
    return Character.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Character>, I>>(object: I): Character {
    const message = createBaseCharacter();
    message.characterId = object.characterId ?? "0";
    message.name = object.name ?? "";
    message.level = object.level ?? 0;
    message.gearLevel = object.gearLevel ?? 0;
    message.classId = object.classId ?? 0;
    return message;
  },
};

function createBasePlayer(): Player {
  return { partyId: 0, character: undefined, isLocal: false };
}

export const Player = {
  encode(message: Player, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.partyId !== 0) {
      writer.uint32(8).uint32(message.partyId);
    }
    if (message.character !== undefined) {
      Character.encode(message.character, writer.uint32(18).fork()).ldelim();
    }
    if (message.isLocal === true) {
      writer.uint32(24).bool(message.isLocal);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Player {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlayer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.partyId = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.character = Character.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.isLocal = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Player {
    return {
      partyId: isSet(object.partyId) ? Number(object.partyId) : 0,
      character: isSet(object.character) ? Character.fromJSON(object.character) : undefined,
      isLocal: isSet(object.isLocal) ? Boolean(object.isLocal) : false,
    };
  },

  toJSON(message: Player): unknown {
    const obj: any = {};
    message.partyId !== undefined && (obj.partyId = Math.round(message.partyId));
    message.character !== undefined &&
      (obj.character = message.character ? Character.toJSON(message.character) : undefined);
    message.isLocal !== undefined && (obj.isLocal = message.isLocal);
    return obj;
  },

  create<I extends Exact<DeepPartial<Player>, I>>(base?: I): Player {
    return Player.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Player>, I>>(object: I): Player {
    const message = createBasePlayer();
    message.partyId = object.partyId ?? 0;
    message.character = (object.character !== undefined && object.character !== null)
      ? Character.fromPartial(object.character)
      : undefined;
    message.isLocal = object.isLocal ?? false;
    return message;
  },
};

function createBaseSkillInfo(): SkillInfo {
  return {
    skillId: 0,
    level: 0,
    tripodIndex1: 0,
    tripodIndex2: 0,
    tripodIndex3: 0,
    tripodLevel1: 0,
    tripodLevel2: 0,
    tripodLevel3: 0,
  };
}

export const SkillInfo = {
  encode(message: SkillInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.skillId !== 0) {
      writer.uint32(8).uint32(message.skillId);
    }
    if (message.level !== 0) {
      writer.uint32(16).uint32(message.level);
    }
    if (message.tripodIndex1 !== 0) {
      writer.uint32(24).uint32(message.tripodIndex1);
    }
    if (message.tripodIndex2 !== 0) {
      writer.uint32(32).uint32(message.tripodIndex2);
    }
    if (message.tripodIndex3 !== 0) {
      writer.uint32(40).uint32(message.tripodIndex3);
    }
    if (message.tripodLevel1 !== 0) {
      writer.uint32(48).uint32(message.tripodLevel1);
    }
    if (message.tripodLevel2 !== 0) {
      writer.uint32(56).uint32(message.tripodLevel2);
    }
    if (message.tripodLevel3 !== 0) {
      writer.uint32(64).uint32(message.tripodLevel3);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SkillInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSkillInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.skillId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.level = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.tripodIndex1 = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.tripodIndex2 = reader.uint32();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.tripodIndex3 = reader.uint32();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.tripodLevel1 = reader.uint32();
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.tripodLevel2 = reader.uint32();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.tripodLevel3 = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SkillInfo {
    return {
      skillId: isSet(object.skillId) ? Number(object.skillId) : 0,
      level: isSet(object.level) ? Number(object.level) : 0,
      tripodIndex1: isSet(object.tripodIndex1) ? Number(object.tripodIndex1) : 0,
      tripodIndex2: isSet(object.tripodIndex2) ? Number(object.tripodIndex2) : 0,
      tripodIndex3: isSet(object.tripodIndex3) ? Number(object.tripodIndex3) : 0,
      tripodLevel1: isSet(object.tripodLevel1) ? Number(object.tripodLevel1) : 0,
      tripodLevel2: isSet(object.tripodLevel2) ? Number(object.tripodLevel2) : 0,
      tripodLevel3: isSet(object.tripodLevel3) ? Number(object.tripodLevel3) : 0,
    };
  },

  toJSON(message: SkillInfo): unknown {
    const obj: any = {};
    message.skillId !== undefined && (obj.skillId = Math.round(message.skillId));
    message.level !== undefined && (obj.level = Math.round(message.level));
    message.tripodIndex1 !== undefined && (obj.tripodIndex1 = Math.round(message.tripodIndex1));
    message.tripodIndex2 !== undefined && (obj.tripodIndex2 = Math.round(message.tripodIndex2));
    message.tripodIndex3 !== undefined && (obj.tripodIndex3 = Math.round(message.tripodIndex3));
    message.tripodLevel1 !== undefined && (obj.tripodLevel1 = Math.round(message.tripodLevel1));
    message.tripodLevel2 !== undefined && (obj.tripodLevel2 = Math.round(message.tripodLevel2));
    message.tripodLevel3 !== undefined && (obj.tripodLevel3 = Math.round(message.tripodLevel3));
    return obj;
  },

  create<I extends Exact<DeepPartial<SkillInfo>, I>>(base?: I): SkillInfo {
    return SkillInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SkillInfo>, I>>(object: I): SkillInfo {
    const message = createBaseSkillInfo();
    message.skillId = object.skillId ?? 0;
    message.level = object.level ?? 0;
    message.tripodIndex1 = object.tripodIndex1 ?? 0;
    message.tripodIndex2 = object.tripodIndex2 ?? 0;
    message.tripodIndex3 = object.tripodIndex3 ?? 0;
    message.tripodLevel1 = object.tripodLevel1 ?? 0;
    message.tripodLevel2 = object.tripodLevel2 ?? 0;
    message.tripodLevel3 = object.tripodLevel3 ?? 0;
    return message;
  },
};

function createBaseEntity(): Entity {
  return { objectId: "0", ownerId: "0", typeId: 0, maxHp: 0 };
}

export const Entity = {
  encode(message: Entity, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.objectId !== "0") {
      writer.uint32(8).uint64(message.objectId);
    }
    if (message.ownerId !== "0") {
      writer.uint32(16).uint64(message.ownerId);
    }
    if (message.typeId !== 0) {
      writer.uint32(24).uint32(message.typeId);
    }
    if (message.maxHp !== 0) {
      writer.uint32(32).uint32(message.maxHp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Entity {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEntity();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.objectId = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.ownerId = longToString(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.typeId = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.maxHp = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Entity {
    return {
      objectId: isSet(object.objectId) ? String(object.objectId) : "0",
      ownerId: isSet(object.ownerId) ? String(object.ownerId) : "0",
      typeId: isSet(object.typeId) ? Number(object.typeId) : 0,
      maxHp: isSet(object.maxHp) ? Number(object.maxHp) : 0,
    };
  },

  toJSON(message: Entity): unknown {
    const obj: any = {};
    message.objectId !== undefined && (obj.objectId = message.objectId);
    message.ownerId !== undefined && (obj.ownerId = message.ownerId);
    message.typeId !== undefined && (obj.typeId = Math.round(message.typeId));
    message.maxHp !== undefined && (obj.maxHp = Math.round(message.maxHp));
    return obj;
  },

  create<I extends Exact<DeepPartial<Entity>, I>>(base?: I): Entity {
    return Entity.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Entity>, I>>(object: I): Entity {
    const message = createBaseEntity();
    message.objectId = object.objectId ?? "0";
    message.ownerId = object.ownerId ?? "0";
    message.typeId = object.typeId ?? 0;
    message.maxHp = object.maxHp ?? 0;
    return message;
  },
};

function createBaseBattle(): Battle {
  return { start: undefined, end: undefined, encounterId: 0, players: {}, entities: {}, events: [], result: 0 };
}

export const Battle = {
  encode(message: Battle, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.start !== undefined) {
      Timestamp.encode(toTimestamp(message.start), writer.uint32(10).fork()).ldelim();
    }
    if (message.end !== undefined) {
      Timestamp.encode(toTimestamp(message.end), writer.uint32(18).fork()).ldelim();
    }
    if (message.encounterId !== 0) {
      writer.uint32(24).uint32(message.encounterId);
    }
    Object.entries(message.players).forEach(([key, value]) => {
      Battle_PlayersEntry.encode({ key: key as any, value }, writer.uint32(34).fork()).ldelim();
    });
    Object.entries(message.entities).forEach(([key, value]) => {
      Battle_EntitiesEntry.encode({ key: key as any, value }, writer.uint32(42).fork()).ldelim();
    });
    for (const v of message.events) {
      Event.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.result !== 0) {
      writer.uint32(56).int32(message.result);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Battle {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBattle();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.start = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.end = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.encounterId = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          const entry4 = Battle_PlayersEntry.decode(reader, reader.uint32());
          if (entry4.value !== undefined) {
            message.players[entry4.key] = entry4.value;
          }
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          const entry5 = Battle_EntitiesEntry.decode(reader, reader.uint32());
          if (entry5.value !== undefined) {
            message.entities[entry5.key] = entry5.value;
          }
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.events.push(Event.decode(reader, reader.uint32()));
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.result = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Battle {
    return {
      start: isSet(object.start) ? fromJsonTimestamp(object.start) : undefined,
      end: isSet(object.end) ? fromJsonTimestamp(object.end) : undefined,
      encounterId: isSet(object.encounterId) ? Number(object.encounterId) : 0,
      players: isObject(object.players)
        ? Object.entries(object.players).reduce<{ [key: string]: Player }>((acc, [key, value]) => {
          acc[key] = Player.fromJSON(value);
          return acc;
        }, {})
        : {},
      entities: isObject(object.entities)
        ? Object.entries(object.entities).reduce<{ [key: string]: Entity }>((acc, [key, value]) => {
          acc[key] = Entity.fromJSON(value);
          return acc;
        }, {})
        : {},
      events: Array.isArray(object?.events) ? object.events.map((e: any) => Event.fromJSON(e)) : [],
      result: isSet(object.result) ? battleResultFromJSON(object.result) : 0,
    };
  },

  toJSON(message: Battle): unknown {
    const obj: any = {};
    message.start !== undefined && (obj.start = message.start.toISOString());
    message.end !== undefined && (obj.end = message.end.toISOString());
    message.encounterId !== undefined && (obj.encounterId = Math.round(message.encounterId));
    obj.players = {};
    if (message.players) {
      Object.entries(message.players).forEach(([k, v]) => {
        obj.players[k] = Player.toJSON(v);
      });
    }
    obj.entities = {};
    if (message.entities) {
      Object.entries(message.entities).forEach(([k, v]) => {
        obj.entities[k] = Entity.toJSON(v);
      });
    }
    if (message.events) {
      obj.events = message.events.map((e) => e ? Event.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    message.result !== undefined && (obj.result = battleResultToJSON(message.result));
    return obj;
  },

  create<I extends Exact<DeepPartial<Battle>, I>>(base?: I): Battle {
    return Battle.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Battle>, I>>(object: I): Battle {
    const message = createBaseBattle();
    message.start = object.start ?? undefined;
    message.end = object.end ?? undefined;
    message.encounterId = object.encounterId ?? 0;
    message.players = Object.entries(object.players ?? {}).reduce<{ [key: string]: Player }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = Player.fromPartial(value);
      }
      return acc;
    }, {});
    message.entities = Object.entries(object.entities ?? {}).reduce<{ [key: string]: Entity }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = Entity.fromPartial(value);
      }
      return acc;
    }, {});
    message.events = object.events?.map((e) => Event.fromPartial(e)) || [];
    message.result = object.result ?? 0;
    return message;
  },
};

function createBaseBattle_PlayersEntry(): Battle_PlayersEntry {
  return { key: "0", value: undefined };
}

export const Battle_PlayersEntry = {
  encode(message: Battle_PlayersEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "0") {
      writer.uint32(8).uint64(message.key);
    }
    if (message.value !== undefined) {
      Player.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Battle_PlayersEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBattle_PlayersEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.key = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.value = Player.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Battle_PlayersEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "0",
      value: isSet(object.value) ? Player.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: Battle_PlayersEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value ? Player.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Battle_PlayersEntry>, I>>(base?: I): Battle_PlayersEntry {
    return Battle_PlayersEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Battle_PlayersEntry>, I>>(object: I): Battle_PlayersEntry {
    const message = createBaseBattle_PlayersEntry();
    message.key = object.key ?? "0";
    message.value = (object.value !== undefined && object.value !== null)
      ? Player.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseBattle_EntitiesEntry(): Battle_EntitiesEntry {
  return { key: "0", value: undefined };
}

export const Battle_EntitiesEntry = {
  encode(message: Battle_EntitiesEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "0") {
      writer.uint32(8).uint64(message.key);
    }
    if (message.value !== undefined) {
      Entity.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Battle_EntitiesEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBattle_EntitiesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.key = longToString(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.value = Entity.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Battle_EntitiesEntry {
    return {
      key: isSet(object.key) ? String(object.key) : "0",
      value: isSet(object.value) ? Entity.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: Battle_EntitiesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined && (obj.value = message.value ? Entity.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Battle_EntitiesEntry>, I>>(base?: I): Battle_EntitiesEntry {
    return Battle_EntitiesEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Battle_EntitiesEntry>, I>>(object: I): Battle_EntitiesEntry {
    const message = createBaseBattle_EntitiesEntry();
    message.key = object.key ?? "0";
    message.value = (object.value !== undefined && object.value !== null)
      ? Entity.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseEventsBatch(): EventsBatch {
  return { events: [] };
}

export const EventsBatch = {
  encode(message: EventsBatch, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.events) {
      Event.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventsBatch {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventsBatch();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.events.push(Event.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventsBatch {
    return { events: Array.isArray(object?.events) ? object.events.map((e: any) => Event.fromJSON(e)) : [] };
  },

  toJSON(message: EventsBatch): unknown {
    const obj: any = {};
    if (message.events) {
      obj.events = message.events.map((e) => e ? Event.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EventsBatch>, I>>(base?: I): EventsBatch {
    return EventsBatch.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventsBatch>, I>>(object: I): EventsBatch {
    const message = createBaseEventsBatch();
    message.events = object.events?.map((e) => Event.fromPartial(e)) || [];
    return message;
  },
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function toTimestamp(date: Date): Timestamp {
  const seconds = Math.trunc(date.getTime() / 1_000).toString();
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = Number(t.seconds) * 1_000;
  millis += t.nanos / 1_000_000;
  return new Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof Date) {
    return o;
  } else if (typeof o === "string") {
    return new Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function longToString(long: Long) {
  return long.toString();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
