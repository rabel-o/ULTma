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
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { GameService } from './api';
import { GameMatch, SpellResult, Player, DuelResult } from './types';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#9c27b0' }, 
    secondary: { main: '#ffd700' }, 
    error: { main: '#ff1744' },
    info: { main: '#2196f3' },
    background: { 
      default: 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #2d1b3d 100%)', 
      paper: 'rgba(30, 30, 46, 0.95)' 
    },
  },
  typography: {
    fontFamily: '"Cinzel", "Roboto", "Helvetica", "Arial", serif',
    h3: { fontWeight: 'bold', letterSpacing: '3px', textShadow: '0 0 10px rgba(156, 39, 176, 0.8)' },
    h4: { fontWeight: 'bold', letterSpacing: '2px' },
    h5: { fontWeight: '600', letterSpacing: '1px' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(45, 27, 61, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }
      }
    }
  }
});

// Add CSS animations and styles
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5), inset 0 0 10px rgba(255, 215, 0, 0.2); }
    50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.3); }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .player-card {
    background: linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(45, 27, 61, 0.95) 100%);
    border: 2px solid;
    border-image: linear-gradient(135deg, #9c27b0, #ffd700) 1;
    border-radius: 12px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }
  
  .player-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.2), transparent);
    animation: shimmer 3s infinite;
    pointer-events: none;
    z-index: 0;
  }
  
  .player-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(156, 39, 176, 0.5);
  }
  
  .player-card.active {
    border-image: linear-gradient(135deg, #ffd700, #ff9800) 1;
    animation: glow 2s infinite;
  }
  
  .player-card > * {
    position: relative;
    z-index: 1;
  }
  
  .spell-chip {
    background: linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(156, 39, 176, 0.1));
    border: 1px solid rgba(156, 39, 176, 0.5);
    backdrop-filter: blur(5px);
    transition: all 0.2s ease;
  }
  
  .spell-chip:hover {
    background: linear-gradient(135deg, rgba(156, 39, 176, 0.5), rgba(156, 39, 176, 0.3));
    transform: scale(1.05);
  }
  
  .stat-icon {
    filter: drop-shadow(0 0 5px currentColor);
  }
  
  .magic-background {
    background: 
      radial-gradient(circle at 20% 50%, rgba(156, 39, 176, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #0a0e27 0%, #1a1a3e 50%, #2d1b3d 100%);
    min-height: 100vh;
  }
  
  .arena-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid #2196f3;
    background: radial-gradient(circle, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.05) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 0 20px rgba(33, 150, 243, 0.5);
    animation: pulse 2s infinite;
  }
  
  .arena-connection {
    height: 3px;
    background: linear-gradient(90deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.8), rgba(33, 150, 243, 0.3));
    position: absolute;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = customStyles;
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
  
  // Potion selection dialog
  const [potionDialogOpen, setPotionDialogOpen] = useState(false);
  
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

  // Load game state on component mount
  useEffect(() => {
    const loadGameState = async () => {
      try {
        const gameState = await GameService.getGame();
        if (gameState && gameState.players && gameState.players.length > 0) {
          setGame(gameState);
          // Select the first player if available
          if (gameState.players.length > 0) {
            setCurrentPlayer(gameState.players[0]);
          }
        }
      } catch (err) {
        console.error('Error loading game state:', err);
        // Silently fail if there's no game state
      }
    };
    
    loadGameState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

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

  const handleResetGame = async () => {
    if (window.confirm('Tem certeza que deseja sair e resetar a partida? Todos os dados serão perdidos.')) {
      try {
        await GameService.resetGame();
        setGame(null);
        setCurrentPlayer(null);
        setSpellResult(null);
        setDuelResult(null);
        setResourceChange(null);
        setError('');
        setPlayerName('');
        setWord1('');
        setWord2('');
      } catch (err) {
        console.error(err);
        setError("Erro ao resetar a partida.");
      }
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

  const handleEndArena = async () => {
    try {
      setError('');
      const updatedGame = await GameService.endArenaPhase();
      if (updatedGame) {
        refreshPlayer(updatedGame);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao finalizar arena.");
    }
  };

  const handleUsePotion = async (potionColor: string) => {
    if (!currentPlayer) return;
    try {
      setError('');
      const updatedGame = await GameService.usePotion(currentPlayer.id, potionColor);
      if (updatedGame) {
        refreshPlayer(updatedGame, currentPlayer.id);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao usar poção.");
    }
  };

  const openPotionDialog = () => {
    setPotionDialogOpen(true);
  };

  const closePotionDialog = () => {
    setPotionDialogOpen(false);
  };

  const handleGivePotion = async (potionColor: string) => {
    if (!currentPlayer) return;
    try {
      setError('');
      const updatedGame = await GameService.givePotion(currentPlayer.id, potionColor);
      if (updatedGame) {
        refreshPlayer(updatedGame, currentPlayer.id);
      }
      closePotionDialog();
    } catch (err) {
      console.error(err);
      setError("Erro ao obter poção.");
      closePotionDialog();
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box className="magic-background" sx={{ minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* Header */}
            <Paper elevation={10} sx={{ 
              p: 4, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%)',
              border: '2px solid',
              borderImage: 'linear-gradient(135deg, #9c27b0, #ffd700) 1',
              borderRadius: 2,
              boxShadow: '0 0 30px rgba(156, 39, 176, 0.5)',
              position: 'relative'
            }}>
              {game && (
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<ExitToAppIcon />}
                    onClick={handleResetGame}
                    sx={{
                      borderColor: 'rgba(244, 67, 54, 0.5)',
                      color: '#f44336',
                      '&:hover': {
                        borderColor: '#f44336',
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Sair da Partida
                  </Button>
                </Box>
              )}
              <Typography variant="h3" color="primary" sx={{ 
                fontSize: { xs: '2rem', md: '3rem' },
                mb: 1,
                textShadow: '0 0 20px rgba(156, 39, 176, 0.8), 0 0 40px rgba(156, 39, 176, 0.4)'
              }}>
                UltMA
              </Typography>
              <Typography variant="h6" color="secondary" sx={{ 
                fontStyle: 'italic',
                letterSpacing: '3px',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
              }}>
                Digital Grimoire
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Arena dos Magos - 4 Jogadores
              </Typography>
            </Paper>

          {!game && (
            <Paper elevation={10} sx={{ 
              p: 4, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(255, 215, 0, 0.1) 100%)',
              border: '2px solid rgba(156, 39, 176, 0.5)',
              borderRadius: 3
            }}>
              <MenuBookIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.8 }} />
              <Typography variant="h5" gutterBottom color="primary">
                Bem-vindo ao UltMA!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                Crie uma nova partida para começar. Você pode adicionar até 4 jogadores na mesma tela e vivenciar batalhas épicas entre magos poderosos.
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<MenuBookIcon />} 
                onClick={handleStartGame} 
                sx={{
                  px: 6,
                  py: 1.5,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                  boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%)',
                    boxShadow: '0 6px 20px rgba(156, 39, 176, 0.6)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Criar Nova Partida
              </Button>
            </Paper>
          )}

          {game && game.players.length < 4 && (
            <Paper elevation={8} sx={{ 
              p: 3, 
              border: '2px solid',
              borderImage: 'linear-gradient(135deg, #9c27b0, #ffd700) 1',
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonAddIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Adicionar Jogador {game.players.length + 1}/4
                </Typography>
              </Box>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(156, 39, 176, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(156, 39, 176, 0.8)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#9c27b0',
                        boxShadow: '0 0 10px rgba(156, 39, 176, 0.3)'
                      }
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleAddPlayer} 
                  startIcon={<PersonAddIcon />}
                  disabled={!playerName.trim()}
                  sx={{
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
                    color: '#000',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ffeb3b 0%, #ffd700 100%)',
                      boxShadow: '0 6px 20px rgba(255, 215, 0, 0.6)',
                      transform: 'translateY(-2px)'
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(255, 215, 0, 0.3)',
                      color: 'rgba(0, 0, 0, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
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

          {/* Player Selection Grid - Styled as Cards */}
          {game && game.players.length > 0 && (
            <Paper elevation={10} sx={{ 
              p: 4,
              background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(45, 27, 61, 0.95) 100%)',
              border: '2px solid rgba(156, 39, 176, 0.3)',
              borderRadius: 3
            }}>
              <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3, textAlign: 'center' }}>
                ⚔️ Magos na Arena ({game.players.length}/4)
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                {game.players.map((player, index) => (
                  <Grid item xs={12} sm={6} md={3} key={player.id}>
                    <Card 
                      className={`player-card ${currentPlayer?.id === player.id ? 'active' : ''}`}
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        background: currentPlayer?.id === player.id 
                          ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 152, 0, 0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(45, 27, 61, 0.95) 100%)',
                        boxSizing: 'border-box',
                        border: '2px solid',
                        borderImage: currentPlayer?.id === player.id 
                          ? 'linear-gradient(135deg, #ffd700, #ff9800) 1'
                          : 'linear-gradient(135deg, #9c27b0, #ffd700) 1',
                        borderRadius: '12px',
                      }}
                      onClick={() => selectPlayer(player.id)}
                    >
                      <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ 
                              color: currentPlayer?.id === player.id ? '#ffd700' : '#9c27b0',
                              fontWeight: 'bold',
                              mb: 0.5,
                              textShadow: currentPlayer?.id === player.id ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none'
                            }}>
                              {player.name}
                            </Typography>
                            {currentPlayer?.id === player.id && (
                              <Chip 
                                label="⚡ Ativo" 
                                size="small" 
                                sx={{ 
                                  bgcolor: '#ffd700',
                                  color: '#000',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  height: '20px',
                                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
                                }} 
                              />
                            )}
                          </Box>
                          {currentPlayer?.id !== player.id && (
                            <IconButton 
                              size="small" 
                              onClick={(e) => { e.stopPropagation(); selectPlayer(player.id); }}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { 
                                  bgcolor: 'rgba(156, 39, 176, 0.2)',
                                  transform: 'rotate(180deg)',
                                  transition: 'transform 0.3s ease'
                                }
                              }}
                            >
                              <SwapHorizIcon />
                            </IconButton>
                          )}
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          justifyContent: 'space-around', 
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid rgba(156, 39, 176, 0.3)'
                        }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <FavoriteIcon color="error" className="stat-icon" sx={{ fontSize: 28, mb: 0.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff1744' }}>
                              {player.lifeEnergy}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                              Vida
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <ShieldIcon color="info" className="stat-icon" sx={{ fontSize: 28, mb: 0.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                              {player.magicShield}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                              Escudo
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <BoltIcon className="stat-icon" sx={{ fontSize: 28, mb: 0.5, color: '#b2ebf2' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#b2ebf2' }}>
                              {player.mana}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                              Mana
                            </Typography>
                          </Box>
                        </Box>
                        
                        {player.isEliminated && (
                          <Chip 
                            label="💀 Eliminado" 
                            color="error" 
                            size="small" 
                            sx={{ 
                              mt: 2, 
                              fontWeight: 'bold',
                              boxShadow: '0 0 10px rgba(255, 23, 68, 0.5)'
                            }} 
                          />
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
              {/* Arena Visualization */}
              {game?.isArenaPhase && (
                <Paper elevation={10} sx={{ 
                  p: 4,
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(156, 39, 176, 0.1) 100%)',
                  border: '3px solid #2196f3',
                  borderRadius: 3,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Typography variant="h5" color="info.main" gutterBottom align="center" sx={{ mb: 3 }}>
                    ⚔️ FASE DE COMBATE - Rodada {game.arenaRound}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    minHeight: '300px',
                    position: 'relative',
                    my: 4
                  }}>
                    {game.players.length === 4 && (
                      <Box sx={{ 
                        position: 'relative', 
                        width: '400px', 
                        height: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {/* Square layout for 4 players */}
                        {game.players.map((player, idx) => {
                          const positions = [
                            { top: 0, left: 0 },
                            { top: 0, right: 0 },
                            { bottom: 0, left: 0 },
                            { bottom: 0, right: 0 }
                          ];
                          const pos = positions[idx];
                          return (
                            <Box key={player.id} sx={{
                              position: 'absolute',
                              ...pos,
                              width: '120px',
                              height: '120px'
                            }}>
                              <Box className="arena-circle" sx={{
                                borderColor: currentPlayer?.id === player.id ? '#ffd700' : '#2196f3',
                                boxShadow: currentPlayer?.id === player.id ? '0 0 30px rgba(255, 215, 0, 0.8)' : '0 0 20px rgba(33, 150, 243, 0.5)',
                                width: '100%',
                                height: '100%',
                                flexDirection: 'column',
                                gap: 0.5
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                                  {player.name}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#ff1744' }}>
                                  ❤️ {player.lifeEnergy}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                        {/* Connection lines */}
                        <Box sx={{
                          position: 'absolute',
                          width: '280px',
                          height: '3px',
                          background: 'linear-gradient(90deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.8), rgba(33, 150, 243, 0.3))',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 10px rgba(33, 150, 243, 0.5)'
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          width: '3px',
                          height: '280px',
                          background: 'linear-gradient(180deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.8), rgba(33, 150, 243, 0.3))',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 10px rgba(33, 150, 243, 0.5)'
                        }} />
                      </Box>
                    )}
                  </Box>
                  
                  {game.currentTurnPlayerIndex !== undefined && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body1" color="secondary">
                        Turno de: {game.players[game.currentTurnPlayerIndex]?.name || 'N/A'}
                      </Typography>
                      {currentPlayer?.id === game.players[game.currentTurnPlayerIndex]?.id && (
                        <Typography variant="body2" color="text.secondary">
                          Ações restantes: {currentPlayer.actionsRemaining || 0}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              )}

              {/* Current Player Status */}
              <Card sx={{ 
                border: '3px solid #ffd700',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 152, 0, 0.1) 100%)',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
                borderRadius: 2
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 }, px: { xs: 2, sm: 4 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold', textShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}>
                      🧙 {currentPlayer.name}
                    </Typography>
                    <Button 
                      variant="contained"
                      color="info" 
                      size="medium" 
                      startIcon={<SelfImprovementIcon />}
                      onClick={handleMeditate}
                      sx={{
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
                          boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Meditar (+2 Mana)
                    </Button>
                  </Box>
                  
                  <Grid container spacing={1.5} sx={{ mt: 1, justifyContent: 'center', maxWidth: '100%' }}>
                    <Grid item xs={12} sm={4} sx={{ maxWidth: { sm: '32%' }, flex: { sm: '0 0 32%' } }}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 4,
                        minHeight: 200,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        background: 'rgba(255, 23, 68, 0.1)',
                        border: '2px solid rgba(255, 23, 68, 0.3)',
                        animation: resourceChange?.lifeEnergy && resourceChange.lifeEnergy !== 0 ? 'pulse 0.5s' : 'none',
                      }}>
                        <FavoriteIcon color="error" className="stat-icon" sx={{ fontSize: 60, mb: 2, mx: 'auto' }} />
                        <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#ff1744', mb: 1, fontSize: { xs: '2.5rem', sm: '3rem' } }}>
                          {currentPlayer.lifeEnergy}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '600' }}>Vida</Typography>
                        {resourceChange?.lifeEnergy && resourceChange.lifeEnergy !== 0 && (
                          <Typography variant="h6" sx={{ 
                            color: resourceChange.lifeEnergy < 0 ? '#ff1744' : '#4caf50',
                            fontWeight: 'bold',
                            animation: 'pulse 1s'
                          }}>
                            {resourceChange.lifeEnergy > 0 ? '+' : ''}{resourceChange.lifeEnergy}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ maxWidth: { sm: '32%' }, flex: { sm: '0 0 32%' } }}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 4,
                        minHeight: 200,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        background: 'rgba(33, 150, 243, 0.1)',
                        border: '2px solid rgba(33, 150, 243, 0.3)',
                        animation: resourceChange?.magicShield && resourceChange.magicShield !== 0 ? 'pulse 0.5s' : 'none',
                      }}>
                        <ShieldIcon color="info" className="stat-icon" sx={{ fontSize: 60, mb: 2, mx: 'auto' }} />
                        <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#2196f3', mb: 1, fontSize: { xs: '2.5rem', sm: '3rem' } }}>
                          {currentPlayer.magicShield}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '600' }}>Escudo</Typography>
                        {resourceChange?.magicShield && resourceChange.magicShield !== 0 && (
                          <Typography variant="h6" sx={{ 
                            color: resourceChange.magicShield < 0 ? '#ff1744' : '#4caf50',
                            fontWeight: 'bold',
                            animation: 'pulse 1s'
                          }}>
                            {resourceChange.magicShield > 0 ? '+' : ''}{resourceChange.magicShield}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ maxWidth: { sm: '32%' }, flex: { sm: '0 0 32%' } }}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 4,
                        minHeight: 200,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        background: 'rgba(178, 235, 242, 0.1)',
                        border: '2px solid rgba(178, 235, 242, 0.3)',
                        animation: resourceChange?.mana && resourceChange.mana !== 0 ? 'pulse 0.5s' : 'none',
                      }}>
                        <BoltIcon className="stat-icon" sx={{ fontSize: 60, mb: 2, color: '#b2ebf2', mx: 'auto' }} />
                        <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#b2ebf2', mb: 1, fontSize: { xs: '2.5rem', sm: '3rem' } }}>
                          {currentPlayer.mana}
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: '600' }}>Mana</Typography>
                        {resourceChange?.mana && resourceChange.mana !== 0 && (
                          <Typography variant="h6" sx={{ 
                            color: resourceChange.mana < 0 ? '#ff1744' : '#4caf50',
                            fontWeight: 'bold',
                            animation: 'pulse 1s'
                          }}>
                            {resourceChange.mana > 0 ? '+' : ''}{resourceChange.mana}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Known Spells */}
              {currentPlayer.knownSpells.length > 0 && (
                <Paper elevation={8} sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)',
                  border: '2px solid rgba(156, 39, 176, 0.5)',
                  borderRadius: 2
                }}>
                  <Typography variant="h6" color="primary" gutterBottom sx={{ mb: 2 }}>
                    📜 Magias Conhecidas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {currentPlayer.knownSpells.map((spell, index) => (
                      <Chip 
                        key={index} 
                        label={spell} 
                        className="spell-chip"
                        sx={{
                          fontSize: '0.85rem',
                          py: 2.5,
                          px: 1,
                          fontWeight: '500'
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Active Defenses */}
              {currentPlayer.activeDefenses && currentPlayer.activeDefenses.length > 0 && (
                <Paper elevation={8} sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.05) 100%)',
                  border: '2px solid #2196f3',
                  borderRadius: 2,
                  boxShadow: '0 0 20px rgba(33, 150, 243, 0.3)'
                }}>
                  <Typography variant="h6" color="info.main" gutterBottom sx={{ mb: 2 }}>
                    🛡️ Defesas Ativas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {currentPlayer.activeDefenses.map((defense, idx) => (
                      <Chip 
                        key={idx} 
                        label={defense} 
                        sx={{
                          bgcolor: '#2196f3',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          py: 2.5,
                          boxShadow: '0 0 10px rgba(33, 150, 243, 0.5)'
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Potions Inventory */}
              {currentPlayer && (
                <Paper elevation={8} sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(255, 20, 147, 0.1) 100%)',
                  border: '2px solid rgba(255, 20, 147, 0.5)',
                  borderRadius: 2,
                  boxShadow: '0 0 20px rgba(255, 20, 147, 0.3)'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      🧪 Poções {currentPlayer.potions && currentPlayer.potions.length > 0 ? `(${currentPlayer.potions.length})` : '(0)'}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={openPotionDialog}
                      sx={{
                        borderColor: 'rgba(255, 20, 147, 0.5)',
                        color: '#ff1493',
                        fontSize: '0.75rem',
                        px: 2,
                        '&:hover': {
                          borderColor: '#ff1493',
                          bgcolor: 'rgba(255, 20, 147, 0.1)'
                        }
                      }}
                    >
                      + Obter Poção
                    </Button>
                  </Box>
                  {currentPlayer.potions && currentPlayer.potions.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {currentPlayer.potions.map((potion, idx) => {
                      const potionColors: Record<string, string> = {
                        'ROSA': '#ff69b4',
                        'VERDE': '#4caf50',
                        'AZUL': '#2196f3',
                        'VERMELHA': '#f44336',
                        'BRANCA': '#ffffff',
                        'ROXA': '#9c27b0'
                      };
                      const color = potionColors[potion] || '#9c27b0';
                      return (
                        <Button
                          key={idx}
                          variant="contained"
                          size="medium"
                          onClick={() => handleUsePotion(potion)}
                          sx={{
                            bgcolor: color,
                            color: potion === 'BRANCA' ? '#000' : '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            px: 3,
                            py: 1.5,
                            boxShadow: `0 0 15px ${color}80`,
                            '&:hover': {
                              bgcolor: color,
                              filter: 'brightness(1.1)',
                              boxShadow: `0 0 20px ${color}aa`,
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🧪 {potion}
                        </Button>
                      );
                    })}
                  </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Nenhuma poção no inventário. Clique em "Obter Poção" para adicionar uma!
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Activate Defense Spells */}
              {currentPlayer.knownSpells.some(s => 
                ['Barreira de Fogo', 'Muro de Água', 'Armadura de Pedra', 'Levitação', 'Proteção Arcana', 'Escudo de Vácuo'].includes(s)
              ) && (
                <Paper elevation={8} sx={{ 
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
                  border: '2px solid rgba(33, 150, 243, 0.5)',
                  borderRadius: 2
                }}>
                  <Typography variant="h6" color="info.main" gutterBottom sx={{ mb: 2 }}>
                    🛡️ Ativar Defesas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {currentPlayer.knownSpells
                      .filter(s => ['Barreira de Fogo', 'Muro de Água', 'Armadura de Pedra', 'Levitação', 'Proteção Arcana', 'Escudo de Vácuo'].includes(s))
                      .map((spell) => (
                        <Button
                          key={spell}
                          variant="outlined"
                          size="medium"
                          onClick={() => handleActivateDefense(spell)}
                          disabled={
                            currentPlayer.activeDefenses?.includes(spell) ||
                            (game?.isArenaPhase && (currentPlayer.actionsRemaining == null || currentPlayer.actionsRemaining <= 0)) ||
                            (game?.isArenaPhase && currentPlayer.id !== game.players[game.currentTurnPlayerIndex]?.id)
                          }
                          sx={{
                            borderColor: currentPlayer.activeDefenses?.includes(spell) ? 'rgba(33, 150, 243, 0.3)' : '#2196f3',
                            color: currentPlayer.activeDefenses?.includes(spell) ? 'rgba(255, 255, 255, 0.3)' : '#2196f3',
                            '&:hover': {
                              borderColor: '#42a5f5',
                              bgcolor: 'rgba(33, 150, 243, 0.2)',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {spell}
                        </Button>
                      ))}
                  </Box>
                </Paper>
              )}

              {/* Attack Other Players */}
              {game && game.players.filter(p => p.id !== currentPlayer.id && !p.isEliminated).length > 0 && (
                <Paper elevation={10} sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(211, 47, 47, 0.1) 100%)',
                  border: '3px solid #f44336',
                  borderRadius: 2,
                  boxShadow: '0 0 20px rgba(244, 67, 54, 0.3)'
                }}>
                  <Typography variant="h5" color="error" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                    ⚔️ Atacar Outros Jogadores
                  </Typography>
                  <Grid container spacing={2}>
                    {game.players
                      .filter(p => p.id !== currentPlayer.id && !p.isEliminated)
                      .map((player) => (
                        <Grid item xs={12} sm={6} key={player.id}>
                          <Card sx={{ 
                            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)',
                            border: '2px solid rgba(244, 67, 54, 0.5)',
                            borderRadius: 2
                          }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                                    {player.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip 
                                      size="small" 
                                      icon={<FavoriteIcon sx={{ fontSize: 16 }} />} 
                                      label={`${player.lifeEnergy}`} 
                                      color="error" 
                                      sx={{ fontWeight: 'bold' }}
                                    />
                                    <Chip 
                                      size="small" 
                                      icon={<ShieldIcon sx={{ fontSize: 16 }} />} 
                                      label={`${player.magicShield}`} 
                                      color="info" 
                                      sx={{ fontWeight: 'bold' }}
                                    />
                                  </Box>
                                </Box>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="medium"
                                  startIcon={<SportsMmaIcon />}
                                  disabled={
                                    (game?.isArenaPhase && (currentPlayer.actionsRemaining == null || currentPlayer.actionsRemaining <= 0)) ||
                                    (game?.isArenaPhase && currentPlayer.id !== game.players[game.currentTurnPlayerIndex]?.id)
                                  }
                                  onClick={() => openAttackDialog(player)}
                                  sx={{
                                    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                    boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
                                      boxShadow: '0 6px 20px rgba(244, 67, 54, 0.6)',
                                      transform: 'translateY(-2px)'
                                    },
                                    '&:disabled': {
                                      background: 'rgba(244, 67, 54, 0.3)',
                                      color: 'rgba(255, 255, 255, 0.5)'
                                    },
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  Atacar
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                </Paper>
              )}

              {/* Casting Circle */}
              <Paper elevation={10} sx={{ 
                p: 4, 
                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(255, 215, 0, 0.1) 100%)',
                border: '3px solid',
                borderImage: 'linear-gradient(135deg, #9c27b0, #ffd700) 1',
                borderRadius: 3,
                boxShadow: '0 0 30px rgba(156, 39, 176, 0.3)'
              }}>
                <Typography variant="h5" color="secondary" gutterBottom sx={{ mb: 3, textAlign: 'center', textShadow: '0 0 10px rgba(255, 215, 0, 0.6)' }}>
                  🔮 Círculo de Conjuração
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <TextField 
                    label="Palavra 1" 
                    fullWidth 
                    value={word1} 
                    onChange={(e) => setWord1(e.target.value.toUpperCase())} 
                    sx={{ 
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(156, 39, 176, 0.5)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(156, 39, 176, 0.8)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#9c27b0',
                          boxShadow: '0 0 10px rgba(156, 39, 176, 0.3)'
                        }
                      }
                    }} 
                  />
                  <TextField 
                    label="Palavra 2" 
                    fullWidth 
                    value={word2} 
                    onChange={(e) => setWord2(e.target.value.toUpperCase())} 
                    sx={{ 
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(156, 39, 176, 0.5)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(156, 39, 176, 0.8)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#9c27b0',
                          boxShadow: '0 0 10px rgba(156, 39, 176, 0.3)'
                        }
                      }
                    }} 
                  />
                </Box>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large" 
                  startIcon={<AutoFixHighIcon />} 
                  onClick={handleCast}
                  fullWidth
                  sx={{
                    py: 2,
                    fontSize: '1.2rem',
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
                    color: '#000',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ffeb3b 0%, #ffd700 100%)',
                      boxShadow: '0 6px 25px rgba(255, 215, 0, 0.7)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Combinar Magias
                </Button>
              </Paper>

              {/* Arena is now active by default when there are 2+ players - no button needed */}

              {game?.isArenaPhase && currentPlayer.actionsRemaining === 0 && (
                <Paper elevation={8} sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 152, 0, 0.1) 100%)',
                  border: '2px solid #ffd700',
                  borderRadius: 2
                }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleEndTurn} 
                    fullWidth
                    size="large"
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
                      color: '#000',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #ffeb3b 0%, #ffd700 100%)',
                        boxShadow: '0 6px 25px rgba(255, 215, 0, 0.7)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ✅ Finalizar Turno
                  </Button>
                </Paper>
              )}

              {/* Botão para finalizar fase de arena */}
              {game?.isArenaPhase && (
                <Paper elevation={8} sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(56, 142, 60, 0.1) 100%)',
                  border: '2px solid #4caf50',
                  borderRadius: 2,
                  mt: 2
                }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    onClick={handleEndArena} 
                    fullWidth
                    size="large"
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                      color: '#fff',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.5)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)',
                        boxShadow: '0 6px 25px rgba(76, 175, 80, 0.7)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🏁 Finalizar Fase de Arena
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
                    Todos os jogadores recuperarão 2 mana e receberão novos glifos para exploração
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {spellResult && (
            <Paper elevation={15} sx={{ 
              p: 4, 
              border: '3px solid',
              borderColor: spellResult.success ? '#4caf50' : '#f44336',
              textAlign: 'center',
              background: spellResult.success 
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.1) 100%)',
              borderRadius: 3,
              boxShadow: spellResult.success 
                ? '0 0 30px rgba(76, 175, 80, 0.5)'
                : '0 0 30px rgba(244, 67, 54, 0.5)'
            }}>
              <Typography variant="h3" gutterBottom sx={{ 
                color: spellResult.success ? '#4caf50' : '#f44336',
                fontWeight: 'bold',
                textShadow: '0 0 15px currentColor',
                mb: 2
              }}>
                {spellResult.success ? '✨' : '❌'} {spellResult.spellName}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Chip 
                  label={spellResult.type} 
                  sx={{
                    bgcolor: '#9c27b0',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    py: 2.5
                  }}
                />
                <Chip 
                  label={`Custo: ${spellResult.manaCost} Mana`} 
                  variant="outlined"
                  sx={{
                    borderColor: '#9c27b0',
                    color: '#9c27b0',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    py: 2.5
                  }}
                />
              </Box>
              <Typography variant="body1" sx={{ 
                fontStyle: 'italic',
                fontSize: '1.1rem',
                color: 'text.secondary'
              }}>
                {spellResult.description}
              </Typography>
            </Paper>
          )}

          {duelResult && (
            <Paper elevation={15} sx={{ 
              p: 4, 
              border: '3px solid',
              borderColor: duelResult.wasBlocked ? '#ff9800' : '#f44336',
              textAlign: 'center',
              background: duelResult.wasBlocked
                ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 152, 0, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.1) 100%)',
              borderRadius: 3,
              boxShadow: duelResult.wasBlocked
                ? '0 0 30px rgba(255, 152, 0, 0.5)'
                : '0 0 30px rgba(244, 67, 54, 0.5)'
            }}>
              <Typography variant="h4" gutterBottom sx={{ 
                color: duelResult.wasBlocked ? '#ff9800' : '#f44336',
                fontWeight: 'bold',
                textShadow: '0 0 15px currentColor',
                mb: 2
              }}>
                {duelResult.wasBlocked ? '🛡️ Ataque Bloqueado!' : '⚔️ Ataque Realizado!'}
              </Typography>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                {duelResult.spellName}
              </Typography>
              {duelResult.wasBlocked && duelResult.blockingSpell && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 152, 0, 0.2)', borderRadius: 2 }}>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    Bloqueado por: <strong>{duelResult.blockingSpell}</strong>
                  </Typography>
                </Box>
              )}
              {!duelResult.wasBlocked && (
                <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(244, 67, 54, 0.2)', borderRadius: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Dano causado: <span style={{ color: '#ff1744' }}>{duelResult.damageDealt}</span>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Escudo: {duelResult.targetShieldBefore} → {duelResult.targetShieldAfter} | 
                    Vida: {duelResult.targetLifeBefore} → {duelResult.targetLifeAfter}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{
                fontSize: '1rem',
                py: 2,
                borderRadius: 2,
                boxShadow: '0 0 20px rgba(244, 67, 54, 0.3)'
              }}
            >
              {error}
            </Alert>
          )}

          {/* Potion Selection Dialog */}
          <Dialog 
            open={potionDialogOpen} 
            onClose={closePotionDialog} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(45, 27, 61, 0.95) 100%)',
                border: '2px solid rgba(255, 20, 147, 0.5)'
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(255, 20, 147, 0.1) 100%)',
              borderBottom: '2px solid rgba(255, 20, 147, 0.5)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              🧪 Selecionar Poção
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Escolha qual poção você deseja obter:
              </Typography>
              <Grid container spacing={2}>
                {['ROSA', 'VERDE', 'AZUL', 'VERMELHA', 'BRANCA', 'ROXA'].map((potion) => {
                  const potionColors: Record<string, string> = {
                    'ROSA': '#ff69b4',
                    'VERDE': '#4caf50',
                    'AZUL': '#2196f3',
                    'VERMELHA': '#f44336',
                    'BRANCA': '#ffffff',
                    'ROXA': '#9c27b0'
                  };
                  const color = potionColors[potion] || '#9c27b0';
                  return (
                    <Grid item xs={6} key={potion}>
                      <ListItemButton 
                        onClick={() => handleGivePotion(potion)}
                        sx={{
                          border: '2px solid rgba(255, 20, 147, 0.3)',
                          borderRadius: 2,
                          bgcolor: `${color}20`,
                          '&:hover': {
                            bgcolor: `${color}40`,
                            borderColor: color,
                            transform: 'translateX(5px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 15px ${color}80`
                          }}>
                            <Typography variant="h6" sx={{ color: potion === 'BRANCA' ? '#000' : '#fff' }}>
                              🧪
                            </Typography>
                          </Box>
                          <ListItemText 
                            primary={
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: color }}>
                                {potion}
                              </Typography>
                            }
                          />
                        </Box>
                      </ListItemButton>
                    </Grid>
                  );
                })}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '2px solid rgba(255, 20, 147, 0.5)' }}>
              <Button 
                onClick={closePotionDialog}
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255, 20, 147, 0.5)',
                  color: '#ff1493',
                  '&:hover': {
                    borderColor: '#ff1493',
                    bgcolor: 'rgba(255, 20, 147, 0.1)'
                  }
                }}
              >
                Cancelar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Spell Selection Dialog for Attack */}
          <Dialog 
            open={attackDialogOpen} 
            onClose={closeAttackDialog} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, rgba(30, 30, 46, 0.95) 0%, rgba(45, 27, 61, 0.95) 100%)',
                border: '2px solid rgba(244, 67, 54, 0.5)'
              }
            }}
          >
            <DialogTitle sx={{ 
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(244, 67, 54, 0.1) 100%)',
              borderBottom: '2px solid rgba(244, 67, 54, 0.5)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              ⚔️ Selecionar Magia de Ataque
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              {selectedTarget && (
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'rgba(244, 67, 54, 0.1)', 
                  borderRadius: 2,
                  border: '1px solid rgba(244, 67, 54, 0.3)'
                }}>
                  <Typography variant="body1" color="text.secondary">
                    Atacando: <strong style={{ color: '#f44336' }}>{selectedTarget.name}</strong>
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              {currentPlayer && currentPlayer.knownSpells.filter(s => 
                ['Bola de Fogo', 'Lança de Gelo', 'Vento Cortante', 'Fúria da Terra', 'Disparo Arcano', 'Maldição do Vazio'].includes(s)
              ).length > 0 ? (
                <List>
                  {currentPlayer.knownSpells
                    .filter(s => ['Bola de Fogo', 'Lança de Gelo', 'Vento Cortante', 'Fúria da Terra', 'Disparo Arcano', 'Maldição do Vazio'].includes(s))
                    .map((spell) => (
                      <ListItem key={spell} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton 
                          onClick={() => {
                            console.log('Spell selected in dialog:', spell, 'Target:', selectedTarget);
                            if (selectedTarget) {
                              handleAttack(selectedTarget.id, spell);
                            } else {
                              setError("Nenhum alvo selecionado.");
                            }
                          }}
                          sx={{
                            border: '2px solid rgba(244, 67, 54, 0.3)',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'rgba(244, 67, 54, 0.2)',
                              borderColor: '#f44336',
                              transform: 'translateX(5px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <ListItemText 
                            primary={
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {spell}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                Custo: {
                                  spell === 'Disparo Arcano' ? '1 Mana' :
                                  spell === 'Maldição do Vazio' ? '2 Mana' :
                                  '2 Mana'
                                }
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Você não conhece magias de ataque. Combine palavras de poder para descobrir novas magias!
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '2px solid rgba(244, 67, 54, 0.5)' }}>
              <Button 
                onClick={closeAttackDialog}
                variant="outlined"
                sx={{
                  borderColor: 'rgba(244, 67, 54, 0.5)',
                  color: '#f44336',
                  '&:hover': {
                    borderColor: '#f44336',
                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                  }
                }}
              >
                Cancelar
              </Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
