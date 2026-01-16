// frontend/src/api.ts
import axios from 'axios';
import { GameMatch, SpellResult, DuelResult } from './types';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/game';
const api = axios.create({
    baseURL: apiBaseURL,
});

export const GameService = {
    startNewGame: async (): Promise<GameMatch> => {
        const response = await api.post<GameMatch>('/new');
        return response.data;
    },

    joinGame: async (playerName: string): Promise<GameMatch> => {
        const response = await api.post<GameMatch>('/join', null, {
            params: { playerName }
        });
        return response.data;
    },

    // cast a spell sending player id for mana deduction
    castSpell: async (playerId: string, word1: string, word2: string): Promise<SpellResult> => {
        const response = await api.post<SpellResult>('/cast', null, {
            params: { playerId: playerId, w1: word1, w2: word2 } // sending player idS
        });
        return response.data;
    },

    // get current game state without resetting
    getGame: async (): Promise<GameMatch> => {
        const response = await api.get<GameMatch>(''); // calls GET /api/game
        return response.data;
    },

    // recover mana
    meditate: async (playerId: string): Promise<GameMatch> => {
        const response = await api.post<GameMatch>('/meditate', null, {
            params: { playerId }
        });
        return response.data;
    },

    // attack another player
    attackPlayer: async (attackerId: string, targetId: string, spellName: string): Promise<DuelResult> => {
        const response = await api.post<DuelResult>('/attack', null, {
            params: { attackerId, targetId, spellName }
        });
        return response.data;
    },

    // activate a defense spell
    activateDefense: async (playerId: string, spellName: string): Promise<SpellResult> => {
        const response = await api.post<SpellResult>('/activate-defense', null, {
            params: { playerId, spellName }
        });
        return response.data;
    },

    // start arena phase
    startArenaPhase: async (): Promise<GameMatch> => {
        const response = await api.post<GameMatch>('/start-arena');
        return response.data;
    },

    // end turn in arena
    endArenaTurn: async (playerId: string): Promise<GameMatch> => {
        const response = await api.post<GameMatch>('/end-turn', null, {
            params: { playerId }
        });
        return response.data;
    },

    // check if positions are adjacent
    areAdjacent: async (pos1: number, pos2: number, totalPlayers: number): Promise<boolean> => {
        const response = await api.get<boolean>('/adjacent', {
            params: { pos1, pos2, totalPlayers }
        });
        return response.data;
    },
};