import { EntityType, ZombieType, EntityConfig } from './types';
import { Sprout, Sun, Shield, Bomb, Snowflake, Zap } from 'lucide-react';

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const TICK_RATE = 100; // Game loop interval in ms
export const ZOMBIE_SPAWN_RATE_INITIAL = 10000; // Increased from 5000ms to 10s for slower start
export const SUN_SPAWN_RATE = 4000; // Decreased from 8000ms to 4s for faster resources
export const LEVEL_DURATION = 120000; // 2 minutes to win

export const PLANT_CONFIGS: Record<EntityType, EntityConfig> = {
  [EntityType.Peashooter]: {
    id: EntityType.Peashooter,
    name: "Peashooter",
    cost: 100,
    cooldown: 2000,
    hp: 100,
    damage: 20,
    attackRate: 1500,
    icon: Sprout,
    color: "text-green-500",
    description: "Shoots peas at zombies"
  },
  [EntityType.Sunflower]: {
    id: EntityType.Sunflower,
    name: "Sunflower",
    cost: 50,
    cooldown: 3000,
    hp: 80,
    attackRate: 5000, // Buffed from 10000ms to 5s
    icon: Sun,
    color: "text-yellow-500",
    description: "Produces extra sun"
  },
  [EntityType.WallNut]: {
    id: EntityType.WallNut,
    name: "Wall-nut",
    cost: 50,
    cooldown: 10000,
    hp: 800,
    icon: Shield,
    color: "text-orange-700",
    description: "Blocks zombies with high health"
  },
  [EntityType.CherryBomb]: {
    id: EntityType.CherryBomb,
    name: "Cherry Bomb",
    cost: 150,
    cooldown: 15000,
    hp: 999, // Invulnerable until explodes
    damage: 500,
    icon: Bomb,
    color: "text-red-600",
    description: "Explodes enemies in an area"
  },
  [EntityType.SnowPea]: {
    id: EntityType.SnowPea,
    name: "Snow Pea",
    cost: 175,
    cooldown: 3000,
    hp: 100,
    damage: 20,
    attackRate: 1500,
    icon: Snowflake,
    color: "text-cyan-400",
    description: "Shoots frozen peas that slow zombies"
  },
  [EntityType.Repeater]: {
    id: EntityType.Repeater,
    name: "Repeater",
    cost: 200,
    cooldown: 3000,
    hp: 120,
    damage: 20,
    attackRate: 1500, // Shoots twice technically (handled in logic)
    icon: Zap,
    color: "text-lime-600",
    description: "Shoots two peas at a time"
  }
};

export const ZOMBIE_CONFIGS: Record<ZombieType, { hp: number; speed: number; damage: number }> = {
  [ZombieType.Normal]: { hp: 200, speed: 0.3, damage: 10 },
  [ZombieType.Conehead]: { hp: 500, speed: 0.3, damage: 10 },
  [ZombieType.Buckethead]: { hp: 1100, speed: 0.3, damage: 10 }
};