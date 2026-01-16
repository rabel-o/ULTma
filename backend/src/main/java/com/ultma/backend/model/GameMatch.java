package com.ultma.backend.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class GameMatch {
    private String matchId;
    private List<Player> players;
    private boolean isArenaPhase;
    private Integer currentTurnPlayerIndex;
    private Integer arenaRound;

    private Map<GameEnums.PowerWord, GameEnums.Meaning> wordDictionary;
    private Map<GameEnums.PotionColor, GameEnums.PotionEffect> potionDictionary;
    
    // Sistema de glifos
    private List<GameEnums.Glifo> glifosUsadosNoTabuleiro; // Glifos distintos já usados nesta rodada


    public GameMatch() {
        this.matchId = UUID.randomUUID().toString();
        this.players = new ArrayList<>();
        this.isArenaPhase = false;
        this.currentTurnPlayerIndex = 0;
        this.arenaRound = 0;
        this.glifosUsadosNoTabuleiro = new ArrayList<>();
    }
}
