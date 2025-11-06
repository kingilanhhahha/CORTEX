import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Music, Volume2, Play, Pause, Settings, Headphones } from 'lucide-react';
import { useMusic, MUSIC_TRACKS } from '@/contexts/MusicContext';

interface MusicSettingsProps {
  className?: string;
}

const MusicSettings: React.FC<MusicSettingsProps> = ({ className }) => {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    setCurrentTrack, 
    setIsPlaying, 
    setVolume, 
    togglePlayPause,
    isDucked
  } = useMusic();

  const handleTrackSelect = (track: typeof MUSIC_TRACKS[0]) => {
    setCurrentTrack(track);
    // Auto-play when selecting a new track
    setIsPlaying(true);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const formatTrackName = (name: string) => {
    // Clean up track names for better display
    return name.replace(/\(.*?\)/g, '').trim();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`holographic-border ${className}`}
        >
          <Music size={16} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-slate-900 border-slate-600 overflow-y-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(79, 195, 247, 0.3) transparent'
      }}>
        <SheetHeader className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 pb-4">
          <SheetTitle className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Music Settings
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Customize your cosmic learning experience with background music
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          {/* Current Track Display */}
          <Card className="bg-gradient-card border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-orbitron text-primary flex items-center gap-2">
                <Music className="h-4 w-4" />
                Now Playing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-card-foreground truncate">
                    {formatTrackName(currentTrack.name)}
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentTrack.artist}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentTrack.genre}
                  </p>
                  {isDucked && (
                    <div className="flex items-center gap-1 mt-1">
                      <Volume2 className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-500 font-medium">
                        Ducking for conversation
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={togglePlayPause}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Volume Control */}
          <Card className="bg-gradient-card border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-orbitron text-primary flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Volume Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[volume * 100]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Track Selection */}
          <Card className="bg-gradient-card border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-orbitron text-primary flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Choose Track
              </CardTitle>
              <CardDescription>
                Select your preferred background music for the cosmic journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(79, 195, 247, 0.2) transparent'
              }}>
                {MUSIC_TRACKS.map((track) => (
                  <motion.div
                    key={track.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={currentTrack.id === track.id ? "default" : "outline"}
                      className={`w-full justify-start h-auto p-4 ${
                        currentTrack.id === track.id 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500" 
                          : "bg-card hover:bg-card/80 border-border"
                      }`}
                      onClick={() => handleTrackSelect(track)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentTrack.id === track.id 
                            ? "bg-primary-foreground/20" 
                            : "bg-muted"
                        }`}>
                          <Music className={`h-5 w-5 ${
                            currentTrack.id === track.id 
                              ? "text-primary-foreground" 
                              : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`font-semibold ${
                            currentTrack.id === track.id 
                              ? "text-primary-foreground" 
                              : "text-card-foreground"
                          }`}>
                            {formatTrackName(track.name)}
                          </div>
                          <div className={`text-sm ${
                            currentTrack.id === track.id 
                              ? "text-primary-foreground/80" 
                              : "text-muted-foreground"
                          }`}>
                            {track.artist} • {track.genre}
                          </div>
                        </div>
                        {currentTrack.id === track.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-primary-foreground rounded-full"
                          />
                        )}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cosmic Theme Note */}
          <Card className="bg-gradient-card border-primary/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-2xl">🌌</div>
                <p className="text-sm text-muted-foreground">
                  Immerse yourself in the cosmic learning experience with carefully curated background music
                </p>
                <p className="text-xs text-muted-foreground">
                  ✨ Music automatically ducks during conversations for better clarity
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MusicSettings;
