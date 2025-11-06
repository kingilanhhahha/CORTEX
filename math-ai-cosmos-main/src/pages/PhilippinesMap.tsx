import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { 
  ArrowLeft, 
  Home, 
  MapPin, 
  Star, 
  Crown,
  Compass,
  Mountain,
  Waves,
  TreePine,
  Zap,
  Calculator
} from 'lucide-react';
import CosmicBackground from '@/components/rpg/CosmicBackground';

// Use direct path instead of import to avoid potential build issues
// import philippinesMapImg from '@/assets/philippines-map.jpg';
import { useMemo } from 'react';

// Define subregions for finer hotspots
const subregions = [
  { id: 'ilocos', name: 'Ilocos', color: 'rgba(34,197,94,0.18)' },
  { id: 'cordillera', name: 'Cordillera', color: 'rgba(34,197,94,0.18)' },
  { id: 'cagayan', name: 'Cagayan Valley', color: 'rgba(34,197,94,0.18)' },
  { id: 'central-luzon', name: 'Central Luzon', color: 'rgba(34,197,94,0.18)' },
  { id: 'ncr', name: 'NCR', color: 'rgba(34,197,94,0.18)' },
  { id: 'calabarzon', name: 'CALABARZON', color: 'rgba(34,197,94,0.18)' },
  { id: 'mimaropa', name: 'MIMAROPA', color: 'rgba(34,197,94,0.18)' },
  { id: 'bicol', name: 'Bicol', color: 'rgba(34,197,94,0.18)' },
  { id: 'western-visayas', name: 'Western Visayas', color: 'rgba(59,130,246,0.18)' },
  { id: 'central-visayas', name: 'Central Visayas', color: 'rgba(59,130,246,0.18)' },
  { id: 'eastern-visayas', name: 'Eastern Visayas', color: 'rgba(59,130,246,0.18)' },
  { id: 'zamboanga', name: 'Zamboanga Peninsula', color: 'rgba(245,158,11,0.18)' },
  { id: 'northern-mindanao', name: 'Northern Mindanao', color: 'rgba(245,158,11,0.18)' },
  { id: 'davao', name: 'Davao Region', color: 'rgba(245,158,11,0.18)' },
  { id: 'soccsksargen', name: 'SOCCSKSARGEN', color: 'rgba(245,158,11,0.18)' },
  { id: 'caraga', name: 'Caraga', color: 'rgba(245,158,11,0.18)' },
  { id: 'barmm', name: 'BARMM', color: 'rgba(245,158,11,0.18)' }
];

// Philippines regions with rational equation challenges
const philippinesRegions = [
  {
    id: 'luzon',
    name: 'Luzon',
    description: 'Northern Philippines - Advanced Rational Equations',
    position: { x: 35, y: 20 },
    challenges: [
      {
        id: 'manila-challenge',
        title: 'Manila Metropolitan Challenge',
        equation: '(2x + 3)/(x - 1) = (x + 5)/(x + 2)',
        difficulty: 'Advanced',
        points: 500,
        description: 'Solve the traffic flow equation for Manila\'s bustling streets'
      },
      {
        id: 'baguio-challenge',
        title: 'Baguio Mountain Problem',
        equation: '1/(x + 1) + 1/(x - 1) = 2/(x^2 - 1)',
        difficulty: 'Expert',
        points: 750,
        description: 'Calculate the altitude-pressure relationship in Baguio'
      }
    ],
    icon: Mountain,
    color: 'from-green-500 to-emerald-600',
    unlocked: true
  },
  {
    id: 'visayas',
    name: 'Visayas',
    description: 'Central Philippines - Intermediate Challenges',
    position: { x: 40, y: 55 },
    challenges: [
      {
        id: 'cebu-challenge',
        title: 'Cebu Island Navigation',
        equation: '(x + 2)/(x - 3) = (2x - 1)/(x + 1)',
        difficulty: 'Intermediate',
        points: 350,
        description: 'Navigate through Cebu\'s archipelago using rational functions'
      },
      {
        id: 'boracay-challenge',
        title: 'Boracay Beach Resort Planning',
        equation: '3/(x + 4) - 2/(x - 1) = 1/(x^2 + 3x - 4)',
        difficulty: 'Intermediate',
        points: 400,
        description: 'Optimize tourist capacity for Boracay\'s pristine beaches'
      }
    ],
    icon: Waves,
    color: 'from-blue-500 to-cyan-600',
    unlocked: true
  },
  {
    id: 'mindanao',
    name: 'Mindanao',
    description: 'Southern Philippines - Expert Level',
    position: { x: 45, y: 80 },
    challenges: [
      {
        id: 'davao-challenge',
        title: 'Davao Agricultural Optimization',
        equation: '(x^2 - 4)/(x + 2) = x - 2',
        difficulty: 'Expert',
        points: 600,
        description: 'Maximize crop yield in Davao\'s fertile lands'
      },
      {
        id: 'palawan-challenge',
        title: 'Palawan Biodiversity Study',
        equation: '2/(x - 5) + 3/(x + 1) = (5x + 7)/(x^2 - 4x - 5)',
        difficulty: 'Master',
        points: 1000,
        description: 'Study species population dynamics in Palawan\'s ecosystem'
      }
    ],
    icon: TreePine,
    color: 'from-amber-500 to-orange-600',
    unlocked: true
  }
];

