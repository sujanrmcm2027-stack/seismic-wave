import React, { useEffect, useRef, useState, useCallback } from "react";
import { useCrisisMode } from "@/hooks/useCrisisMode";
import { RotateCcw, Zap } from "lucide-react";

export function TectonicStressSandbox() {
  const { liteMode } = useCrisisMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Simulation Config (using Ref to prevent re-renders on animation frames)
  const config = useRef({
    convergenceRate: 1.5,
    faultFriction: 0.8,
    isSlipped: false,
    stressLevel: 0,
  });

  // UI State purely for slider visualization
  const [convergence, setConvergence] = useState(1.5);
  const [friction, setFriction] = useState(0.8);

  // Sync UI state to Simulation Ref
  useEffect(() => {
    config.current.convergenceRate = convergence;
    config.current.faultFriction = friction;
  }, [convergence, friction]);

  const triggerSlip = useCallback(() => {
    config.current.isSlipped = true;
    // Optional: hook into global notification or sound API here
  }, []);

  const resetSimulation = useCallback(() => {
    config.current.isSlipped = false;
    config.current.stressLevel = 0;
  }, []);

  useEffect(() => {
    if (liteMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width;
    let height = canvas.height;

    // Simulation Entities
    const plateWidth = width / 2.5;
    let leftPlate = { x: 0, y: height / 2 - 40, w: plateWidth, h: 80, baseX: 0 };
    let rightPlate = { x: width - plateWidth, y: height / 2 - 40, w: plateWidth, h: 80, baseX: width - plateWidth };
    
    let particles: { x: number, y: number, vx: number, vy: number, life: number, maxLife: number, type: 'stress' | 'slip' }[] = [];

    const draw = () => {
      // Clear with Theme Background
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, width, height);

      const cfg = config.current;

      // Physics Calculation
      const boundaryX = width / 2;
      const leftEdge = leftPlate.x + leftPlate.w;
      const rightEdge = rightPlate.x;
      const isColliding = leftEdge >= rightEdge - 2; // -2 tolerance

      if (cfg.isSlipped) {
        // Elastic Rebound (Snap back)
        leftPlate.x = Math.max(leftPlate.baseX, leftPlate.x - (cfg.stressLevel * 0.5));
        rightPlate.x = Math.min(rightPlate.baseX, rightPlate.x + (cfg.stressLevel * 0.5));
        
        // Explosion particles
        if (cfg.stressLevel > 0) {
          for (let i = 0; i < cfg.stressLevel * 2; i++) {
            particles.push({
              x: boundaryX,
              y: height / 2 + (Math.random() - 0.5) * 80,
              vx: (Math.random() - 0.5) * 15,
              vy: (Math.random() - 0.5) * 15,
              life: 1,
              maxLife: 30 + Math.random() * 20,
              type: 'slip'
            });
          }
          cfg.stressLevel = 0;
        }

        // Auto-reset after snap
        if (leftPlate.x <= leftPlate.baseX + 1) {
          cfg.isSlipped = false;
        }
      } else {
        // Normal Convergence
        if (!isColliding) {
          leftPlate.x += cfg.convergenceRate;
          rightPlate.x -= cfg.convergenceRate;
        } else {
          // Locked by friction - build stress
          if (cfg.stressLevel < 100 * cfg.faultFriction) {
            cfg.stressLevel += cfg.convergenceRate * 0.5;
            
            // Spawn stress particles at boundary
            if (Math.random() < 0.3) {
              particles.push({
                x: boundaryX + (Math.random() - 0.5) * 4,
                y: height / 2 + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                maxLife: 20 + Math.random() * 20,
                type: 'stress'
              });
            }
          }
        }
      }

      // Draw Plates
      // Left Plate (Indian Plate)
      ctx.fillStyle = `rgba(60, 60, 65, 1)`;
      ctx.shadowBlur = cfg.stressLevel > 0 && !cfg.isSlipped ? 15 : 0;
      ctx.shadowColor = "#E53935";
      ctx.fillRect(leftPlate.x, leftPlate.y, leftPlate.w, leftPlate.h);
      
      // Right Plate (Eurasian Plate)
      ctx.fillStyle = `rgba(50, 50, 55, 1)`;
      ctx.fillRect(rightPlate.x, rightPlate.y, rightPlate.w, rightPlate.h);
      ctx.shadowBlur = 0;

      // Draw Stress Zone (Red Glow)
      if (isColliding && !cfg.isSlipped) {
        ctx.fillStyle = `rgba(229, 57, 53, ${cfg.stressLevel / 100})`;
        ctx.fillRect(boundaryX - 2, height / 2 - 45, 4, 90);
      }

      // Draw & Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const opacity = 1 - (p.life / p.maxLife);
        ctx.fillStyle = p.type === 'stress' 
            ? `rgba(229, 57, 53, ${opacity})`   // Red for stress
            : `rgba(255, 200, 50, ${opacity})`; // Orange/Yellow for slip explosion

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'slip' ? 3 : 1.5, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [liteMode]);

  if (liteMode) {
    return (
      <div className="w-full rounded-xl border border-border bg-[#121212] p-6 text-foreground flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">⚡ LITE MODE ACTIVE</div>
          <div className="flex items-center gap-1 justify-center opacity-80">
            <div className="w-16 h-12 bg-neutral-700 rounded-sm translate-x-1" />
            <div className="w-1 h-16 bg-[#E53935] animate-pulse rounded-full" />
            <div className="w-16 h-12 bg-neutral-800 rounded-sm -translate-x-1" />
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px] mt-4">
            Interactive physics disabled to preserve client resources. Fault boundary locked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-[#121212] p-5 shadow-sm overflow-hidden flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-gray-100">Tectonic Stress Simulator</h3>
        <button 
          onClick={resetSimulation}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
          aria-label="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Zero-Gravity Canvas Canvas */}
      <div className="w-full flex justify-center bg-black/40 rounded-lg border border-white/5 relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={200}
          className="max-w-full h-auto object-contain"
        />
        {/* Helper Overlay */}
        <div className="absolute top-2 left-2 text-[9px] font-mono text-gray-500 uppercase">Indian Plate</div>
        <div className="absolute top-2 right-2 text-[9px] font-mono text-gray-500 uppercase">Eurasian Plate</div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>Convergence Rate</span>
            <span>{convergence.toFixed(1)} mm/yr</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.1" 
            value={convergence}
            onChange={(e) => setConvergence(parseFloat(e.target.value))}
            className="w-full accent-[#E53935]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400 font-medium">
            <span>Fault Friction (Locking)</span>
            <span>{Math.round(friction * 100)}%</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            value={friction}
            onChange={(e) => setFriction(parseFloat(e.target.value))}
            className="w-full accent-[#E53935]"
          />
        </div>

        <button 
          onClick={triggerSlip}
          className="w-full flex items-center justify-center gap-2 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold py-3 px-4 rounded-md transition-colors active:scale-[0.98]"
        >
          <Zap className="w-5 h-5 fill-current" />
          TRIGGER SLIP
        </button>
      </div>
    </div>
  );
}
