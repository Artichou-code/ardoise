import {
  Award,
  Brain,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Medal,
  Crown,
  UserCheck,
  Compass,
  Grid3X3,
  Layers,
  Wand2,
  Skull,
  HeartCrack,
  Zap,
  Anchor,
  Eye,
  CheckCircle2,
  Swords,
  Trophy,
  Dices,
  Target,
  Hourglass,
  VenetianMask,
  Timer,
  Snail,
  Frown,
  Meh,
  Ghost,
  ThumbsDown,
} from 'lucide-react'

import { Mustache } from './MustacheIcon'

const ICON_MAP = {
  Award,
  Brain,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Medal,
  Crown,
  UserCheck,
  Compass,
  Grid3X3,
  Layers,
  Wand2,
  Skull,
  HeartCrack,
  Zap,
  Anchor,
  Eye,
  CheckCircle2,
  Swords,
  Trophy,
  Dices,
  Target,
  Hourglass,
  VenetianMask,
  Timer,
  Snail,
  Frown,
  Meh,
  Ghost,
  ThumbsDown,
  Mustache,
  mustache: Mustache,
  Moustache: Mustache,
  moustache: Mustache,
}

/**
 * Composant d'icône thématique pour les trophées et distinctions
 */
export function TrophyIcon({ name, size = 13, className = '' }) {
  const Component = (name && ICON_MAP[name]) ? ICON_MAP[name] : Award
  return <Component size={size} className={className} />
}
