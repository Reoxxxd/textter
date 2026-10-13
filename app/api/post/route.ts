import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { threadId, content, userName, trip } = body;

    if (!content || content.length > 150) {
      return NextResponse.json({ error: '無効なコンテンツです。' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json({ error: 'サーバー設定エラー (API Key未設定)' }, { status: 500 });
    }

    // 1. OpenAI Moderation API チェック（通常の flagged 判定のみに戻して誤検知を減らす）
    const moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: content }),
    });

    const moderationData = await moderationResponse.json();

    if (!moderationResponse.ok) {
      console.error('Moderation API Error:', moderationData);
      return NextResponse.json({ error: 'モデレーションAPIの呼び出しに失敗しました。' }, { status: 500 });
    }

    const result = moderationData.results?.[0];

    // 明らかな規約違反のみブロック
    if (result?.flagged) {
      return NextResponse.json(
        { error: '安全ガイドラインに違反する可能性のある表現が含まれているため投稿できません。' },
        { status: 422 }
      );
    }

    // 2. 現在のスレッドの最大 res_number を安全に取得して +1 する（重複防止）
    const { data: existingPosts, error: fetchError } = await supabase
      .from('posts')
      .select('res_number')
      .eq('thread_id', Number(threadId))
      .order('res_number', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Fetch Max Res Number Error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const nextResNumber = existingPosts && existingPosts.length > 0 ? existingPosts[0].res_number + 1 : 1;

    // 3. Supabase へ保存
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          thread_id: Number(threadId),
          content,
          user_name: userName || '名無し',
          trip,
          res_number: nextResNumber,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data[0] });
  } catch (err: any) {
    console.error('Catch Error:', err);
    return NextResponse.json({ error: err.message || 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}