"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VNStory } from '@/types/vn';
import { createBlankStory } from '@/lib/vn/sampleStory';
import VNPlayer from '@/components/vn/VNPlayer';

export default function PlayerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('leafvn_active_project_id') : null);

  const [story, setStory] = useState<VNStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      try {
        if (projectId) {
          let serverStory: VNStory | null = null;
          let localStory: VNStory | null = null;

          // 1. Leer versión local en navegador
          try {
            const rawLocal = localStorage.getItem(`leafvn_project_${projectId}`);
            if (rawLocal) {
              localStory = JSON.parse(rawLocal);
            }
          } catch (_) {}

          // 2. Leer versión en disco del servidor local
          try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.story) {
                serverStory = data.story;
              }
            }
          } catch (_) {}

          // 3. Resolver la versión más reciente según timestamp
          if (localStory && serverStory) {
            const localTime = new Date(localStory.updatedAt || 0).getTime();
            const serverTime = new Date(serverStory.updatedAt || 0).getTime();
            if (localTime > serverTime) {
              setStory(localStory);
              setLoading(false);
              return;
            } else {
              setStory(serverStory);
              setLoading(false);
              return;
            }
          } else if (serverStory) {
            setStory(serverStory);
            setLoading(false);
            return;
          } else if (localStory) {
            setStory(localStory);
            setLoading(false);
            return;
          }
        }

        setStory(createBlankStory(projectId));
      } catch (err) {
        console.error('Error loading project for player:', err);
        setStory(createBlankStory(projectId));
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [projectId]);

  if (loading || !story) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-gray-400 gap-3 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Player...</span>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <VNPlayer
        story={story}
        onExit={() => {
          router.push('/');
        }}
        onOpenEditor={() => {
          router.push(`/editor?id=${story.id}`);
        }}
      />
    </div>
  );
}
