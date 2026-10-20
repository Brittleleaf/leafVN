import React, { Suspense } from 'react';
import EditorClient from './EditorClient';

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0b10] text-gray-400 gap-3 font-mono text-xs">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Editor Studio...</span>
        </div>
      }
    >
      <EditorClient />
    </Suspense>
  );
}
