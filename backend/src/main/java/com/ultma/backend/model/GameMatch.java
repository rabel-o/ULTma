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

    private Map<GameEnums.PowerWord, GameEnums.Meaning> wordDictionary;
    private Map<GameEnums.PotionColor, GameEnums.PotionEffect> potionDictionary;


    public GameMatch() {
        this.matchId = UUID.randomUUID().toString();
        this.players = new ArrayList<>();
        this.isArenaPhase = false;
    }
}
