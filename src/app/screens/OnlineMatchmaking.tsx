import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Shield, Search, Swords, Wifi } from "lucide-react";

const MATCH_POOL = [
  { name: "LunaByte", rank: "Gold II", ping: "28 ms" },
  { name: "PixelClaw", rank: "Platinum I", ping: "34 ms" },
  { name: "MimiRush", rank: "Diamond III", ping: "22 ms" },
  { name: "NekoStorm", rank: "Gold III", ping: "31 ms" },
];

export function OnlineMatchmaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lockedOpponentName = searchParams.get("opponent");

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [status, setStatus] = useState<"searching" | "found">(lockedOpponentName ? "found" : "searching");
  const [opponent] = useState(() => {
    if (lockedOpponentName) {
      return MATCH_POOL.find((entry) => entry.name === lockedOpponentName) ?? {
        name: lockedOpponentName,
        rank: "Ranked Rival",
        ping: "30 ms",
      };
    }

    return MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)];
  });

  useEffect(() => {
    if (lockedOpponentName) {
      return;
    }

    const counter = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    const finder = window.setTimeout(() => {
      setStatus("found");
    }, 2600);

    return () => {
      window.clearInterval(counter);
      window.clearTimeout(finder);
    };
  }, [lockedOpponentName]);

  return (
    <div className="relative h-dvh overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-900 to-fuchsia-700 px-4 py-5 sm:px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute h-2 w-2 rounded-full bg-white/20"
            initial={{ x: Math.random() * window.innerWidth, y: -20 }}
            animate={{ x: Math.random() * window.innerWidth, y: window.innerHeight + 20 }}
            transition={{
              duration: 8 + Math.random() * 8,
              delay: Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/85 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm font-bold sm:text-base">Volver</span>
          </button>

          <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-xs">
            Ranked Queue
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-cyan-200/80 sm:text-sm">
              Matchmaking online
            </p>
            <h1 className="text-[clamp(2.3rem,7vw,4.8rem)] font-black leading-none text-white">
              Busca rival y entra directo a la cola ranked.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/78 sm:text-lg">
              El acceso de Ranked ya no pasa por el selector general: ahora abre directamente el buscador
              de contrincante online y prepara la partida desde aqui.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              <QueueStat icon={<Search className="h-4 w-4" />} label="Cola activa" value="24/7" />
              <QueueStat icon={<Wifi className="h-4 w-4" />} label="Ping objetivo" value="< 60 ms" />
              <QueueStat icon={<Shield className="h-4 w-4" />} label="MMR" value="+/- 1 tier" />
            </div>
          </motion.div>

          <motion.div
            className="rounded-[32px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">Estado</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {status === "searching" ? "Buscando rival..." : "Rival encontrado"}
                </h2>
              </div>

              <motion.div
                className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-100"
                animate={status === "searching" ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="absolute inset-0 rounded-full border border-cyan-200/40" />
                <motion.div
                  className="absolute inset-[-10px] rounded-full border border-cyan-200/20"
                  animate={status === "searching" ? { scale: [1, 1.2], opacity: [0.6, 0] } : { opacity: 0.25 }}
                  transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY }}
                />
                <Swords className="h-7 w-7" />
              </motion.div>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-950/35 p-4">
              {status === "searching" ? (
                <>
                  <p className="text-sm text-white/75">
                    Ajustando ping, rango y region para encontrar un duelo equilibrado.
                  </p>
                  <div className="mt-4 flex items-end gap-2">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        className="block h-2 w-2 rounded-full bg-cyan-200"
                        animate={{ y: [0, -8, 0], opacity: [0.45, 1, 0.45] }}
                        transition={{
                          duration: 0.8,
                          delay: index * 0.12,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-white/55">
                    Tiempo en cola: {elapsedSeconds}s
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/70">
                        Match listo
                      </p>
                      <h3 className="mt-2 text-3xl font-black text-white">{opponent.name}</h3>
                      <p className="mt-1 text-sm text-white/70">
                        {opponent.rank} · Ping estimado {opponent.ping}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-center">
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100/70">Estado</div>
                      <div className="mt-1 text-lg font-black text-emerald-100">Listo</div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/character-selection?mode=ranked&from=matchmaking&opponent=${encodeURIComponent(opponent.name)}`,
                      )
                    }
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 text-base font-black text-slate-950 transition-transform hover:scale-[1.02]"
                  >
                    ELEGIR MI GATO
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function QueueStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-cyan-100">{icon}</div>
      <div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/55">{label}</div>
      <div className="mt-1 text-sm font-black text-white sm:text-base">{value}</div>
    </div>
  );
}
