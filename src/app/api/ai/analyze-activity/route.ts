import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzePostRun } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { activityId, geminiApiKey } = body;

    if (!geminiApiKey) {
      return NextResponse.json(
        { message: '請提供 Gemini API Key。' },
        { status: 400 }
      );
    }

    if (!activityId) {
      return NextResponse.json(
        { message: '缺少活動 ID。' },
        { status: 400 }
      );
    }

    const activity = await prisma.garminActivity.findUnique({
      where: { activityId: BigInt(activityId) }
    });

    if (!activity) {
      return NextResponse.json(
        { message: '找不到該筆活動紀錄。' },
        { status: 404 }
      );
    }

    const analysis = await analyzePostRun(geminiApiKey, activity);

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('[/api/ai/analyze-activity] Error:', error);
    return NextResponse.json(
      { message: error.message || '無法生成分析報告' },
      { status: 500 }
    );
  }
}
