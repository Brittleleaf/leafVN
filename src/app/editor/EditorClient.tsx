"use client";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VNStory } from '@/types/vn';
import { createBlankStory } from '@/lib/vn/sampleStory';
import { useAuth } from '@/lib/firebase/authContext';
import { loadProjectFromCloud } from '@/lib/firebase/cloudProjects';
import VNMaker from '@/components/vn/VNMaker';

export default function EditorClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('leafvn_active_project_id') : null);

  const [story, setStory] = useState<VNStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      try {
        if (projectId) {
          // 1. Intentar desde API de servidor local
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

          // 2. Intentar desde localStorage
          try {
            const local = localStorage.getItem(`leafvn_project_${projectId}`);
            if (local) {
              setStory(JSON.parse(local));
              setLoading(false);
              return;
            }
          } catch (_) {}

          // 3. Intentar desde Cloud Firestore si el usuario está autenticado
          if (user?.uid) {
            try {
              const cloudStory = await loadProjectFromCloud(user.uid, projectId);
              if (cloudStory) {
                setStory(cloudStory);
                setLoading(false);
                return;
              }
            } catch (_) {}
          }
        }

        // 4. Fallback a proyecto nuevo en blanco
        setStory(createBlankStory(projectId, user?.displayName));
      } catch (err) {
        console.error('Error loading project for editor:', err);
        setStory(createBlankStory(projectId, user?.displayName));
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [projectId, user]);

  if (loading || !story) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0b0b10] text-[var(--muted)] gap-3 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading Editor Studio...</span>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <VNMaker
        initialStory={story}
        onPlayStory={(updatedStory) => {
          try {
            localStorage.setItem(`leafvn_project_${updatedStory.id}`, JSON.stringify(updatedStory));
          } catch (_) {}
          router.push(`/player?id=${updatedStory.id}`);
        }}
        onExit={() => {
          router.push('/');
        }}
      />
    </div>
  );
}
