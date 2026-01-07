package com.ultma.backend.service;

import com.ultma.backend.model.GameEnums;
import com.ultma.backend.model.GameMatch;
import com.ultma.backend.model.Player;
import com.ultma.backend.model.SpellResult;
import com.ultma.backend.repository.GameRepository;
import org.springframework.stereotype.Service;

import java.util.*;

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
}