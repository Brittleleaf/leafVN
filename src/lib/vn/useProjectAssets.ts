"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { VNStory, VNAssetItem } from '@/types/vn';
import { SYSTEM_ASSETS } from './systemAssets';

export interface UseProjectAssetsResult {
  allAssets: VNAssetItem[];
  projectAssets: VNAssetItem[];
  systemAssets: VNAssetItem[];
  customAssets: VNAssetItem[];
  isLoading: boolean;
  projectId: string;
  fetchProjectAssets: (syncToParent?: boolean) => Promise<void>;
}

export function useProjectAssets(
  story?: VNStory,
  onUpdateStoryCustomAssets?: (updatedAssets: VNAssetItem[]) => void
): UseProjectAssetsResult {
  const activeStoredProject =
    typeof window !== 'undefined' ? localStorage.getItem('vn_active_project_id') : null;
  const projectId = story?.id || activeStoredProject || 'current-project';

  const [projectAssets, setProjectAssets] = useState<VNAssetItem[]>(story?.customAssets || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onUpdateStoryCustomAssetsRef = useRef(onUpdateStoryCustomAssets);
  useEffect(() => {
    onUpdateStoryCustomAssetsRef.current = onUpdateStoryCustomAssets;
  }, [onUpdateStoryCustomAssets]);

  // Combine system assets with physical project assets and story custom assets, deduplicated by ID
  const customAssets = story?.customAssets || [];
  const systemAssets = SYSTEM_ASSETS;

  const allAssets: VNAssetItem[] = (() => {
    const map = new Map<string, VNAssetItem>();
    systemAssets.forEach((a) => map.set(a.id, a));
    customAssets.forEach((a) => map.set(a.id, a));
    projectAssets.forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  })();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProjectAssets = useCallback(
    async (syncToParent = false) => {
      if (!projectId) return;
      if (isMountedRef.current) setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/assets`);
        if (res.ok && isMountedRef.current) {
          const data = await res.json();
          if (data.assets && Array.isArray(data.assets)) {
            setProjectAssets(data.assets);
            if (syncToParent && onUpdateStoryCustomAssetsRef.current) {
              onUpdateStoryCustomAssetsRef.current(data.assets);
            }
          }
        }
      } catch (err) {
        console.error('Error loading project assets from disk:', err);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchProjectAssets(false);
  }, [fetchProjectAssets]);

  return {
    allAssets,
    projectAssets,
    systemAssets,
    customAssets,
    isLoading,
    projectId,
    fetchProjectAssets,
  };
}
