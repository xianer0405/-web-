import React from 'react';
import { PLANT_CONFIGS, GRID_COLS, GRID_ROWS } from '../constants';
import { Plant, Zombie, Projectile, SunResource } from '../types';
import { Ghost } from 'lucide-react';

export const PlantView: React.FC<{ plant: Plant }> = ({ plant }) => {
  const config = PLANT_CONFIGS[plant.type];
  const Icon = config.icon;
  
  // Calculate position percentages
  const left = plant.col * (100 / GRID_COLS);
  const top = plant.row * (100 / GRID_ROWS);
  const width = 100 / GRID_COLS;
  const height = 100 / GRID_ROWS;

  return (
    <div 
      className="absolute flex items-center justify-center animate-bounce-subtle"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: 10 + plant.row
      }}
    >
       <div className={`relative w-3/4 h-3/4 rounded-full flex items-center justify-center shadow-md backdrop-blur-sm border border-white/20 ${config.color.replace('text-', 'bg-').replace('500','500/20').replace('600','600/20')}`}>
         <Icon size={32} strokeWidth={2.5} className={config.color} />
         {/* Health Bar */}
         <div className="absolute -bottom-1 left-[15%] w-[70%] h-1 bg-gray-700 rounded-full overflow-hidden">
           <div 
             className="h-full bg-green-500 transition-all duration-300" 
             style={{ width: `${(plant.hp / plant.maxHp) * 100}%` }}
           />
         </div>
       </div>
    </div>
  );
};

export const ZombieView: React.FC<{ zombie: Zombie }> = ({ zombie }) => {
  const isFrozen = zombie.frozen && zombie.frozenTimer && zombie.frozenTimer > 0;
  
  // Calculate position
  const top = zombie.row * (100 / GRID_ROWS);
  const height = 100 / GRID_ROWS;
  
  return (
    <div 
      className="absolute flex flex-col items-center justify-end pb-2 transition-all duration-100"
      style={{ 
        left: `${zombie.x}%`, 
        top: `${top}%`,
        width: `${100 / GRID_COLS}%`,
        height: `${height}%`,
        zIndex: 20 + zombie.row,
      }}
    >
      {/* Inner wrapper handling animation and offset */}
      <div className={`relative p-1 transition-all animate-walk ${isFrozen ? 'brightness-125 saturate-50' : ''}`}>
        
        {/* Accessories based on type */}
        {zombie.type === 'Conehead' && (
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20 drop-shadow-md">
             <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-orange-500" />
             <div className="w-8 h-1 bg-orange-600 rounded-full absolute -bottom-1 -left-1" />
          </div>
        )}
        
        {zombie.type === 'Buckethead' && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 drop-shadow-md">
            <div className="w-9 h-7 bg-slate-400 rounded-t-lg border-2 border-slate-600 relative">
               <div className="absolute top-1 left-1 w-1 h-4 bg-white/30 rounded-full" />
            </div>
          </div>
        )}
        
        {/* Base Body */}
        <Ghost 
          size={48} 
          className={`${isFrozen ? 'text-cyan-500' : 'text-purple-800'} drop-shadow-xl`} 
          fill={isFrozen ? "#a5f3fc" : zombie.type === 'Normal' ? "#a855f7" : "#9333ea"} 
          strokeWidth={1.5}
        />
        
        {/* Animated Eyes - slightly crossed for zombie effect */}
        <div className="absolute top-4 left-3 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
        <div className="absolute top-3 right-4 w-2.5 h-2.5 bg-yellow-300 rounded-full animate-pulse delay-75" />
        
        {/* Mouth */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-black/50 rounded-full" />
      </div>

       {/* Health Bar */}
       <div className="w-12 h-1 bg-red-900 mt-[-2px] rounded-full overflow-hidden z-30 border border-black/30">
           <div 
             className="h-full bg-red-500" 
             style={{ width: `${(zombie.hp / zombie.maxHp) * 100}%` }}
           />
       </div>
    </div>
  );
};

export const ProjectileView: React.FC<{ projectile: Projectile }> = ({ projectile }) => {
  const top = projectile.row * (100 / GRID_ROWS);
  const height = 100 / GRID_ROWS;

  return (
    <div 
      className="absolute flex items-center justify-center z-30 pointer-events-none"
      style={{ 
        left: `${projectile.x}%`,
        top: `${top}%`,
        width: '20px', 
        height: `${height}%`,
        transform: 'translateX(-50%)'
      }}
    >
      <div className={`
        w-5 h-5 rounded-full shadow-lg border border-white/40
        ${projectile.isFrozen ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-green-500 shadow-green-500/50'} 
      `} />
    </div>
  );
};

export const SunView: React.FC<{ sun: SunResource; onClick: (id: string) => void }> = ({ sun, onClick }) => {
  return (
    <button
      onClick={() => onClick(sun.id)}
      className="absolute w-12 h-12 text-yellow-400 animate-spin-slow z-50 hover:scale-110 transition-transform cursor-pointer drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
      style={{ left: `${sun.x}%`, top: `${sun.y}%` }}
    >
       <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
         <circle cx="12" cy="12" r="6" />
         <path d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
       </svg>
    </button>
  );
};