const PhilippinesMap: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentXP, level, awardXP } = usePlayer();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [showChallengeDialog, setShowChallengeDialog] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [progress, setProgress] = useState(0);
  // no editor state — polygons are predefined and tuned to the image

  // Calculate overall progress
  useEffect(() => {
    const totalChallenges = philippinesRegions.reduce((sum, region) => sum + region.challenges.length, 0);
    const completed = completedChallenges.length;
    setProgress((completed / totalChallenges) * 100);
  }, [completedChallenges]);

  function openFirstChallengeForRegion(regionId: string) {
    const region = philippinesRegions.find(r => r.id === regionId);
    if (!region || !region.unlocked) return;
    setSelectedRegion(regionId);
    if (region.challenges[0]) {
      setShowChallengeDialog(region.challenges[0].id);
    }
  }

  const handleRegionClick = (regionId: string) => {
    openFirstChallengeForRegion(regionId);
  };

  const handleChallengeSubmit = (challengeId: string) => {
    // Simple check - in a real app, you'd validate the solution properly
    if (userAnswer.trim()) {
      setCompletedChallenges(prev => [...prev, challengeId]);
      
      // Find challenge and award XP
      const challenge = philippinesRegions
        .flatMap(r => r.challenges)
        .find(c => c.id === challengeId);
      
      if (challenge) {
        awardXP(challenge.points, challengeId);
      }
      
      setShowChallengeDialog(null);
      setUserAnswer('');
      
      // Check if this unlocks new regions
      if (completedChallenges.length + 1 >= 2) {
        // Unlock Mindanao after completing 2 challenges
        philippinesRegions[2].unlocked = true;
      }
    }
  };

  const selectedRegionData = philippinesRegions.find(r => r.id === selectedRegion);

  function getSubregionMeta(regionId: string | null) {
    if (!regionId) return null;
    const meta = subregions.find(s => s.id === regionId);
    if (!meta) return null;
    return meta;
  }

  function buildSubregionChallenges(regionId: string) {
    const meta = getSubregionMeta(regionId);
    const display = meta?.name ?? regionId;
    
    // Special case for Cordillera - show Rice Terraces lesson as first quest
    if (regionId === 'cordillera') {
      return [
        { id: 'rice-terraces', title: 'Rice Terraces: Polynomial Recall', equation: 'h(x) = 2x³ - 3x² + x - 5', points: 200, description: 'Learn polynomial functions through Banaue Rice Terraces', isLesson: true },
        { id: `${regionId}-q1`, title: `${display}: Basics`, equation: '(x+2)/(x-1) = 3/(x-1)', points: 150, description: `Warm-up quest in ${display}` },
        { id: `${regionId}-q2`, title: `${display}: Applications`, equation: '1/(x+2)+1/(x-3)=5/(x^2-x-6)', points: 200, description: `Apply rational equations to a real scenario in ${display}` },
      ];
    }
    
    // Default quests for other regions
    return [
      { id: `${regionId}-q1`, title: `${display}: Basics`, equation: '(x+2)/(x-1) = 3/(x-1)', points: 150, description: `Warm-up quest in ${display}` },
      { id: `${regionId}-q2`, title: `${display}: Applications`, equation: '1/(x+2)+1/(x-3)=5/(x^2-x-6)', points: 200, description: `Apply rational equations to a real scenario in ${display}` },
      { id: `${regionId}-q3`, title: `${display}: Challenge`, equation: '(2x+3)/(x^2-1) = 5/(x+1)', points: 300, description: `Boss challenge for ${display}` },
    ];
  }

  const onHotspotClick = (regionId: string) => {
    setSelectedRegion(regionId);
  };

  const defaultPolygons: Record<string, string> = {
    // tuned hand-drawn polygons (approximate but region-shaped)
    ilocos: '52,23 56,24 58,27 56,30 52,30 50,27',
    cordillera: '56,27 62,29 62,34 58,36 55,33',
    cagayan: '62,29 72,34 70,40 63,38',
    'central-luzon': '53,36 61,36 61,42 53,42',
    ncr: '58.5,43.5 60.5,43.5 60.5,45.5 58.5,45.5',
    calabarzon: '60,46 68,46 68,51 60,51',
    mimaropa: '49,49 58,49 58,56 49,56',
    bicol: '66,51 73,53 73,58 65,57',
    'western-visayas': '50,59 56,60 55,64 49,63',
    'central-visayas': '56,60 62,62 61,66 55,65',
    'eastern-visayas': '62,62 69,64 68,69 61,68',
    zamboanga: '54,73 61,73 61,77 54,77',
    'northern-mindanao': '61,73 68,73 68,77 61,77',
    davao: '66,77 72,77 72,83 66,83',
    soccsksargen: '59,77 66,77 66,83 59,83',
    caraga: '61,83 69,83 69,89 61,89',
    barmm: '53,79 59,79 59,85 53,85',
  };

  return (
    <CosmicBackground variant="nebula" intensity="medium">
      <div className="min-h-screen relative overflow-hidden">
        {/* Header */}
        <motion.header 
          className="p-6 border-b border-white/10 backdrop-blur-sm relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/rpg')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Cosmos
              </Button>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <Compass className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-orbitron font-bold text-xl bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Philippines Rational Equations Map
                </h1>
                <p className="text-xs text-white/80">Explore the archipelago through mathematics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-white border-white/20">
                Level {level}
              </Badge>
              <Badge variant="outline" className="text-white border-white/20">
                XP: {currentXP}
              </Badge>
            </div>
          </div>
        </motion.header>

        <div className="container mx-auto px-6 py-8 relative z-10">
          {/* Progress Bar */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between text-sm text-white/80 mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map Section */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Interactive Philippines Map
                  </CardTitle>

                </CardHeader>
                <CardContent>
                  <div className="relative rounded-lg overflow-hidden border border-white/20 aspect-square w-full max-w-[720px] mx-auto">
                    {/* Beautiful Philippines Map Background */}
                    <img 
                      src="/src/assets/philippines-map.jpg" 
                      alt="Philippines Map"
                      className="absolute inset-0 w-full h-full object-contain z-10"
                      onLoad={() => console.log('Philippines map loaded successfully')}
                      onError={(e) => {
                        console.error('Failed to load Philippines map image');
                        // Fallback to a styled background if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add('bg-gradient-to-br', 'from-blue-900/40', 'to-green-900/40');
                        }
                      }}
                    />
                    
                    {/* Fallback background if image doesn't load */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-green-900/40 z-5" />
                    
                    {/* Overlay for better visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none z-15" />

                    {/* Markers removed to keep the map clean; precise hotspots are used instead */}

                                         {/* Map is now just for display - no clickable hotspots */}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Aesthetic Quest Panel */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-md">
                {/* panel glow */}
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-orbitron text-lg text-white tracking-wide">
                        Available Lessons
                      </h3>
                      <p className="text-white/70 text-xs">Choose a lesson to begin your journey</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-white/20 text-white/80">XP {currentXP}</Badge>
                      <Badge variant="outline" className="border-white/20 text-white/80">Lv {level}</Badge>
                    </div>
                  </div>

                                     {/* Lesson List */}
                   <div className="space-y-3">
                     <motion.div
                       whileHover={{ y: -2 }}
                       className="group px-4 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
                       onClick={() => navigate('/lesson/rice-terraces')}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                             1
                           </div>
                           <div>
                             <div className="text-white font-semibold leading-tight">Rice Terraces: Polynomial Recall</div>
                             <div className="text-white/60 text-xs">Learn polynomial functions through Banaue Rice Terraces</div>
                           </div>
                         </div>
                         <div className="text-yellow-300 font-semibold">+200 XP</div>
                       </div>
                       <div className="mt-3 flex justify-center">
                         <Button 
                           size="sm" 
                           className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate('/lesson/rice-terraces');
                           }}
                         >
                           Start Lesson
                         </Button>
                       </div>
                     </motion.div>
                     
                     <motion.div
                       whileHover={{ y: -2 }}
                       className="group px-4 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
                       onClick={() => navigate('/lesson/chocolate-hills')}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-md bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold shadow-lg">
                             2
                           </div>
                           <div>
                             <div className="text-white font-semibold leading-tight">Chocolate Hills: Rational Functions</div>
                             <div className="text-white/60 text-xs">Learn rational functions through Bohol\'s Chocolate Hills</div>
                           </div>
                         </div>
                         <div className="text-yellow-300 font-semibold">+250 XP</div>
                       </div>
                       <div className="mt-3 flex justify-center">
                         <Button 
                           size="sm" 
                           className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white"
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate('/lesson/chocolate-hills');
                           }}
                         >
                           Start Lesson
                         </Button>
                       </div>
                     </motion.div>
                     
                     <motion.div
                       whileHover={{ y: -2 }}
                       className="group px-4 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
                       onClick={() => navigate('/lesson/cagsawa-domain')}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-md bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
                             3
                           </div>
                           <div>
                             <div className="text-white font-semibold leading-tight">Cagsawa Ruins: Domain & Restrictions</div>
                             <div className="text-white/60 text-xs">Learn domain restrictions through Cagsawa Ruins with Mt. Mayon</div>
                           </div>
                         </div>
                         <div className="text-yellow-300 font-semibold">+300 XP</div>
                       </div>
                       <div className="mt-3 flex justify-center">
                         <Button 
                           size="sm" 
                           className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate('/lesson/cagsawa-domain');
                           }}
                         >
                           Start Lesson
                         </Button>
                       </div>
                     </motion.div>
                     
                                            <motion.div
                         whileHover={{ y: -2 }}
                         className="group px-4 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
                         onClick={() => navigate('/lesson/palawan-restrictions')}
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
                               4
                             </div>
                             <div>
                               <div className="text-white font-semibold leading-tight">Palawan Underground: Mathematical Restrictions</div>
                               <div className="text-white/60 text-xs">Learn mathematical restrictions through Palawan Underground River</div>
                             </div>
                           </div>
                           <div className="text-yellow-300 font-semibold">+350 XP</div>
                         </div>
                         <div className="mt-3 flex justify-center">
                           <Button 
                             size="sm" 
                             className="bg-gradient-to-r from-blue-500 to-teal-600 hover:from-blue-600 hover:to-teal-700 text-white"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate('/lesson/palawan-restrictions');
                             }}
                           >
                             Start Lesson
                           </Button>
                         </div>
                       </motion.div>
                       
                       <motion.div
                         whileHover={{ y: -2 }}
                         className="group px-4 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
                         onClick={() => navigate('/lesson/taal-graphs')}
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-md bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
                               5
                             </div>
                             <div>
                               <div className="text-white font-semibold leading-tight">Taal Volcano: Exploring Graphs & Asymptotes</div>
                               <div className="text-white/60 text-xs">Learn about rational function graphs and asymptotes through Taal Volcano</div>
                             </div>
                           </div>
                           <div className="text-yellow-300 font-semibold">+400 XP</div>
                         </div>
                         <div className="mt-3 flex justify-center">
                           <Button 
                             size="sm" 
                             className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate('/lesson/taal-graphs');
                             }}
                           >
                             Start Lesson
                           </Button>
                         </div>
                       </motion.div>
                       
                       <motion.div
                         whileHover={{ y: -2 }}
                         className="group px-4 py-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
                         onClick={() => navigate('/lesson/calaguas-zeros')}
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
                               6
                             </div>
                             <div>
                               <div className="text-white font-semibold leading-tight">Calaguas Island: Zeros of Rational Functions</div>
                               <div className="text-white/60 text-xs">Learn to find zeros of rational functions through Calaguas Island</div>
                             </div>
                           </div>
                           <div className="text-yellow-300 font-semibold">+450 XP</div>
                         </div>
                         <div className="mt-3 flex justify-center">
                           <Button 
                             size="sm" 
                             className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                             onClick={(e) => {
                               e.stopPropagation();
                               navigate('/lesson/calaguas-zeros');
                             }}
                           >
                             Start Lesson
                           </Button>
                         </div>
                       </motion.div>
                     </div>
                  </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Challenge Dialog */}
        {showChallengeDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {(() => {
                const challenge = philippinesRegions
                  .flatMap(r => r.challenges)
                  .find(c => c.id === showChallengeDialog);
                
                if (!challenge) return null;

                return (
                  <>
                    <h3 className="text-white font-bold text-lg mb-2">{challenge.title}</h3>
                    <p className="text-white/80 text-sm mb-4">{challenge.description}</p>
                    
                    <div className="bg-black/50 rounded-lg p-4 mb-4">
                      <p className="text-white/80 text-sm mb-2">Solve the equation:</p>
                      <p className="text-white font-mono text-lg">{challenge.equation}</p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-white/80 text-sm mb-2">Your solution:</label>
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Enter your answer (e.g., x = 2)"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowChallengeDialog(null)}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleChallengeSubmit(challenge.id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                        disabled={!userAnswer.trim()}
                      >
                        Submit
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>
    </CosmicBackground>
  );
};

export default PhilippinesMap;
