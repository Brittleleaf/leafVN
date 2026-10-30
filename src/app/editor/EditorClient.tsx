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
              // Sincronizar en segundo plano al disco
              fetch(`/api/projects/${projectId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ story: localStory }),
              }).catch(() => {});
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

          // 4. Intentar desde Cloud Firestore si el usuario está autenticado
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

        // 5. Fallback a proyecto nuevo en blanco
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
        onPlayStory={async (updatedStory) => {
          try {
            localStorage.setItem(`leafvn_project_${updatedStory.id}`, JSON.stringify(updatedStory));
            localStorage.setItem('leafvn_active_project_id', updatedStory.id);
          } catch (_) {}
          // Guardar en disco antes de probar
          try {
            await fetch(`/api/projects/${updatedStory.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ story: updatedStory }),
            });
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
