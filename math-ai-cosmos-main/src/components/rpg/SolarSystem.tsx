import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export interface LessonPlanet {
  id: string;
  name: string;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  color: string;
  locked: boolean;
  hasMoon?: boolean;
  imageUrl?: string;
}

interface SolarSystemProps {
  planets: LessonPlanet[];
  onLessonSelect?: (id: string) => void;
  onBack?: () => void;
}

// Lore mapping per planet id
const planetLore: Record<string, { title: string; tagline: string; focus: string; teacher: string }> = {
  'lesson-1': {
    title: 'Mercury — The First Signal',
    tagline: 'Learn the anatomy of rational equations.',
    focus: 'Definition, parts, restrictions (idea)',
    teacher: 'Recognize the parts before you move them.'
  },
  'lesson-2': {
    title: 'Venus — The Forge of Factors',
    tagline: 'Factor denominators; forge the LCD.',
    focus: 'Factoring, LCD construction',
    teacher: 'If you can factor it, you can master it.'
  },
  'lesson-3': {
    title: 'Earth — Clear the Skies',
    tagline: 'Multiply by LCD and cancel with purpose.',
    focus: 'Multiply by LCD, cancellations, simplified form',
    teacher: 'Clear the clutter; see the path.'
  },
  'lesson-4': {
    title: 'Mars — Ghost Solutions',
    tagline: 'Spot and reject the fakes.',
    focus: 'Restrictions, extraneous solutions',
    teacher: 'If it zeros a denominator, it’s not welcome.'
  },
  'lesson-5': {
    title: 'Jupiter — Engines of Application',
    tagline: 'Turn stories into equations.',
    focus: 'Word problems with rational expressions',
    teacher: 'Translate stories into equations; the math will follow.'
  },
  'lesson-6': {
    title: 'Saturn — Rings of Power',
    tagline: 'Powers and repeated factors shape the LCD.',
    focus: 'LCD with powers, careful simplification',
    teacher: 'Respect exponents; they decide the LCD’s strength.'
  },
  'lesson-7': {
    title: 'Uranus — Winds of Graphs',
    tagline: 'Read asymptotes and intercepts like star maps.',
    focus: 'Graph features of rational functions',
    teacher: 'Asymptotes are boundaries, not barriers.'
  },
  'lesson-8': {
    title: 'Neptune — The Final Trial',
    tagline: 'Everything together, with proofs.',
    focus: 'Full pipeline + justification',
    teacher: 'Prove it, don’t just find it.'
  }
};

