package com.ultma.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DuelResult {
    private boolean success;
    private String attackerId;
    private String targetId;
    private String spellName;
    private int damageDealt;
    private int targetShieldBefore;
    private int targetShieldAfter;
    private int targetLifeBefore;
    private int targetLifeAfter;
    private boolean wasBlocked;
    private String blockingSpell;
}
