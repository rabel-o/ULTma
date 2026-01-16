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
    private List<String> activeDefenses; // Defesas ativas no duelo atual
    private List<GameEnums.Glifo> glifos; // Glifos do jogador na fase de exploração
    private Integer arenaPosition; // Posição na arena (0-3 para 4 jogadores)
    private Integer actionsRemaining; // Ações restantes no turno da arena (inicialmente 3)

    public Player(){
        // empty constructor for Jackson (JSON)
    }

    public Player(String name){
        this.id = UUID.randomUUID().toString();
        this.name = name;
        this.lifeEnergy = 3;
        this.magicShield = 3; // Corrigido: especificação diz 3, não 5
        this.mana = 5;
        this.isEliminated = false;
        this.potions = new ArrayList<>();
        this.activeDefenses = new ArrayList<>();
        this.glifos = new ArrayList<>();
        this.arenaPosition = null;
        this.actionsRemaining = 0;

        // initial magics
        this.knownSpells = new ArrayList<>();
        this.knownSpells.add("Disparo Arcano");
        this.knownSpells.add("Proteção Arcana");
        this.knownSpells.add("Teletransporte");
        this.knownSpells.add("Portal");
    }
}