const SolarSystem: React.FC<SolarSystemProps> = ({ planets, onLessonSelect, onBack }) => {
  const [time, setTime] = useState(0);
  const [selectedPlanet, setSelectedPlanet] = useState<LessonPlanet | null>(null);
  const [isOrbiting, setIsOrbiting] = useState(true);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOrbiting) return;
    
    const interval = setInterval(() => {
      setTime(prev => prev + 0.02);
    }, 16);
    return () => clearInterval(interval);
  }, [isOrbiting]);

  const handlePlanetClick = (planet: LessonPlanet) => {
    if (planet.locked) return;
    
    // Navigate to specific lesson based on planet ID
    if (planet.id === 'lesson-1') { navigate('/mercury-lesson'); return; }
    if (planet.id === 'lesson-2') { navigate('/venus-lesson'); return; }
    if (planet.id === 'lesson-3') { navigate('/earth-lesson'); return; }
    if (planet.id === 'lesson-4') { navigate('/mars-lesson'); return; }
    if (planet.id === 'lesson-5') { navigate('/jupiter-lesson'); return; }
    if (planet.id === 'lesson-6') { navigate('/saturn-lesson'); return; }
    if (planet.id === 'lesson-7') { navigate('/uranus-lesson'); return; }
    if (planet.id === 'lesson-8') { navigate('/neptune-lesson'); return; }
    
    setSelectedPlanet(planet);
  };

  const toggleOrbiting = () => {
    setIsOrbiting(!isOrbiting);
  };

  // Determine which lore to show in side panel
  const activeLoreId = hoveredPlanetId || selectedPlanet?.id || null;
  const activeLore = activeLoreId ? planetLore[activeLoreId] : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-cosmos">
      {/* Stars background */}
      <div className="absolute inset-0 cosmic-starfield opacity-30" />
      
      {/* Aesthetic lore panel (left) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden md:block absolute left-6 top-[18%] z-30 w-[320px] lg:w-[380px] pointer-events-none"
      >
        <div
          className="rounded-2xl border p-5 max-h-[70vh] overflow-y-auto pr-2 pointer-events-auto scrollbar-transparent"
          style={{ 
            borderColor: 'rgba(255,255,255,0.05)', 
            backgroundColor: 'transparent', 
            boxShadow: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {!activeLore && (
            <>
              <div className="mb-2 text-xs tracking-widest uppercase text-white/60 font-orbitron">Cosmic Lore</div>
              <h3 className="mb-3 font-orbitron font-semibold text-lg bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                The Rational System
              </h3>
              <p className="text-sm leading-relaxed text-white/70">
                In this galaxy, each orbit is a denominator — the path a fraction takes. Balance happens when all
                terms travel the <span className="text-white/90">same ring</span>, so their speeds align and comparisons are fair.
              </p>
              <div className="my-3 h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-orbitron tracking-wide text-white/60">Key Ideas</div>
                  <ul className="mt-1 space-y-1.5 text-sm text-white/65">
                    <li>• LCD = the shared orbit that lets every term fly together.</li>
                    <li>• Clear denominators = move everything onto the LCD ring.</li>
                    <li>• Cross-multiply = match thrust between two balanced paths.</li>
                    <li>• Restrictions: avoid <span className="text-white/85">forbidden orbits</span> (denominators ≠ 0).</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-orbitron tracking-wide text-white/60">Mission Steps</div>
                  <ol className="mt-1 space-y-1.5 text-sm text-white/65 list-decimal list-inside">
                    <li>Identify restricted values from each denominator.</li>
                    <li>Find the LCD and multiply every term by it.</li>
                    <li>Solve the simpler equation and <span className="text-white/85">check for extraneous</span>.</li>
                  </ol>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/55">
                <span className="inline-block h-1 w-10 rounded-full bg-gradient-to-r from-cyan-300/30 to-transparent" />
                Tip: Hover a planet to preview its mission.
              </div>
            </>
          )}
          {activeLore && (
            <>
              <div className="mb-2 text-xs tracking-widest uppercase text-white/60 font-orbitron">Mission Briefing</div>
              <h3 className="mb-2 font-orbitron font-semibold text-lg text-white">{activeLore.title}</h3>
              <p className="text-sm text-white/85 mb-2">{activeLore.tagline}</p>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-3">
                <div className="text-xs text-white/60 mb-1">Focus</div>
                <div className="text-sm text-white/85">{activeLore.focus}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-xs text-white/60 mb-1">Navigator</div>
                <div className="text-sm text-white/85">“{activeLore.teacher}”</div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Square arena to keep orbits perfectly circular */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: 'min(90vmin, 900px)',
          height: 'min(90vmin, 900px)',
          transform: 'translate(-50%, -50%)',
        }}
      >

      {/* Central Sun with enhanced aesthetics */}
      <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%)' }}>
        {/* Sun core */}
        <motion.div
          className="w-24 h-24 bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 rounded-full relative"
        animate={{ 
          boxShadow: [
              '0 0 60px rgba(255, 193, 7, 0.8)',
              '0 0 120px rgba(255, 107, 0, 0.9)',
              '0 0 180px rgba(255, 69, 0, 0.7)',
              '0 0 120px rgba(255, 107, 0, 0.9)',
              '0 0 60px rgba(255, 193, 7, 0.8)'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Sun surface details */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-orange-400 to-red-500 opacity-70" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-100 via-orange-300 to-red-400 opacity-50" />
          
          {/* Sun corona effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,193,7,0.2) 30%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        
        {/* Sun rays */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(255,193,7,0.3), transparent, rgba(255,107,0,0.3), transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Orbital lines for all planets */}
      {planets.map((planet) => (
        <div
          key={`orbit-${planet.id}`}
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none z-0"
          style={{
            width: `${planet.orbitRadius * 6}%`,
            height: `${planet.orbitRadius * 6}%`,
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(255,255,255,0.25)'
          }}
        />
      ))}

      {/* Planets with slot design */}
      {planets.map((planet, index) => {
        const angle = time * planet.orbitSpeed + (index * Math.PI / 3);
        const x = Math.cos(angle) * planet.orbitRadius * 3 + 50; // Scale for screen
        const y = Math.sin(angle) * planet.orbitRadius * 3 + 50;
        const BASE_SIZE = 96; // px baseline for planet diameter at size=1 (larger planets)
        const diameter = planet.size * BASE_SIZE; // main planet diameter
        const shadowDiameter = diameter; // same as planet
        const glowDiameter = diameter * 1.25; // outer glow ring
        const glowOffset = (glowDiameter - diameter) / 2; // center the glow
        const highlightDiameter = diameter * 0.6;
        const highlightOffset = diameter * 0.2;
        const ringWidth = diameter * 1.6;
        const ringHeight = diameter * 0.45;
        const ringLeft = -(ringWidth - diameter) / 2;
        const ringTop = diameter * 0.5;
        const normalizedImageUrl = planet.imageUrl
          ? (planet.imageUrl.startsWith('/')
              ? planet.imageUrl
              : `/${planet.imageUrl.replace(/^public\//, '').replace(/^\//, '')}`)
          : undefined;

        const lore = planetLore[planet.id];

        return (
          <motion.div
            key={planet.id}
            className="absolute cursor-pointer z-10 group"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              filter: planet.locked ? 'grayscale(0.7) brightness(0.6)' : 'none',
            }}
            whileHover={{ scale: 1.3, zIndex: 10 }}
            onClick={() => handlePlanetClick(planet)}
            onMouseEnter={() => setHoveredPlanetId(planet.id)}
            onMouseLeave={() => setHoveredPlanetId(prev => (prev === planet.id ? null : prev))}
          >
            {/* Planet with slot design for image replacement */}
            <div className="relative">
              {/* Planet shadow */}
              <div
                className="absolute rounded-full bg-black/30"
                style={{
                  width: `${shadowDiameter}px`,
                  height: `${shadowDiameter}px`,
                  transform: 'translate(3px, 3px)',
                }}
              />
              
              {/* Outer glow ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: `${glowDiameter}px`,
                  height: `${glowDiameter}px`,
                  left: `${-glowOffset}px`,
                  top: `${-glowOffset}px`,
                  background: `radial-gradient(circle, ${planet.color}30 0%, transparent 70%)`,
                  filter: 'blur(3px)',
                }}
              />
              
              {/* Main planet slot container */}
            <motion.div
                className={`rounded-full relative overflow-hidden border-2 ${planet.locked ? 'border-gray-500 bg-gray-600' : 'bg-white/10'}`}
              style={{
                  width: `${diameter}px`,
                  height: `${diameter}px`,
                  background: planet.locked ? 'linear-gradient(145deg, #4a5568, #2d3748)' : `radial-gradient(circle at 30% 30%, ${planet.color}dd, ${planet.color}aa, ${planet.color}88)`,
                  boxShadow: planet.locked ? 
                    'inset 2px 2px 4px rgba(255,255,255,0.1), inset -2px -2px 4px rgba(0,0,0,0.3), 0 0 15px rgba(107, 114, 128, 0.4)' : 
                    `inset 2px 2px 8px rgba(255,255,255,0.3), inset -2px -2px 8px rgba(0,0,0,0.3), 0 0 25px ${planet.color}50, 0 0 40px ${planet.color}30`,
                  borderColor: planet.locked ? '#6b7280' : planet.color,
              }}
              animate={planet.locked ? {} : {
                boxShadow: [
                    `inset 2px 2px 8px rgba(255,255,255,0.3), inset -2px -2px 8px rgba(0,0,0,0.3), 0 0 25px ${planet.color}50, 0 0 40px ${planet.color}30`,
                    `inset 2px 2px 8px rgba(255,255,255,0.4), inset -2px -2px 8px rgba(0,0,0,0.4), 0 0 35px ${planet.color}60, 0 0 50px ${planet.color}40`,
                    `inset 2px 2px 8px rgba(255,255,255,0.3), inset -2px -2px 8px rgba(0,0,0,0.3), 0 0 25px ${planet.color}50, 0 0 40px ${planet.color}30`
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {/* Image slot: always render image if provided (even when locked) */}
                {normalizedImageUrl ? (
                  <img src={normalizedImageUrl} alt={planet.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center text-white/60 text-xs">
                    🌍
                  </div>
                )}
                
                {/* Planet surface details for non-image planets (only for unlocked) */}
                {!planet.locked && !normalizedImageUrl && (
                  <>
                    {/* Surface texture */}
                    <div
                      className="absolute inset-0 rounded-full opacity-30"
                      style={{
                        background: `radial-gradient(circle at 20% 20%, ${planet.color}ff 0%, transparent 50%), 
                                   radial-gradient(circle at 80% 80%, ${planet.color}cc 0%, transparent 40%)`,
                      }}
                    />
                    
                    {/* Atmospheric glow */}
                    <div
                      className="absolute inset-0 rounded-full opacity-20"
                      style={{
                        background: `radial-gradient(circle, ${planet.color}40 0%, transparent 70%)`,
                      }}
                    />
                    
                    {/* Planet rings (for gas giants) */}
                    {planet.size > 1.5 && (
                      <div
                        className="absolute rounded-full border-2 border-white/20"
                        style={{
                          width: `${ringWidth}px`,
                          height: `${ringHeight}px`,
                          left: `${ringLeft}px`,
                          top: `${ringTop}px`,
                          transform: 'rotateX(75deg)',
                        }}
                      />
                    )}
                  </>
                )}
                
                {/* Lock icon for locked planets */}
              {planet.locked && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                  🔒
                </div>
              )}
            </motion.div>
              
              {/* Planet highlight */}
              {!planet.locked && (
                <div
                  className="absolute rounded-full opacity-60"
                  style={{
                    width: `${highlightDiameter}px`,
                    height: `${highlightDiameter}px`,
                    left: `${highlightOffset}px`,
                    top: `${highlightOffset}px`,
                    background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                  }}
                />
              )}

              {/* Hover bubble with simple dialogue */}
              {lore && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="relative bg-black/75 backdrop-blur-sm text-white text-xs rounded-lg px-4 py-2 border border-white/10 shadow-xl w-[320px] whitespace-normal">
                    {/* Arrow */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black/75" />
                    <div className="font-semibold mb-1 truncate">{lore.title}</div>
                    <div className="truncate">Cadet: {lore.tagline}</div>
                    <div className="text-white/80 truncate">Navigator: {lore.teacher}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Planet Label - Only visible on hover */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-orbitron border border-white/20">
                {planet.name}
              </div>
            </div>
          </motion.div>
        );
      })}

      </div>

      {/* Spaceship with enhanced design */}
      <motion.div
        className="absolute"
        style={{
          left: '60%',
          top: '45%',
        }}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Spaceship shadow */}
        <div className="w-4 h-6 bg-black/30 rounded-t-full transform translate-x-1 translate-y-1" />
        
        {/* Spaceship body */}
        <div className="relative w-4 h-6 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700 rounded-t-full">
          {/* Cockpit */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-cyan-300 rounded-full opacity-80" />
          
          {/* Engine glow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-cyan-400 rounded-b-full opacity-60" />
        </div>
        
        {/* Engine trail */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gradient-to-t from-cyan-400 to-transparent rounded-b-full"
          animate={{
            height: [12, 20, 12],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>

      {/* Control Buttons */}
      <div className="absolute top-6 left-6 z-50 flex gap-3">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
          >
            ← Return to Station
          </Button>
        )}
        <Button
          onClick={toggleOrbiting}
          variant="outline"
          className="bg-black/60 backdrop-blur-sm border-white/20 text-white hover:bg-black/80"
        >
          {isOrbiting ? '⏸️ Stop Orbits' : '▶️ Start Orbits'}
        </Button>
      </div>

      {/* Planet Selection Modal */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlanet(null)}
          >
            <motion.div
              className="w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full overflow-hidden"
                      style={{ 
                        background: `radial-gradient(circle at 30% 30%, ${selectedPlanet.color}dd, ${selectedPlanet.color}aa, ${selectedPlanet.color}88)`,
                        boxShadow: `inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3), 0 0 15px ${selectedPlanet.color}40`
                      }}
                    >
                      {selectedPlanet.imageUrl && (
                        <img src={selectedPlanet.imageUrl} alt={selectedPlanet.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold text-lg">
                      {selectedPlanet.name}
                    </h3>
                    {planetLore[selectedPlanet.id] && (
                      <p className="text-sm text-muted-foreground">
                        {planetLore[selectedPlanet.id].tagline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPlanet(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (onLessonSelect && selectedPlanet) onLessonSelect(selectedPlanet.id);
                      setSelectedPlanet(null);
                      handlePlanetClick(selectedPlanet);
                    }}
                    className="flex-1 bg-gradient-quest"
                  >
                    Start Lesson
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SolarSystem;
