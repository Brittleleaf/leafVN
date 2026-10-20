import { NextRequest, NextResponse } from 'next/server';
import { listProjects, saveProject, sanitizeProjectId } from '@/lib/vn/projectFs';
import { SAMPLE_STORY } from '@/lib/vn/sampleStory';

export async function GET() {
  try {
    const projects = listProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error: any) {
    console.error('Error al listar proyectos:', error);
    return NextResponse.json({ error: error?.message || 'Error al listar proyectos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body.id || body.title || 'nuevo-proyecto';
    const safeId = sanitizeProjectId(rawId);

    const title = body.title?.trim() || 'Nuevo Proyecto';
    const author = body.author?.trim() || 'Autor';
    const description = body.description?.trim() || '';

    // Si se solicita plantilla de muestra o proyecto en blanco
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
              title: 'Capítulo 1: Comienzo',
              summary: 'Inicio de la historia.',
              loadingScreen: { enabled: false, title: 'Capítulo 1' },
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
                      text: 'Enter dialogue text here...',
                    },
                  ],
                },
              ],
            },
          ],
    };

    const saved = saveProject(safeId, newStory);
    if (!saved) {
      return NextResponse.json({ error: 'No se pudo crear el proyecto en disco.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, projectId: safeId, story: newStory });
  } catch (error: any) {
    console.error('Error al crear proyecto:', error);
    return NextResponse.json({ error: error?.message || 'Error al crear proyecto' }, { status: 500 });
  }
}
