import {
  VNEvent,
  VNStory,
  VNChapter,
  VNScene,
  VNCharacter,
  VNAssetType,
  VNScreenFxType,
} from '@/types/vn';

export interface EventInspectorSubProps {
  currentLine: VNEvent;
  selectedLineIndex: number;
  story: VNStory;
  currentChapter: VNChapter;
  currentScene: VNScene;
  currentSpeaker?: VNCharacter;
  timelineFxStatus: {
    activeMap: Map<string, { type: VNScreenFxType; pairId?: string; intensity?: 'light' | 'medium' | 'heavy' }>;
    pairsMap: Map<string, { startIdx: number; endIdx: number; startId: string; endId: string }>;
  };
  onUpdateCurrentLine: (field: keyof VNEvent, value: any) => void;
  onPatchCurrentLine: (patch: Partial<VNEvent>) => void;
  onUpdateCurrentScene: (field: keyof VNScene, value: any) => void;
  onSelectLineIndex: (index: number) => void;
  onOpenCharacterPicker: () => void;
  onOpenGlobalModal: (modal: 'variables' | 'scenes' | 'characters') => void;
  onOpenAssetPicker: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => void;
  notify: (msg: string) => void;
}
