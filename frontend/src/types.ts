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
    magicShield: number; // 3
    mana: number;       // 5
    knownSpells: string[];
    potions: string[];
}

export interface GameMatch {
    matchId: string;
    players: Player[];
    wordDictionary?: Record<string, string>;
}