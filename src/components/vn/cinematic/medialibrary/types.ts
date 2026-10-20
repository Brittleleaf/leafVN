import { VNCharacter, VNAssetItem, VNAssetType } from '@/types/vn';

export interface MediaCatalogItem {
  id: string;
  url: string;
  name: string;
  tag: 'Background' | 'Character' | 'Scenario' | 'Icon';
  origin?: 'system' | 'user' | 'project';
  category?: string;
}

export type MediaTabType = 'characters' | 'fx' | 'media' | 'text' | 'audio';
