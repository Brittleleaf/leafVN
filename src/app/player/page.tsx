import React, { Suspense } from 'react';
import PlayerClient from './PlayerClient';

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-gray-400 gap-3 font-mono text-xs">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Player...</span>
        </div>
      }
    >
      <PlayerClient />
    </Suspense>
  );
}
