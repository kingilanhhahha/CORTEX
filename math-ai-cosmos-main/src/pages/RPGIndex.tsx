import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, BookOpen, Map, Package, Home, LogOut } from 'lucide-react';
import Confetti from 'react-confetti';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { resolveProgressRoute } from '@/App';

// RPG Components
import CosmicBackground from '@/components/rpg/CosmicBackground';
import RPGHeader from '@/components/rpg/RPGHeader';
import QuestMap from '@/components/rpg/QuestMap';
import CosmicNPC from '@/components/rpg/CosmicNPC';
import HolographicCard from '@/components/rpg/HolographicCard';
import SolarSystem from '@/components/rpg/SolarSystem';
import DialogueBox from '@/components/character/DialogueBox';
import AchievementDisplay from '@/components/rpg/AchievementDisplay';

// New avatar mapping
import marisse from '@/components/character/baby ko.png';
import charmelle from '@/components/character/charmelle.png';
import chriselle from '@/components/character/CHRISELLE.png';
import king from '@/components/character/KING.png';
import jeremiah from '@/components/character/Jeremiah_Uniform.png';

import KRISEL_SUIT from '@/components/character/KRISEL_SUIT.png';
import CHARMELLE_SUIT from '@/components/character/CHARMELLE_SUIT.png';
import KING_SUIT from '@/components/character/KING_SUIT.png';
import JEREMIAH_SUIT from '@/components/character/JEREMIAH_SUIT.png';
import MARISSE_SUIT from '@/components/character/MARISSE_SUIT-.png';

import CharacterSelect from '@/components/character/CharacterSelect';
import { usePlayer } from '@/contexts/PlayerContext';
import loloChar from '@/components/character/lolo.png';
import woaaaa from '@/woaaaa.mp3';
import welcomeAboard from '@/components/character/WELCOME ABOARD.mp3';
import calculationsLikeMath from '@/components/character/CALCULATIONS. LIKE MATH.mp3';
import notJustMath from '@/components/character/not just math.mp3';
import letsGoo from '@/components/character/LETS GOO.mp3';
import prepare from '@/components/character/PREPARE.mp3';
import ClassroomGate from '@/components/classroom/ClassroomGate';
import mercuryImg from '@/components/other planets/mercury.png';
import venusImg from '@/components/other planets/Venus_globe-removebg-preview.png';
import marsImg from '@/components/other planets/mars.png';
import jupiterImg from '@/components/other planets/junpiter.png';
import saturnImg from '@/components/other planets/saturn.png';
import uranusImg from '@/components/other planets/uranus.png';
import neptuneImg from '@/components/other planets/neptune1.png';

// Game Components
import XPBar from '@/components/game/XPBar';
import LessonCard from '@/components/lesson/LessonCard';

