# Jupiter Lesson Update Prompt

Apply all the following changes from the Mars lesson to the Jupiter lesson to create a cinematic video game-style experience with better readability:

## 1. Add State Variables and Audio Reference

Add these state variables and refs at the top of the component:

```typescript
const audioRef = useRef<HTMLAudioElement | null>(null);
const [backgroundLoaded, setBackgroundLoaded] = useState(false);
const [contentVisible, setContentVisible] = useState(false);
```

## 2. Add Animation Sequence useEffect

Add this useEffect hook to handle the animation sequence for each slide:

```typescript
// Initial animation: show background first, then title, then content
useEffect(() => {
  // Reset states when section changes
  setBackgroundLoaded(false);
  setContentVisible(false);

  // Stop any playing audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  // First, show the background image (0.1s delay)
  const backgroundTimer = setTimeout(() => {
    setBackgroundLoaded(true);
    
    // Play background music when background loads
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    }
  }, 100);

  // Then, after background is shown, fade in the content (1.5s delay)
  const contentTimer = setTimeout(() => {
    setContentVisible(true);
  }, 1500);

  return () => {
    clearTimeout(backgroundTimer);
    clearTimeout(contentTimer);
  };
}, [currentSection]);
```

## 3. Add Background Music Audio Element

Add this audio element at the beginning of the return statement (right after the main container div):

```tsx
{/* Background music - hidden audio element */}
<audio
  ref={audioRef}
  loop
  preload="auto"
>
  <source src="/jupiter-background-music.mp3" type="audio/mpeg" />
  <source src="/jupiter-background-music.ogg" type="audio/ogg" />
</audio>
```

## 4. Update Background Image

Update the background image to:
- Add `key={currentSection}` to ensure it updates when switching slides
- Add `onLoad={() => setBackgroundLoaded(true)}` handler
- Change from `object-contain` to `object-cover` so it fills the screen without bars
- Add opacity animation tied to `backgroundLoaded` state
- Add subtle zoom effect on initial load

```tsx
<motion.img
  key={currentSection}
  src={bgSrc}
  onError={() => setBgSrc(jupiterPng)}
  onLoad={() => setBackgroundLoaded(true)}
  alt="Jupiter Background"
  className="fixed inset-0 w-full h-full object-cover"
  style={{ 
    objectFit: 'cover',
    objectPosition: 'center',
    width: '100%',
    height: '100%'
  }}
  initial={{ opacity: 0, scale: 1.02 }}
  animate={{ 
    opacity: backgroundLoaded ? 1 : 0,
    scale: 1.05,
    x: 5,
    y: 3
  }}
  transition={{ 
    opacity: { duration: 0.3 },
    scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
    x: { duration: 20, repeat: Infinity, ease: "easeInOut" },
    y: { duration: 20, repeat: Infinity, ease: "easeInOut" }
  }}
/>
```

Also update overlay divs to fade in with the background:

```tsx
<motion.div 
  className="fixed inset-0 bg-gradient-to-b from-[jupiter-color]/40 via-black/50 to-black/70" 
  initial={{ opacity: 0 }}
  animate={{ opacity: backgroundLoaded ? 1 : 0 }}
  transition={{ duration: 0.5 }}
/>
<motion.div 
  className="fixed inset-0 pointer-events-none" 
  style={{ boxShadow: 'inset 0 0 200px rgba([jupiter-color],0.2), inset 0 0 100px rgba(0,0,0,0.6)' }}
  initial={{ opacity: 0 }}
  animate={{ opacity: backgroundLoaded ? 1 : 0 }}
  transition={{ duration: 0.5 }}
/>
```

## 5. Add Video Game-Style Title Animation

Add this title animation section (before the header, after the background/overlays):

