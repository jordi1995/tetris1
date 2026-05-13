import { Character, PowerType } from "../types/game";
import { powers } from "./powers";

export type PowerId = PowerType["id"];

export interface CpuProfile {
  label: string;
  moveInterval: number;
  mistakeBias: number;
  attackWeight: number;
  survivalWeight: number;
  powerCooldown: number;
}

export interface CharacterBattleProfile {
  style: string;
  special: string;
  strengths: string[];
  powerIds: PowerId[];
}

export const characterPowerLoadouts: Record<Character["id"], PowerId[]> = {
  whiskers: ["whisker_dash", "perfect_fit", "combo_spark"],
  shadow: ["shadow_bind", "power_theft", "smoke_guard"],
  fluffy: ["pillow_guard", "tidy_sweep", "pillow_patch"],
  tiger: ["claw_barrage", "pounce_panic", "battle_roar"],
  luna: ["moonbeam_clear", "lunar_guard", "lucky_star"],
  midnight: ["void_cleanse", "phase_shift", "nightmare_pause"],
};

export const characterBattleProfiles: Record<Character["id"], CharacterBattleProfile> = {
  whiskers: {
    style: "Combo rapido",
    special: "Vive de encadenar jugadas rapidas: fuerza ritmo, busca piezas buenas y recicla hold para seguir atacando.",
    strengths: ["Velocidad", "Combos", "Piezas utiles"],
    powerIds: characterPowerLoadouts.whiskers,
  },
  shadow: {
    style: "Control tactico",
    special: "No gana por fuerza bruta: congela, roba energia y se cubre justo cuando el rival prepara respuesta.",
    strengths: ["Control", "Robo de poder", "Contraataque"],
    powerIds: characterPowerLoadouts.shadow,
  },
  fluffy: {
    style: "Defensa estable",
    special: "Convierte partidas feas en manejables: escudo largo, barrido bajo y reparacion de huecos.",
    strengths: ["Defensa", "Reparacion", "Calma"],
    powerIds: characterPowerLoadouts.fluffy,
  },
  tiger: {
    style: "Ataque explosivo",
    special: "Todo su kit sirve para hacer dano: basura directa, velocidad forzada y castigo extra con rugido.",
    strengths: ["Dano", "Presion", "Riesgo alto"],
    powerIds: characterPowerLoadouts.tiger,
  },
  luna: {
    style: "Equilibrio",
    special: "Tiene respuestas simples para casi todo: limpia, protege y cambia una pieza mala por una opcion estable.",
    strengths: ["Equilibrio", "Seguridad", "Aprendizaje"],
    powerIds: characterPowerLoadouts.luna,
  },
  midnight: {
    style: "Remontada",
    special: "Esta pensado para sobrevivir al borde: limpia fuerte, cambia fase y congela al rival para respirar.",
    strengths: ["Remontada", "Emergencia", "Juego tardio"],
    powerIds: characterPowerLoadouts.midnight,
  },
};

export const cpuProfiles: Record<Character["id"], CpuProfile> = {
  luna: {
    label: "Facil",
    moveInterval: 220,
    mistakeBias: 42,
    attackWeight: 0.78,
    survivalWeight: 0.82,
    powerCooldown: 2800,
  },
  fluffy: {
    label: "Normal",
    moveInterval: 180,
    mistakeBias: 28,
    attackWeight: 0.92,
    survivalWeight: 1.08,
    powerCooldown: 2400,
  },
  whiskers: {
    label: "Intermedio",
    moveInterval: 150,
    mistakeBias: 18,
    attackWeight: 1.06,
    survivalWeight: 1,
    powerCooldown: 2100,
  },
  shadow: {
    label: "Dificil",
    moveInterval: 125,
    mistakeBias: 10,
    attackWeight: 1.18,
    survivalWeight: 1.12,
    powerCooldown: 1800,
  },
  tiger: {
    label: "Experto",
    moveInterval: 105,
    mistakeBias: 6,
    attackWeight: 1.34,
    survivalWeight: 1.04,
    powerCooldown: 1500,
  },
  midnight: {
    label: "Extremo",
    moveInterval: 90,
    mistakeBias: 3,
    attackWeight: 1.2,
    survivalWeight: 1.35,
    powerCooldown: 1200,
  },
};

export function getPowersForCharacter(characterId: Character["id"]): PowerType[] {
  const loadout = characterPowerLoadouts[characterId] ?? characterPowerLoadouts.whiskers;
  return loadout.map((powerId) => powers.find((power) => power.id === powerId)).filter(Boolean) as PowerType[];
}

export function getCpuProfile(characterId: Character["id"]): CpuProfile {
  return cpuProfiles[characterId] ?? cpuProfiles.shadow;
}

export function getCharacterBattleProfile(characterId: Character["id"]): CharacterBattleProfile {
  return characterBattleProfiles[characterId] ?? characterBattleProfiles.whiskers;
}
