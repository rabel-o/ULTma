import { useState } from 'react';
import { 
  CssBaseline, Container, Typography, Box, Paper, Button, 
  TextField, Alert, Chip, Card, CardContent,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'; 
import MenuBookIcon from '@mui/icons-material/MenuBook'; 
import FavoriteIcon from '@mui/icons-material/Favorite'; 
import ShieldIcon from '@mui/icons-material/Shield'; 
import BoltIcon from '@mui/icons-material/Bolt'; 
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement'; // Icone Meditação

import { GameService } from './api';
import { GameMatch, SpellResult, Player } from './types';

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

function App() {
  const [game, setGame] = useState<GameMatch | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [playerName, setPlayerName] = useState('');
  
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');
  const [spellResult, setSpellResult] = useState<SpellResult | null>(null);
  const [error, setError] = useState('');

  // helper to update local player state from game state
  const refreshPlayer = (gameData: GameMatch, playerId: string) => {
    const me = gameData.players.find(p => p.id === playerId);
    if (me) setCurrentPlayer(me);
    setGame(gameData);
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
      setError("error connecting to backend.");
    }
  };

  const handleJoinGame = async () => {
    if (!playerName) return;
    try {
      const updatedGame = await GameService.joinGame(playerName);
      refreshPlayer(updatedGame, updatedGame.players[updatedGame.players.length - 1].id);
      setError('');
    } catch (err) {
      console.error(err);
      setError("error joining game.");
    }
  };

  const handleCast = async () => {
    if (!word1 || !word2 || !currentPlayer) return;
    try {
      setError('');
      const result = await GameService.castSpell(currentPlayer.id, word1, word2);
      setSpellResult(result);

      // refresh data to see mana cost and learned spells
      const updatedGame = await GameService.getGame();
      refreshPlayer(updatedGame, currentPlayer.id);

    } catch (err) {
      console.error(err);
      setError("failed to cast spell.");
    }
  };

  // new: meditate handler
  const handleMeditate = async () => {
    if (!currentPlayer) return;
    try {
      const updatedGame = await GameService.meditate(currentPlayer.id);
      refreshPlayer(updatedGame, currentPlayer.id);
      setSpellResult(null); // clear old spell results
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', border: '1px solid #9c27b0' }}>
            <Typography variant="h3" color="primary">UltMA</Typography>
            <Typography variant="subtitle1" color="text.secondary">Digital Grimoire</Typography>
          </Paper>

          {!game && (
            <Button variant="contained" size="large" startIcon={<MenuBookIcon />} onClick={handleStartGame} fullWidth>
              Create Session
            </Button>
          )}

          {game && !currentPlayer && (
            <Paper elevation={3} sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField label="Mage Name" fullWidth value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
              <Button variant="contained" color="secondary" onClick={handleJoinGame} startIcon={<PersonAddIcon />}>
                Join
              </Button>
            </Paper>
          )}

          {currentPlayer && (
            <>
              {/* status panel with meditate button */}
              <Card sx={{ border: '1px solid #ffd700' }}>
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
                      Meditate (+2 Mana)
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <FavoriteIcon color="error" />
                      <Typography variant="h6">{currentPlayer.lifeEnergy}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <ShieldIcon color="info" />
                      <Typography variant="h6">{currentPlayer.magicShield}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <BoltIcon sx={{ color: '#b2ebf2' }} />
                      <Typography variant="h6">{currentPlayer.mana}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* learned spells list */}
              {currentPlayer.knownSpells.length > 0 && (
                <Paper elevation={1} sx={{ p: 2, bgcolor: 'rgba(156, 39, 176, 0.1)' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Known Spells:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {currentPlayer.knownSpells.map((spell, index) => (
                      <Chip key={index} label={spell} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* casting area */}
              <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" color="secondary">Casting Circle</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Word 1" fullWidth value={word1} onChange={(e) => setWord1(e.target.value.toUpperCase())} sx={{ flex: 1 }} />
                  <TextField label="Word 2" fullWidth value={word2} onChange={(e) => setWord2(e.target.value.toUpperCase())} sx={{ flex: 1 }} />
                </Box>
                <Button variant="contained" color="secondary" size="large" startIcon={<AutoFixHighIcon />} onClick={handleCast}>
                  Combine
                </Button>
              </Paper>
            </>
          )}

          {spellResult && (
            <Paper elevation={10} sx={{ p: 3, border: '2px solid', borderColor: spellResult.success ? '#4caf50' : '#f44336', textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom>{spellResult.spellName}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Chip label={spellResult.type} color="primary" />
                <Chip label={`Cost: ${spellResult.manaCost}`} variant="outlined" />
              </Box>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{spellResult.description}</Typography>
            </Paper>
          )}

          {error && <Alert severity="error">{error}</Alert>}

        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;