```tsx
{/* Video game-style title animation for each slide */}
<motion.div
  className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none"
  initial={{ opacity: 0 }}
  animate={{ 
    opacity: backgroundLoaded && !contentVisible ? 1 : 0,
  }}
  transition={{ 
    duration: 0.5,
    delay: 0.8,
  }}
>
  <motion.div
    className="text-center"
    initial={{ scale: 0.8, opacity: 0, y: 50 }}
    animate={{ 
      scale: backgroundLoaded && !contentVisible ? 1 : 0.8,
      opacity: backgroundLoaded && !contentVisible ? 1 : 0,
      y: backgroundLoaded && !contentVisible ? 0 : 50,
    }}
    transition={{ 
      duration: 0.8,
      delay: 1.0,
      ease: [0.34, 1.56, 0.64, 1], // Back ease for bouncy effect
    }}
  >
    <motion.h1
      className="text-6xl md:text-8xl font-orbitron font-bold mb-4"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, [jupiter-color-1] 50%, [jupiter-color-2] 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: '0 0 40px rgba([jupiter-color-rgb], 0.8), 0 0 80px rgba([jupiter-color-2-rgb], 0.6)',
        filter: 'drop-shadow(0 0 20px rgba([jupiter-color-rgb], 0.5))',
      }}
      animate={{
        textShadow: [
          '0 0 40px rgba([jupiter-color-rgb], 0.8), 0 0 80px rgba([jupiter-color-2-rgb], 0.6)',
          '0 0 60px rgba([jupiter-color-rgb], 1), 0 0 100px rgba([jupiter-color-2-rgb], 0.8)',
          '0 0 40px rgba([jupiter-color-rgb], 0.8), 0 0 80px rgba([jupiter-color-2-rgb], 0.6)',
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {slides[currentSection].title}
    </motion.h1>
    <motion.div
      className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-[jupiter-color] to-transparent"
      initial={{ scaleX: 0 }}
      animate={{ 
        scaleX: backgroundLoaded && !contentVisible ? 1 : 0,
      }}
      transition={{ 
        duration: 0.6,
        delay: 1.5,
        ease: "easeOut",
      }}
    />
  </motion.div>
</motion.div>
```

**Note**: Replace `[jupiter-color]` with Jupiter's theme colors (e.g., orange/yellow/brown for Jupiter's atmosphere). Use colors like:
- Primary: `#f97316` (orange-500) or `#f59e0b` (amber-500)
- Secondary: `#eab308` (yellow-500) or `#d97706` (orange-600)
- RGB values: `249, 115, 22` for orange-500, `234, 179, 8` for amber-500

## 6. Update Header to Fade In with Content

Update the header to only show when content is visible:

```tsx
<motion.header 
  className="p-6 border-b-2 border-[jupiter-color]/40 backdrop-blur-md bg-gradient-to-r from-[jupiter-color]/30 via-black/40 to-[jupiter-color-2]/30 relative z-10 shadow-[0_4px_20px_rgba([jupiter-color-rgb],0.3)]" 
  initial={{ opacity: 0, y: -20 }} 
  animate={{ 
    opacity: contentVisible ? 1 : 0, 
    y: contentVisible ? 0 : -20 
  }}
  transition={{ duration: 0.8, delay: 0.3 }}
>
```

## 7. Update Content Container

Wrap the main content container in a motion.div that fades in:

```tsx
<motion.div 
  className="container mx-auto px-6 py-6 relative z-10"
  initial={{ opacity: 0 }}
  animate={{ opacity: contentVisible ? 1 : 0 }}
  transition={{ duration: 0.8, delay: 0.5 }}
>
```

## 8. Update Main Content Card Background

Change the main content card background from red/jupiter colors to dark blue/slate for better readability:

```tsx
className="relative rounded-2xl border-2 border-[jupiter-color]/60 backdrop-blur-md transition-all duration-300 overflow-hidden"
style={{
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.90) 0%, rgba(30, 41, 59, 0.88) 50%, rgba(20, 30, 48, 0.90) 100%)',
  boxShadow: '0 20px 60px rgba([jupiter-color-rgb], 0.3), 0 0 40px rgba([jupiter-color-2-rgb], 0.2), inset 0 0 60px rgba([jupiter-color-rgb], 0.1)',
}}
```

And update the animated border glow to be less intense:

```tsx
<motion.div
  className="absolute inset-0 pointer-events-none"
  animate={{
    boxShadow: [
      'inset 0 0 40px rgba([jupiter-color-rgb], 0.25), inset 0 0 80px rgba([jupiter-color-2-rgb], 0.15)',
      'inset 0 0 60px rgba([jupiter-color-rgb], 0.35), inset 0 0 100px rgba([jupiter-color-2-rgb], 0.2)',
      'inset 0 0 40px rgba([jupiter-color-rgb], 0.25), inset 0 0 80px rgba([jupiter-color-2-rgb], 0.15)',
    ],
  }}
  transition={{
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  }}
/>
```

## 9. Update Nested Content Containers

Change all nested content containers from jupiter-colored backgrounds to dark backgrounds for better contrast:

