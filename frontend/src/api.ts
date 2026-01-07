// frontend/src/api.ts
import axios from 'axios';
import { GameMatch, SpellResult } from './types';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/game',
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
};