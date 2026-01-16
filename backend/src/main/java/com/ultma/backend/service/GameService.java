package com.ultma.backend.service;

import com.ultma.backend.model.GameEnums;
import com.ultma.backend.model.GameMatch;
import com.ultma.backend.model.Player;
import com.ultma.backend.model.SpellResult;
import com.ultma.backend.model.DuelResult;
import com.ultma.backend.repository.GameRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GameService {

    private final GameRepository gameRepository;

    public GameService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    public GameMatch createNewGame() {
        GameMatch match = new GameMatch();
        
        // 1. Generate the randomness of power words
        match.setWordDictionary(generateRandomWordMap());
        
        // 2. Generate the randomness of potions
        match.setPotionDictionary(generateRandomPotionMap());
        
        // Save the initial state
        gameRepository.saveGame(match);
        return match;
    }

    public GameMatch addPlayer(String playerName) {
        GameMatch match = gameRepository.loadGame();
        if (match == null) {
            match = createNewGame();
        }
        
        Player newPlayer = new Player(playerName);
        match.getPlayers().add(newPlayer);
        
        gameRepository.saveGame(match);
        return match;
    }

    public GameMatch getGameState() {
        return gameRepository.loadGame();
    }

    // Private logic to shuffle meanings
    private Map<GameEnums.PowerWord, GameEnums.Meaning> generateRandomWordMap() {
        List<GameEnums.Meaning> meanings = Arrays.asList(GameEnums.Meaning.values());
        Collections.shuffle(meanings); // Embaralha a lista de significados

        Map<GameEnums.PowerWord, GameEnums.Meaning> map = new HashMap<>();
        GameEnums.PowerWord[] words = GameEnums.PowerWord.values();

        // Associate each word to a random meaning from the shuffled list
        for (int i = 0; i < words.length; i++) {
            map.put(words[i], meanings.get(i));
        }
        return map;
    }

        // Private logic to shuffle potions
    private Map<GameEnums.PotionColor, GameEnums.PotionEffect> generateRandomPotionMap() {
        List<GameEnums.PotionEffect> effects = Arrays.asList(GameEnums.PotionEffect.values());
        Collections.shuffle(effects);

        Map<GameEnums.PotionColor, GameEnums.PotionEffect> map = new HashMap<>();
        GameEnums.PotionColor[] colors = GameEnums.PotionColor.values();

        for (int i = 0; i < colors.length; i++) {
            map.put(colors[i], effects.get(i));
        }
        return map;
    }

// cast a spell and deduct mana from player
public SpellResult castSpell(String playerId, String word1Str, String word2Str) {
    GameMatch match = getGameState();
    if (match == null) return new SpellResult("Error", "N/A", 0, "game not started", false);

    // find the player who is casting
    Player player = match.getPlayers().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElse(null);

    if (player == null) {
        return new SpellResult("Error", "N/A", 0, "player not found", false);
    }

    try {
        // convert strings to enums
        GameEnums.PowerWord word1 = GameEnums.PowerWord.valueOf(word1Str.toUpperCase());
        GameEnums.PowerWord word2 = GameEnums.PowerWord.valueOf(word2Str.toUpperCase());

        // translate words using the match dictionary
        GameEnums.Meaning m1 = match.getWordDictionary().get(word1);
        GameEnums.Meaning m2 = match.getWordDictionary().get(word2);

        // calculate the spell result
        SpellResult result = resolveCombination(m1, m2);

        // check if player has enough mana
        if (player.getMana() < result.getManaCost()) {
            return new SpellResult("Fizzle", "Failure", 0, "not enough mana to cast this spell", false);
        }

        // deduct mana and save game state
        player.setMana(player.getMana() - result.getManaCost());

        if (result.isSuccess() && !player.getKnownSpells().contains(result.getSpellName())) {
            player.getKnownSpells().add(result.getSpellName());
        }

        gameRepository.saveGame(match);
        return result;

    } catch (IllegalArgumentException e) {
        return new SpellResult("Invalid Word", "Error", 0, "one of the words does not exist", false);
    }
}

    private SpellResult resolveCombination(GameEnums.Meaning m1, GameEnums.Meaning m2) {
        // Trick: Sort the names to facilitate the comparison in the switch
        List<String> sorted = Arrays.asList(m1.name(), m2.name());
        Collections.sort(sorted);
        String key = sorted.get(0) + "_" + sorted.get(1);

        switch (key) {
            // AETHER (Aether) Combinations
            case "AETHER_RUNA": return new SpellResult("Bola de Fogo", "Ataque", 2, "Dano (Evitada por Muro de Água)", true);
            case "AETHER_NEXUS": return new SpellResult("Lança de Gelo", "Ataque", 2, "Dano (Evitada por Barreira de Fogo)", true);
            case "AETHER_SOMBRA": return new SpellResult("Vento Cortante", "Ataque", 2, "Dano (Evitada por Armadura de Pedra)", true);
            case "AETHER_FORJA": return new SpellResult("Barreira de Fogo", "Defesa", 1, "Defesa (Dobra dano de Lança de Gelo)", true);
            case "AETHER_VAZIO": return new SpellResult("Dissipação", "Utilidade", 3, "Remove artefato/poção ou cancela vidência", true);

            // RUNA Combinations
            case "NEXUS_RUNA": return new SpellResult("Muro de Água", "Defesa", 1, "Defesa (Dobra dano de Bola de Fogo)", true);
            case "RUNA_SOMBRA": return new SpellResult("Ocultar Presença", "Utilidade", 1, "Impede duelos e vidência", true);
            case "FORJA_RUNA": return new SpellResult("Armadura de Pedra", "Defesa", 1, "Defesa (Dobra dano de Fúria da Terra)", true);
            case "RUNA_VAZIO": return new SpellResult("Maldição do Vazio", "Ataque", 2, "Remove 3 mana ou 1 vida", true);

            // NEXUS Combinations
            case "NEXUS_SOMBRA": return new SpellResult("Visão Mental", "Utilidade", 2, "Aprende Palavras de Poder do alvo", true);
            case "FORJA_NEXUS": return new SpellResult("Fúria da Terra", "Ataque", 2, "Dano (Evitada por Levitação)", true);
            case "NEXUS_VAZIO": return new SpellResult("Transferência de Mana", "Utilidade", 1, "Rouba 2 de Mana", true);

            // SOMBRA Combinations
            case "FORJA_SOMBRA": return new SpellResult("Clarividência", "Utilidade", 1, "Revela informações", true);
            case "SOMBRA_VAZIO": return new SpellResult("Levitação", "Defesa", 1, "Defesa (Dobra dano de Vento Cortante)", true);

            // FORJA Combinations
            case "FORJA_VAZIO": return new SpellResult("Escudo de Vácuo", "Defesa", 3, "+1 Escudo Temporário", true);

            default: return new SpellResult("Falha Mágica", "Nenhum", 0, "A combinação falhou.", false);
        }
    }

    // action to recover mana (end of turn mechanic)
    public GameMatch meditate(String playerId) {
        GameMatch match = getGameState();
        if (match == null) return null;
        
        Player player = match.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (player != null) {
            // recover 2 mana, capping at 5 (initial max) for balance
            int newMana = Math.min(5, player.getMana() + 2);
            player.setMana(newMana);
            gameRepository.saveGame(match);
        }
        return match;
    }

    // Attack another player with a spell
    public DuelResult attackPlayer(String attackerId, String targetId, String spellName) {
        GameMatch match = getGameState();
        if (match == null) {
            return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, null);
        }

        Player attacker = match.getPlayers().stream()
                .filter(p -> p.getId().equals(attackerId))
                .findFirst()
                .orElse(null);

        Player target = match.getPlayers().stream()
                .filter(p -> p.getId().equals(targetId))
                .findFirst()
                .orElse(null);

        if (attacker == null || target == null || attacker.equals(target)) {
            return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, null);
        }

        // Check if attacker knows the spell
        if (!attacker.getKnownSpells().contains(spellName)) {
            return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, "Você não conhece esta magia");
        }

        // Get spell info to check if it's an attack spell
        String spellType = getSpellType(spellName);
        if (!"Ataque".equals(spellType)) {
            return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, "Esta magia não é de ataque");
        }

        // Get spell cost - attack spells cost 1-2 mana
        int spellCost = getSpellCost(spellName);
        if (attacker.getMana() < spellCost) {
            return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, "Mana insuficiente para esta magia");
        }

        // Deduct mana from attacker
        attacker.setMana(attacker.getMana() - spellCost);

        // Check for blocking defenses (simplified - no active defenses for now)
        String blockingSpell = null;
        boolean wasBlocked = false;

        int shieldBefore = target.getMagicShield();
        int lifeBefore = target.getLifeEnergy();
        int damage = 1; // Base damage is 1

        // Apply damage
        if (!wasBlocked) {
            if (target.getMagicShield() > 0) {
                target.setMagicShield(Math.max(0, target.getMagicShield() - damage));
            } else {
                target.setLifeEnergy(Math.max(0, target.getLifeEnergy() - damage));
            }
        }

        // Check for elimination
        if (target.getLifeEnergy() <= 0) {
            target.setEliminated(true);
        }

        int shieldAfter = target.getMagicShield();
        int lifeAfter = target.getLifeEnergy();

        gameRepository.saveGame(match);

        return new DuelResult(true, attackerId, targetId, spellName, wasBlocked ? 0 : damage,
                shieldBefore, shieldAfter, lifeBefore, lifeAfter, wasBlocked, blockingSpell);
    }

    private String getSpellType(String spellName) {
        switch (spellName) {
            case "Bola de Fogo":
            case "Lança de Gelo":
            case "Vento Cortante":
            case "Fúria da Terra":
            case "Disparo Arcano":
            case "Maldição do Vazio":
                return "Ataque";
            case "Barreira de Fogo":
            case "Muro de Água":
            case "Armadura de Pedra":
            case "Levitação":
            case "Proteção Arcana":
            case "Escudo de Vácuo":
                return "Defesa";
            default:
                return "Utilidade";
        }
    }

    private int getSpellCost(String spellName) {
        switch (spellName) {
            case "Disparo Arcano":
                return 1;
            case "Bola de Fogo":
            case "Lança de Gelo":
            case "Vento Cortante":
            case "Fúria da Terra":
            case "Maldição do Vazio":
                return 2;
            default:
                return 1;
        }
    }

    // Activate a defense spell for a player
    public SpellResult activateDefense(String playerId, String spellName) {
        GameMatch match = getGameState();
        if (match == null) return new SpellResult("Error", "N/A", 0, "game not started", false);

        Player player = match.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (player == null) {
            return new SpellResult("Error", "N/A", 0, "player not found", false);
        }

        // Check if player knows the spell
        if (!player.getKnownSpells().contains(spellName)) {
            return new SpellResult("Error", "N/A", 0, "você não conhece esta magia", false);
        }

        // Check if it's a defense spell
        String spellType = getSpellType(spellName);
        if (!"Defesa".equals(spellType)) {
            return new SpellResult("Error", "N/A", 0, "esta magia não é de defesa", false);
        }

        // Get spell cost (defense spells cost 1, except Escudo de Vácuo which costs 3)
        int cost = "Escudo de Vácuo".equals(spellName) ? 3 : 1;

        // Check if player has enough mana
        if (player.getMana() < cost) {
            return new SpellResult("Fizzle", "Failure", 0, "mana insuficiente para ativar esta defesa", false);
        }

        // Deduct mana
        player.setMana(player.getMana() - cost);

        // Apply Escudo de Vácuo effect (adds 1 temporary shield)
        if ("Escudo de Vácuo".equals(spellName)) {
            player.setMagicShield(player.getMagicShield() + 1);
        }

        gameRepository.saveGame(match);

        return new SpellResult(spellName, "Defesa", cost, "Defesa ativada!", true);
    }

    // Start arena phase
    public GameMatch startArenaPhase() {
        GameMatch match = getGameState();
        if (match == null) return null;

        List<Player> activePlayers = match.getPlayers().stream()
                .filter(p -> !p.isEliminated())
                .collect(Collectors.toList());

        if (activePlayers.size() < 2) {
            return match; // Need at least 2 players
        }

        match.setArenaPhase(true);
        if (match.getArenaRound() == null) {
            match.setArenaRound(0);
        }
        match.setArenaRound(match.getArenaRound() + 1);
        match.setCurrentTurnPlayerIndex(0);

        gameRepository.saveGame(match);
        return match;
    }

    // End turn in arena
    public GameMatch endArenaTurn(String playerId) {
        GameMatch match = getGameState();
        if (match == null || !match.isArenaPhase()) return match;

        List<Player> activePlayers = match.getPlayers().stream()
                .filter(p -> !p.isEliminated())
                .collect(Collectors.toList());

        int currentIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
        if (currentIndex < activePlayers.size() - 1) {
            match.setCurrentTurnPlayerIndex(currentIndex + 1);
        } else {
            // Round complete, start new round
            match.setArenaRound(match.getArenaRound() + 1);
            match.setCurrentTurnPlayerIndex(0);
        }

        gameRepository.saveGame(match);
        return match;
    }
}