**For all content boxes inside slides**, change from:
```tsx
style={{ background: 'linear-gradient(135deg, rgba([jupiter-color], 0.75) 0%, rgba([jupiter-color-2], 0.70) 100%)' }}
```

To:
```tsx
style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.80) 100%)' }}
```

**For equation display boxes**, change from:
```tsx
style={{ background: 'rgba([jupiter-color], 0.6)' }}
```

To:
```tsx
style={{ background: 'rgba(30, 41, 59, 0.7)' }}
```

## 10. Update Content Animations

Update the icon and content inside the main card to animate in:

```tsx
<motion.div 
  className="flex items-center gap-3 mb-6"
  initial={{ opacity: 0, x: -20 }}
  animate={{ 
    opacity: contentVisible ? 1 : 0,
    x: contentVisible ? 0 : -20,
  }}
  transition={{ duration: 0.6, delay: 0.6 }}
>
  {/* Icon with pulsing glow */}
  <motion.div 
    className="p-3 rounded-xl bg-gradient-to-br from-[jupiter-color]/40 to-[jupiter-color-2]/40 border-2 border-[jupiter-color]/60 shadow-[0_0_25px_rgba([jupiter-color-rgb],0.5)]"
    animate={{
      boxShadow: [
        '0 0 25px rgba([jupiter-color-rgb], 0.5), 0 0 15px rgba([jupiter-color-2-rgb], 0.3)',
        '0 0 35px rgba([jupiter-color-rgb], 0.7), 0 0 20px rgba([jupiter-color-2-rgb], 0.5)',
        '0 0 25px rgba([jupiter-color-rgb], 0.5), 0 0 15px rgba([jupiter-color-2-rgb], 0.3)',
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {slides[currentSection].icon}
  </motion.div>
  {/* Title */}
</motion.div>

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ 
    opacity: contentVisible ? 1 : 0,
    y: contentVisible ? 0 : 20,
  }}
  transition={{ duration: 0.6, delay: 0.8 }}
>
  {slides[currentSection].body}
</motion.div>
```

## 11. Update Corner Glow Effects

Reduce the intensity of corner glow effects:

```tsx
{/* Corner glow effects */}
<div className="absolute top-0 left-0 w-32 h-32 bg-[jupiter-color]/20 rounded-full blur-3xl pointer-events-none" />
<div className="absolute bottom-0 right-0 w-40 h-40 bg-[jupiter-color-2]/15 rounded-full blur-3xl pointer-events-none" />
```

## 12. Update Main Content Card Animation

Update the main content card to fade in with content:

```tsx
<motion.div 
  key={slides[currentSection].id} 
  initial={{ opacity: 0, y: 12 }} 
  animate={{ 
    opacity: contentVisible ? 1 : 0, 
    y: contentVisible ? 0 : 12 
  }}
  transition={{ duration: 0.6, delay: 0.4 }} 
  whileHover={{ scale: 1.01 }} 
  // ... rest of props
>
```

## Animation Sequence Summary

The complete animation sequence for each slide:
1. **0.1s**: Background image fades in
2. **0.5s**: Overlays fade in
3. **1.0s**: Large title appears with bounce effect (plays background music)
4. **1.5s**: Title underline expands
5. **1.5s**: Title fades out and content fades in

## Color Scheme for Jupiter

Replace all `[jupiter-color]` placeholders with:
- **Primary**: Orange (`#f97316` or `orange-500`) - RGB: `249, 115, 22`
- **Secondary**: Amber/Yellow (`#f59e0b` or `amber-500`) - RGB: `234, 179, 8`
- **Tertiary**: Yellow (`#eab308` or `yellow-500`) - RGB: `234, 179, 8`

## Notes

- The background music file should be placed at `/jupiter-background-music.mp3` (or `.ogg`) in the public folder
- All text should be readable with the dark background (rgba(15, 23, 42, 0.90))
- The jupiter theme colors are used for borders, accents, and glows only
- The main content areas use dark backgrounds for optimal readability

## Result

After applying these changes, the Jupiter lesson will have:
- ✅ Background image that fills the screen without bars (object-cover)
- ✅ Video game-style title animation for each slide
- ✅ Background music that plays during slide transitions
- ✅ Smooth transitions between slides
- ✅ Content with dark backgrounds for better readability
- ✅ Staggered animations for a polished feel
- ✅ Cinematic video game-style title screen effect



