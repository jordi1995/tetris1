import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { characters } from "../data/characters";
import { Character } from "../types/game";

interface CharacterGridProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onSelect: (character: Character) => void;
  excludeCharacter: Character | null;
  compact?: boolean;
}

export function CharacterSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "vs-cpu";
  const from = searchParams.get("from");
  const opponent = searchParams.get("opponent");

  const [player1Character, setPlayer1Character] = useState<Character | null>(null);
  const [player2Character, setPlayer2Character] = useState<Character | null>(null);
  const [activePicker, setActivePicker] = useState<1 | 2>(1);

  const needsTwoPlayers = mode === "vs-player" || mode === "coop";
  const backTarget =
    from === "home-local"
      ? "/"
      : from === "quick-play"
        ? "/mode-selection?view=quick-play"
        : from === "matchmaking"
          ? `/online-matchmaking?mode=ranked${opponent ? `&opponent=${encodeURIComponent(opponent)}` : ""}`
          : "/mode-selection";

  const handleStart = () => {
    if (!player1Character) return;
    if (needsTwoPlayers && !player2Character) return;

    const params = new URLSearchParams({
      mode,
      p1: player1Character.id,
      p2: needsTwoPlayers ? player2Character!.id : "cpu",
    });

    if (opponent) {
      params.set("opponent", opponent);
    }

    navigate(`/game?${params.toString()}`);
  };

  const handleSelectPlayer1 = (character: Character) => {
    setPlayer1Character(character);
    if (needsTwoPlayers && !player2Character) {
      setActivePicker(2);
    }
  };

  const handleSelectPlayer2 = (character: Character) => {
    setPlayer2Character(character);
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-700 to-pink-600">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(255,214,102,0.12),_transparent_30%)]" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-5">
        <motion.div
          className="grid flex-none grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button
            onClick={() => navigate(backTarget)}
            className="flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm font-bold sm:text-base">Volver</span>
          </button>

          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-white/60 sm:text-xs">
              Seleccion de personaje
            </p>
            <h1 className="mt-1 text-xl font-black text-white sm:text-4xl lg:text-5xl">
              {needsTwoPlayers ? "ELIGE A TUS GATOS" : "ELIGE TU GATO"}
            </h1>
            <p className="mt-1 text-[10px] text-white/75 sm:text-sm">
              {mode === "ranked" && opponent
                ? `Rival encontrado: ${opponent}`
                : needsTwoPlayers
                  ? "Seleccion rapida sin scroll para ambos jugadores."
                  : "Todo entra en pantalla para empezar al instante."}
            </p>
          </div>

          <div className="hidden min-w-[96px] justify-self-end rounded-full border border-white/15 bg-white/10 px-3 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 sm:block">
            {needsTwoPlayers ? "Versus local" : "Ready"}
          </div>
        </motion.div>

        <div className="flex min-h-0 flex-1 flex-col pb-16 pt-3 sm:pb-0 sm:pt-5">
          {needsTwoPlayers && (
            <div className="mb-2 flex flex-none justify-center xl:hidden">
              <div className="inline-flex rounded-full border border-white/15 bg-black/15 p-1 backdrop-blur-sm">
                <PickerTab
                  label="Jugador 1"
                  isActive={activePicker === 1}
                  isReady={Boolean(player1Character)}
                  onClick={() => setActivePicker(1)}
                />
                <PickerTab
                  label="Jugador 2"
                  isActive={activePicker === 2}
                  isReady={Boolean(player2Character)}
                  onClick={() => setActivePicker(2)}
                />
              </div>
            </div>
          )}

          {!needsTwoPlayers && (
            <div className="min-h-0 flex-1">
              <SinglePicker
                title="Tu gato"
                selectedCharacter={player1Character}
                onSelect={handleSelectPlayer1}
                excludeCharacter={player2Character}
                compact={false}
              />
            </div>
          )}

          {needsTwoPlayers && (
            <>
              <div className="min-h-0 flex-1 xl:hidden">
                {activePicker === 1 ? (
                  <SinglePicker
                    title="Jugador 1"
                    selectedCharacter={player1Character}
                    onSelect={handleSelectPlayer1}
                    excludeCharacter={player2Character}
                    compact
                  />
                ) : (
                  <SinglePicker
                    title="Jugador 2"
                    selectedCharacter={player2Character}
                    onSelect={handleSelectPlayer2}
                    excludeCharacter={player1Character}
                    compact
                  />
                )}
              </div>

              <div className="hidden min-h-0 flex-1 xl:grid xl:grid-cols-2 xl:gap-6">
                <SinglePicker
                  title="Jugador 1"
                  selectedCharacter={player1Character}
                  onSelect={handleSelectPlayer1}
                  excludeCharacter={player2Character}
                />
                <SinglePicker
                  title="Jugador 2"
                  selectedCharacter={player2Character}
                  onSelect={handleSelectPlayer2}
                  excludeCharacter={player1Character}
                />
              </div>
            </>
          )}
        </div>

        <motion.div
          className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-center gap-2 sm:static sm:inset-auto sm:bottom-auto sm:z-auto sm:flex-none sm:gap-3 sm:pt-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {needsTwoPlayers && (
            <div className="hidden rounded-2xl border border-white/15 bg-black/15 px-4 py-3 text-xs font-medium text-white/70 backdrop-blur-sm sm:block">
              P1: {player1Character?.name ?? "Sin elegir"} · P2: {player2Character?.name ?? "Sin elegir"}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!player1Character || (needsTwoPlayers && !player2Character)}
            className={`rounded-2xl px-5 py-3 text-sm font-black transition-all sm:px-10 sm:py-4 sm:text-xl ${
              player1Character && (!needsTwoPlayers || player2Character)
                ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-2xl hover:scale-[1.02]"
                : "cursor-not-allowed bg-gray-500 text-gray-200"
            }`}
          >
            {player1Character && (!needsTwoPlayers || player2Character)
              ? mode === "ranked"
                ? "ENTRAR EN PARTIDA"
                : "COMENZAR BATALLA"
              : needsTwoPlayers
                ? "Selecciona ambos gatos"
                : "Selecciona tu gato"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function PickerTab({
  label,
  isActive,
  isReady,
  onClick,
}: {
  label: string;
  isActive: boolean;
  isReady: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
        isActive ? "bg-white text-fuchsia-700" : "text-white/80 hover:text-white"
      }`}
    >
      {label}
      {isReady ? " ✓" : ""}
    </button>
  );
}

function SinglePicker({
  title,
  selectedCharacter,
  onSelect,
  excludeCharacter,
  compact = false,
}: {
  title: string;
  selectedCharacter: Character | null;
  onSelect: (character: Character) => void;
  excludeCharacter: Character | null;
  compact?: boolean;
}) {
  return (
    <div className={`flex h-full min-h-0 flex-col rounded-[28px] border border-white/12 bg-black/12 backdrop-blur-sm ${compact ? "p-2 sm:p-4" : "p-3 sm:p-4"}`}>
      <div className={`flex flex-none items-center justify-between ${compact ? "mb-2" : "mb-3"}`}>
        <div>
          <h2 className={`font-black text-white ${compact ? "text-lg sm:text-2xl" : "text-xl sm:text-2xl"}`}>{title}</h2>
          <p className={`text-white/65 ${compact ? "text-[10px] sm:text-xs" : "text-[11px] sm:text-xs"}`}>
            {selectedCharacter ? `${selectedCharacter.name} listo` : "Toca una carta para continuar"}
          </p>
        </div>

        {selectedCharacter && (
          <div className={`rounded-full bg-white/12 font-bold uppercase tracking-[0.14em] text-white/80 ${compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-[11px]"}`}>
            Confirmado
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <CharacterGrid
          characters={characters}
          selectedCharacter={selectedCharacter}
          onSelect={onSelect}
          excludeCharacter={excludeCharacter}
          compact={compact}
        />
      </div>
    </div>
  );
}

function CharacterGrid({ characters, selectedCharacter, onSelect, excludeCharacter, compact = false }: CharacterGridProps) {
  return (
    <div
      className={`grid h-full grid-cols-2 ${
        compact ? "content-start auto-rows-[96px] gap-2" : "auto-rows-fr gap-3"
      } lg:grid-cols-3`}
    >
      {characters.map((character, index) => {
        const isSelected = selectedCharacter?.id === character.id;
        const isExcluded = excludeCharacter?.id === character.id;

        return (
          <motion.button
            key={character.id}
            onClick={() => !isExcluded && onSelect(character)}
            disabled={isExcluded}
            className={`relative flex min-h-0 min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border text-left transition-all ${
              compact ? "h-[96px] p-2 sm:h-auto sm:p-4" : "h-full p-3 sm:p-4"
            } ${
              isExcluded
                ? "cursor-not-allowed border-white/10 bg-gray-700/50 opacity-40"
                : isSelected
                  ? "scale-[1.01] border-white/70 bg-white text-slate-900 shadow-2xl"
                  : "border-white/12 bg-white/92 text-slate-900 hover:-translate-y-0.5 hover:bg-white"
            }`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: compact ? 0.18 : 0.35, delay: compact ? 0 : index * 0.04 }}
            whileTap={!isExcluded ? { scale: 0.98 } : {}}
            style={{
              boxShadow: isSelected ? `0 0 32px ${character.color}` : undefined,
            }}
          >
            {isSelected && (
              <motion.div
                className="absolute right-3 top-3 rounded-full bg-green-500 p-1.5 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}

            <div>
              <div className={`mb-1 ${compact ? "text-2xl sm:text-5xl" : "text-5xl sm:text-6xl"}`}>{character.emoji}</div>
              <h3 className={`${compact ? "text-xs sm:text-lg" : "text-base sm:text-lg"} font-black`} style={{ color: character.color }}>
                {character.name}
              </h3>
              <p className={`mt-1 leading-snug text-slate-600 ${compact ? "hidden text-[10px] sm:block sm:text-[11px]" : "text-[10px] sm:text-[11px]"}`}>
                {character.description}
              </p>
            </div>

            <div className={compact ? "mt-1.5" : "mt-3"}>
              <div className="h-2 rounded-full" style={{ backgroundColor: character.color }} />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
