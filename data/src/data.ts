import Encounters from "../encounters.json";
import NPCData from "../meter-data/databases/Npc.json";
import PCData from "../meter-data/databases/PCData.json";
import SkillData from "../meter-data/databases/Skill.json";
import SkillBuffData from "../meter-data/databases/SkillBuff.json";
import SkillEffectData from "../meter-data/databases/SkillEffect.json";
import SkillFeatureData from "../meter-data/databases/SkillFeature.json";

export const SUPPORT_CLASS_IDS = [
  105, // paladin
  204, // bard
  602, // artist
];

export function getClassName(classId: number): string | undefined {
  return (PCData as Record<string, string>)[classId];
}

export function sortClasses(classIds: Array<number>) {
  return classIds.sort((a, b) => {
    if (SUPPORT_CLASS_IDS.includes(a)) {
      if (SUPPORT_CLASS_IDS.includes(b)) {
        return a - b;
      }
      return 1;
    } else if (SUPPORT_CLASS_IDS.includes(b)) {
      if (SUPPORT_CLASS_IDS.includes(a)) {
        return a - b;
      }
      return -1;
    }

    return a - b;
  });
}

export enum EncounterCategory {
  ABYSS_RAID = "Abyss Raid",
  LEGION_RAID = "Legion Raid",
  GUARDIAN_RAID = "Guardian Raid",
  TRIAL_GUARDIAN_RAID = "Trial Guardian Raid",
}

export type Encounter = {
  id: number;
  name: string;
  difficulty: "normal" | "hard" | "";
  category: EncounterCategory;
  gate: number;
};

export function encounterToString(
  e: Encounter,
  includeDifficulty?: boolean
): string {
  let result = "";

  if (e.gate > -1) {
    result = `${e.name} Gate ${e.gate}${result}`;
  } else {
    result = `${e.name}${result}`;
  }

  if (includeDifficulty && e.difficulty !== "") {
    result = `${result} (${e.difficulty})`;
  }

  return result;
}

export function getEncounter(id: number): Encounter | undefined {
  return (Encounters as Array<Encounter>).find((it) => {
    return it.id === id;
  });
}

export function getEncounters(): Array<Encounter> {
  return Encounters as Array<Encounter>;
}

export type NPCInfo = {
  id: number;
  name: string;
  grade: string;
  type: string;
};

export function getNPCInfo(id: number): NPCInfo | undefined {
  return (NPCData as Record<string, NPCInfo>)[id.toString()];
}

export type SkillInfo = {
  id: number;
  name: string;
  desc: string;
  classid: number;
  icon: string;
};

export function getSkillInfo(id: number): SkillInfo | undefined {
  return (SkillData as Record<string, SkillInfo>)[id.toString()];
}

export type SkillEffectInfo = {
  id: number;
  comment: string;
  stagger: number;
};

export function getSkillEffectInfo(id: number): SkillEffectInfo | undefined {
  return (SkillEffectData as Record<string, SkillEffectInfo>)[id.toString()];
}

export type SkillBuffInfo = {
  id: number;
  name: string;
  desc: string;
  icon: string;
  iconshowtype: string;
  duration: number;
  category: string;
  type: string;
  target: string;
  uniquegroup: number;
  overlapflag: number;
  passiveoption: Array<{
    type: string;
    keystat: string;
    keyindex: number;
    value: number;
  }>;
};

export function getSkillBuffInfo(id: number): SkillBuffInfo | undefined {
  return (SkillBuffData as Record<string, SkillBuffInfo>)[id.toString()];
}

export type SkillFeature = {
  skillid: number;
  tripods: Record<
    string,
    {
      key: number;
      name: string;
      entries: Array<unknown>;
    }
  >;
};

export function getSkillFeature(id: number): SkillFeature | undefined {
  return (SkillFeatureData as Record<string, SkillFeature>)[id.toString()];
}
