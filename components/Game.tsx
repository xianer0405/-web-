import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  EntityType, 
  Plant, 
  Zombie, 
  Projectile, 
  SunResource, 
  GameStatus, 
  ZombieType 
} from '../types';
import { 
  GRID_ROWS, 
  GRID_COLS, 
  TICK_RATE, 
  PLANT_CONFIGS, 
  ZOMBIE_CONFIGS, 
  ZOMBIE_SPAWN_RATE_INITIAL, 
  SUN_SPAWN_RATE,
  LEVEL_DURATION
} from '../constants';
import { PlantView, ZombieView, ProjectileView, SunView } from './EntityComponents';
import { getCrazyDaveAdvice } from '../services/geminiService';
import { Brain, Play, Pause, RefreshCw } from 'lucide-react';

// Custom hook to replace usehooks-ts
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => {
        savedCallback.current();
      }, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default function Game() {
  // --- State ---
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [sun, setSun] = useState(150);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [suns, setSuns] = useState<SunResource[]>([]);
  const [selectedPlantType, setSelectedPlantType] = useState<EntityType | null>(null);
  const [message, setMessage] = useState<string>("Welcome to the lawn!");
  const [levelProgress, setLevelProgress] = useState(0);
  const [crazyDaveTip, setCrazyDaveTip] = useState<string>("");
  const [loadingDave, setLoadingDave] = useState(false);

  // --- Refs for Timing ---
  const lastSunSpawnRef = useRef<number>(0);
  const lastZombieSpawnRef = useRef<number>(0);
  const levelStartTimeRef = useRef<number>(0);
  
  // --- Message Timeout ---
  useEffect(() => {
    if (status === 'PLAYING' && message === "Welcome to the lawn!") {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, message]);

  // --- Helpers ---
  const getGridCell = (row: number, col: number) => plants.find(p => p.row === row && p.col === col);

  const spawnSun = (x?: number, y?: number, val: number = 25) => {
    const newSun: SunResource = {
      id: uuidv4(),
      x: x ?? Math.random() * 80 + 10,
      y: y ?? Math.random() * 80 + 10,
      value: val,
      createdAt: Date.now()
    };
    setSuns(prev => [...prev, newSun]);
  };

  const collectSun = (id: string) => {
    const s = suns.find(s => s.id === id);
    if (s) {
      setSun(prev => prev + s.value);
      setSuns(prev => prev.filter(item => item.id !== id));
    }
  };

  const askCrazyDave = async () => {
    if (loadingDave) return;
    setLoadingDave(true);
    const tip = await getCrazyDaveAdvice(sun, plants, zombies);
    setCrazyDaveTip(tip);
    setLoadingDave(false);
  };

  // --- Main Game Loop ---
  useInterval(() => {
    if (status !== 'PLAYING') return;

    const now = Date.now();
    
    // 1. Level Progress
    const elapsed = now - levelStartTimeRef.current;
    const progress = Math.min(100, (elapsed / LEVEL_DURATION) * 100);
    setLevelProgress(progress);
    
    if (progress >= 100 && zombies.length === 0) {
      setStatus('VICTORY');
      return;
    }

    // 2. Prepare Next State
    let nextPlants = plants.map(p => ({...p}));
    let nextZombies = zombies.map(z => ({...z}));
    let nextProjectiles = projectiles.map(p => ({...p}));

    // 3. Spawning
    
    // Sun (Side Effect)
    if (now - lastSunSpawnRef.current > SUN_SPAWN_RATE) {
      spawnSun();
      lastSunSpawnRef.current = now;
    }
    
    // Zombies (Integrated)
    const currentSpawnRate = Math.max(1000, ZOMBIE_SPAWN_RATE_INITIAL - (progress * 40));
    if (now - lastZombieSpawnRef.current > currentSpawnRate && progress < 100) {
      const row = Math.floor(Math.random() * GRID_ROWS);
      const types = [ZombieType.Normal, ZombieType.Normal, ZombieType.Conehead, ZombieType.Buckethead];
      // Introduce variety earlier
      const typeIndex = Math.floor(Math.random() * (progress > 15 ? (progress > 50 ? 4 : 3) : 2));
      const type = types[typeIndex];
      const config = ZOMBIE_CONFIGS[type];

      const newZombie: Zombie = {
        id: uuidv4(),
        type,
        row,
        x: 100, // Starts at right edge (100%)
        hp: config.hp,
        maxHp: config.hp,
        speed: config.speed,
        isEating: false
      };
      
      // Push directly to local state copy to prevent race condition with setZombies
      nextZombies.push(newZombie);
      lastZombieSpawnRef.current = now;
    }

    // 4. Simulation Step

    // --- A. Plants Act (Shoot / Produce) ---
    nextPlants.forEach(plant => {
      const config = PLANT_CONFIGS[plant.type];
      
      // Sunflower
      if (plant.type === EntityType.Sunflower) {
         if (now - plant.lastActionTime > (config.attackRate || 10000)) {
           const xPos = (plant.col / GRID_COLS) * 100;
           const yPos = (plant.row / GRID_ROWS) * 100;
           spawnSun(xPos + 2, yPos + 2); 
           plant.lastActionTime = now;
         }
      }
      
      // Shooters
      if (config.damage) {
        const zombieInLane = nextZombies.some(z => z.row === plant.row && z.x > (plant.col * (100/GRID_COLS)));
        
        if (zombieInLane && now - plant.lastActionTime > (config.attackRate || 1500)) {
          const shots = plant.type === EntityType.Repeater ? 2 : 1;
          for(let i=0; i<shots; i++) {
             nextProjectiles.push({
               id: uuidv4(),
               row: plant.row,
               x: (plant.col / GRID_COLS) * 100 + 5 + (i*2),
               damage: config.damage || 20,
               isFrozen: plant.type === EntityType.SnowPea
             });
          }
          plant.lastActionTime = now;
        }
      }
    });

    // --- B. Projectiles Move & Hit ---
    nextProjectiles = nextProjectiles.filter(p => {
      p.x += 2; // Move right
      
      let hit = false;
      // Find first zombie in range
      for (const z of nextZombies) {
        if (z.hp > 0 && z.row === p.row && p.x >= z.x && p.x <= z.x + 5) {
           hit = true;
           z.hp -= p.damage;
           if (p.isFrozen) {
             z.frozen = true;
             z.frozenTimer = 2000;
           }
           break; // Bullet destroys itself on first target
        }
      }
      
      return !hit && p.x < 100; // Keep if not hit and on screen
    });

    // --- C. Zombies Move & Eat ---
    let gameOver = false;
    nextZombies.forEach(z => {
       if (z.hp <= 0) return; // Skip dead (will be filtered later)

       // Check House Reached
       if (z.x < 0) {
         gameOver = true;
       }

       // Check Collision with Plant
       const colWidth = 100 / GRID_COLS;
       // Zombie center roughly at z.x. Plant center at col * colWidth.
       const zombieCol = Math.floor((z.x + 2) / colWidth); 
       
       const plantInSpot = nextPlants.find(p => p.row === z.row && p.col === zombieCol && p.hp > 0);
       
       if (plantInSpot) {
         z.isEating = true;
         plantInSpot.hp -= (ZOMBIE_CONFIGS[z.type].damage / 10); // Damage plant
         
         // Cherry Bomb Trigger
         if (plantInSpot.type === EntityType.CherryBomb) {
           plantInSpot.hp = 0; // Kill bomb
           z.hp = 0; // Kill zombie
         }
       } else {
         z.isEating = false;
         // Move
         let moveSpeed = z.speed;
         if (z.frozen && z.frozenTimer && z.frozenTimer > 0) {
           moveSpeed *= 0.5;
           z.frozenTimer -= TICK_RATE;
         }
         z.x -= moveSpeed;
       }
    });

    if (gameOver) {
      setStatus('GAME_OVER');
    }

    // --- Cleanup Dead Entities ---
    nextPlants = nextPlants.filter(p => p.hp > 0);
    nextZombies = nextZombies.filter(z => z.hp > 0);

    // --- Apply State ---
    setPlants(nextPlants);
    setZombies(nextZombies);
    setProjectiles(nextProjectiles);

  }, TICK_RATE);

  // --- User Interaction ---
  const handleGridClick = (row: number, col: number) => {
    if (status !== 'PLAYING') return;
    if (!selectedPlantType) return;

    const existing = getGridCell(row, col);
    if (existing) return;

    const config = PLANT_CONFIGS[selectedPlantType];
    if (sun >= config.cost) {
      const newPlant: Plant = {
        id: uuidv4(),
        type: selectedPlantType,
        row,
        col,
        hp: config.hp,
        maxHp: config.hp,
        lastActionTime: Date.now()
      };
      
      setPlants(prev => [...prev, newPlant]);
      setSun(prev => prev - config.cost);
      setSelectedPlantType(null);
    } else {
      setMessage("Not enough sun!");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const startGame = () => {
    setPlants([]);
    setZombies([]);
    setProjectiles([]);
    setSuns([]);
    setSun(150);
    setLevelProgress(0);
    setCrazyDaveTip("");
    setMessage("Welcome to the lawn!");
    
    const now = Date.now();
    levelStartTimeRef.current = now;
    lastSunSpawnRef.current = now;
    lastZombieSpawnRef.current = now; // Reset spawn timers
    
    setStatus('PLAYING');
  };

  // --- Rendering ---

  if (status === 'MENU') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/1920/1080?blur')] bg-cover" />
        <div className="z-10 text-center space-y-8 p-8 bg-black/50 rounded-3xl backdrop-blur-md border-4 border-green-600">
          <h1 className="text-6xl font-black text-green-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wider">
            PLANTS <span className="text-white text-4xl block my-2">vs</span> ZOMBIES
          </h1>
          <p className="text-xl text-green-100">React Edition</p>
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white text-2xl font-bold rounded-xl shadow-[0_6px_0_#14532d] hover:shadow-[0_3px_0_#14532d] hover:translate-y-[3px] transition-all"
          >
            START GAME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden font-sans select-none">
      {/* HUD */}
      <div className="flex-none h-24 bg-[#5d4037] border-b-4 border-black flex items-center px-4 space-x-4 z-50 shadow-xl relative">
        
        {/* Sun Counter */}
        <div className="relative flex items-center bg-[#3e2723] border-2 border-[#8d6e63] rounded-lg px-4 py-2 min-w-[120px]">
          <SunView sun={{ id: 'hud', x: 0, y: 0, value: 0, createdAt: 0 }} onClick={() => {}} />
          <span className="ml-10 text-2xl font-bold text-yellow-100">{Math.floor(sun)}</span>
        </div>

        {/* Plant Selector */}
        <div className="flex-1 flex space-x-2 overflow-x-auto py-2 px-2 scrollbar-hide">
          {Object.values(PLANT_CONFIGS).map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedPlantType(config.id)}
              disabled={sun < config.cost}
              className={`
                relative flex flex-col items-center justify-center w-16 h-20 rounded-lg border-2 transition-all
                ${selectedPlantType === config.id ? 'border-green-400 bg-green-900/80 ring-2 ring-green-400 scale-105' : 'border-[#8d6e63] bg-[#3e2723]'}
                ${sun < config.cost ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-[#4e342e] cursor-pointer'}
              `}
            >
              <config.icon size={24} className={config.color} />
              <span className="text-xs font-bold text-white mt-1">{config.cost}</span>
              <span className="text-[8px] text-gray-300 leading-none mt-0.5">{config.name}</span>
            </button>
          ))}
        </div>

        {/* Dave Button */}
        <button 
           onClick={askCrazyDave}
           disabled={loadingDave}
           className="flex flex-col items-center justify-center p-2 bg-blue-900/80 border-2 border-blue-500 rounded-lg hover:bg-blue-800 transition-colors w-24"
        >
          {loadingDave ? <RefreshCw className="animate-spin text-white" size={24}/> : <Brain className="text-pink-400" size={24} />}
          <span className="text-[10px] text-white font-bold mt-1">CRAZY DAVE</span>
        </button>

        {/* Controls */}
        <div className="flex space-x-2">
           <button onClick={() => setStatus(status === 'PAUSED' ? 'PLAYING' : 'PAUSED')} className="p-2 bg-gray-700 rounded hover:bg-gray-600 text-white">
             {status === 'PAUSED' ? <Play size={20}/> : <Pause size={20}/>}
           </button>
           <button onClick={() => setStatus('MENU')} className="p-2 bg-red-900 rounded hover:bg-red-800 text-white">
             Esc
           </button>
        </div>
      </div>
      
      {/* Crazy Dave Message Bubble */}
      {crazyDaveTip && (
        <div className="absolute top-28 right-4 z-50 max-w-xs animate-in fade-in slide-in-from-right-10">
          <div className="bg-white text-black p-4 rounded-2xl rounded-tr-none shadow-2xl border-4 border-black relative font-mono text-sm">
             <button onClick={() => setCrazyDaveTip("")} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-red-600">&times;</button>
             <p>"{crazyDaveTip}"</p>
             <div className="text-xs text-gray-500 mt-2 text-right">- Crazy Dave</div>
          </div>
        </div>
      )}

      {/* Game Board Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-green-800">
        {/* Background Lawn */}
        <div className="relative w-[1000px] h-[600px] bg-green-600 shadow-2xl border-8 border-green-900 rounded-lg overflow-hidden">
            {/* Checkerboard Pattern */}
            {Array.from({ length: GRID_ROWS }).map((_, r) => (
              <div key={r} className="flex h-[20%] w-full">
                {Array.from({ length: GRID_COLS }).map((_, c) => (
                  <div 
                    key={`${r}-${c}`}
                    onClick={() => handleGridClick(r, c)}
                    className={`
                      w-full h-full border-black/5 relative cursor-pointer hover:bg-white/5 transition-colors
                      ${(r + c) % 2 === 0 ? 'bg-green-600' : 'bg-green-500'}
                    `}
                  >
                    {/* Highlight Valid Placement */}
                    {selectedPlantType && !getGridCell(r, c) && (
                       <div className="absolute inset-0 bg-green-400/30 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Entities */}
            {plants.map(plant => <PlantView key={plant.id} plant={plant} />)}
            {zombies.map(zombie => <ZombieView key={zombie.id} zombie={zombie} />)}
            {projectiles.map(proj => <ProjectileView key={proj.id} projectile={proj} />)}
            {suns.map(s => <SunView key={s.id} sun={s} onClick={collectSun} />)}
            
            {/* Level Progress Bar (Bottom) */}
            <div className="absolute bottom-2 right-2 left-2 h-4 bg-black/50 rounded-full overflow-hidden border border-white/20">
               <div 
                 className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-500"
                 style={{ width: `${levelProgress}%` }}
               />
               <div className="absolute top-0 right-0 h-full w-px bg-white/50" /> {/* Flag post */}
            </div>
        </div>
        
        {/* Message Overlay */}
        {message && status === 'PLAYING' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-4xl font-black text-red-600 drop-shadow-[0_2px_0_#fff] animate-bounce z-50 whitespace-nowrap">
            {message}
          </div>
        )}
      </div>

      {/* Overlays (Win/Loss) */}
      {(status === 'GAME_OVER' || status === 'VICTORY') && (
        <div className="absolute inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <h2 className={`text-8xl font-black mb-8 ${status === 'VICTORY' ? 'text-yellow-400' : 'text-red-600'} drop-shadow-xl`}>
            {status === 'VICTORY' ? 'VICTORY!' : 'THE ZOMBIES ATE YOUR BRAINS!'}
          </h2>
          <button 
            onClick={startGame}
            className="px-8 py-4 bg-white text-black text-2xl font-bold rounded hover:scale-105 transition-transform"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}