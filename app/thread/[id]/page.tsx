'use client';

import { useState, useEffect, use, Suspense, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';

type Post = {
  id: number;
  content: string;
  user_name: string;
  trip: string | null;
  res_number: number;
  created_at: string;
};

type Thread = {
  id: number;
  title: string;
  created_at: string;
};

const translations = {
  ja: {
    back: '← スレッド一覧に戻る',
    termsBtn: '規約',
    placeholder: 'レスを投稿（150文字まで）...',
    postButton: '投稿',
    posting: '送信中...',
    waitSec: '秒待機...',
    anonymous: '名無し',
    noPosts: 'まだレスがありません。最初の返信をしよう！',
    postFailed: '投稿に失敗しました: ',
  },
  en: {
    back: '← Back to Threads',
    termsBtn: 'Terms',
    placeholder: 'Reply (Up to 150 characters)...',
    postButton: 'Post',
    posting: 'Posting...',
    waitSec: 's wait...',
    anonymous: 'Anonymous',
    noPosts: 'No posts yet. Be the first to reply!',
    postFailed: 'Failed to post: ',
  },
};

function generateClientTrip(): string {
  const today = new Date().toISOString().split('T')[0];
  let seed = navigator.userAgent + today;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  return positiveHash.toString(36).substring(0, 6).toUpperCase();
}

function ThreadDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const threadId = resolvedParams.id;

  const searchParams = useSearchParams();
  const darkMode = searchParams.get('dark') === '1';
  const lang = (searchParams.get('lang') as 'ja' | 'en') || 'ja';

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [hoveredPost, setHoveredPost] = useState<Post | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const getDisplayUserName = (name: string) => {
    if (!name || name === '名無し' || name === 'Anonymous') {
      return t.anonymous;
    }
    return name;
  };

  const fetchData = async () => {
    const { data: threadData, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (!threadError) setThread(threadData);

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('res_number', { ascending: true });

    if (!postsError) {
      setPosts(postsData || []);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`room_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > 150 || loading || cooldown > 0) return;

    setLoading(true);
    const tripId = generateClientTrip();

    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          content,
          userName: '名無し',
          trip: tripId,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        alert(resData.error || t.postFailed);
      } else {
        setContent('');
        setCooldown(5);
      }
    } catch (err: any) {
      alert(t.postFailed + err.message);
    }
    setLoading(false);
  };

  const handleInsertAnchor = (resNumber: number) => {
    const anchorText = `>>${resNumber} `;
    setContent((prev) => (prev ? `${prev} ${anchorText}` : anchorText));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderContentWithAnchors = (text: string) => {
    const parts = text.split(/(>>\d+)/g);

    return parts.map((part, index) => {
      const match = part.match(/>>(\d+)/);
      if (match) {
        const targetResNum = parseInt(match[1], 10);
        const targetPost = posts.find(p => p.res_number === targetResNum);

        return (
          <span
            key={index}
            onMouseEnter={(e) => {
              if (targetPost) {
                setHoveredPost(targetPost);
                setHoverPos({ x: e.clientX, y: e.clientY });
              }
            }}
            onMouseLeave={() => setHoveredPost(null)}
            style={{ color: darkMode ? '#4ade80' : '#2563eb', cursor: 'pointer' }}
            className="font-bold underline mx-0.5 transition font-sans"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const nextLang = lang === 'ja' ? 'en' : 'ja';
  const nextDark = darkMode ? '0' : '1';

  return (
    <div style={{ backgroundColor: darkMode ? '#0a0a0a' : '#ffffff', color: darkMode ? '#ffffff' : '#000000', minHeight: '100vh', transition: 'background-color 0.2s, color 0.2s' }}>
      <main className="max-w-xl mx-auto px-4 pt-8 pb-28 font-sans tracking-tight">
        
        <header className="mb-8 pb-4 border-b border-zinc-300 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-4 w-full font-sans">
            <NextLink
              href={`/?dark=${darkMode ? '1' : '0'}&lang=${lang}`}
              className="text-xs font-bold text-zinc-500 hover:underline"
            >
              {t.back}
            </NextLink>

            <div className="flex items-center gap-2">
              <NextLink
                href={`/terms?dark=${darkMode ? '1' : '0'}&lang=${lang}&from_thread=${threadId}`}
                className="px-3 py-1.5 text-xs font-bold rounded-full transition"
                style={{ backgroundColor: darkMode ? '#18181b' : '#f4f4f5', color: darkMode ? '#ffffff' : '#000000', border: '1px solid #d4d4d8' }}
              >
                {t.termsBtn}
              </NextLink>

              <NextLink
                href={`/thread/${threadId}?dark=${darkMode ? '1' : '0'}&lang=${nextLang}`}
                className="px-3 py-1.5 text-xs font-bold rounded-full transition"
                style={{ backgroundColor: darkMode ? '#18181b' : '#f4f4f5', color: darkMode ? '#ffffff' : '#000000', border: '1px solid #d4d4d8' }}
              >
                {lang === 'ja' ? 'EN' : 'JP'}
              </NextLink>

              <NextLink
                href={`/thread/${threadId}?dark=${nextDark}&lang=${lang}`}
                className="p-2 text-xs rounded-full transition"
                style={{ backgroundColor: darkMode ? '#18181b' : '#f4f4f5', color: darkMode ? '#fbbf24' : '#000000', border: '1px solid #d4d4d8' }}
                title="Toggle Theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </NextLink>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-wider leading-snug font-sans">
            {thread ? thread.title : 'Loading...'}
          </h1>
        </header>

        {/* レス一覧 */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans">
          {posts.length === 0 ? (
            <p className="text-center text-sm font-medium text-zinc-500 py-12 font-sans">{t.noPosts}</p>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="py-5 px-1 transition">
                {/* 投稿者名・トリップ・日時も font-sans （サンセリフ）に完全統一 */}
                <div className="flex justify-between items-baseline mb-2 text-xs font-sans">
                  <div className="flex items-baseline gap-2">
                    <button
                      type="button"
                      onClick={() => handleInsertAnchor(post.res_number)}
                      style={{ color: darkMode ? '#f4f4f5' : '#000000' }}
                      className="font-bold hover:underline cursor-pointer text-xs font-sans"
                      title="Click to insert anchor"
                    >
                      {post.res_number}. {getDisplayUserName(post.user_name)}
                    </button>
                    
                    <span className="text-xs text-zinc-400 font-sans">
                      ID:{post.trip || '------'}
                    </span>
                  </div>
                  <time className="text-zinc-400 text-xs font-sans">{new Date(post.created_at).toLocaleString()}</time>
                </div>
                
                <p 
                  style={{ color: darkMode ? '#f4f4f5' : '#18181b' }}
                  className="text-base sm:text-lg font-medium leading-relaxed whitespace-pre-wrap pl-1 font-sans"
                >
                  {renderContentWithAnchors(post.content)}
                </p>
              </article>
            ))
          )}
        </div>

        {/* アンカーホバー時のプレビュー */}
        {hoveredPost && hoverPos && (
          <div
            style={{
              position: 'fixed',
              top: hoverPos.y - 90,
              left: Math.min(hoverPos.x, window.innerWidth - 320),
              backgroundColor: darkMode ? '#18181b' : '#ffffff',
              borderColor: darkMode ? '#3f3f46' : '#cbd5e1',
              color: darkMode ? '#ffffff' : '#000000',
            }}
            className="w-80 p-4 rounded-xl border shadow-xl z-50 text-xs font-sans pointer-events-none"
          >
            <div className="font-bold mb-1 text-zinc-400 font-sans">
              Response #{hoveredPost.res_number} (ID:{hoveredPost.trip || '------'})
            </div>
            <p className="line-clamp-3 text-sm font-sans">{hoveredPost.content}</p>
          </div>
        )}

      </main>

      {/* 投稿フォーム */}
      <div 
        style={{
          backgroundColor: darkMode ? 'rgba(18, 18, 20, 0.95)' : 'rgba(250, 250, 250, 0.95)',
          borderColor: darkMode ? '#27272a' : '#d4d4d8'
        }}
        className="fixed bottom-0 left-0 right-0 border-t backdrop-blur-md p-3 shadow-lg z-40 font-sans"
      >
        <form
          onSubmit={handleReply}
          style={{
            backgroundColor: darkMode ? '#18181b' : '#ffffff',
            borderColor: darkMode ? '#27272a' : '#d4d4d8'
          }}
          className="max-w-xl mx-auto flex items-center gap-2 p-1.5 pl-4 rounded-full border transition shadow-sm"
        >
          <input
            ref={inputRef}
            type="text"
            style={{ color: darkMode ? '#ffffff' : '#000000' }}
            className="flex-1 bg-transparent focus:outline-none text-sm sm:text-base font-medium placeholder-zinc-400 font-sans"
            placeholder={t.placeholder}
            maxLength={150}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          <div className="flex items-center gap-3 shrink-0 font-sans">
            <span
              className={`text-xs font-bold ${
                content.length > 140 ? 'text-red-500' : 'text-zinc-400'
              }`}
            >
              {content.length}/150
            </span>

            <button
              type="submit"
              disabled={loading || !content.trim() || cooldown > 0}
              style={{
                backgroundColor: darkMode ? '#ffffff' : '#000000',
                color: darkMode ? '#000000' : '#ffffff',
              }}
              className="px-5 py-2 text-xs font-bold rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 font-sans"
            >
              {loading
                ? t.posting
                : cooldown > 0
                ? `${cooldown}${t.waitSec}`
                : t.postButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ThreadDetail params={params} />
    </Suspense>
  );
}