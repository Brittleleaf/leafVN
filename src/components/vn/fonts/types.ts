export type VNFontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export interface VNFontDefinition {
  id: string;
  name: string;
  category: VNFontCategory;
  fontFamily: string;
  googleFontFamily?: string;
  googleUrl?: string;
  description: string;
  previewSample: string;
  isBuiltIn?: boolean;
}
