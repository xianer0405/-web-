import React from 'react';

export enum EntityType {
  Peashooter = 'Peashooter',
  Sunflower = 'Sunflower',
  WallNut = 'WallNut',
  CherryBomb = 'CherryBomb',
  Repeater = 'Repeater',
  SnowPea = 'SnowPea'
}

export enum ZombieType {
  Normal = 'Normal',
  Conehead = 'Conehead',
  Buckethead = 'Buckethead'
}

export interface EntityConfig {
  id: EntityType;
  name: string;
  cost: number;
  cooldown: number; // in ms
  hp: number;
  damage?: number;
  attackRate?: number; // in ms
  icon: React.ElementType;
  color: string;
  description: string;
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface Plant {
  id: string;
  type: EntityType;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  lastActionTime: number;
}

export interface Zombie {
  id: string;
  type: ZombieType;
  row: number;
  x: number; // 0-100 scale of the lane
  hp: number;
  maxHp: number;
  speed: number;
  isEating: boolean;
  frozen?: boolean;
  frozenTimer?: number;
}

export interface Projectile {
  id: string;
  row: number;
  x: number;
  damage: number;
  isFrozen: boolean;
}

export interface SunResource {
  id: string;
  x: number; // percentage left
  y: number; // percentage top
  value: number;
  createdAt: number;
}

export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';