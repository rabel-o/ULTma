package com.ultma.backend.controller;

import com.ultma.backend.model.GameMatch;
import com.ultma.backend.service.GameService;
import org.springframework.web.bind.annotation.*;

import com.ultma.backend.model.SpellResult;

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

}
