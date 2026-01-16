// frontend/src/types.ts

export interface SpellResult {
    spellName: string;
    type: string;
    manaCost: number;
    description: string;
    success: boolean;
}

export interface Player {
    id: string;
    name: string;
    lifeEnergy: number; // 3
    magicShield: number; // 5
    mana: number;       // 5
    isEliminated: boolean;
    knownSpells: string[];
    potions: string[];
    activeDefenses?: string[];
    arenaPosition?: number;
    actionsRemaining?: number;
}

export interface GameMatch {
    matchId: string;
    players: Player[];
    wordDictionary?: Record<string, string>;
    isArenaPhase?: boolean;
    currentTurnPlayerIndex?: number;
    arenaRound?: number;
}

export interface DuelResult {
    success: boolean;
    attackerId: string;
    targetId: string;
    spellName: string;
    damageDealt: number;
    targetShieldBefore: number;
    targetShieldAfter: number;
    targetLifeBefore: number;
    targetLifeAfter: number;
    wasBlocked: boolean;
    blockingSpell?: string;
}