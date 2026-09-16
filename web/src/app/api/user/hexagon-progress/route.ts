import { NextResponse } from 'next/server';
import { adminDb as db } from '@/lib/firebase/admin';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';

export async function POST(request: Request) {
  try {
    const rawInitData = extractInitDataFromRequest(request);
    const botToken = process.env.BOT_TOKEN;

    if (!rawInitData || !botToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validated = validateTelegramInitData(rawInitData, botToken);
    if (!validated || !validated.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    const telegramId = validated.user.id.toString();
    const body = await request.json();
    const {
      level_number,
      score,
      completed,
      duration_seconds = 0,
    } = body;

    // Fetch existing user from Firestore
    const userRef = db.collection('users').doc(telegramId).collection('hexagonBlockSort').doc('profile');
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userSnap.data() as any;

    let updatedLevel = user.currentLevel;
    let updatedTotalScore = user.totalScore;
    let updatedBestScore = user.bestScore;
    let updatedLevelsCompleted = user.levelsCompleted;

    if (completed) {
      if (level_number >= user.currentLevel) {
        updatedLevel = level_number + 1;
      }
      updatedLevelsCompleted += 1;
    }

    if (score > 0) {
      updatedTotalScore += score;
      if (score > updatedBestScore) {
        updatedBestScore = score;
      }
    }

    // Update user record in Firestore
    await userRef.update({
      currentLevel: updatedLevel,
      totalScore: updatedTotalScore,
      bestScore: updatedBestScore,
      levelsCompleted: updatedLevelsCompleted,
      lastActiveAt: new Date().toISOString()
    });

    // Insert game log for analytics
    await db.collection('hexagon_game_logs').add({
      telegramId: telegramId,
      levelNumber: level_number,
      score: score,
      completed: completed ? 1 : 0,
      durationSeconds: duration_seconds,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      user: {
        telegramId: telegramId,
        currentLevel: updatedLevel,
        totalScore: updatedTotalScore,
        bestScore: updatedBestScore,
        levelsCompleted: updatedLevelsCompleted
      },
    });
  } catch (error: any) {
    console.error('Error in /api/user/hexagon-progress:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
