"use client";
/**
 * Visual Novel Text Effects System
 * Re-exports the modular individual text effects architecture from '@/components/vn/texteffects'
 */
export * from '@/components/vn/texteffects';
import { TextEffectDefinition } from '@/components/vn/texteffects';
export type VNTextEffectItem = TextEffectDefinition;
