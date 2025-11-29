import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RotateCcw, Download, ArrowLeft, Play } from 'lucide-react';

export default function HandballStats() {
  // Load sporty Google Font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    document.body.style.fontFamily = "'Poppins', sans-serif";
    
    return () => {
      document.body.style.fontFamily = '';
    };
  }, []);

  const [page, setPage] = useState('setup');
  const [homeTeam, setHomeTeam] = useState('Hjemmelag');
  const [awayTeam, setAwayTeam] = useState('Bortelag');
  const [currentHalf, setCurrentHalf] = useState(1);
  const [players, setPlayers] = useState([
    { id: 1, name: 'Spiller 1', number: 1, isKeeper: false }
  ]);
  const [opponents, setOpponents] = useState([
    { id: 1, name: 'Motstander 1', number: 1 }
  ]);
  const [activeKeeper, setActiveKeeper] = useState(null);
  const [mode, setMode] = useState('attack');
  const [events, setEvents] = useState([]);
  const [showTechnicalPopup, setShowTechnicalPopup] = useState(false);
  const [showShotPopup, setShowShotPopup] = useState(false);
  const [tempShot, setTempShot] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showShotDetails, setShowShotDetails] = useState(false);
  const [shotDetailsData, setShotDetailsData] = useState(null);

  const addPlayer = () => {
    const newId = Math.max(0, ...players.map(p => p.id)) + 1;
    setPlayers([...players, { id: newId, name: `Spiller ${newId}`, number: newId, isKeeper: false }]);
  };

  const removePlayer = (id) => {
    if (players.length > 1) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const updatePlayerName = (id, name) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePlayerNumber = (id, number) => {
    setPlayers(players.map(p => p.id === id ? { ...p, number: parseInt(number) || 0 } : p));
  };

  const toggleKeeper = (id) => {
    setPlayers(players.map(p => p.id === id ? { ...p, isKeeper: !p.isKeeper } : p));
  };

  const addOpponent = () => {
    const newId = Math.max(0, ...opponents.map(o => o.id)) + 1;
    setOpponents([...opponents, { id: newId, name: `Motstander ${newId}`, number: newId }]);
  };

  const removeOpponent = (id) => {
    if (opponents.length > 1) {
      setOpponents(opponents.filter(o => o.id !== id));
    }
  };

  const updateOpponentName = (id, name) => {
    setOpponents(opponents.map(o => o.id === id ? { ...o, name } : o));
  };

  const updateOpponentNumber = (id, number) => {
    setOpponents(opponents.map(o => o.id === id ? { ...o, number: parseInt(number) || 0 } : o));
  };

  const handleShotClick = (e, zone) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (zone === 'goal') {
      const x = (((e.clientX - rect.left - 12) / (rect.width - 24)) * 100).toFixed(1);
      const y = (((e.clientY - rect.top - 12) / (rect.height - 12)) * 100).toFixed(1);
      
      setTempShot({
        x: parseFloat(x),
        y: parseFloat(y),
        zone: 'goal'
      });
    } else {
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      
      setTempShot({
        x: parseFloat(x),
        y: parseFloat(y),
        zone: 'outside'
      });
    }
    
    setSelectedResult(null);
    setShowShotPopup(true);
  };

  const registerShot = (player, result) => {
    if (!tempShot) return;

    const event = {
      id: Date.now(),
      half: currentHalf,
      mode: mode,
      player: mode === 'attack' ? player : null,
      opponent: mode === 'defense' ? player : null,
      keeper: mode === 'defense' ? activeKeeper : null,
      x: tempShot.x,
      y: tempShot.y,
      result: tempShot.zone === 'outside' ? 'utenfor' : result,
      zone: tempShot.zone,
      timestamp: new Date().toLocaleTimeString('no-NO')
    };
    
    setEvents([...events, event]);
    setShowShotPopup(false);
    setTempShot(null);
    setSelectedResult(null);
  };

  const registerTechnicalError = (player) => {
    const event = {
      id: Date.now(),
      half: currentHalf,
      mode: 'technical',
      player: player,
      result: 'teknisk feil',
      timestamp: new Date().toLocaleTimeString('no-NO')
    };
    setEvents([...events, event]);
    setShowTechnicalPopup(false);
  };

  const getPlayerStats = (playerId, half = null) => {
    const playerEvents = events.filter(e => 
      e.player?.id === playerId && 
      (half === null || e.half === half) &&
      e.mode === 'attack'
    );
    return {
      goals: playerEvents.filter(e => e.result === 'mål').length,
      saved: playerEvents.filter(e => e.result === 'redning').length,
      outside: playerEvents.filter(e => e.result === 'utenfor').length,
      technical: events.filter(e => e.player?.id === playerId && e.mode === 'technical' && (half === null || e.half === half)).length
    };
  };

  const getOpponentStats = (opponentId, half = null) => {
    const opponentEvents = events.filter(e => 
      e.opponent?.id === opponentId && 
      (half === null || e.half === half) &&
      e.mode === 'defense'
    );
    return {
      goals: opponentEvents.filter(e => e.result === 'mål').length,
      saved: opponentEvents.filter(e => e.result === 'redning').length,
      shots: opponentEvents
    };
  };

  const showPlayerShotDetails = (player, isOpponent = false) => {
    const playerShots = events.filter(e => {
      if (isOpponent) {
        return e.opponent?.id === player.id && e.zone === 'goal';
      } else {
        return e.player?.id === player.id && e.zone === 'goal';
      }
    });
    
    setShotDetailsData({
      player,
      shots: playerShots,
      isOpponent
    });
    setShowShotDetails(true);
  };

  const showKeeperShotDetails = (keeper) => {
    const keeperShots = events.filter(e => 
      e.keeper?.id === keeper.id && e.zone === 'goal'
    );
    
    setShotDetailsData({
      player: keeper,
      shots: keeperShots,
      isKeeper: true
    });
    setShowShotDetails(true);
  };

  const exportData = () => {
    const data = {
      players,
      opponents,
      events,
      homeTeam,
      awayTeam,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handball-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const resetMatch = () => {
    if (window.confirm('Er du sikker på at du vil nullstille kampen?')) {
      setEvents([]);
      setCurrentHalf(1);
    }
  };

  if (page === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-4xl font-extrabold text-center text-indigo-900 mb-8">
            Oppsett av kamp
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-semibold mb-2">Hjemmelag</label>
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                placeholder="Navn på hjemmelag"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Bortelag</label>
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                placeholder="Navn på bortelag"
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">{homeTeam} - Spillere</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="number"
                    value={player.number}
                    onChange={(e) => updatePlayerNumber(player.id, e.target.value)}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center"
                    placeholder="Nr"
                  />
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                    placeholder="Spillernavn"
                  />
                  <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-2 border-gray-300 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={player.isKeeper}
                      onChange={() => toggleKeeper(player.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-sm font-semibold whitespace-nowrap">Keeper</span>
                  </label>
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addPlayer}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-lg font-semibold transition"
            >
              <Plus size={24} />
              Legg til spiller
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-orange-900 mb-4">{awayTeam} - Spillere</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
              {opponents.map(opponent => (
                <div key={opponent.id} className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <input
                    type="number"
                    value={opponent.number}
                    onChange={(e) => updateOpponentNumber(opponent.id, e.target.value)}
                    className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg text-center"
                    placeholder="Nr"
                  />
                  <input
                    type="text"
                    value={opponent.name}
                    onChange={(e) => updateOpponentName(opponent.id, e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg"
                    placeholder="Spillernavn"
                  />
                  <button
                    onClick={() => removeOpponent(opponent.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOpponent}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 text-lg font-semibold transition"
            >
              <Plus size={24} />
              Legg til spiller
            </button>
          </div>

          <button
            onClick={() => setPage('match')}
            className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-xl font-bold transition"
          >
            <Play size={28} />
            Start kamp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage('setup')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Tilbake til oppsett
              </button>
              <h1 className="text-2xl font-bold text-indigo-900">{homeTeam} vs {awayTeam}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetMatch}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <RotateCcw size={20} />
                Nullstill
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Download size={20} />
                Eksporter
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setCurrentHalf(1)}
              className={`px-6 py-3 rounded-lg font-semibold ${currentHalf === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              1. omgang
            </button>
            <button
              onClick={() => setCurrentHalf(2)}
              className={`px-6 py-3 rounded-lg font-semibold ${currentHalf === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
            >
              2. omgang
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setMode('attack')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold ${mode === 'attack' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Angrep ({homeTeam})
            </button>
            <button
              onClick={() => setMode('defense')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold ${mode === 'defense' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}
            >
              Forsvar (Keeper mot {awayTeam})
            </button>
          </div>

          {mode === 'defense' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Velg aktiv keeper:</label>
              <select
                value={activeKeeper?.id || ''}
                onChange={(e) => {
                  const keeper = players.find(p => p.id === parseInt(e.target.value));
                  setActiveKeeper(keeper || null);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-orange-600 focus:outline-none"
              >
                <option value="">Ingen keeper valgt</option>
                {players.filter(p => p.isKeeper).map(keeper => (
                  <option key={keeper.id} value={keeper.id}>
                    #{keeper.number} - {keeper.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'attack' && (
            <button
              onClick={() => setShowTechnicalPopup(true)}
              className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold text-lg"
            >
              Registrer teknisk feil
            </button>
          )}
        </div>

        {/* Goal Visualization */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-indigo-900">
            {mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
          </h2>
          <div className="relative">
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleShotClick(e, 'outside');
                }
              }}
              className="relative bg-gray-300 pt-12 px-12 rounded-lg cursor-crosshair hover:bg-gray-400 transition"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleShotClick(e, 'goal');
                }}
                className="relative bg-gradient-to-b from-blue-100 to-blue-200 cursor-crosshair hover:bg-blue-300 transition mx-auto"
                style={{ 
                  aspectRatio: '3/2', 
                  maxWidth: '600px',
                  borderTop: '12px solid #dc2626',
                  borderLeft: '12px solid #dc2626',
                  borderRight: '12px solid #dc2626'
                }}
              >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="border border-gray-400 opacity-40"
                    ></div>
                  ))}
                </div>

                {/* Shot markers inside goal */}
                {events
                  .filter(e => e.mode === mode && (e.player || e.opponent) && e.zone === 'goal')
                  .map(event => {
                    const playerNumber = mode === 'attack' ? event.player?.number : event.opponent?.number;
                    return (
                      <div
                        key={event.id}
                        className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 flex items-center justify-center font-bold shadow-lg pointer-events-none text-white"
                        style={{
                          left: `${event.x}%`,
                          top: `${event.y}%`,
                          backgroundColor: event.result === 'mål' ? '#22c55e' : '#f59e0b',
                          borderColor: '#fff',
                          fontSize: '14px'
                        }}
                        title={`${event.result} - ${mode === 'attack' ? event.player?.name : event.opponent?.name} (#${playerNumber}) - ${event.timestamp}`}
                      >
                        {playerNumber}
                      </div>
                    );
                  })}

                {/* Temporary shot marker for goal */}
                {tempShot && tempShot.zone === 'goal' && (
                  <div
                    className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-white border-4 border-blue-600 animate-pulse pointer-events-none flex items-center justify-center"
                    style={{
                      left: `${tempShot.x}%`,
                      top: `${tempShot.y}%`
                    }}
                  >
                    ⚽
                  </div>
                )}
              </div>

              {/* Shot markers outside goal */}
              {events
                .filter(e => e.mode === mode && (e.player || e.opponent) && e.zone === 'outside')
                .map((event, index) => {
                  const leftPosition = 10 + (index % 10) * 9;
                  return (
                    <div
                      key={event.id}
                      className="absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-lg pointer-events-none"
                      style={{
                        left: `${leftPosition}%`,
                        top: '12px',
                        backgroundColor: '#9ca3af',
                        borderColor: '#fff'
                      }}
                      title={`${event.result} utenfor - ${(mode === 'attack' ? event.player?.name : event.opponent?.name)} - ${event.timestamp}`}
                    >
                      ⚽
                    </div>
                  );
                })}

              {/* Temporary shot marker for outside */}
              {tempShot && tempShot.zone === 'outside' && (
                <div
                  className="absolute w-8 h-8 rounded-full bg-white border-4 border-gray-600 animate-pulse pointer-events-none flex items-center justify-center"
                  style={{
                    left: '50%',
                    top: '12px',
                    marginLeft: '-16px'
                  }}
                >
                  ⚽
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-3 text-center">
              Klikk på målet der skuddet gikk, eller i det grå området hvis skuddet gikk utenfor
            </p>
            <div className="flex gap-3 justify-center mt-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Mål</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium">Redning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium">Utenfor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics - continuing in next part due to length */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-indigo-900">Statistikk</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setMode('attack')}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold"
            >
              Se {homeTeam} angrep
            </button>
            <button
              onClick={() => setMode('defense')}
              className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg font-semibold"
            >
              Se keeper mot {awayTeam}
            </button>
          </div>

          {mode === 'attack' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Nr</th>
                    <th className="px-4 py-2 text-left">Spiller</th>
                    <th className="px-4 py-2 text-center">1. omg Mål</th>
                    <th className="px-4 py-2 text-center">1. omg Redn.</th>
                    <th className="px-4 py-2 text-center">1. omg Utenfor</th>
                    <th className="px-4 py-2 text-center">1. omg Tekn.feil</th>
                    <th className="px-4 py-2 text-center">2. omg Mål</th>
                    <th className="px-4 py-2 text-center">2. omg Redn.</th>
                    <th className="px-4 py-2 text-center">2. omg Utenfor</th>
                    <th className="px-4 py-2 text-center">2. omg Tekn.feil</th>
                    <th className="px-4 py-2 text-center font-bold">Tot. Mål</th>
                    <th className="px-4 py-2 text-center font-bold">Tot. Skudd</th>
                    <th className="px-4 py-2 text-center font-bold">Uttelling %</th>
                    <th className="px-4 py-2 text-center">Detaljer</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => {
                    const half1 = getPlayerStats(player.id, 1);
                    const half2 = getPlayerStats(player.id, 2);
                    const total = getPlayerStats(player.id);
                    const totalShots = total.goals + total.saved + total.outside;
                    const shootingPercent = totalShots > 0 ? ((total.goals / totalShots) * 100).toFixed(1) : 0;
                    return (
                      <tr key={player.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{player.number}</td>
                        <td className="px-4 py-2 font-semibold">{player.name}</td>
                        <td className="px-4 py-2 text-center">{half1.goals}</td>
                        <td className="px-4 py-2 text-center">{half1.saved}</td>
                        <td className="px-4 py-2 text-center">{half1.outside}</td>
                        <td className="px-4 py-2 text-center">{half1.technical}</td>
                        <td className="px-4 py-2 text-center">{half2.goals}</td>
                        <td className="px-4 py-2 text-center">{half2.saved}</td>
                        <td className="px-4 py-2 text-center">{half2.outside}</td>
                        <td className="px-4 py-2 text-center">{half2.technical}</td>
                        <td className="px-4 py-2 text-center font-bold text-green-600">{total.goals}</td>
                        <td className="px-4 py-2 text-center font-bold">{totalShots}</td>
                        <td className="px-4 py-2 text-center font-bold text-blue-600">{shootingPercent}%</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => showPlayerShotDetails(player, false)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                          >
                            Se skudd
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              {/* Keeper Statistics */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-indigo-900 mb-4">Våre keepere</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Nr</th>
                        <th className="px-4 py-2 text-left">Keeper</th>
                        <th className="px-4 py-2 text-center">Mottatte skudd</th>
                        <th className="px-4 py-2 text-center">Redninger</th>
                        <th className="px-4 py-2 text-center font-bold">Redningsprosent</th>
                        <th className="px-4 py-2 text-center">Detaljer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.filter(p => p.isKeeper).map(keeper => {
                        const keeperShots = events.filter(e => 
                          e.mode === 'defense' && 
                          e.keeper?.id === keeper.id
                        );
                        const totalShots = keeperShots.length;
                        const saves = keeperShots.filter(e => e.result === 'redning').length;
                        const savePercent = totalShots > 0 ? ((saves / totalShots) * 100).toFixed(1) : 0;
                        
                        return (
                          <tr key={keeper.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{keeper.number}</td>
                            <td className="px-4 py-2 font-semibold">{keeper.name}</td>
                            <td className="px-4 py-2 text-center">{totalShots}</td>
                            <td className="px-4 py-2 text-center">{saves}</td>
                            <td className="px-4 py-2 text-center font-bold text-green-600">{savePercent}%</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => showKeeperShotDetails(keeper)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                              >
                                Se skudd
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Opponent Statistics */}
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-4">Motstanderstatistikk</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-orange-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Nr</th>
                        <th className="px-4 py-2 text-left">Motstander</th>
                        <th className="px-4 py-2 text-center">Avfyrte skudd</th>
                        <th className="px-4 py-2 text-center">Mål</th>
                        <th className="px-4 py-2 text-center font-bold">Uttelling %</th>
                        <th className="px-4 py-2 text-center">Detaljer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opponents
                        .map(opponent => {
                          const total = getOpponentStats(opponent.id);
                          const totalShots = total.shots.length;
                          const shootingPercent = totalShots > 0 ? ((total.goals / totalShots) * 100).toFixed(1) : 0;
                          return {
                            opponent,
                            totalShots,
                            goals: total.goals,
                            shootingPercent: parseFloat(shootingPercent)
                          };
                        })
                        .sort((a, b) => b.goals - a.goals)
                        .map(({ opponent, totalShots, goals, shootingPercent }) => (
                          <tr key={opponent.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{opponent.number}</td>
                            <td className="px-4 py-2 font-semibold">{opponent.name}</td>
                            <td className="px-4 py-2 text-center">{totalShots}</td>
                            <td className="px-4 py-2 text-center font-bold text-red-600">{goals}</td>
                            <td className="px-4 py-2 text-center font-bold text-orange-600">{shootingPercent}%</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => showPlayerShotDetails(opponent, true)}
                                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                              >
                                Se skudd
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Error Popup */}
      {showTechnicalPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-900">
                Velg spiller som begikk teknisk feil
              </h2>
              <button
                onClick={() => setShowTechnicalPopup(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                Lukk
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => registerTechnicalError(player)}
                  className="aspect-square bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex flex-col items-center justify-center p-2 transition shadow-md hover:shadow-lg"
                >
                  <span className="text-3xl font-bold">{player.number}</span>
                  <span className="text-xs text-center mt-1">{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shot Registration Popup */}
      {showShotPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-900">
                {mode === 'attack' ? 'Registrer skudd' : 'Registrer motstanderskudd'}
              </h2>
              <button
                onClick={() => {
                  setShowShotPopup(false);
                  setTempShot(null);
                  setSelectedResult(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                Lukk
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              {tempShot?.zone === 'outside' 
                ? 'Skudd utenfor mål - velg spiller'
                : selectedResult 
                  ? 'Velg spiller som avfyrte skuddet'
                  : 'Velg resultat av skuddet'}
            </p>

            {tempShot?.zone !== 'outside' && !selectedResult && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Velg resultat:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedResult('mål')}
                    className="px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    ⚽ Mål
                  </button>
                  <button
                    onClick={() => setSelectedResult('redning')}
                    className="px-6 py-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    🧤 Redning
                  </button>
                </div>
              </div>
            )}

            {(selectedResult || tempShot?.zone === 'outside') && (
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Velg spiller:
                  {selectedResult && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      (Resultat: {selectedResult === 'mål' ? '⚽ Mål' : '🧤 Redning'})
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {(mode === 'attack' ? players : opponents).map(player => (
                    <button
                      key={player.id}
                      onClick={() => registerShot(player, tempShot?.zone === 'outside' ? 'utenfor' : selectedResult)}
                      className="aspect-square bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex flex-col items-center justify-center p-2 transition shadow-md hover:shadow-lg"
                    >
                      <span className="text-3xl font-bold">{player.number}</span>
                      <span className="text-xs text-center mt-1">{player.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shot Details Popup */}
      {showShotDetails && shotDetailsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b bg-white rounded-t-xl sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-indigo-900">
                {shotDetailsData.isKeeper 
                  ? `Keeper ${shotDetailsData.player.name} (#${shotDetailsData.player.number}) - Mottatte skudd`
                  : `${shotDetailsData.player.name} (#${shotDetailsData.player.number}) - Skudd`}
              </h2>
              <button
                onClick={() => {
                  setShowShotDetails(false);
                  setShotDetailsData(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
              >
                Lukk
              </button>
            </div>

            <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
              {shotDetailsData.shots.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Ingen skudd registrert</p>
              ) : (
                <div>
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-100 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {shotDetailsData.shots.filter(s => s.result === 'mål').length}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">Mål</div>
                    </div>
                    <div className="bg-amber-100 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-amber-600">
                        {shotDetailsData.shots.filter(s => s.result === 'redning').length}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">Redninger</div>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {shotDetailsData.shots.length}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">Totalt skudd</div>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {shotDetailsData.shots.length > 0 
                          ? ((shotDetailsData.shots.filter(s => s.result === 'mål').length / shotDetailsData.shots.length) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {shotDetailsData.isKeeper ? 'Innsluppsprosent' : 'Uttelling'}
                      </div>
                    </div>
                  </div>

                  <div className="relative bg-gray-300 pt-12 px-12 rounded-lg">
                    <div
                      className="relative bg-gradient-to-b from-blue-100 to-blue-200 mx-auto"
                      style={{ 
                        aspectRatio: '3/2', 
                        maxWidth: '600px',
                        borderTop: '12px solid #dc2626',
                        borderLeft: '12px solid #dc2626',
                        borderRight: '12px solid #dc2626'
                      }}
                    >
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="border border-gray-400 opacity-40"
                          ></div>
                        ))}
                      </div>

                      {shotDetailsData.shots.map(shot => {
                        const playerNumber = shotDetailsData.isKeeper 
                          ? shot.opponent?.number 
                          : shotDetailsData.isOpponent 
                            ? shot.opponent?.number 
                            : shot.player?.number;
                        return (
                          <div
                            key={shot.id}
                            className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 flex items-center justify-center font-bold shadow-lg pointer-events-none text-white"
                            style={{
                              left: `${shot.x}%`,
                              top: `${shot.y}%`,
                              backgroundColor: shot.result === 'mål' ? '#22c55e' : '#f59e0b',
                              borderColor: '#fff',
                              fontSize: '14px'
                            }}
                            title={`${shot.result} - ${shot.timestamp}`}
                          >
                            {playerNumber}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Mål</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium">Redning</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
