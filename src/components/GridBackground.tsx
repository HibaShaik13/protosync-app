/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function GridBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Keep internal local state synchronized with document.body's class list
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    setIsLight(document.body.classList.contains('light'));
    return () => observer.disconnect();
  }, []);

  // Pre-generate static layout positions for neon background dust particle stars to avoid hydration issues
  const particles = [
    { id: 1, top: '15%', left: '20%', size: 2, delay: 0 },
    { id: 2, top: '45%', left: '8%', size: 3, delay: 1.5 },
    { id: 3, top: '75%', left: '16%', size: 1.5, delay: 0.8 },
    { id: 4, top: '25%', left: '85%', size: 2.5, delay: 2.2 },
    { id: 5, top: '60%', left: '78%', size: 2, delay: 1.1 },
    { id: 6, top: '88%', left: '90%', size: 3, delay: 3.0 },
    { id: 7, top: '12%', left: '60%', size: 1.5, delay: 0.5 },
    { id: 8, top: '38%', left: '35%', size: 2, delay: 1.9 },
    { id: 9, top: '82%', left: '48%', size: 2.5, delay: 2.5 },
    { id: 10, top: '50%', left: '62%', size: 1.5, delay: 1.3 },
  ];

  return (
    <div className={`fixed inset-0 overflow-hidden ${isLight ? 'bg-[#f8fafc]' : 'bg-[#02040a]'} -z-50 pointer-events-none select-none transition-colors duration-300`}>
      {/* Laser-engraved futuristic Grid Network overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: isLight
            ? `
              linear-gradient(to right, rgba(147, 51, 234, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(147, 51, 234, 0.3) 1px, transparent 1px)
            `
            : `
              linear-gradient(to right, rgba(147, 51, 234, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(147, 51, 234, 0.4) 1px, transparent 1px)
            `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Mesh Radial glow centered behind content */}
      <div className={`absolute inset-0 ${isLight ? 'bg-[radial-gradient(circle_at_50%_120%,rgba(147,51,234,0.03),transparent_60%)]' : 'bg-[radial-gradient(circle_at_50%_120%,rgba(14,8,44,0.9),transparent_60%)]'}`} />

      {/* Interactive mouse highlight spotlight */}
      <div 
        className="absolute -inset-[300px] opacity-[0.14] blur-[150px] transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
        }}
      >
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
      </div>

      {/* Floating neon blurred light orbs - exactly configured to Immersive UI */}
      <motion.div 
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -90, 60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] ${isLight ? 'bg-purple-300/10' : 'bg-purple-900/20'}`} 
      />

      <motion.div 
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 80, -70, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] ${isLight ? 'bg-blue-300/10' : 'bg-blue-900/20'}`} 
      />

      <motion.div 
        animate={{
          scale: [1, 1.15, 0.9, 1],
          opacity: isLight ? [0.03, 0.08, 0.05, 0.03] : [0.08, 0.15, 0.12, 0.08]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full blur-[100px] ${isLight ? 'bg-indigo-300/10' : 'bg-indigo-500/10'}`} 
      />

      {/* Floating glowing tech starfield dust particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full opacity-25 ${isLight ? 'bg-purple-600' : 'bg-purple-400'}`}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 ${p.size * 3}px rgba(168, 85, 247, 0.8)`
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.15, 0.6, 0.15],
          }}
          transition={{
            duration: 3 + p.delay,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
