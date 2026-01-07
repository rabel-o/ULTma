package com.ultma.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SpellResult {
    private String spellName;
    private String type; // attack, defense, utility
    private int manaCost;
    private String description;
    private boolean success; // if the combination is valid
}