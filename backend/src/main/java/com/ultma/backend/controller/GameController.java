package com.ultma.backend.controller;

import com.ultma.backend.model.GameMatch;
import com.ultma.backend.service.GameService;
import org.springframework.web.bind.annotation.*;

import com.ultma.backend.model.SpellResult;
import com.ultma.backend.model.DuelResult;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/new")
    public GameMatch startNewGame() {
        return gameService.createNewGame();
    }

    @PostMapping("/join")
    public GameMatch joinGame(@RequestParam String playerName) {
        return gameService.addPlayer(playerName);
    }

    @GetMapping
    public GameMatch getGame() {
        return gameService.getGameState();
    }

    @PostMapping("/cast")
    public SpellResult castMagic(
            @RequestParam String playerId, 
            @RequestParam String w1, 
            @RequestParam String w2) {
        return gameService.castSpell(playerId, w1, w2);
    }

    @PostMapping("/meditate")
    public GameMatch meditate(@RequestParam String playerId) {
        return gameService.meditate(playerId);
    }

    @PostMapping("/attack")
    public DuelResult attackPlayer(
            @RequestParam String attackerId,
            @RequestParam String targetId,
            @RequestParam String spellName) {
        return gameService.attackPlayer(attackerId, targetId, spellName);
    }

    @PostMapping("/activate-defense")
    public SpellResult activateDefense(
            @RequestParam String playerId,
            @RequestParam String spellName) {
        return gameService.activateDefense(playerId, spellName);
    }

    @PostMapping("/start-arena")
    public GameMatch startArenaPhase() {
        return gameService.startArenaPhase();
    }

    @PostMapping("/end-turn")
    public GameMatch endArenaTurn(@RequestParam String playerId) {
        return gameService.endArenaTurn(playerId);
    }

    @DeleteMapping("/reset")
    public void resetGame() {
        gameService.resetGame();
    }

    @PostMapping("/use-potion")
    public GameMatch usePotion(
            @RequestParam String playerId,
            @RequestParam String potionColor) {
        return gameService.usePotion(playerId, potionColor);
    }

    @PostMapping("/give-potion")
    public GameMatch givePotion(
            @RequestParam String playerId,
            @RequestParam String potionColor) {
        return gameService.givePotion(playerId, potionColor);
    }

    @PostMapping("/distribute-glyphs")
    public GameMatch distributeGlyphs() {
        return gameService.distributeGlyphs();
    }

    @PostMapping("/use-glyph")
    public GameMatch useGlyph(
            @RequestParam String playerId,
            @RequestParam String glifo) {
        return gameService.useGlyph(playerId, glifo);
    }

    @PostMapping("/end-arena")
    public GameMatch endArenaPhase() {
        return gameService.endArenaPhase();
    }

}
