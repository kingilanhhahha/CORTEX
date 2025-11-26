# Jupiter Lesson Update - Concise Prompt

Apply all the changes from the Mars lesson to the Jupiter lesson:

## Changes to Apply:

1. **Add state variables**: `audioRef`, `backgroundLoaded`, `contentVisible`

2. **Add animation sequence useEffect**: Reset states on slide change, show background (0.1s), play music, show content (1.5s)

3. **Add background music**: Hidden audio element with `/jupiter-background-music.mp3`, loops, volume 0.5

4. **Fix background image**:
   - Add `key={currentSection}` to update on slide change
   - Change to `object-cover` (not `object-contain`) to fill screen without bars
   - Add `onLoad` handler to set `backgroundLoaded`
   - Add opacity animation tied to `backgroundLoaded`
   - Add subtle zoom effect (scale 1.05, x:5, y:3)

5. **Add video game-style title animation**:
   - Large centered title (6xl/8xl) with gradient text (white → jupiter colors)
   - Bouncy entrance animation (back ease curve)
   - Pulsing glow effect on title text
   - Decorative underline that expands from center
   - Title appears after background loads (1.0s delay)
   - Title fades out when content appears (1.5s delay)

6. **Update header/content visibility**: Only show when `contentVisible` is true

7. **Fix content background colors**: Change from jupiter-colored backgrounds to dark blue/slate for better readability:
   - Main container: `rgba(15, 23, 42, 0.90)` gradient
   - Nested containers: `rgba(15, 23, 42, 0.85)` gradient
   - Equation boxes: `rgba(30, 41, 59, 0.7)`

8. **Add content animations**:
   - Icon slides in from left with pulsing glow
   - Content fades in from below
   - Staggered animations (icon: 0.6s delay, content: 0.8s delay)

9. **Reduce glow effects**: Reduce corner glow opacity (20% for primary, 15% for secondary)

10. **Animation sequence per slide**:
    - Background fades in (0.1s)
    - Overlays fade in (0.5s)
    - Title appears with bounce (1.0s)
    - Title underline expands (1.5s)
    - Title fades out, content fades in (1.5s)

## Jupiter Color Scheme:
- Primary: Orange (`#f97316`, RGB: `249, 115, 22`)
- Secondary: Amber (`#f59e0b`, RGB: `234, 179, 8`)
- Use for borders, accents, glows only
- Content backgrounds should be dark (rgba(15, 23, 42, 0.90))

## Result:
- Background fills screen without bars
- Video game-style title animation for each slide
- Background music plays during transitions
- Smooth slide transitions
- Dark content backgrounds for readability
- Polished staggered animations
- Cinematic video game-style experience






