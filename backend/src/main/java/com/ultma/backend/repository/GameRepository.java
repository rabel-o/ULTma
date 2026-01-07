package com.ultma.backend.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ultma.backend.model.GameMatch;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;

@Repository
public class GameRepository {

    private final String FILE_PATH = "gamestate.json";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void saveGame(GameMatch gameMatch) {
        try {
            objectMapper.writeValue(new File(FILE_PATH), gameMatch);
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Erro ao salvar o jogo");
        }
    }

    public GameMatch loadGame() {
        File file = new File(FILE_PATH);
        if (!file.exists()) {
            return null;
        }
        try {
            return objectMapper.readValue(file, GameMatch.class);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}