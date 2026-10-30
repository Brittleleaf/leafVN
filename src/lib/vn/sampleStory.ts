import { VNStory } from '@/types/vn';

export const SAMPLE_STORY: VNStory = {
  id: 'el-renacer-del-pintor',
  version: '1.0.0',
  title: 'The Rebirth of the Painter',
  author: 'Creator',
  description: 'Clean project prepared for new scenarios.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  textBoxConfig: {
    theme: 'classified',
    opacity: 0.9,
    borderColor: '#b91c1c',
    fontSize: 'base',
    typewriterSpeedMs: 25,
    showAvatar: true,
    soundBlipEnabled: true,
    position: 'bottom',
  },
  variables: [],
  characters: [],
  chapters: [
    {
      id: 'chap-1',
      number: 1,
      title: 'Chapter 1',
      summary: '',
      loadingScreen: {
        enabled: false,
        title: 'Chapter 1',
      },
      startSceneId: 'scene-1',
      scenes: [
        {
          id: 'scene-1',
          name: 'Scene 1',
          backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          timeline: [],
          hotspots: [],
          enableHotspots: false,
        },
      ],
    },
  ],
  scenarios: [
    {
      id: 'scene-1',
      name: 'Scene 1',
      backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      timeline: [],
      hotspots: [],
      enableHotspots: false,
    },
  ],
  customAssets: [],
};

export function createBlankStory(id?: string | null, authorName?: string | null): VNStory {
  const safeId = id || `project-${Date.now()}`;
  return {
    id: safeId,
    version: '1.0.0',
    title: 'Untitled Project',
    author: authorName || 'Author',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    textBoxConfig: {
      theme: 'minimal',
      opacity: 0.9,
      borderColor: '#b15be4',
      fontSize: 'base',
      typewriterSpeedMs: 25,
      showAvatar: true,
      soundBlipEnabled: true,
      position: 'bottom',
    },
    variables: [],
    characters: [],
    chapters: [
      {
        id: `chap-1`,
        number: 1,
        title: 'Chapter 1',
        summary: '',
        loadingScreen: { enabled: false, title: 'Chapter 1' },
        startSceneId: 'scene-1',
        scenes: [
          {
            id: 'scene-1',
            name: 'Scene 1',
            backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
            timeline: [],
            hotspots: [],
            enableHotspots: false,
          },
        ],
      },
    ],
    scenarios: [
      {
        id: 'scene-1',
        name: 'Scene 1',
        backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
        timeline: [],
        hotspots: [],
        enableHotspots: false,
      },
    ],
    customAssets: [],
  };
}
