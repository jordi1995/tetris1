import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { characters } from "../data/characters";
import { Character } from "../types/game";

export function CharacterSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'vs-cpu';
  
  const [player1Character, setPlayer1Character] = useState<Character | null>(null);
  const [player2Character, setPlayer2Character] = useState<Character | null>(null);
  
  const needsTwoPlayers = mode === 'vs-player' || mode === 'coop';

  const handleStart = () => {
    if (!player1Character) return;
    if (needsTwoPlayers && !player2Character) return;
    
    navigate(`/game?mode=${mode}&p1=${player1Character.id}&p2=${player2Character?.id || 'cpu'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button
            onClick={() => navigate('/mode-selection')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg font-bold">Volver</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-5xl font-black text-white">
              ELIGE TU GATO
            </h1>
            <p className="text-white/80 mt-2">Cada gato tiene su propia personalidad</p>
          </div>
          
          <div className="w-24" />
        </motion.div>

        {/* Selección de jugadores */}
        <div className={`grid ${needsTwoPlayers ? 'grid-cols-2' : 'grid-cols-1'} gap-8 mb-8`}>
          {/* Player 1 */}
          <div>
            <h2 className="text-3xl font-black text-white mb-4 text-center">
              {needsTwoPlayers ? 'JUGADOR 1' : 'TU GATO'}
            </h2>
            <CharacterGrid
              characters={characters}
              selectedCharacter={player1Character}
              onSelect={setPlayer1Character}
              excludeCharacter={player2Character}
            />
          </div>

          {/* Player 2 */}
          {needsTwoPlayers && (
            <div>
              <h2 className="text-3xl font-black text-white mb-4 text-center">
                JUGADOR 2
              </h2>
              <CharacterGrid
                characters={characters}
                selectedCharacter={player2Character}
                onSelect={setPlayer2Character}
                excludeCharacter={player1Character}
              />
            </div>
          )}
        </div>

        {/* Botón de inicio */}
        <motion.div
          className="text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={handleStart}
            disabled={!player1Character || (needsTwoPlayers && !player2Character)}
            className={`px-12 py-6 rounded-2xl text-2xl font-black transition-all ${
              player1Character && (!needsTwoPlayers || player2Character)
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-110 shadow-2xl'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {player1Character && (!needsTwoPlayers || player2Character)
              ? '¡COMENZAR BATALLA! 🎮'
              : 'Selecciona tu gato'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface CharacterGridProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onSelect: (character: Character) => void;
  excludeCharacter: Character | null;
}

function CharacterGrid({ characters, selectedCharacter, onSelect, excludeCharacter }: CharacterGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {characters.map((character, index) => {
        const isSelected = selectedCharacter?.id === character.id;
        const isExcluded = excludeCharacter?.id === character.id;
        
        return (
          <motion.button
            key={character.id}
            onClick={() => !isExcluded && onSelect(character)}
            disabled={isExcluded}
            className={`relative p-6 rounded-2xl transition-all ${
              isExcluded
                ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                : isSelected
                ? 'bg-white shadow-2xl scale-105'
                : 'bg-white/90 hover:bg-white hover:scale-105'
            }`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              type: "spring",
            }}
            whileHover={!isExcluded ? { y: -5 } : {}}
            whileTap={!isExcluded ? { scale: 0.95 } : {}}
            style={{
              boxShadow: isSelected ? `0 0 40px ${character.color}` : undefined,
            }}
          >
            {/* Check de selección */}
            {isSelected && (
              <motion.div
                className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="w-6 h-6 text-white" />
              </motion.div>
            )}

            {/* Emoji del gato */}
            <motion.div
              className="text-6xl mb-3"
              animate={isSelected ? {
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: isSelected ? Infinity : 0,
                repeatDelay: 1,
              }}
            >
              {character.emoji}
            </motion.div>

            {/* Nombre */}
            <h3 
              className="text-xl font-black mb-2"
              style={{ color: character.color }}
            >
              {character.name}
            </h3>

            {/* Descripción */}
            <p className="text-gray-600 text-xs leading-tight">
              {character.description}
            </p>

            {/* Barra de color */}
            <div 
              className="mt-3 h-2 rounded-full"
              style={{ backgroundColor: character.color }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
