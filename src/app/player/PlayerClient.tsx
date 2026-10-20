"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VNStory } from '@/types/vn';
import { SAMPLE_STORY } from '@/lib/vn/sampleStory';
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
          try {
            const res = await fetch(`/api/projects/${projectId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.story) {
                setStory(data.story);
                setLoading(false);
                return;
              }
            }
          } catch (_) {}

          try {
            const local = localStorage.getItem(`leafvn_project_${projectId}`);
            if (local) {
              setStory(JSON.parse(local));
              setLoading(false);
              return;
            }
          } catch (_) {}
        }

        setStory(SAMPLE_STORY);
      } catch (err) {
        console.error('Error loading project for player:', err);
        setStory(SAMPLE_STORY);
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
