import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CosmicBackgroundProps {
  children: React.ReactNode;
  variant?: 'starfield' | 'nebula' | 'deep-space';
  intensity?: 'low' | 'medium' | 'high';
}

const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ 
  children, 
  variant = 'starfield',
  intensity = 'medium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animated starfield
    const stars: Array<{ x: number; y: number; size: number; speed: number; color: string }> = [];
    const starCount = intensity === 'low' ? 50 : intensity === 'medium' ? 100 : 200;

    const colors = [
      'rgba(79, 195, 247, 0.8)', // plasma blue
      'rgba(233, 150, 228, 0.8)', // nebula pink
      'rgba(102, 255, 194, 0.8)', // cosmic green
      'rgba(255, 215, 0, 0.8)',   // stellar gold
      'rgba(255, 255, 255, 0.9)'  // quantum white
    ];

    // Initialize stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(12, 10, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        // Draw star
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Add twinkle effect
        if (Math.random() < 0.01) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = star.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Move star
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [intensity]);

  const getBackgroundStyle = () => {
    switch (variant) {
      case 'nebula':
        return 'bg-gradient-nebula';
      case 'deep-space':
        return 'bg-gradient-cosmos';
      default:
        return 'bg-background';
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${getBackgroundStyle()}`}>
      {/* Animated Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      
      {/* Cosmic Particles Overlay */}
      <div className="absolute inset-0 cosmic-particles" style={{ zIndex: 2 }} />
      
      {/* Floating Cosmic Elements */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 3 }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `hsl(${180 + i * 30} 100% 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  );
};

export default CosmicBackground;