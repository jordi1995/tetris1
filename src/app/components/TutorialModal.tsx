import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Gamepad2, Zap, Cat, Swords, Sparkles } from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      title: "¡Bienvenido a Cat Tetris! 😺",
      icon: <Cat className="w-16 h-16" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Un juego de puzzle battle competitivo donde deberás eliminar líneas y enviar ataques a tu rival.
          </p>
          <div className="bg-white/10 p-4 rounded-xl">
            <h4 className="font-black mb-2">🎯 Objetivo</h4>
            <p>Sobrevive más tiempo que tu oponente enviándole líneas de basura cuando hagas combos.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Controles Básicos 🎮",
      icon: <Gamepad2 className="w-16 h-16" />,
      content: (
        <div className="space-y-3">
          <ControlRow keys="⬅️ ➡️" description="Mover pieza a izquierda/derecha" />
          <ControlRow keys="⬇️" description="Acelerar caída" />
          <ControlRow keys="ESPACIO / ⬆️" description="Rotar pieza" />
          <ControlRow keys="SHIFT" description="Hard Drop (caída instantánea)" />
          <ControlRow keys="C" description="Hold (guardar pieza)" />
          <ControlRow keys="ESC" description="Pausar juego" />
          
          <div className="bg-yellow-500/20 p-3 rounded-lg mt-4">
            <p className="text-sm font-bold text-yellow-300">
              💡 En modo 1v1 Local, el Jugador 2 usa WASD, W para rotar, Q para drop, E para hold
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Sistema de Combate ⚔️",
      icon: <Swords className="w-16 h-16" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 rounded-xl">
            <h4 className="font-black mb-2 text-red-300">📤 Enviar Ataques</h4>
            <ul className="space-y-2 text-sm">
              <li>• 1 línea = 0 ataque</li>
              <li>• 2 líneas = 1 ataque</li>
              <li>• 3 líneas = 2 ataques</li>
              <li>• 4 líneas (Tetris) = 4 ataques</li>
              <li>• Combos añaden ataques extra</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl">
            <h4 className="font-black mb-2 text-purple-300">📥 Recibir Ataques</h4>
            <p className="text-sm">
              Tu oponente te enviará líneas de basura que aparecen en la parte inferior de tu tablero.
              ¡Debes limpiarlas antes de que te bloqueen!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Piezas Especiales 🌟",
      icon: <Sparkles className="w-16 h-16" />,
      content: (
        <div className="space-y-3">
          <SpecialPieceCard
            emoji="💣"
            name="Cat Bomb"
            description="Explota y elimina bloques cercanos al colocarse"
          />
          <SpecialPieceCard
            emoji="✂️"
            name="Scratch Piece"
            description="Rasga una fila o columna completa"
          />
          <SpecialPieceCard
            emoji="😴"
            name="Sleep Cat"
            description="Bloque pasivo que ocupa espacio y molesta"
          />
          <SpecialPieceCard
            emoji="🍀"
            name="Lucky Cat"
            description="Otorga puntos bonus si se coloca correctamente"
          />
          
          <div className="bg-green-500/20 p-3 rounded-lg mt-4">
            <p className="text-sm font-bold text-green-300">
              ✨ Las piezas especiales aparecen aleatoriamente, ¡especialmente en Modo Caos!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Poderes Especiales ⚡",
      icon: <Zap className="w-16 h-16" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm mb-4">
            Llena tu barra de energía eliminando líneas. A 100% puedes activar un poder:
          </p>
          
          <PowerCard emoji="💥" name="Línea Gratis" description="Elimina una línea completa" />
          <PowerCard emoji="🛡️" name="Escudo" description="Bloquea ataques por 5 segundos" />
          <PowerCard emoji="⚡" name="Aceleración" description="Acelera la caída del rival" />
          <PowerCard emoji="❄️" name="Congelar" description="Congela una pieza rival" />
          <PowerCard emoji="✨" name="Transformar" description="Cambia tu pieza actual" />
          
          <div className="bg-blue-500/20 p-3 rounded-lg mt-4">
            <p className="text-sm font-bold text-blue-300">
              💡 Usa los poderes estratégicamente en momentos clave para voltear la partida
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Sistema de Remontada 🔥",
      icon: <Cat className="w-16 h-16" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-xl">
            <h4 className="font-black mb-2 text-orange-300">🎯 Last Stand Mode</h4>
            <p className="text-sm">
              Cuando estás cerca de perder, tu barra de poder se llena más rápido y tus ataques son más fuertes.
              ¡No te rindas nunca!
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl">
            <h4 className="font-black mb-2 text-purple-300">⚡ Comeback Bonus</h4>
            <p className="text-sm">
              Si sobrevives a una cadena de ataques del rival, obtendrás un bonus temporal que hace tus
              siguientes ataques más devastadores.
            </p>
          </div>
          
          <div className="bg-yellow-500/20 p-3 rounded-lg">
            <p className="text-sm font-bold text-yellow-300">
              🌟 ¡Las mejores remontadas suceden cuando parece que todo está perdido!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-3xl border-b-4 border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {pages[currentPage].icon}
                </motion.div>
                <h2 className="text-3xl font-black text-white">{pages[currentPage].title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {pages[currentPage].content}
              </motion.div>
            </div>

            {/* Footer navigation */}
            <div className="sticky bottom-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-b-3xl border-t-4 border-white/20">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className={`px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all ${
                    currentPage === 0
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>

                <div className="flex gap-2">
                  {pages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentPage ? "bg-white w-8" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                {currentPage < pages.length - 1 ? (
                  <button
                    onClick={nextPage}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black flex items-center gap-2 transition-all"
                  >
                    Siguiente
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-black hover:scale-105 transition-transform"
                  >
                    ¡Entendido!
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ControlRow({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between bg-white/10 p-3 rounded-lg">
      <span className="font-mono font-black text-yellow-300">{keys}</span>
      <span className="text-sm text-white/90">{description}</span>
    </div>
  );
}

function SpecialPieceCard({ emoji, name, description }: { emoji: string; name: string; description: string }) {
  return (
    <div className="bg-white/10 p-4 rounded-xl flex items-start gap-3">
      <span className="text-3xl">{emoji}</span>
      <div>
        <h5 className="font-black text-white mb-1">{name}</h5>
        <p className="text-sm text-white/80">{description}</p>
      </div>
    </div>
  );
}

function PowerCard({ emoji, name, description }: { emoji: string; name: string; description: string }) {
  return (
    <div className="bg-white/10 p-3 rounded-lg flex items-center gap-3">
      <span className="text-2xl">{emoji}</span>
      <div>
        <h5 className="font-bold text-white text-sm">{name}</h5>
        <p className="text-xs text-white/70">{description}</p>
      </div>
    </div>
  );
}