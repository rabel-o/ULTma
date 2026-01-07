package com.ultma.backend.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class Player {
    private String id;
    private String name;

    // resources
    private int lifeEnergy;
    private int magicShield;
    private int mana;
    private boolean isEliminated;

    // inventory
    private List<String> knownSpells;
    private List<GameEnums.PotionColor> potions;

    public Player(){
        // empty constructor for Jackson (JSON)
    }

    public Player(String name){
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.lifeEnergy = 3;
        this.magicShield = 5;
        this.mana = 5;
        this.isEliminated = false;
        this.potions = new ArrayList<>();

        // initial magics
        this.knownSpells = new ArrayList<>();
        this.knownSpells.add("Disparo Arcano");
        this.knownSpells.add("Proteção Arcana");
        this.knownSpells.add("Teletransporte");
        this.knownSpells.add("Portal");
    }
}