const RPGIndex = () => {
  const [showQuestMap, setShowQuestMap] = useState(false);
  const [showSolar, setShowSolar] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introStep, setIntroStep] = useState<number>(1);
  const [doFlash, setDoFlash] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('home');
  const [showCelebration, setShowCelebration] = useState(false);
  const [userLevel] = useState(5);
  const [userXP] = useState(1250);
  const [maxXP] = useState(1500);
  const [stardust] = useState(2847);
  const [relics] = useState(12);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Solar System intro state
  const [showSolarIntro, setShowSolarIntro] = useState(false);
  const [solarIntroStep, setSolarIntroStep] = useState(1);

  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { cadetAvatar, currentProgress, getOverallProgress } = usePlayer();
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  // --- BEGIN ADD: continue handler ---
  function handleContinue() {
    const path = resolveProgressRoute(currentProgress);
    navigate(path);
  }

  // Dynamic lesson info based on progress
  function getCurrentLessonInfo() {
    const moduleId = currentProgress.module_id || 'mercury';
    
    const lessonInfo: Record<string, { title: string; description: string; planet: string; color: string }> = {
      'mercury': {
        title: 'Basic Concepts Review',
        description: 'Master fundamental concepts and basic rational equations.',
        planet: 'Mercury',
        color: 'from-gray-500 to-gray-700'
      },
      'venus': {
        title: 'Introduction to Rational Equations', 
        description: 'Learn the foundations of rational equation solving.',
        planet: 'Venus',
        color: 'from-yellow-500 to-orange-500'
      },
      'earth': {
        title: 'Core Rational Equations',
        description: 'Develop core skills in rational equation manipulation.',
        planet: 'Earth',
        color: 'from-blue-500 to-green-500'
      },
      'mars': {
        title: 'Rational Inequalities',
        description: 'Master the art of solving rational inequalities in the volcanic terrain.',
        planet: 'Mars',
        color: 'from-red-500 to-red-900'
      },
      'jupiter': {
        title: 'Advanced Problem Types',
        description: 'Tackle complex rational equation scenarios.',
        planet: 'Jupiter',
        color: 'from-orange-500 to-red-500'
      },
      'saturn': {
        title: 'Mastery Challenges',
        description: 'Complete advanced challenges and ring-based problems.',
        planet: 'Saturn',
        color: 'from-yellow-600 to-orange-600'
      },
      'uranus': {
        title: 'Creative Applications',
        description: 'Apply rational equations to real-world scenarios.',
        planet: 'Uranus',
        color: 'from-cyan-500 to-blue-500'
      },
      'neptune': {
        title: 'Final Assessments',
        description: 'Demonstrate mastery through comprehensive evaluations.',
        planet: 'Neptune',
        color: 'from-blue-600 to-purple-600'
      }
    };

    return lessonInfo[moduleId.toLowerCase()] || lessonInfo['mercury'];
  }
  // --- END ADD ---

  // Discover female voice files for constellation cadet lines
  const femaleVoices = useMemo(() => {
    try {
      const modules = import.meta.glob('/src/components/character/girl oice/*.mp3', {
        eager: true,
        as: 'url',
      }) as Record<string, string>;
      const entries = Object.entries(modules);
      const find = (re: RegExp) => entries.find(([path]) => re.test(path))?.[1] || null;
      return {
        step1: find(/woa/i) || find(/whoa/i) || null,
        step3: find(/calculation/i) || null,
        step5: find(/let\s*\s*goo|lets\s*goo/i) || find(/let/i) || null,
      } as { step1: string | null; step3: string | null; step5: string | null };
    } catch {
      return { step1: null, step3: null, step5: null };
    }
  }, []);

  // Solar system convo files (gendered and neutral)
  const solarConvo = useMemo(() => {
    try {
      const mods = import.meta.glob('/solar system convo/*.mp3', { eager: true, as: 'url' }) as Record<string, string>;
      const entries = Object.entries(mods);
      const findBoy = (pattern: RegExp) => entries.find(([k]) => /boy/i.test(k) && pattern.test(k))?.[1] || null;
      const findGirl = (pattern: RegExp) => entries.find(([k]) => /girl/i.test(k) && pattern.test(k))?.[1] || null;
      const findNeutral = (pattern: RegExp) => entries.find(([k]) => !/boy|girl/i.test(k) && pattern.test(k))?.[1] || null;
      return {
        cadetWhoahBoy: findBoy(/Whoa.*view/i),
        cadetWhoahGirl: findGirl(/Whoa.*view/i),
        cadetLessonBoy: findBoy(/every\s+planet\s+has\s+a\s+lesson/i),
        cadetLessonGirl: findGirl(/every\s+planet\s+has\s+a\s+lesson/i),
        cadetReadyBoy: findBoy(/ready\s+to\s+learn/i),
        cadetReadyGirl: findGirl(/ready\s+to\s+learn/i),
        navImpressive: findNeutral(/Impressive/i),
        navExactly: findNeutral(/Exactly/i),
        navMercury: findNeutral(/^Good\./i),
      };
    } catch {
      return {} as any;
    }
  }, []);

  const isFemaleCadet = ['marisse', 'charmelle', 'chriselle'].includes(cadetAvatar);

  const playAudio = (src: string, volume = 0.95) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(src);
      audio.volume = volume;
      audioRef.current = audio;
      void audio.play();
    } catch (e) {}
  };

  // Function to get appropriate audio based on cadet character (constellation intro)
  const getCadetAudio = (step: number) => {
    const femaleCadets = ['marisse', 'charmelle', 'chriselle'];
    const isFemale = femaleCadets.includes(cadetAvatar);

    if (!isFemale) {
      // Male voices
      switch (step) {
        case 1: return woaaaa;
        case 3: return calculationsLikeMath;
        case 5: return letsGoo;
        default: return woaaaa;
      }
    }

    // Female voices if available; fallback to male assets if not found
    switch (step) {
      case 1: return femaleVoices.step1 ?? woaaaa;
      case 3: return femaleVoices.step3 ?? calculationsLikeMath;
      case 5: return femaleVoices.step5 ?? letsGoo;
      default: return woaaaa;
    }
  };

  // Solar system intro voice resolver by step
  const getSolarAudioForStep = (step: number): string | null => {
    switch (step) {
      case 1: // Cadet: Whoa… look at this view!
        return isFemaleCadet ? (solarConvo as any).cadetWhoahGirl : (solarConvo as any).cadetWhoahBoy;
      case 2: // Navigator: Impressive, isn’t it…
        return (solarConvo as any).navImpressive || null;
      case 3: // Cadet: So every planet has a lesson?
        return isFemaleCadet ? (solarConvo as any).cadetLessonGirl : (solarConvo as any).cadetLessonBoy;
      case 4: // Navigator: Exactly. From the swift orbit…
        return (solarConvo as any).navExactly || null;
      case 5: // Cadet: Then let’s start the journey. I’m ready to learn.
        return isFemaleCadet ? (solarConvo as any).cadetReadyGirl : (solarConvo as any).cadetReadyBoy;
      case 6: // Navigator: Good. Your first destination: Mercury…
        return (solarConvo as any).navMercury || null;
      default:
        return null;
    }
  };

  // Base portrait mapping (non-solar scenes)
  const cadetImageMap: Record<string, string> = {
    'marisse': marisse,
    'charmelle': charmelle,
    'chriselle': chriselle,
    'king': king,
    'jeremiah': jeremiah,
  };

  // Suit portrait mapping for Solar System scene
  const cadetSuitMap: Record<string, string> = {
    'marisse': MARISSE_SUIT,
    'charmelle': CHARMELLE_SUIT,
    'chriselle': KRISEL_SUIT,
    'king': KING_SUIT,
    'jeremiah': JEREMIAH_SUIT,
  };

  const selectedCadetImg = (showSolar ? cadetSuitMap[cadetAvatar] : cadetImageMap[cadetAvatar]) ?? king;

  // Show loading state while AuthContext is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading RPG Mode...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Quest Data for Galaxy Map (unchanged except ids/positions kept)
  const questNodes = [
    {
      id: 'intro-rational',
      title: 'Rational Equation',
      description: 'Begin your journey in the Nebula of Numbers. Learn the fundamentals of rational equations.',
      difficulty: 'beginner' as const,
      status: 'completed' as const,
      xpReward: 150,
      position: { x: 20, y: 60 },
      connections: ['basic-solving'],
      planetType: 'forest' as const
    },
    {
      id: 'basic-solving',
      title: 'Rational Function',
      description: 'Explore the Philippines archipelago and solve rational function challenges across different regions.',
      difficulty: 'beginner' as const,
      status: 'available' as const,
      xpReward: 200,
      position: { x: 40, y: 40 },
      connections: ['rational-inequalities'],
      planetType: 'crystal' as const
    },
    {
      id: 'rational-inequalities',
      title: 'Rational Inequalities',
      description: 'Explore the Volcanic Plains of Variables. Understand inequality relationships.',
      difficulty: 'intermediate' as const,
      status: 'locked' as const,
      xpReward: 250,
      position: { x: 60, y: 30 },
      connections: ['complex-equations', 'graphing-challenge'],
      planetType: 'volcanic' as const
    },
    {
      id: 'complex-equations',
      title: 'Inverse Function',
      description: 'Venture into the Ice Moons of Infinity. Tackle advanced equation systems.',
      difficulty: 'advanced' as const,
      status: 'locked' as const,
      xpReward: 350,
      position: { x: 80, y: 50 },
      connections: ['mastery-challenge'],
      planetType: 'ice' as const
    },
    {
      id: 'graphing-challenge',
      title: 'Graphing Rational Functions',
      description: 'Journey through the Desert of Derivatives. Visualize function behaviors.',
      difficulty: 'intermediate' as const,
      status: 'locked' as const,
      xpReward: 300,
      position: { x: 45, y: 70 },
      connections: ['mastery-challenge'],
      planetType: 'desert' as const
    },
    {
      id: 'mastery-challenge',
      title: 'The Nebula Nexus',
      description: 'Face the ultimate test in the Cosmic Convergence. Prove your mastery of all concepts.',
      difficulty: 'legendary' as const,
      status: 'locked' as const,
      xpReward: 500,
      position: { x: 75, y: 80 },
      connections: [],
      planetType: 'nebula' as const
    }
  ];

  // Solar System Planets (Scene 2) 
  const solarPlanets = [
    {
      id: 'lesson-1',
      name: 'Rational Equation',
      orbitRadius: 4,
      orbitSpeed: 0.55,
      size: 0.7,
      color: '#9ca3af',
      locked: false,
      hasMoon: false,
      imageUrl: mercuryImg
    },
    {
      id: 'lesson-2',
      name: 'Rational Function',
      orbitRadius: 6,
      orbitSpeed: 0.48,
      size: 1.0,
      color: '#a78bfa',
      locked: false,
      imageUrl: venusImg
    },
    {
      id: 'lesson-3',
      name: 'Rational Inequalities',
      orbitRadius: 8,
      orbitSpeed: 0.42,
      size: 1.05,
      color: '#34d399',
      locked: false,
      imageUrl: '/planets/earth.png'
    },
    {
      id: 'lesson-4',
      name: 'Inverse Function',
      orbitRadius: 10,
      orbitSpeed: 0.36,
      size: 0.8,
      color: '#f87171',
      locked: false,
      imageUrl: marsImg
    },
    {
      id: 'lesson-5',
      name: 'Jupiter — Applications',
      orbitRadius: 12,
      orbitSpeed: 0.3,
      size: 1.8,
      color: '#f59e0b',
      locked: false,
      imageUrl: jupiterImg
    },
    {
      id: 'lesson-6',
      name: 'Saturn — Advanced Practices',
      orbitRadius: 14,
      orbitSpeed: 0.26,
      size: 1.6,
      color: '#fbbf24',
      locked: false,
      imageUrl: saturnImg
    },
    {
      id: 'lesson-7',
      name: 'Uranus — Graphing Rational Functions',
      orbitRadius: 16,
      orbitSpeed: 0.22,
      size: 1.25,
      color: '#60a5fa',
      locked: false,
      imageUrl: uranusImg
    },
    {
      id: 'lesson-8',
      name: 'Neptune — Mastery Challenge',
      orbitRadius: 18,
      orbitSpeed: 0.18,
      size: 1.2,
      color: '#3b82f6',
      locked: false,
      imageUrl: neptuneImg
    },
  ];

  const playAudioOnce = (src: string | null) => {
    if (!src) return;
    playAudio(src, 0.95);
  };

  // First-time Solar System intro trigger
  useEffect(() => {
    if (showSolar) {
      setShowSolarIntro(true);
      setSolarIntroStep(1);
      playAudioOnce(getSolarAudioForStep(1));
    } else {
      setShowSolarIntro(false);
    }
  }, [showSolar]);

  const handleSolarIntroNext = () => {
    if (!showSolarIntro) return;
    if (solarIntroStep < 6) {
      const next = solarIntroStep + 1;
      setSolarIntroStep(next);
      playAudioOnce(getSolarAudioForStep(next));
      return;
    }
    // End solar intro
    setShowSolarIntro(false);
  };

  // Function to get appropriate audio based on cadet character (constellation intro)
  const getCadetAudioConstellation = (step: number) => {
    const femaleCadets = ['marisse', 'charmelle', 'chriselle'];
    const isFemaleCadetLocal = femaleCadets.includes(cadetAvatar);

    if (!isFemaleCadetLocal) {
      // Male voices
      switch (step) {
        case 1: return woaaaa;
        case 3: return calculationsLikeMath;
        case 5: return letsGoo;
        default: return woaaaa;
      }
    }

    // Female voices if available; fallback to male assets if not found
    switch (step) {
      case 1: return femaleVoices.step1 ?? woaaaa;
      case 3: return femaleVoices.step3 ?? calculationsLikeMath;
      case 5: return femaleVoices.step5 ?? letsGoo;
      default: return woaaaa;
    }
  };

  const stepConfig: { [k: number]: { speaker: 'Cadet' | 'Co‑Pilot'; side: 'left' | 'right'; text: string; audio: string; speed?: number } } = {
    1: { speaker: 'Cadet', side: 'left', text: 'Whoa… so this is it — my first real mission. The Constellation of Knowledge… never thought I’d see it this close.', audio: woaaaa, speed: 24 },
    2: { speaker: 'Co‑Pilot', side: 'right', text: 'Welcome aboard, Cadet. I’ll be your co-pilot. We’ll be charting systems and collecting data, but be warned — our navigation relies on precise calculations.', audio: welcomeAboard, speed: 22 },
    3: { speaker: 'Cadet', side: 'left', text: 'Calculations? You mean like… math?', audio: calculationsLikeMath, speed: 24 },
    4: { speaker: 'Co‑Pilot', side: 'right', text: 'Not just math. We’ll be solving rational equations to plot our course, adjust for planetary movement, and make sure we don’t run out of fuel. Every star has its own challenges.', audio: notJustMath, speed: 22 },
    5: { speaker: 'Cadet', side: 'left', text: 'Well, I didn’t join the Stellar Navigation Program to turn back now. Let’s start with that first star — the Solar System!', audio: letsGoo, speed: 24 },
    6: { speaker: 'Co‑Pilot', side: 'right', text: 'Coordinates locked. Prepare for launch, Cadet.', audio: prepare, speed: 22 },
  };

  const startIntroCinematic = () => {
    setIntroStep(1);
    setShowIntro(true);
    playAudio(getCadetAudioConstellation(1), 0.9);
  };

  const handleIntroNext = () => {
    if (introStep < 6) {
      const next = introStep + 1;
      setIntroStep(next);
      const cfg = stepConfig[next];
      const audioSrc = cfg.speaker === 'Cadet' ? getCadetAudioConstellation(next) : cfg.audio;
      playAudio(audioSrc, 0.95);
      return;
    }
    endIntroToSolar();
  };

  const endIntroToSolar = () => {
    setDoFlash(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setTimeout(() => {
      setShowQuestMap(false);
      setShowSolar(true);
      setShowIntro(false);
      setDoFlash(false);
    }, 400);
  };

  const handleQuestSelect = (questId: string) => {
    if (questId === 'intro-rational') {
      startIntroCinematic();
      return;
    }
    if (questId === 'basic-solving') {
      // Navigate to Philippines Map for Rational Function quest
      navigate('/philippines-map');
      return;
    }
    console.log(`Starting quest: ${questId}`);
  };

  const handleNavigation = (section: string) => {
    setSelectedSection(section);
    if (section === 'map') {
      setShowQuestMap(true);
    } else {
      setShowQuestMap(false);
    }
  };

  // Scene 2: Solar System
  if (showSolar) {
    const solarScript: Array<{ speaker: 'Cadet' | 'Navigator'; side: 'left' | 'right'; text: string }> = [
      { speaker: 'Cadet', side: 'left', text: 'Whoa… look at this view! I’ve never seen anything like it.' },
      { speaker: 'Navigator', side: 'right', text: 'Impressive, isn’t it? These planets aren’t just beautiful — each one holds a challenge that will test your skills.' },
      { speaker: 'Cadet', side: 'left', text: 'So every planet has a lesson?' },
      { speaker: 'Navigator', side: 'right', text: 'Exactly. From the swift orbit of Mercury to the icy winds of Neptune, each stop will sharpen your understanding of rational equations. Think of it as a training ground written in the stars.' },
      { speaker: 'Cadet', side: 'left', text: 'Then let’s start the journey. I’m ready to learn.' },
      { speaker: 'Navigator', side: 'right', text: 'Good. Your first destination: Mercury. Fast, unpredictable, and the perfect place to begin.' },
    ];

    return (
      <CosmicBackground variant="deep-space" intensity="high">
        <ClassroomGate enabled={true} />
        {showCharacterSelect && (
          <CharacterSelect onClose={() => setShowCharacterSelect(false)} />
        )}
        <RPGHeader
          currentPlanet="Rational Equations — Solar System"
          onNavigate={handleNavigation}
        />

        <SolarSystem planets={solarPlanets as any} onBack={() => setShowSolar(false)} onLessonSelect={(id) => console.log('Start lesson', id)} />

        {/* Solar System Intro Overlay */}
        <AnimatePresence>
          {showSolarIntro && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'transparent' }}
              onClick={handleSolarIntroNext}
            >
              <div className={`absolute ${solarScript[solarIntroStep - 1].side === 'left' ? 'left-6 md:left-12' : 'right-6 md:right-12'} bottom-6 md:bottom-12 flex flex-col ${solarScript[solarIntroStep - 1].side === 'left' ? 'items-start' : 'items-end'} gap-3 pointer-events-none`}>
                <div className="pointer-events-auto w-[88vw] max-w-[640px]">
                  <DialogueBox
                    speaker={solarScript[solarIntroStep - 1].speaker}
                    text={solarScript[solarIntroStep - 1].text}
                    onNext={handleSolarIntroNext}
                    showNext
                    autoPlay={false}
                    speed={24}
                    variant="inline"
                  />
                </div>

                <motion.img
                  src={solarScript[solarIntroStep - 1].speaker === 'Cadet' ? selectedCadetImg : loloChar}
                  alt={solarScript[solarIntroStep - 1].speaker}
                  className="w-[220px] h-[220px] md:w-[360px] md:h-[360px] object-contain select-none"
                  initial={{ x: solarScript[solarIntroStep - 1].side === 'left' ? -30 : 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: solarScript[solarIntroStep - 1].side === 'left' ? -30 : 30, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  draggable={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed top-6 right-6 z-50 flex gap-2">
          <Button onClick={() => setShowCharacterSelect(true)} className="holographic-border" variant="outline">
            Choose Cadet
          </Button>
          <Button onClick={logout} className="holographic-border text-red-500 hover:text-red-600" variant="outline">
            <LogOut size={16} />
          </Button>
        </div>
      </CosmicBackground>
    );
  }

  // Scene 1: Constellation / Quest Map
  if (showQuestMap) {
    const cfg = stepConfig[introStep] || stepConfig[1];
    const isLeft = cfg.side === 'left';

    return (
      <CosmicBackground variant="deep-space" intensity="high">
        <ClassroomGate enabled={true} />
        {showCharacterSelect && (
          <CharacterSelect onClose={() => setShowCharacterSelect(false)} />
        )}
        <RPGHeader
          currentPlanet="Constellation View"
          onNavigate={handleNavigation}
        />

        <QuestMap quests={questNodes as any} onQuestSelect={handleQuestSelect} openDetailsOnClick={false} />

        {/* Intro Cinematic Overlay (multi-step) */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28))' }}
            >
              <div className={`absolute ${isLeft ? 'left-6 md:left-12' : 'right-6 md:right-12'} bottom-6 md:bottom-12 flex flex-col ${isLeft ? 'items-start' : 'items-end'} gap-3 pointer-events-none`}>
                <div className="pointer-events-auto w-[88vw] max-w-[640px]">
                  <DialogueBox
                    speaker={cfg.speaker}
                    text={cfg.text}
                    onNext={handleIntroNext}
                    showNext
                    autoPlay
                    speed={cfg.speed ?? 24}
                    variant="inline"
                  />
                </div>

                <motion.img
                  src={isLeft ? selectedCadetImg : loloChar}
                  alt={cfg.speaker}
                  className="w-[220px] h-[220px] md:w-[360px] md:h-[360px] object-contain select-none"
                  initial={{ x: isLeft ? -30 : 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: isLeft ? -30 : 30, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  draggable={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CosmicNPC
          name="Nova Guide"
          type="guide"
          position="bottom-left"
          messages={[
            {
              id: '1',
              text: 'The "Rational Equations" star is within reach. Select it to begin your solar adventure.',
              expression: 'thinking',
            },
          ]}
        />

        <Button onClick={() => setShowQuestMap(false)} className="fixed top-6 left-6 z-50 holographic-border" variant="outline">
          ← Return to Station
        </Button>

        <div className="fixed top-6 right-6 z-50 flex gap-2">
          <Button onClick={() => setShowCharacterSelect(true)} className="holographic-border" variant="outline">
            Choose Cadet
          </Button>
          <Button onClick={logout} className="holographic-border text-red-500 hover:text-red-600" variant="outline">
            <LogOut size={16} />
          </Button>
        </div>

        {/* Cinematic flash overlay */}
        <AnimatePresence>
          {doFlash && (
            <motion.div
              className="fixed inset-0 bg-white"
              style={{ zIndex: 60 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </CosmicBackground>
    );
  }

  // Station / Landing Screen (unchanged)
  return (
    <CosmicBackground variant="starfield" intensity="medium">
      <ClassroomGate enabled={true} />
      {showCharacterSelect && (
        <CharacterSelect onClose={() => setShowCharacterSelect(false)} />
      )}
      {showCelebration && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      <RPGHeader
        currentPlanet="Training Station Alpha"
        onNavigate={handleNavigation}
      />

      {/* Navigation Buttons */}
      <div className="fixed top-6 right-6 z-50 flex gap-2">
        <Button onClick={() => setShowCharacterSelect(true)} className="holographic-border" variant="outline">
          Choose Cadet
        </Button>
        <Button onClick={logout} className="holographic-border text-red-500 hover:text-red-600" variant="outline">
          <LogOut size={16} />
        </Button>
      </div>

      {/* Hero Section */}
      <motion.section
        className="container mx-auto px-6 py-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          className="relative inline-block mb-8"
          animate={{
            textShadow: [
              '0 0 20px hsl(var(--primary) / 0.3)',
              '0 0 40px hsl(var(--primary) / 0.6)',
              '0 0 20px hsl(var(--primary) / 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <h2 className="font-orbitron font-bold text-5xl md:text-7xl bg-gradient-primary bg-clip-text text-transparent">
            COSMOS ADVENTURE
          </h2>
          <motion.div
            className="absolute -inset-4 bg-gradient-primary rounded-lg opacity-10 blur-xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Embark on an epic journey through the mathematical cosmos. Solve rational equations,
          conquer galactic challenges, and become the ultimate Math Warrior!
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button onClick={() => setShowQuestMap(true)} className="px-8 py-4 text-lg bg-gradient-quest shadow-quest" size="lg">
            <Map size={24} className="mr-2" />
            Enter Galaxy Map
          </Button>
          <Button variant="outline" size="lg" className="px-8 py-4 text-lg holographic-border" onClick={() => setShowSolar(true)}>
            <Play size={24} className="mr-2" />
            Enter Solar System
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 py-4 text-lg holographic-border" 
            onClick={() => navigate('/drawing-solver')}
          >
            <span className="mr-2">🎨</span>
            Drawing Solver
          </Button>
        </motion.div>
      </motion.section>

      {/* Quick Access Quests */}
      <motion.section
        className="container mx-auto px-6 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="text-center mb-8">
          <h3 className="font-orbitron font-semibold text-3xl text-card-foreground mb-4">🚀 Active Missions</h3>
          <p className="text-muted-foreground">Your current quest objectives and recent discoveries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Quest */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.0 }}>
            <HolographicCard variant="quest" animated>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getCurrentLessonInfo().color} rounded-full`} />
                  <div>
                    <h4 className="font-orbitron font-bold text-lg">In Progress</h4>
                    <p className="text-sm text-muted-foreground">{getCurrentLessonInfo().planet} Lesson</p>
                  </div>
                </div>
                <h5 className="font-semibold mb-2">{getCurrentLessonInfo().title}</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  {getCurrentLessonInfo().description}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-cosmic-green">
                      Overall Progress: {getOverallProgress()}%
                    </span>
                    <Button size="sm" className="bg-gradient-quest" onClick={handleContinue}>
                      Continue
                    </Button>
                  </div>
                  <Progress value={getOverallProgress()} className="h-2" />
                </div>
              </div>
            </HolographicCard>
          </motion.div>

          {/* Achievement Showcase */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.1 }}>
            <AchievementDisplay />
          </motion.div>

          {/* Calculator Access */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.2 }}>
            <HolographicCard variant="portal" animated>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 portal-effect rounded-full p-0.5">
                    <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                      <span className="text-2xl">🧮</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-lg">Quantum Calculator</h4>
                    <p className="text-sm text-muted-foreground">AI-Powered Solver</p>
                  </div>
                </div>
                <h5 className="font-semibold mb-2">Interactive Solver</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Access the advanced equation solver with step-by-step guidance.
                </p>
                <Button size="sm" className="w-full bg-gradient-nebula" onClick={() => window.open('/calculator', '_blank')}>
                  Enter Portal
                </Button>
              </div>
            </HolographicCard>
          </motion.div>

          {/* Drawing Solver Access */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.3 }}>
            <HolographicCard variant="portal" animated>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 portal-effect rounded-full p-0.5">
                    <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎨</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-lg">Drawing Solver</h4>
                    <p className="text-sm text-muted-foreground">AI-Powered OCR</p>
                  </div>
                </div>
                <h5 className="font-semibold mb-2">Hand-Drawn Equations</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Draw mathematical equations by hand and let AI solve them step-by-step.
                </p>
                <Button size="sm" className="w-full bg-gradient-quest" onClick={() => navigate('/drawing-solver')}>
                  Launch Solver
                </Button>
              </div>
            </HolographicCard>
          </motion.div>
        </div>
      </motion.section>

      {/* RPG NPCs */}
      <CosmicNPC
        name="Quantum Merchant"
        type="merchant"
        position="bottom-left"
        size="small"
        messages={[
          { id: '1', text: 'Welcome to my cosmic shop! I have rare stardust and powerful learning artifacts for trade.', expression: 'happy' },
        ]}
      />
    </CosmicBackground>
  );
};

export default RPGIndex;