"use client";
import React, { useState, useEffect } from 'react';
import { VNSaveSlot } from '@/types/vn';
import { getSaveSlots, deleteSaveSlot } from '@/lib/vn/storage';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playUiSound } from '@/lib/audioSettings';

interface StaticScreenSaveLoadWidgetProps {
  storyId?: string;
  isInteractive?: boolean;
  onLoadSlot?: (slot: VNSaveSlot) => void;
  onBackToMenu?: () => void;
}

export function StaticScreenSaveLoadWidget({
  storyId = 'test',
  isInteractive = false,
  onLoadSlot,
  onBackToMenu,
}: StaticScreenSaveLoadWidgetProps) {
  const [slots, setSlots] = useState<VNSaveSlot[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loaded = getSaveSlots(storyId);
    setSlots(loaded);
  }, [storyId]);

  const handleDelete = (slotNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const updated = deleteSaveSlot(slotNum, storyId);
    setSlots(updated);
    playUiSound('delete', 0.5);
  };

  const handleSelectSlot = (slot: VNSaveSlot) => {
    if (!isInteractive) return;
    playUiSound('select', 0.5);
    onLoadSlot?.(slot);
  };

  // Mock slots for editor preview if no real saves exist yet
  const displaySlots: (VNSaveSlot | { slotNumber: number; isEmpty: true })[] = [1, 2, 3, 4, 5, 6].map((num) => {
    const existing = slots.find((s) => s.slotNumber === num);
    if (existing) return existing;
    if (!isInteractive && num <= 2) {
      return {
        id: `mock-save-${num}`,
        slotNumber: num,
        savedAt: num === 1 ? 'Today, 18:24' : 'Yesterday, 21:05',
        storyTitle: 'Story Archive',
        chapterTitle: num === 1 ? 'Act I: Awakening' : 'Prologue',
        sceneName: num === 1 ? 'Secret Laboratory' : 'Hallway Encounter',
        previewBg: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
        gameState: {
          currentChapterId: 'chap-1',
          currentSceneId: 'scene-1',
          eventIndex: 0,
          variablesState: {},
          history: [],
          activeCharacters: [],
          isHotspotMode: false,
          consumedHotspots: [],
          customSceneBg: null,
        },
      };
    }
    return { slotNumber: num, isEmpty: true };
  });

  return (
    <div className="w-full max-w-4xl px-4 py-2 z-30 pointer-events-auto flex flex-col items-center">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-h-[340px] overflow-y-auto custom-scrollbar p-1">
        {displaySlots.map((item) => {
          const isSlotActive = !('isEmpty' in item);
          const slotNum = item.slotNumber;
          const slot = isSlotActive ? (item as VNSaveSlot) : null;

          return (
            <div
              key={slotNum}
              onClick={() => slot && handleSelectSlot(slot)}
              className={`group relative rounded-md border p-2.5 flex flex-col justify-between transition-all select-none backdrop-blur-md ${
                slot
                  ? 'bg-black/60 hover:bg-black/80 border-white/20 hover:border-cyan-400/80 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:scale-[1.02]'
                  : 'bg-black/35 border-white/10 opacity-70'
              }`}
            >
              {/* Header info */}
              <div className="flex items-center justify-between text-[10px] mb-1.5 pb-1 border-b border-white/10 font-mono">
                <span className="font-bold text-cyan-400">SLOT {slotNum < 10 ? `0${slotNum}` : slotNum}</span>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="truncate max-w-[90px]">{slot ? slot.savedAt : 'EMPTY'}</span>
                  {slot && isInteractive && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(slotNum, e)}
                      className="text-red-400 hover:text-red-300 p-0.5 rounded cursor-pointer transition-colors"
                      title="Delete saved game"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slot Thumbnail & Metadata */}
              {slot ? (
                <div className="space-y-1.5">
                  <div className="w-full h-16 rounded-lg overflow-hidden bg-black/80 border border-white/10 relative">
                    {slot.previewBg ? (
                      <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${slot.previewBg}')` }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 font-mono">
                        NO IMAGE
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white uppercase tracking-wider truncate max-w-[140px] drop-shadow-md">
                      {slot.sceneName || 'Unnamed Scene'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-medium">
                    <span className="truncate">{slot.chapterTitle || 'Chapter'}</span>
                    <span className="text-cyan-400 font-mono text-[9px] uppercase font-bold tracking-wider">READY</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-24 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 text-[11px] font-mono gap-1">
                  <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-4 h-4 opacity-40" />
                  <span>-- EMPTY SLOT --</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
