import { NextRequest, NextResponse } from 'next/server';
import { loadProject, saveProject, deleteProject } from '@/lib/vn/projectFs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = loadProject(id);
    if (!story) {
      return NextResponse.json({ error: `Project "${id}" not found.` }, { status: 404 });
    }
    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('Error loading project:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const story = body.story || body;

    if (!story || !story.id) {
      return NextResponse.json({ error: 'Invalid story payload' }, { status: 400 });
    }

    const saved = saveProject(id, story);
    if (!saved) {
      return NextResponse.json({ error: 'Error writing project to disk.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Project "${id}" saved to disk successfully.` });
  } catch (error: any) {
    console.error('Error saving project:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ error: `Could not delete project "${id}".` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Project "${id}" deleted.` });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
