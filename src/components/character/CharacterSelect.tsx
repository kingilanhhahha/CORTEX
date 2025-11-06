import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlayer, CadetAvatarId } from '@/contexts/PlayerContext';

import marisse from './baby ko.png';
import charmelle from './charmelle.png';
import chriselle from './CHRISELLE.png';
import king from './KING.png';
import jeremiahUniform from './Jeremiah_Uniform.png';

import KRISEL_SUIT from './KRISEL_SUIT.png';
import CHARMELLE_SUIT from './CHARMELLE_SUIT.png';
import KING_SUIT from './KING_SUIT.png';
import JEREMIAH_SUIT from './JEREMIAH_SUIT.png';

// Note: suit images will be used elsewhere (e.g., in Solar System) based on context

type CharacterOption = {
  id: CadetAvatarId;
  name: string;
  image: string;
  tag: string;
  blurb: string;
};

interface CharacterSelectProps {
  onClose?: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onClose }) => {
  const { cadetAvatar, setCadetAvatar } = usePlayer();
  const [hovered, setHovered] = useState<CadetAvatarId | null>(null);
  const [selected, setSelected] = useState<CadetAvatarId>(cadetAvatar);

  const options = useMemo<CharacterOption[]>(() => [
    { id: 'marisse', name: 'Marisse', image: marisse, tag: 'Cadet', blurb: 'Bright-eyed explorer with boundless curiosity.' },
    { id: 'charmelle', name: 'Charmelle', image: charmelle, tag: 'Cadet', blurb: 'Graceful navigator with stellar intuition.' },
    { id: 'chriselle', name: 'Chriselle', image: chriselle, tag: 'Cadet', blurb: 'Tough problem-smasher with a heart of gold.' },
    { id: 'king', name: 'King', image: king, tag: 'Cadet', blurb: 'Stoic analyst who sees truths in the stars.' },
    { id: 'jeremiah', name: 'Jeremiah', image: jeremiahUniform, tag: 'Cadet', blurb: 'Cheerful mechanic who optimizes your flight plan.' },
  ], []);

  const active = options.find(o => o.id === selected) ?? options[0];

  return (
    <motion.div
      className="fixed inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* cosmic glass overlay */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(1200px 600px at 20% 10%, rgba(0,200,255,0.12), transparent 60%), radial-gradient(1000px 500px at 80% 90%, rgba(255,0,200,0.10), transparent 60%), rgba(0,0,0,0.35)'
      }} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-5xl"
          initial={{ y: 20, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="relative p-6 md:p-8 bg-gradient-card/70 backdrop-blur-md border border-white/10">
            <div className="absolute -inset-0.5 rounded-xl opacity-20 pointer-events-none" style={{
              background: 'conic-gradient(from 0deg, rgba(0,212,255,0.4), rgba(255,0,212,0.4), rgba(0,212,255,0.4))',
              filter: 'blur(18px)'
            }} />

            <div className="relative">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-orbitron text-2xl md:text-3xl">Choose Your Cadet</h2>
                  <p className="text-sm text-muted-foreground">Pick your explorer. Co‑Pilot remains unchanged.</p>
                </div>
                {onClose && (
                  <Button variant="outline" onClick={onClose} className="holographic-border">Close</Button>
                )}
              </div>

              {/* selector grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    onMouseEnter={() => setHovered(opt.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelected(opt.id)}
                    className={`relative rounded-xl overflow-hidden border transition-colors ${selected === opt.id ? 'border-primary' : 'border-white/10'}`}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="aspect-square bg-black/30">
                      <img src={opt.image} alt={opt.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4))'
                    }} />
                    <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10">
                        <span className="font-orbitron text-xs text-white/90">{opt.name}</span>
                        {selected === opt.id && <span className="text-xs text-cosmic-green">Selected</span>}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* detail panel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="relative p-4 md:p-6 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="absolute -top-4 left-6 text-xs font-orbitron text-white/70">Profile</div>
                    <h3 className="font-orbitron text-xl mb-2">{active.name}</h3>
                    <p className="text-sm text-white/70">{active.blurb}</p>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <Button
                      className="bg-gradient-quest"
                      onClick={() => { setCadetAvatar(active.id); onClose?.(); }}
                    >
                      Confirm Selection
                    </Button>
                    <div className="text-xs text-white/60">Your co‑pilot avatar will not change.</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CharacterSelect;





