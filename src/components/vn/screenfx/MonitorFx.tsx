'use client';

import React, { useEffect, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

const FLAVORS = [
  'SERVER CONNECTED · PING 8MS',
  'FEED ACTIVE · SIGNAL STRENGTH 94%',
  'RELAY NODE ONLINE · ROUTING CONFIRMED',
  'UPLINK ACTIVE · SRV-01 RESPONDING',
];

export const MonitorComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  const [clock, setClock] = useState('00:00:00');
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [flavorOpacity, setFlavorOpacity] = useState(1);
  const [bootDismissed, setBootDismissed] = useState(false);

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const updateTime = () => {
      const now = new Date();
      setClock(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };
    updateTime();
    const timeTimer = setInterval(updateTime, 1000);

    const flavorTimer = setInterval(() => {
      setFlavorOpacity(0);
      setTimeout(() => {
        setFlavorIndex((prev) => (prev + 1) % FLAVORS.length);
        setFlavorOpacity(1);
      }, 400);
    }, 5000);

    const bootTimer = setTimeout(() => {
      setBootDismissed(true);
    }, 1200);

    return () => {
      clearInterval(timeTimer);
      clearInterval(flavorTimer);
      clearTimeout(bootTimer);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono">
      <style jsx global>{`
        @keyframes cctvAmbientFlicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          92.5% { opacity: 0.92; }
          93% { opacity: 1; }
        }

        @keyframes cctvScanlineScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }

        @keyframes cctvScanBandDrift {
          0% { top: -30%; }
          100% { top: 110%; }
        }

        @keyframes cctvRecPulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 6px #00aa44, 0 0 12px rgba(0, 170, 68, 0.4);
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 3px #007733;
          }
        }

        @keyframes cctvBootFade {
          0% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
      `}</style>

      {/* Screen ambient flicker container */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'cctvAmbientFlicker 8s steps(1) infinite',
        }}
      >
        {/* 1. Green Phosphor CCTV Tint */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-multiply"
          style={{
            backgroundColor: `rgba(0, 40, 10, ${0.32 * intensityMultiplier})`,
            zIndex: 5,
          }}
        />

        {/* 2. Glass Blur & CRT Surface */}
        <div
          className="absolute inset-0 pointer-events-none backdrop-blur-[0.5px]"
          style={{
            background: 'rgba(0, 20, 8, 0.08)',
            zIndex: 6,
          }}
        />

        {/* 3. Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              rgba(0,0,0,${0.55 * intensityMultiplier}) 0px,
              rgba(0,0,0,${0.55 * intensityMultiplier}) 1px,
              transparent 1px,
              transparent 3px
            )`,
            animation: 'cctvScanlineScroll 5s linear infinite',
            zIndex: 20,
          }}
        />

        {/* 4. Drifting Scan Band */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: '30%',
            background: `linear-gradient(
              to bottom,
              transparent 0%,
              rgba(255,255,255,${0.03 * intensityMultiplier}) 40%,
              rgba(255,255,255,${0.08 * intensityMultiplier}) 50%,
              rgba(255,255,255,${0.03 * intensityMultiplier}) 60%,
              transparent 100%
            )`,
            animation: 'cctvScanBandDrift 4s linear infinite',
            zIndex: 21,
          }}
        />

        {/* 5. Radial Camera Lens Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse at center,
              transparent 30%,
              rgba(0, 0, 0, ${0.45 * intensityMultiplier}) 65%,
              rgba(0, 0, 0, ${0.92 * intensityMultiplier}) 100%
            )`,
            zIndex: 22,
          }}
        />

        {/* 6. Corner Bracket Accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#00b446] z-25 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#00b446] z-25 pointer-events-none opacity-80" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-bottom-2 border-b-2 border-l-2 border-[#00b446] z-25 pointer-events-none opacity-80" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#00b446] z-25 pointer-events-none" />

        {/* 7. HUD Overlays */}
        {/* Top-Left Timestamp & Camera ID */}
        <div className="absolute top-3 left-9 z-25 text-[10px] tracking-wider text-white/40 uppercase leading-tight pointer-events-none">
          <div className="font-bold text-emerald-400/80">CAM-04 // ELEVATION 202M</div>
          <div className="text-white/60 font-mono tracking-widest">{clock} · UTC-3</div>
        </div>

        {/* Top-Right REC Indicator */}
        <div className="absolute top-3 right-9 z-25 flex items-center gap-2 text-[10px] tracking-widest text-emerald-400 uppercase pointer-events-none">
          <span
            className="w-2 h-2 rounded-full bg-[#00cc55]"
            style={{ animation: 'cctvRecPulse 1.4s ease-in-out infinite' }}
          />
          <span className="font-semibold text-emerald-300 drop-shadow-[0_0_8px_rgba(0,200,80,0.8)]">REC [LIVE]</span>
        </div>

        {/* Bottom-Left Rotating Telemetry Flavor */}
        <div
          className="absolute bottom-3 left-9 z-25 text-[9px] tracking-wider text-emerald-400/70 uppercase transition-opacity duration-300 pointer-events-none"
          style={{ opacity: flavorOpacity }}
        >
          {FLAVORS[flavorIndex]}
        </div>

        {/* Bottom-Right Channel Identifier */}
        <div className="absolute bottom-3 right-9 z-25 text-[10px] tracking-widest text-white/30 uppercase pointer-events-none">
          CH-04 // SEC-AUX
        </div>

        {/* 8. Initial Boot Acquisition Flash (Fades out after 1.2s) */}
        {!bootDismissed && (
          <div
            className="absolute inset-0 bg-[#050a05] z-40 flex flex-col items-center justify-center pointer-events-none"
            style={{
              animation: 'cctvBootFade 0.6s ease 0.6s forwards',
            }}
          >
            <div className="text-xs uppercase tracking-widest text-emerald-400/90 font-bold animate-pulse">
              [ SIGNAL ACQUIRING · FEED 04 ]
            </div>
            <div className="text-[9px] uppercase tracking-wider text-emerald-500/50 mt-1">
              Establishing encrypted uplink...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const monitorFx: ScreenFxDefinition = {
  id: 'cctv_monitor',
  label: 'Monitor Effect',
  description: 'Tactical CCTV surveillance feed with live timestamps, REC pulse, scanlines and rotating telemetry.',
  icon: GUI_ICONS.general.clapperboard,
  badgeColor: 'border-emerald-500 bg-emerald-950/80 text-emerald-300',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  component: MonitorComponent,
};
