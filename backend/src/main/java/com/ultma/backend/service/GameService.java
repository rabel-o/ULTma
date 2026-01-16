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
        
        // Auto-start arena phase when there are at least 2 players
        if (match.getPlayers().size() >= 2 && !match.isArenaPhase()) {
            // Initialize arena phase automatically
            initializeArenaPhase(match);
        }
        
        gameRepository.saveGame(match);
        return match;
    }

    public GameMatch getGameState() {
        GameMatch match = gameRepository.loadGame();
        if (match != null) {
            // Auto-start arena phase if there are at least 2 players and arena is not active
            if (match.getPlayers().size() >= 2 && !match.isArenaPhase()) {
                initializeArenaPhase(match);
                gameRepository.saveGame(match);
            }
        }
        return match;
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

        // Check if in arena phase - actions are limited
        if (match.isArenaPhase()) {
            // Get list of active players
            List<Player> activePlayers = match.getPlayers().stream()
                    .filter(p -> !p.isEliminated())
                    .collect(Collectors.toList());

            // Check if it's the player's turn
            int currentTurnIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
            if (currentTurnIndex >= match.getPlayers().size()) {
                currentTurnIndex = 0;
            }
            Player currentTurnPlayer = match.getPlayers().get(currentTurnIndex);
            
            // If current turn player is eliminated, find first active player
            if (currentTurnPlayer.isEliminated()) {
                if (!activePlayers.isEmpty()) {
                    currentTurnPlayer = activePlayers.get(0);
                    // Update index to first active player
                    for (int i = 0; i < match.getPlayers().size(); i++) {
                        if (match.getPlayers().get(i).getId().equals(currentTurnPlayer.getId())) {
                            match.setCurrentTurnPlayerIndex(i);
                            break;
                        }
                    }
                }
            }
            
            if (!player.getId().equals(currentTurnPlayer.getId())) {
                return new SpellResult("Error", "N/A", 0, "Não é seu turno. Aguarde o jogador atual terminar suas ações.", false);
            }

            // Check if player has actions remaining
            if (player.getActionsRemaining() == null || player.getActionsRemaining() <= 0) {
                return new SpellResult("Error", "N/A", 0, "Você não tem ações restantes neste turno", false);
            }
        }

        // calculate the spell result
        SpellResult result = resolveCombination(m1, m2);

        // check if player has enough mana
        if (player.getMana() < result.getManaCost()) {
            return new SpellResult("Fizzle", "Failure", 0, "not enough mana to cast this spell", false);
        }

        // deduct mana and save game state
        player.setMana(player.getMana() - result.getManaCost());

        // Decrease actions remaining if in arena phase and check if turn should end
        if (match.isArenaPhase() && player.getActionsRemaining() != null && player.getActionsRemaining() > 0) {
            player.setActionsRemaining(player.getActionsRemaining() - 1);
            
            // If actions are 0, automatically advance to next player's turn
            if (player.getActionsRemaining() == 0) {
                advanceTurn(match);
            }
        }

        if (result.isSuccess() && !player.getKnownSpells().contains(result.getSpellName())) {
            player.getKnownSpells().add(result.getSpellName());
            
            // Reward potions for discovering new spells (100% chance for testing - can be reduced later)
            GameEnums.PotionColor[] colors = GameEnums.PotionColor.values();
            GameEnums.PotionColor randomPotion = colors[(int)(Math.random() * colors.length)];
            player.getPotions().add(randomPotion);
            result.setDescription(result.getDescription() + " | +1 Poção (" + randomPotion.name() + ")");
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

        if (player == null) {
            return match;
        }

        // Check if in arena phase - actions are limited
        if (match.isArenaPhase()) {
            // Get list of active players
            List<Player> activePlayers = match.getPlayers().stream()
                    .filter(p -> !p.isEliminated())
                    .collect(Collectors.toList());

            // Check if it's the player's turn
            int currentTurnIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
            if (currentTurnIndex >= match.getPlayers().size()) {
                currentTurnIndex = 0;
            }
            Player currentTurnPlayer = match.getPlayers().get(currentTurnIndex);
            
            // If current turn player is eliminated, find first active player
            if (currentTurnPlayer.isEliminated()) {
                if (!activePlayers.isEmpty()) {
                    currentTurnPlayer = activePlayers.get(0);
                    // Update index to first active player
                    for (int i = 0; i < match.getPlayers().size(); i++) {
                        if (match.getPlayers().get(i).getId().equals(currentTurnPlayer.getId())) {
                            match.setCurrentTurnPlayerIndex(i);
                            break;
                        }
                    }
                }
            }
            
            if (!player.getId().equals(currentTurnPlayer.getId())) {
                return match; // Not player's turn
            }

            // Check if player has actions remaining
            if (player.getActionsRemaining() == null || player.getActionsRemaining() <= 0) {
                return match; // No actions remaining
            }
        }

        // recover 2 mana, capping at 5 (initial max) for balance
        int newMana = Math.min(5, player.getMana() + 2);
        player.setMana(newMana);

        // Decrease actions remaining if in arena phase and check if turn should end
        if (match.isArenaPhase() && player.getActionsRemaining() != null && player.getActionsRemaining() > 0) {
            player.setActionsRemaining(player.getActionsRemaining() - 1);
            
            // If actions are 0, automatically advance to next player's turn
            if (player.getActionsRemaining() == 0) {
                advanceTurn(match);
            }
        }

        gameRepository.saveGame(match);
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

        // Check if in arena phase - actions are limited
        if (match.isArenaPhase()) {
            // Get list of active players
            List<Player> activePlayers = match.getPlayers().stream()
                    .filter(p -> !p.isEliminated())
                    .collect(Collectors.toList());

            // Check if it's the attacker's turn
            int currentTurnIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
            if (currentTurnIndex >= match.getPlayers().size()) {
                currentTurnIndex = 0;
            }
            Player currentTurnPlayer = match.getPlayers().get(currentTurnIndex);
            
            // If current turn player is eliminated, find first active player
            if (currentTurnPlayer.isEliminated()) {
                if (!activePlayers.isEmpty()) {
                    currentTurnPlayer = activePlayers.get(0);
                    // Update index to first active player
                    for (int i = 0; i < match.getPlayers().size(); i++) {
                        if (match.getPlayers().get(i).getId().equals(currentTurnPlayer.getId())) {
                            match.setCurrentTurnPlayerIndex(i);
                            break;
                        }
                    }
                }
            }
            
            if (!attacker.getId().equals(currentTurnPlayer.getId())) {
                return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, "Não é seu turno. Aguarde o jogador atual terminar suas ações.");
            }

            // Check if attacker has actions remaining
            if (attacker.getActionsRemaining() == null || attacker.getActionsRemaining() <= 0) {
                return new DuelResult(false, attackerId, targetId, spellName, 0, 0, 0, 0, 0, false, "Você não tem ações restantes neste turno");
            }
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

        // Decrease actions remaining if in arena phase and check if turn should end
        if (match.isArenaPhase() && attacker.getActionsRemaining() != null && attacker.getActionsRemaining() > 0) {
            attacker.setActionsRemaining(attacker.getActionsRemaining() - 1);
            
            // If actions are 0, automatically advance to next player's turn
            if (attacker.getActionsRemaining() == 0) {
                advanceTurn(match);
            }
        }

        // Special handling for Maldição do Vazio
        if ("Maldição do Vazio".equals(spellName)) {
            int shieldBefore = target.getMagicShield();
            int lifeBefore = target.getLifeEnergy();
            
            // Remove 3 mana from target
            int manaBefore = target.getMana();
            target.setMana(Math.max(0, target.getMana() - 3));
            int manaAfter = target.getMana();
            int manaRemoved = manaBefore - manaAfter;
            
            // If target mana is 0, cause 1 damage
            int damage = (manaAfter == 0 && manaRemoved > 0) ? 1 : 0;
            
            if (damage > 0) {
                if (target.getMagicShield() > 0) {
                    target.setMagicShield(Math.max(0, target.getMagicShield() - damage));
                } else {
                    target.setLifeEnergy(Math.max(0, target.getLifeEnergy() - damage));
                }
            }
            
            int shieldAfter = target.getMagicShield();
            int lifeAfter = target.getLifeEnergy();
            
            gameRepository.saveGame(match);
            
            return new DuelResult(true, attackerId, targetId, spellName, damage,
                    shieldBefore, shieldAfter, lifeBefore, lifeAfter, false, null);
        }

        // Check for blocking defenses using activeDefenses
        String blockingSpell = checkBlockingDefense(spellName, target.getActiveDefenses());
        boolean wasBlocked = (blockingSpell != null);

        int shieldBefore = target.getMagicShield();
        int lifeBefore = target.getLifeEnergy();
        int damage = 1; // Base damage is 1

        // Check for damage amplification (defense on target doubles damage)
        // If attacker has the matching defense active on target, damage is doubled
        if (!wasBlocked && attacker.getActiveDefenses() != null) {
            damage = calculateDamageWithAmplification(spellName, attacker.getActiveDefenses(), damage);
        }

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

        // Check if in arena phase - actions are limited
        if (match.isArenaPhase()) {
            // Get list of active players
            List<Player> activePlayers = match.getPlayers().stream()
                    .filter(p -> !p.isEliminated())
                    .collect(Collectors.toList());

            // Check if it's the player's turn
            int currentTurnIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
            if (currentTurnIndex >= match.getPlayers().size()) {
                currentTurnIndex = 0;
            }
            Player currentTurnPlayer = match.getPlayers().get(currentTurnIndex);
            
            // If current turn player is eliminated, find first active player
            if (currentTurnPlayer.isEliminated()) {
                if (!activePlayers.isEmpty()) {
                    currentTurnPlayer = activePlayers.get(0);
                    // Update index to first active player
                    for (int i = 0; i < match.getPlayers().size(); i++) {
                        if (match.getPlayers().get(i).getId().equals(currentTurnPlayer.getId())) {
                            match.setCurrentTurnPlayerIndex(i);
                            break;
                        }
                    }
                }
            }
            
            if (!player.getId().equals(currentTurnPlayer.getId())) {
                return new SpellResult("Error", "N/A", 0, "Não é seu turno. Aguarde o jogador atual terminar suas ações.", false);
            }

            // Check if player has actions remaining
            if (player.getActionsRemaining() == null || player.getActionsRemaining() <= 0) {
                return new SpellResult("Error", "N/A", 0, "você não tem ações restantes neste turno", false);
            }
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

        // Decrease actions remaining if in arena phase and check if turn should end
        if (match.isArenaPhase() && player.getActionsRemaining() != null && player.getActionsRemaining() > 0) {
            player.setActionsRemaining(player.getActionsRemaining() - 1);
            
            // If actions are 0, automatically advance to next player's turn
            if (player.getActionsRemaining() == 0) {
                advanceTurn(match);
            }
        }

        // Add defense to active defenses list
        if (player.getActiveDefenses() == null) {
            player.setActiveDefenses(new ArrayList<>());
        }
        player.getActiveDefenses().add(spellName);

        // Apply Escudo de Vácuo effect (adds 1 temporary shield - only during duel, cleared at end)
        if ("Escudo de Vácuo".equals(spellName)) {
            player.setMagicShield(player.getMagicShield() + 1);
        }

        gameRepository.saveGame(match);

        return new SpellResult(spellName, "Defesa", cost, "Defesa ativada!", true);
    }

    // Check if a defense can block an attack
    private String checkBlockingDefense(String attackSpell, List<String> activeDefenses) {
        if (activeDefenses == null || activeDefenses.isEmpty()) {
            return null;
        }

        // Specific blocking rules
        switch (attackSpell) {
            case "Bola de Fogo":
                if (activeDefenses.contains("Muro de Água")) {
                    return "Muro de Água";
                }
                break;
            case "Lança de Gelo":
                if (activeDefenses.contains("Barreira de Fogo")) {
                    return "Barreira de Fogo";
                }
                break;
            case "Vento Cortante":
                if (activeDefenses.contains("Armadura de Pedra")) {
                    return "Armadura de Pedra";
                }
                break;
            case "Fúria da Terra":
                if (activeDefenses.contains("Levitação")) {
                    return "Levitação";
                }
                break;
            case "Disparo Arcano":
                if (activeDefenses.contains("Proteção Arcana")) {
                    return "Proteção Arcana";
                }
                break;
        }

        return null;
    }

    // Calculate damage with amplification (defense on target doubles damage)
    private int calculateDamageWithAmplification(String attackSpell, List<String> activeDefenses, int baseDamage) {
        if (activeDefenses == null || activeDefenses.isEmpty()) {
            return baseDamage;
        }

        // Amplification rules: if matching defense is active on target, damage doubles
        switch (attackSpell) {
            case "Lança de Gelo":
                if (activeDefenses.contains("Barreira de Fogo")) {
                    return baseDamage * 2;
                }
                break;
            case "Bola de Fogo":
                if (activeDefenses.contains("Muro de Água")) {
                    return baseDamage * 2;
                }
                break;
            case "Fúria da Terra":
                if (activeDefenses.contains("Levitação")) {
                    return baseDamage * 2;
                }
                break;
            case "Vento Cortante":
                if (activeDefenses.contains("Armadura de Pedra")) {
                    return baseDamage * 2;
                }
                break;
        }

        return baseDamage;
    }

    // Distribute 4 glyphs to each player at the start of exploration phase
    public GameMatch distributeGlyphs() {
        GameMatch match = getGameState();
        if (match == null) return null;

        List<GameEnums.Glifo> allGlyphs = Arrays.asList(GameEnums.Glifo.values());
        Collections.shuffle(allGlyphs);

        for (Player player : match.getPlayers()) {
            if (!player.isEliminated()) {
                if (player.getGlifos() == null) {
                    player.setGlifos(new ArrayList<>());
                }
                // Give 4 random glyphs to each player
                player.getGlifos().clear();
                for (int i = 0; i < 4 && i < allGlyphs.size(); i++) {
                    player.getGlifos().add(allGlyphs.get(i));
                }
                // Shuffle again for next player to get different glyphs
                Collections.shuffle(allGlyphs);
            }
        }

        // Reset used glyphs counter
        if (match.getGlifosUsadosNoTabuleiro() == null) {
            match.setGlifosUsadosNoTabuleiro(new ArrayList<>());
        }
        match.getGlifosUsadosNoTabuleiro().clear();

        gameRepository.saveGame(match);
        return match;
    }

    // Use a glyph to open a chamber
    public GameMatch useGlyph(String playerId, String glifoStr) {
        GameMatch match = getGameState();
        if (match == null) return null;

        Player player = match.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (player == null || player.isEliminated()) {
            return match;
        }

        try {
            GameEnums.Glifo glifo = GameEnums.Glifo.valueOf(glifoStr.toUpperCase());

            // Check if player has this glyph
            if (player.getGlifos() == null || !player.getGlifos().contains(glifo)) {
                return match; // Player doesn't have this glyph
            }

            // Remove glyph from player
            player.getGlifos().remove(glifo);

            // Track which distinct glyphs have been used on the board
            if (match.getGlifosUsadosNoTabuleiro() == null) {
                match.setGlifosUsadosNoTabuleiro(new ArrayList<>());
            }
            if (!match.getGlifosUsadosNoTabuleiro().contains(glifo)) {
                match.getGlifosUsadosNoTabuleiro().add(glifo);
            }

            // Check if player just activated their 4th glyph (bonus: +1 mana, +1 shield)
            // Player gets bonus when they use their 4th and final glyph
            if (player.getGlifos().isEmpty()) {
                player.setMana(player.getMana() + 1);
                player.setMagicShield(player.getMagicShield() + 1);
            }

            // Check if all 4 distinct glyphs have been used on the board (trigger arena phase)
            // This happens when any combination of players has used all 4 different glyphs
            if (match.getGlifosUsadosNoTabuleiro().size() >= 4) {
                // Arena phase can be triggered - frontend can check this and call startArenaPhase
            }

            gameRepository.saveGame(match);
            return match;

        } catch (IllegalArgumentException e) {
            return match; // Invalid glyph
        }
    }

    // Helper method to initialize arena phase
    private void initializeArenaPhase(GameMatch match) {
        List<Player> activePlayers = match.getPlayers().stream()
                .filter(p -> !p.isEliminated())
                .collect(Collectors.toList());

        if (activePlayers.size() < 2) {
            return; // Need at least 2 players
        }

        match.setArenaPhase(true);
        if (match.getArenaRound() == null) {
            match.setArenaRound(0);
        }
        if (match.getArenaRound() == 0) {
            match.setArenaRound(1);
        }
        if (match.getCurrentTurnPlayerIndex() == null) {
            match.setCurrentTurnPlayerIndex(0);
        }

        // Randomly position players in arena circles
        Collections.shuffle(activePlayers);
        for (int i = 0; i < activePlayers.size(); i++) {
            if (activePlayers.get(i).getArenaPosition() == null) {
                activePlayers.get(i).setArenaPosition(i);
            }
            if (activePlayers.get(i).getActionsRemaining() == null || activePlayers.get(i).getActionsRemaining() == 0) {
                activePlayers.get(i).setActionsRemaining(3); // 3 actions per turn
            }
            // Clear active defenses at start of arena
            if (activePlayers.get(i).getActiveDefenses() == null) {
                activePlayers.get(i).setActiveDefenses(new ArrayList<>());
            }
        }
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

        if (!match.isArenaPhase()) {
            match.setArenaRound(1);
            match.setCurrentTurnPlayerIndex(0);
        } else {
            match.setArenaRound(match.getArenaRound() + 1);
        }

        match.setArenaPhase(true);

        // Randomly position players in arena circles
        Collections.shuffle(activePlayers);
        for (int i = 0; i < activePlayers.size(); i++) {
            activePlayers.get(i).setArenaPosition(i);
            activePlayers.get(i).setActionsRemaining(3); // 3 actions per turn
            // Clear active defenses at start of arena
            activePlayers.get(i).setActiveDefenses(new ArrayList<>());
        }

        gameRepository.saveGame(match);
        return match;
    }

    // Helper method to advance turn to next player
    private void advanceTurn(GameMatch match) {
        if (!match.isArenaPhase()) {
            return;
        }

        List<Player> activePlayers = match.getPlayers().stream()
                .filter(p -> !p.isEliminated())
                .collect(Collectors.toList());

        if (activePlayers.isEmpty()) {
            return;
        }

        // Find current player's index in active players list
        int currentTurnIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
        
        // Get current player ID from the full list
        if (currentTurnIndex >= match.getPlayers().size()) {
            currentTurnIndex = 0;
        }
        Player currentPlayerInFullList = match.getPlayers().get(currentTurnIndex);
        
        // Find this player's index in active players list
        int activeListIndex = -1;
        for (int i = 0; i < activePlayers.size(); i++) {
            if (activePlayers.get(i).getId().equals(currentPlayerInFullList.getId())) {
                activeListIndex = i;
                break;
            }
        }
        
        // If current player was not found in active list (eliminated), start from first
        if (activeListIndex == -1) {
            activeListIndex = 0;
        }
        
        // Move to next active player
        int nextActiveIndex = (activeListIndex + 1) % activePlayers.size();
        Player nextPlayer = activePlayers.get(nextActiveIndex);
        
        // Find next player's index in full list
        int nextFullListIndex = -1;
        for (int i = 0; i < match.getPlayers().size(); i++) {
            if (match.getPlayers().get(i).getId().equals(nextPlayer.getId())) {
                nextFullListIndex = i;
                break;
            }
        }
        
        if (nextFullListIndex != -1) {
            match.setCurrentTurnPlayerIndex(nextFullListIndex);
            nextPlayer.setActionsRemaining(3);
            
            // If we wrapped around (nextActiveIndex == 0), it's a new round
            if (nextActiveIndex == 0 && activeListIndex > 0) {
                match.setArenaRound(match.getArenaRound() + 1);
            }
        }
        
        gameRepository.saveGame(match);
    }

    // End turn in arena
    public GameMatch endArenaTurn(String playerId) {
        GameMatch match = getGameState();
        if (match == null || !match.isArenaPhase()) return match;

        List<Player> activePlayers = match.getPlayers().stream()
                .filter(p -> !p.isEliminated())
                .collect(Collectors.toList());

        Player currentPlayer = activePlayers.stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (currentPlayer != null) {
            currentPlayer.setActionsRemaining(0);
        }

        int currentIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
        if (currentIndex < activePlayers.size() - 1) {
            match.setCurrentTurnPlayerIndex(currentIndex + 1);
            // Reset actions for next player
            Player nextPlayer = activePlayers.get(currentIndex + 1);
            nextPlayer.setActionsRemaining(3);
        } else {
            // Round complete, start new round or end arena phase
            match.setArenaRound(match.getArenaRound() + 1);
            match.setCurrentTurnPlayerIndex(0);
            // Reset actions for first player
            if (!activePlayers.isEmpty()) {
                activePlayers.get(0).setActionsRemaining(3);
            }
        }

        gameRepository.saveGame(match);
        return match;
    }

    // End arena phase and return to exploration
    public GameMatch endArenaPhase() {
        GameMatch match = getGameState();
        if (match == null || !match.isArenaPhase()) return match;

        // Recover 2 mana for all players after arena
        for (Player player : match.getPlayers()) {
            if (!player.isEliminated()) {
                player.setMana(player.getMana() + 2);
                // Clear active defenses at end of arena
                player.setActiveDefenses(new ArrayList<>());
                // Reset arena position
                player.setArenaPosition(null);
                player.setActionsRemaining(0);
            }
        }

        // Return to exploration phase
        match.setArenaPhase(false);
        match.setCurrentTurnPlayerIndex(0);

        // Distribute new glyphs for exploration phase
        distributeGlyphs();

        gameRepository.saveGame(match);
        return match;
    }

    public void resetGame() {
        gameRepository.resetGame();
    }

    // Use a potion from player's inventory
    public GameMatch usePotion(String playerId, String potionColorStr) {
        GameMatch match = getGameState();
        if (match == null) return null;

        Player player = match.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (player == null) return match;

        // Check if in arena phase - actions are limited
        if (match.isArenaPhase()) {
            // Get list of active players
            List<Player> activePlayers = match.getPlayers().stream()
                    .filter(p -> !p.isEliminated())
                    .collect(Collectors.toList());

            // Check if it's the player's turn
            int currentTurnIndex = match.getCurrentTurnPlayerIndex() != null ? match.getCurrentTurnPlayerIndex() : 0;
            if (currentTurnIndex >= match.getPlayers().size()) {
                currentTurnIndex = 0;
            }
            Player currentTurnPlayer = match.getPlayers().get(currentTurnIndex);
            
            // If current turn player is eliminated, find first active player
            if (currentTurnPlayer.isEliminated()) {
                if (!activePlayers.isEmpty()) {
                    currentTurnPlayer = activePlayers.get(0);
                    // Update index to first active player
                    for (int i = 0; i < match.getPlayers().size(); i++) {
                        if (match.getPlayers().get(i).getId().equals(currentTurnPlayer.getId())) {
                            match.setCurrentTurnPlayerIndex(i);
                            break;
                        }
                    }
                }
            }
            
            if (!player.getId().equals(currentTurnPlayer.getId())) {
                return match; // Not player's turn
            }

            // Check if player has actions remaining
            if (player.getActionsRemaining() == null || player.getActionsRemaining() <= 0) {
                return match; // No actions remaining
            }
        }

        try {
            GameEnums.PotionColor potionColor = GameEnums.PotionColor.valueOf(potionColorStr.toUpperCase());
            
            // Check if player has this potion
            if (!player.getPotions().contains(potionColor)) {
                return match; // Player doesn't have this potion
            }

            // Get the effect for this potion color from the dictionary
            GameEnums.PotionEffect effect = match.getPotionDictionary().get(potionColor);
            if (effect == null) {
                return match;
            }

            // Apply the effect
            switch (effect) {
                case CURA:
                    player.setLifeEnergy(Math.min(3, player.getLifeEnergy() + 1)); // Max life is 3
                    break;
                case MANA:
                    player.setMana(player.getMana() + 3); // Recupera 3 pontos de Mana (sem teto na especificação)
                    break;
                case ESCUDO:
                    player.setMagicShield(player.getMagicShield() + 3); // Aumenta 3 pontos de Escudo Mágico
                    break;
                case DEBILITANTE:
                    // Remove 3 pontos de Mana do alvo (por enquanto só em si mesmo)
                    // Pode ser estendido para ter alvo no futuro
                    player.setMana(Math.max(0, player.getMana() - 3));
                    break;
                case CORRUPCAO:
                    // Remove 1 ponto de Energia Vital do alvo (por enquanto só em si mesmo)
                    player.setLifeEnergy(Math.max(0, player.getLifeEnergy() - 1));
                    if (player.getLifeEnergy() <= 0) {
                        player.setEliminated(true);
                    }
                    break;
                case ANTI_MAGIA:
                    // Remove 3 pontos de Escudo Mágico do alvo (por enquanto só em si mesmo)
                    player.setMagicShield(Math.max(0, player.getMagicShield() - 3));
                    break;
            }

            // Remove potion from inventory
            player.getPotions().remove(potionColor);

            // Decrease actions remaining if in arena phase and check if turn should end
            if (match.isArenaPhase() && player.getActionsRemaining() != null && player.getActionsRemaining() > 0) {
                player.setActionsRemaining(player.getActionsRemaining() - 1);
                
                // If actions are 0, automatically advance to next player's turn
                if (player.getActionsRemaining() == 0) {
                    advanceTurn(match);
                }
            }

            gameRepository.saveGame(match);
            return match;

        } catch (IllegalArgumentException e) {
            return match; // Invalid potion color
        }
    }

    // Create a potion by combining two power words
    public SpellResult createPotion(String playerId, String word1Str, String word2Str) {
        GameMatch match = getGameState();
        if (match == null) return new SpellResult("Error", "N/A", 0, "game not started", false);

        Player player = match.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (player == null) {
            return new SpellResult("Error", "N/A", 0, "player not found", false);
        }

        try {
            // Convert strings to enums
            GameEnums.PowerWord word1 = GameEnums.PowerWord.valueOf(word1Str.toUpperCase());
            GameEnums.PowerWord word2 = GameEnums.PowerWord.valueOf(word2Str.toUpperCase());

            // Translate words using the match dictionary
            GameEnums.Meaning m1 = match.getWordDictionary().get(word1);
            GameEnums.Meaning m2 = match.getWordDictionary().get(word2);

            // Calculate potion result based on meaning combination
            SpellResult result = resolvePotionCreation(m1, m2);

            // Check if player has enough mana (creating potions costs 1 mana)
            if (player.getMana() < 1) {
                return new SpellResult("Falha", "Nenhum", 0, "mana insuficiente para criar poção", false);
            }

            // Deduct mana
            player.setMana(player.getMana() - 1);

            if (result.isSuccess()) {
                // Add the created potion to player's inventory
                GameEnums.PotionColor potionColor = getPotionColorFromDescription(result.getDescription());
                if (potionColor != null) {
                    player.getPotions().add(potionColor);
                }
            }

            gameRepository.saveGame(match);
            return result;

        } catch (IllegalArgumentException e) {
            return new SpellResult("Palavra Inválida", "Erro", 0, "uma das palavras não existe", false);
        }
    }

    // Resolve potion creation based on meaning combination
    private SpellResult resolvePotionCreation(GameEnums.Meaning m1, GameEnums.Meaning m2) {
        // Sort to ensure consistent comparison
        List<String> sorted = Arrays.asList(m1.name(), m2.name());
        Collections.sort(sorted);
        String key = sorted.get(0) + "_" + sorted.get(1);

        switch (key) {
            // Simple combinations for basic potions
            case "AETHER_FORJA":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção VERMELHA criada", true);
            case "NEXUS_RUNA":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção AZUL criada", true);
            case "RUNA_SOMBRA":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção VERDE criada", true);
            case "FORJA_VAZIO":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção ROXA criada", true);
            case "AETHER_RUNA":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção ROSA criada", true);
            case "SOMBRA_VAZIO":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção BRANCA criada", true);
            case "AETHER_NEXUS":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção VERMELHA criada", true);
            case "FORJA_NEXUS":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção AZUL criada", true);
            case "AETHER_SOMBRA":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção VERDE criada", true);
            case "NEXUS_VAZIO":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção ROXA criada", true);
            case "AETHER_VAZIO":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção BRANCA criada", true);
            case "RUNA_VAZIO":
                return new SpellResult("Poção Criada", "Poção", 1, "Poção ROSA criada", true);
            default:
                return new SpellResult("Falha na Criação", "Nenhum", 0, "Esta combinação não cria uma poção válida", false);
        }
    }

    // Helper to extract potion color from description
    private GameEnums.PotionColor getPotionColorFromDescription(String description) {
        if (description.contains("VERMELHA")) return GameEnums.PotionColor.VERMELHA;
        if (description.contains("AZUL")) return GameEnums.PotionColor.AZUL;
        if (description.contains("VERDE")) return GameEnums.PotionColor.VERDE;
        if (description.contains("ROXA")) return GameEnums.PotionColor.ROXA;
        if (description.contains("ROSA")) return GameEnums.PotionColor.ROSA;
        if (description.contains("BRANCA")) return GameEnums.PotionColor.BRANCA;
        return null;
    }

    // Give a specific potion to a player
    public GameMatch givePotion(String playerId, String potionColorStr) {
        GameMatch match = getGameState();
        if (match == null) return null;

        Player player = match.getPlayers().stream()
                .filter(p -> p.getId().equals(playerId))
                .findFirst()
                .orElse(null);

        if (player == null) return match;

        try {
            GameEnums.PotionColor potionColor = GameEnums.PotionColor.valueOf(potionColorStr.toUpperCase());
            player.getPotions().add(potionColor);
            gameRepository.saveGame(match);
        } catch (IllegalArgumentException e) {
            // Invalid potion color, return match unchanged
        }

        return match;
    }
}