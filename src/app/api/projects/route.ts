import { NextRequest, NextResponse } from 'next/server';
import { listProjects, saveProject, sanitizeProjectId } from '@/lib/vn/projectFs';
import { SAMPLE_STORY } from '@/lib/vn/sampleStory';

export async function GET() {
  try {
    const projects = listProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('Error listing projects:', error);
    return NextResponse.json({ error: error?.message || 'Error listing projects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body.id || body.title || 'new-project';
    const safeId = sanitizeProjectId(rawId);

    const title = body.title?.trim() || 'New Project';
    const author = body.author?.trim() || 'Author';
    const description = body.description?.trim() || '';

    // If sample template or blank project requested
    const useSample = body.template === 'sample';

    const newStory = {
      ...SAMPLE_STORY,
      id: safeId,
      title,
      author,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters: useSample
        ? SAMPLE_STORY.chapters
        : [
            {
              id: `chap-01-${Date.now()}`,
              number: 1,
              title: 'Chapter 1: Start',
              summary: 'Beginning of the story.',
              loadingScreen: { enabled: false, title: 'Chapter 1' },
              startSceneId: `scene-01-${Date.now()}`,
              scenes: [
                {
                  id: `scene-01-${Date.now()}`,
                  name: 'Initial Scene',
                  description: 'First scene of the project.',
                  backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
                  timeline: [
                    {
                      id: `ev-init-${Date.now()}`,
                      type: 'dialogue' as const,
                      customSpeakerName: 'Narrator',
                      text: '',
                    },
                  ],
                },
              ],
            },
          ],
    };

    const saveResult = saveProject(safeId, newStory);
    if (!saveResult.success) {
      return NextResponse.json({ error: saveResult.error || 'Failed to create project on disk.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, projectId: safeId, story: newStory });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: error?.message || 'Error creating project' }, { status: 500 });
  }
}
