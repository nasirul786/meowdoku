'use client';

import React, { useEffect, useRef } from 'react';
import catFaceData from '../../public/lottie/cat-face.json';

interface CatLottieProps {
  className?: string;
  animationSpeed?: number;
}

let lottieModulePromise: Promise<any> | null = null;
function getLottieModule() {
  if (typeof window === 'undefined') return null;
  if (!lottieModulePromise) {
    lottieModulePromise = import('lottie-web').then((m) => m.default || m);
  }
  return lottieModulePromise;
}

// Pre-load Lottie web module on the client side
if (typeof window !== 'undefined') {
  getLottieModule();
}

export const CatLottie: React.FC<CatLottieProps> = React.memo(({ className = 'w-full h-full', animationSpeed = 1 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let anim: any = null;

    getLottieModule()?.then((lottie) => {
      if (!isMounted || !containerRef.current) return;

      // Clean up any existing SVG nodes if present
      containerRef.current.innerHTML = '';

      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false, // Do not play on loop, play 1 time only when reveals
        autoplay: true, // Play 1 time when reveals
        animationData: catFaceData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
        },
      });
      anim.setSpeed(animationSpeed);
    });

    return () => {
      isMounted = false;
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${className}`}
    />
  );
});

CatLottie.displayName = 'CatLottie';

