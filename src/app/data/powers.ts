import { PowerType } from "../types/game";

export const powers: PowerType[] = [
  {
    id: 'clear_line',
    name: 'Línea Gratis',
    description: 'Elimina una línea completa',
    icon: '💥',
    cost: 100,
  },
  {
    id: 'shield',
    name: 'Escudo',
    description: 'Bloquea ataques por 5 segundos',
    icon: '🛡️',
    cost: 80,
  },
  {
    id: 'speed_attack',
    name: 'Aceleración',
    description: 'Acelera la caída del rival por 3 segundos',
    icon: '⚡',
    cost: 60,
  },
  {
    id: 'freeze',
    name: 'Congelar',
    description: 'Congela una pieza rival por 2 segundos',
    icon: '❄️',
    cost: 70,
  },
  {
    id: 'transform',
    name: 'Transformar',
    description: 'Convierte tu pieza actual en una mejor',
    icon: '✨',
    cost: 50,
  },
];
