import { NextResponse } from 'next/server';
import { getMenu } from '@/lib/petpooja';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const tableNo = new URL(request.url).searchParams.get('table') ?? undefined;

  try {
    const menu = await getMenu({ tableNo });
    return NextResponse.json(menu, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[menu] fetch failed', error);
    return NextResponse.json(
      { error: 'Menu is temporarily unavailable.' },
      { status: 502 },
    );
  }
}
