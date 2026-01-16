import { useState, useEffect } from 'react';
import { 
  CssBaseline, Container, Typography, Box, Paper, Button, 
  TextField, Alert, Chip, Card, CardContent, Tabs, Tab,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogActions, List, ListItem, ListItemButton, ListItemText,
  Divider, Grid,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; 
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import FavoriteIcon from '@mui/icons-material/Favorite'; 
import ShieldIcon from '@mui/icons-material/Shield'; 
import BoltIcon from '@mui/icons-material/Bolt'; 
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import { GameService } from './api';
import { GameMatch, SpellResult, Player, DuelResult } from './types';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#9c27b0' }, 
    secondary: { main: '#ffd700' }, 
    error: { main: '#ff1744' },
    info: { main: '#2196f3' },
    background: { default: '#121212', paper: '#1e1e1e' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 'bold', letterSpacing: '2px' }
  },
});

// Add CSS animation keyframes
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseAnimation;
  document.head.appendChild(style);
}

function App() {
  const [game, setGame] = useState<GameMatch | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [spellResult, setSpellResult] = useState<SpellResult | null>(null);
  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [error, setError] = useState('');
  
  // Spell selection dialog
  const [attackDialogOpen, setAttackDialogOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Player | null>(null);
  
  // Track previous resource values for visual feedback
  const [resourceChange, setResourceChange] = useState<{lifeEnergy: number; magicShield: number; mana: number} | null>(null);

  // helper to update local player state from game state
  const refreshPlayer = (gameData: GameMatch, playerId?: string) => {
    if (!gameData || !gameData.players) return;
    
    const targetId = playerId || currentPlayer?.id;
    
    // Always update game state first (this updates all players in the list)
    setGame({ ...gameData });
    
    // Then update current player if we have a target
    if (targetId && gameData.players) {
      const me = gameData.players.find(p => p.id === targetId);
      if (me) {
        // Track resource changes only if it's the same player
        if (currentPlayer && currentPlayer.id === me.id) {
          const lifeDiff = me.lifeEnergy - currentPlayer.lifeEnergy;
          const shieldDiff = me.magicShield - currentPlayer.magicShield;
          const manaDiff = me.mana - currentPlayer.mana;
          
          if (lifeDiff !== 0 || shieldDiff !== 0 || manaDiff !== 0) {
            setResourceChange({
              lifeEnergy: lifeDiff,
              magicShield: shieldDiff,
              mana: manaDiff,
            });
            setTimeout(() => setResourceChange(null), 2000);
          }
        }
        // Update current player with fresh data from server
        setCurrentPlayer(me);
      }
    } else if (gameData.players && currentPlayer) {
      // If no target but we have current player, try to refresh it
      const me = gameData.players.find(p => p.id === currentPlayer.id);
      if (me) {
        const lifeDiff = me.lifeEnergy - currentPlayer.lifeEnergy;
        const shieldDiff = me.magicShield - currentPlayer.magicShield;
        const manaDiff = me.mana - currentPlayer.mana;
        
        if (lifeDiff !== 0 || shieldDiff !== 0 || manaDiff !== 0) {
          setResourceChange({
            lifeEnergy: lifeDiff,
            magicShield: shieldDiff,
            mana: manaDiff,
          });
          setTimeout(() => setResourceChange(null), 2000);
        }
        setCurrentPlayer(me);
      }
    }
  };

  const selectPlayer = (playerId: string) => {
    if (game) {
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
        setWord1('');
        setWord2('');
        setSpellResult(null);
        setDuelResult(null);
      }
    }
  };

  const handleStartGame = async () => {
    try {
      const newGame = await GameService.startNewGame();
      setGame(newGame);
      setCurrentPlayer(null);
      setSpellResult(null);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar ao backend.");
    }
  };

  const handleAddPlayer = async () => {
    if (!playerName.trim()) {
      setError("Digite um nome para o jogador.");
      return;
    }
    if (game && game.players.length >= 4) {
      setError("Máximo de 4 jogadores atingido.");
      return;
    }
    try {
      setError('');
      const updatedGame = await GameService.joinGame(playerName);
      if (!updatedGame) {
        setError("Erro ao adicionar jogador.");
        return;
      }
      const newPlayerId = updatedGame.players[updatedGame.players.length - 1].id;
      refreshPlayer(updatedGame, newPlayerId);
      setPlayerName('');
      setError('');
    } catch (err) {
      console.error(err);
      setError("Erro ao adicionar jogador.");
    }
  };

  const handleCast = async () => {
    if (!word1 || !word2 || !currentPlayer) return;
    try {
      setError('');
      const result = await GameService.castSpell(currentPlayer.id, word1, word2);
      setSpellResult(result);

      // refresh data immediately and after a delay to ensure backend saved
      try {
        const updatedGame = await GameService.getGame();
        if (updatedGame) {
          refreshPlayer(updatedGame, currentPlayer.id);
        }
      } catch (err) {
        console.error('Error refreshing after cast:', err);
      }
      
      // Also refresh after delay as backup
      setTimeout(async () => {
        try {
          const updatedGame = await GameService.getGame();
          if (updatedGame) {
            refreshPlayer(updatedGame, currentPlayer.id);
          }
        } catch (err) {
          console.error('Error refreshing after cast (delayed):', err);
        }
      }, 500);

    } catch (err) {
      console.error(err);
      setError("Erro ao conjurar magia.");
    }
  };

  const handleMeditate = async () => {
    if (!currentPlayer) return;
    try {
      setError('');
      const updatedGame = await GameService.meditate(currentPlayer.id);
      if (updatedGame) {
        refreshPlayer(updatedGame, currentPlayer.id);
      } else {
        // If no game returned, refresh from server
        setTimeout(async () => {
          try {
            const refreshedGame = await GameService.getGame();
            if (refreshedGame) {
              refreshPlayer(refreshedGame, currentPlayer.id);
            }
          } catch (err) {
            console.error('Error refreshing after meditate:', err);
          }
        }, 300);
      }
      setSpellResult(null);
      setDuelResult(null);
    } catch (err) {
      console.error(err);
      setError("Erro ao meditar.");
    }
  };

  const openAttackDialog = (target: Player) => {
    console.log('Opening attack dialog for target:', target);
    setSelectedTarget(target);
    setAttackDialogOpen(true);
  };

  const closeAttackDialog = () => {
    setAttackDialogOpen(false);
    setSelectedTarget(null);
  };

  const handleAttack = async (targetId: string, spellName: string) => {
    if (!currentPlayer) {
      setError("Nenhum jogador selecionado.");
      return;
    }
    
    console.log('Attack called:', { attackerId: currentPlayer.id, targetId, spellName });
    
    try {
      setError('');
      setDuelResult(null);
      closeAttackDialog();
      
      const result = await GameService.attackPlayer(currentPlayer.id, targetId, spellName);
      console.log('Attack result:', result);
      setDuelResult(result);
      
      if (!result.success) {
        setError(result.blockingSpell || "Ataque falhou.");
      }
      
      // Refresh game state immediately and after delay
      try {
        const updatedGame = await GameService.getGame();
        console.log('Game state after attack:', updatedGame);
        if (updatedGame) {
          refreshPlayer(updatedGame, currentPlayer.id);
        }
      } catch (err) {
        console.error('Error refreshing after attack:', err);
      }
      
      setTimeout(async () => {
        try {
          const updatedGame = await GameService.getGame();
          if (updatedGame) {
            refreshPlayer(updatedGame, currentPlayer.id);
          }
        } catch (err) {
          console.error('Error refreshing after attack (delayed):', err);
        }
      }, 500);
    } catch (err: any) {
      console.error('Attack error:', err);
      const errorMessage = err.response?.data?.message || err.message || "Erro ao atacar.";
      setError(errorMessage);
      closeAttackDialog();
    }
  };

  const handleActivateDefense = async (spellName: string) => {
    if (!currentPlayer) return;
    try {
      setError('');
      const result = await GameService.activateDefense(currentPlayer.id, spellName);
      setSpellResult(result);
      
      // Refresh game state - use setTimeout to ensure backend saved
      setTimeout(async () => {
        try {
          const updatedGame = await GameService.getGame();
          if (updatedGame) {
            refreshPlayer(updatedGame, currentPlayer.id);
          }
        } catch (err) {
          console.error('Error refreshing after defense:', err);
        }
      }, 300);
    } catch (err) {
      console.error(err);
      setError("Erro ao ativar defesa.");
    }
  };

  const handleStartArena = async () => {
    try {
      setError('');
      const updatedGame = await GameService.startArenaPhase();
      if (updatedGame) {
        refreshPlayer(updatedGame);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao iniciar arena.");
    }
  };

  const handleEndTurn = async () => {
    if (!currentPlayer) return;
    try {
      setError('');
      const updatedGame = await GameService.endArenaTurn(currentPlayer.id);
      if (updatedGame) {
        refreshPlayer(updatedGame);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao terminar turno.");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', border: '1px solid #9c27b0' }}>
            <Typography variant="h3" color="primary">UltMA</Typography>
            <Typography variant="subtitle1" color="text.secondary">Digital Grimoire - 4 Jogadores</Typography>
          </Paper>

          {!game && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom align="center">
                Bem-vindo ao UltMA!
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Crie uma nova partida para começar. Você pode adicionar até 4 jogadores na mesma tela.
              </Typography>
              <Button variant="contained" size="large" startIcon={<MenuBookIcon />} onClick={handleStartGame} fullWidth>
                Criar Nova Partida
              </Button>
            </Paper>
          )}

          {game && game.players.length < 4 && (
            <Paper elevation={3} sx={{ p: 3, border: '1px solid #9c27b0' }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Adicionar Jogador {game.players.length + 1}/4
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField 
                  label="Nome do Mago" 
                  fullWidth 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddPlayer();
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleAddPlayer} 
                  startIcon={<PersonAddIcon />}
                  disabled={!playerName.trim()}
                >
                  Adicionar
                </Button>
              </Box>
            </Paper>
          )}

          {game && game.players.length >= 4 && !currentPlayer && (
            <Paper elevation={3} sx={{ p: 3, bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50' }}>
              <Typography variant="h6" color="success.main" gutterBottom align="center">
                Todos os 4 jogadores foram adicionados!
              </Typography>
              <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                Selecione um jogador abaixo para começar a jogar.
              </Typography>
            </Paper>
          )}

          {/* Player Selection Grid */}
          {game && game.players.length > 0 && (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Jogadores ({game.players.length}/4)
              </Typography>
              <Grid container spacing={2}>
                {game.players.map((player) => (
                  <Grid item xs={12} sm={6} key={player.id}>
                    <Card 
                      sx={{ 
                        border: currentPlayer?.id === player.id ? '2px solid #ffd700' : '1px solid #9c27b0',
                        bgcolor: currentPlayer?.id === player.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.1)' }
                      }}
                      onClick={() => selectPlayer(player.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" color={currentPlayer?.id === player.id ? 'secondary' : 'primary'}>
                            {player.name}
                            {currentPlayer?.id === player.id && (
                              <Chip label="Ativo" color="secondary" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          {currentPlayer?.id !== player.id && (
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); selectPlayer(player.id); }}>
                              <SwapHorizIcon />
                            </IconButton>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-around', mt: 2 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <FavoriteIcon color="error" />
                            <Typography variant="body2">{player.lifeEnergy}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <ShieldIcon color="info" />
                            <Typography variant="body2">{player.magicShield}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <BoltIcon sx={{ color: '#b2ebf2' }} />
                            <Typography variant="body2">{player.mana}</Typography>
                          </Box>
                        </Box>
                        {player.isEliminated && (
                          <Chip label="Eliminado" color="error" size="small" sx={{ mt: 1 }} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {currentPlayer && (
            <>
              {/* Current Player Status */}
              <Card sx={{ border: '2px solid #ffd700' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="secondary">{currentPlayer.name}</Typography>
                    <Button 
                      variant="outlined" 
                      color="info" 
                      size="small" 
                      startIcon={<SelfImprovementIcon />}
                      onClick={handleMeditate}
                    >
                      Meditar (+2 Mana)
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ 
                      textAlign: 'center',
                      animation: resourceChange?.lifeEnergy && resourceChange.lifeEnergy !== 0 ? 'pulse 0.5s' : 'none',
                    }}>
                      <FavoriteIcon color="error" />
                      <Typography variant="h6">{currentPlayer.lifeEnergy}</Typography>
                      {resourceChange?.lifeEnergy && resourceChange.lifeEnergy !== 0 && (
                        <Typography variant="caption" sx={{ 
                          color: resourceChange.lifeEnergy < 0 ? '#ff1744' : '#4caf50',
                          display: 'block'
                        }}>
                          {resourceChange.lifeEnergy > 0 ? '+' : ''}{resourceChange.lifeEnergy}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ 
                      textAlign: 'center',
                      animation: resourceChange?.magicShield && resourceChange.magicShield !== 0 ? 'pulse 0.5s' : 'none',
                    }}>
                      <ShieldIcon color="info" />
                      <Typography variant="h6">{currentPlayer.magicShield}</Typography>
                      {resourceChange?.magicShield && resourceChange.magicShield !== 0 && (
                        <Typography variant="caption" sx={{ 
                          color: resourceChange.magicShield < 0 ? '#ff1744' : '#4caf50',
                          display: 'block'
                        }}>
                          {resourceChange.magicShield > 0 ? '+' : ''}{resourceChange.magicShield}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ 
                      textAlign: 'center',
                      animation: resourceChange?.mana && resourceChange.mana !== 0 ? 'pulse 0.5s' : 'none',
                    }}>
                      <BoltIcon sx={{ color: '#b2ebf2' }} />
                      <Typography variant="h6">{currentPlayer.mana}</Typography>
                      {resourceChange?.mana && resourceChange.mana !== 0 && (
                        <Typography variant="caption" sx={{ 
                          color: resourceChange.mana < 0 ? '#ff1744' : '#4caf50',
                          display: 'block'
                        }}>
                          {resourceChange.mana > 0 ? '+' : ''}{resourceChange.mana}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Known Spells */}
              {currentPlayer.knownSpells.length > 0 && (
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Magias Conhecidas:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {currentPlayer.knownSpells.map((spell, index) => (
                      <Chip key={index} label={spell} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Active Defenses */}
              {currentPlayer.activeDefenses && currentPlayer.activeDefenses.length > 0 && (
                <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3' }}>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    Defesas Ativas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {currentPlayer.activeDefenses.map((defense, idx) => (
                      <Chip key={idx} label={defense} color="info" size="small" />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Activate Defense Spells */}
              {currentPlayer.knownSpells.some(s => 
                ['Barreira de Fogo', 'Muro de Água', 'Armadura de Pedra', 'Levitação', 'Proteção Arcana', 'Escudo de Vácuo'].includes(s)
              ) && (
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Ativar Defesas</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {currentPlayer.knownSpells
                      .filter(s => ['Barreira de Fogo', 'Muro de Água', 'Armadura de Pedra', 'Levitação', 'Proteção Arcana', 'Escudo de Vácuo'].includes(s))
                      .map((spell) => (
                        <Button
                          key={spell}
                          variant="outlined"
                          size="small"
                          onClick={() => handleActivateDefense(spell)}
                          disabled={currentPlayer.activeDefenses?.includes(spell)}
                        >
                          {spell}
                        </Button>
                      ))}
                  </Box>
                </Paper>
              )}

              {/* Attack Other Players */}
              {game && game.players.filter(p => p.id !== currentPlayer.id && !p.isEliminated).length > 0 && (
                <Paper elevation={3} sx={{ p: 3, border: '1px solid #f44336' }}>
                  <Typography variant="h6" color="error" gutterBottom>Atacar Outros Jogadores</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {game.players
                      .filter(p => p.id !== currentPlayer.id && !p.isEliminated)
                      .map((player) => (
                        <Box 
                          key={player.id} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            borderRadius: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body1" fontWeight="bold">{player.name}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip size="small" icon={<FavoriteIcon />} label={`Vida: ${player.lifeEnergy}`} color="error" variant="outlined" />
                              <Chip size="small" icon={<ShieldIcon />} label={`Escudo: ${player.magicShield}`} color="info" variant="outlined" />
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<SportsMmaIcon />}
                            onClick={() => openAttackDialog(player)}
                          >
                            Atacar
                          </Button>
                        </Box>
                      ))}
                  </Box>
                </Paper>
              )}

              {/* Casting Circle */}
              <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" color="secondary">Círculo de Conjuração</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Palavra 1" fullWidth value={word1} onChange={(e) => setWord1(e.target.value.toUpperCase())} sx={{ flex: 1 }} />
                  <TextField label="Palavra 2" fullWidth value={word2} onChange={(e) => setWord2(e.target.value.toUpperCase())} sx={{ flex: 1 }} />
                </Box>
                <Button variant="contained" color="secondary" size="large" startIcon={<AutoFixHighIcon />} onClick={handleCast}>
                  Combinar
                </Button>
              </Paper>

              {/* Arena Controls */}
              {!game?.isArenaPhase && game && game.players.length >= 2 && (
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Button variant="contained" color="error" onClick={handleStartArena} fullWidth startIcon={<SportsMmaIcon />}>
                    Iniciar Fase de Arena
                  </Button>
                </Paper>
              )}

              {game?.isArenaPhase && (
                <Paper elevation={3} sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336' }}>
                  <Typography variant="h6" color="error" gutterBottom>
                    Fase de Arena - Rodada {game.arenaRound || 1}
                  </Typography>
                  {currentPlayer.actionsRemaining !== undefined && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Ações restantes: <strong>{currentPlayer.actionsRemaining}/3</strong>
                    </Typography>
                  )}
                  {currentPlayer.actionsRemaining === 0 && (
                    <Button variant="contained" color="secondary" onClick={handleEndTurn} fullWidth>
                      Finalizar Turno
                    </Button>
                  )}
                </Paper>
              )}
            </>
          )}

          {spellResult && (
            <Paper elevation={10} sx={{ p: 3, border: '2px solid', borderColor: spellResult.success ? '#4caf50' : '#f44336', textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>{spellResult.spellName}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Chip label={spellResult.type} color="primary" />
                <Chip label={`Custo: ${spellResult.manaCost}`} variant="outlined" />
              </Box>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{spellResult.description}</Typography>
            </Paper>
          )}

          {duelResult && (
            <Paper elevation={10} sx={{ p: 3, border: '2px solid', borderColor: duelResult.success ? '#ff1744' : '#f44336', textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom color={duelResult.wasBlocked ? 'warning' : 'error'}>
                {duelResult.wasBlocked ? 'Ataque Bloqueado!' : 'Ataque Realizado!'}
              </Typography>
              <Typography variant="h6" gutterBottom>{duelResult.spellName}</Typography>
              {duelResult.wasBlocked && duelResult.blockingSpell && (
                <Typography variant="body2" color="warning.main" gutterBottom>
                  Bloqueado por: {duelResult.blockingSpell}
                </Typography>
              )}
              {!duelResult.wasBlocked && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Dano causado: <strong>{duelResult.damageDealt}</strong>
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {/* Spell Selection Dialog for Attack */}
          <Dialog open={attackDialogOpen} onClose={closeAttackDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Selecionar Magia de Ataque</DialogTitle>
            <DialogContent>
              {selectedTarget && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Atacando: <strong>{selectedTarget.name}</strong>
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              {currentPlayer && currentPlayer.knownSpells.filter(s => 
                ['Bola de Fogo', 'Lança de Gelo', 'Vento Cortante', 'Fúria da Terra', 'Disparo Arcano', 'Maldição do Vazio'].includes(s)
              ).length > 0 ? (
                <List>
                  {currentPlayer.knownSpells
                    .filter(s => ['Bola de Fogo', 'Lança de Gelo', 'Vento Cortante', 'Fúria da Terra', 'Disparo Arcano', 'Maldição do Vazio'].includes(s))
                    .map((spell) => (
                      <ListItem key={spell} disablePadding>
                        <ListItemButton onClick={() => {
                          console.log('Spell selected in dialog:', spell, 'Target:', selectedTarget);
                          if (selectedTarget) {
                            handleAttack(selectedTarget.id, spell);
                          } else {
                            setError("Nenhum alvo selecionado.");
                          }
                        }}>
                          <ListItemText 
                            primary={spell}
                            secondary={
                              spell === 'Disparo Arcano' ? 'Custo: 1 Mana' :
                              spell === 'Maldição do Vazio' ? 'Custo: 2 Mana' :
                              'Custo: 2 Mana'
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Você não conhece magias de ataque. Combine palavras de poder para descobrir novas magias!
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeAttackDialog}>Cancelar</Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
