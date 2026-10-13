'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type ThreadWithCount = {
  id: number;
  title: string;
  created_at: string;
  posts_count: number;
};

const translations = {
  ja: {
    title: 'TEXTTER',
    subtitle: 'Global Anonymous BBS',
    termsBtn: '規約',
    searchPlaceholder: 'スレッドを検索...',
    popularThreads: '🔥 人気のスレッド',
    newThreadPlaceholder: '新しいスレッドのタイトル（150文字まで）...',
    createButton: 'スレッド作成',
    creating: '作成中...',
    noThreads: 'スレッドが見つかりません。',
    postsLabel: 'レス数: ',
  },
  en: {
    title: 'TEXTTER',
    subtitle: 'Global Anonymous BBS',
    termsBtn: 'Terms',
    searchPlaceholder: 'Search threads...',
    popularThreads: '🔥 Popular Threads',
    newThreadPlaceholder: 'New thread title (Up to 150 chars)...',
    createButton: 'Create Thread',
    creating: 'Creating...',
    noThreads: 'No threads found.',
    postsLabel: 'Posts: ',
  },
};

function HomeContent() {
  const searchParams = useSearchParams();
  const darkMode = searchParams.get('dark') === '1';
  const lang = (searchParams.get('lang') as 'ja' | 'en') || 'ja';

  const [threads, setThreads] = useState<ThreadWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const fetchThreads = async (query = '') => {
    let q = supabase
      .from('threads')
      .select('id, title, created_at, posts(id)');

    if (query.trim()) {
      q = q.ilike('title', `%${query}%`);
    }

    const { data, error } = await q;

    if (error) {
      console.error('Error fetching threads:', error);
    } else if (data) {
      const formatted = data.map((thread: any) => ({
        id: thread.id,
        title: thread.title,
        created_at: thread.created_at,
        posts_count: Array.isArray(thread.posts) ? thread.posts.length : 0,
      }));

      formatted.sort((a, b) => b.posts_count - a.posts_count);
      setThreads(formatted);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchThreads(val);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle.length > 150 || loading) return;

    setLoading(true);
    const { error } = await supabase
      .from('threads')
      .insert([{ title: newTitle }]);

    if (error) {
      alert('スレッドの作成に失敗しました: ' + error.message);
    } else {
      setNewTitle('');
      fetchThreads(searchQuery);
    }
    setLoading(false);
  };

  const nextLang = lang === 'ja' ? 'en' : 'ja';
  const nextDark = darkMode ? '0' : '1';

  return (
    <div style={{ backgroundColor: darkMode ? '#0a0a0a' : '#ffffff', color: darkMode ? '#ffffff' : '#000000', minHeight: '100vh', transition: 'background-color 0.2s, color 0.2s' }}>
      
      {/* 右上の操作ボタン群 */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10 font-sans">
        <Link
          href={`/terms?dark=${darkMode ? '1' : '0'}&lang=${lang}`}
          className="px-3 py-1.5 text-xs font-bold rounded-full transition"
          style={{
            backgroundColor: darkMode ? '#18181b' : '#f4f4f5',
            color: darkMode ? '#ffffff' : '#000000',
            border: '1px solid #d4d4d8'
          }}
        >
          {t.termsBtn}
        </Link>

        <Link
          href={`/?dark=${darkMode ? '1' : '0'}&lang=${nextLang}`}
          className="px-3 py-1.5 text-xs font-bold rounded-full transition"
          style={{
            backgroundColor: darkMode ? '#18181b' : '#f4f4f5',
            color: darkMode ? '#ffffff' : '#000000',
            border: '1px solid #d4d4d8'
          }}
        >
          {lang === 'ja' ? 'EN' : 'JP'}
        </Link>

        <Link
          href={`/?dark=${nextDark}&lang=${lang}`}
          className="p-2 text-xs rounded-full transition"
          style={{
            backgroundColor: darkMode ? '#18181b' : '#f4f4f5',
            color: darkMode ? '#fbbf24' : '#000000',
            border: '1px solid #d4d4d8'
          }}
          title="Toggle Theme"
        >
          {darkMode ? '☀️' : '🌙'}
        </Link>
      </div>

      <main className="max-w-xl mx-auto px-4 pt-16 pb-36 font-sans tracking-tight">
        
        {/* 検索エンジン風 中央セクション */}
        <section className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-black tracking-widest uppercase mb-2 font-sans">
            {t.title}
          </h1>
          <p className="text-xs text-zinc-500 font-medium mb-8 font-sans">{t.subtitle}</p>

          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              style={{
                backgroundColor: darkMode ? '#18181b' : '#ffffff',
                color: darkMode ? '#ffffff' : '#000000',
                borderColor: darkMode ? '#3f3f46' : '#d4d4d8'
              }}
              className="w-full px-5 py-3.5 rounded-full border text-sm font-medium focus:outline-none placeholder-zinc-400 transition shadow-sm hover:shadow-md focus:shadow-md font-sans"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </section>

        {/* 人気のスレッド */}
        <section className="mt-12">
          <h2 className="text-xs font-bold tracking-wider text-zinc-500 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 font-sans">
            {t.popularThreads}
          </h2>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans">
            {threads.length === 0 ? (
              <p className="text-center text-sm font-medium text-zinc-500 py-8 font-sans">{t.noThreads}</p>
            ) : (
              threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/thread/${thread.id}?dark=${darkMode ? '1' : '0'}&lang=${lang}`}
                  className="group block py-3.5 px-1 transition"
                >
                  <div className="flex justify-between items-baseline gap-4">
                    <h3 
                      style={{ color: darkMode ? '#ffffff' : '#000000' }}
                      className="text-base sm:text-lg font-medium group-hover:underline tracking-tight transition line-clamp-1 font-sans"
                    >
                      {thread.title}
                    </h3>

                    {/* レス数 ＆ 日時（サンセリフフォント font-sans に指定） */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 shrink-0 font-sans">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {t.postsLabel}{thread.posts_count}
                      </span>
                      <time>{new Date(thread.created_at).toLocaleString()}</time>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

      </main>

      {/* 新規スレッド作成フォーム（1行ピル型） */}
      <div 
        style={{
          backgroundColor: darkMode ? 'rgba(18, 18, 20, 0.95)' : 'rgba(250, 250, 250, 0.95)',
          borderColor: darkMode ? '#27272a' : '#d4d4d8'
        }}
        className="fixed bottom-0 left-0 right-0 border-t backdrop-blur-md p-3 shadow-lg z-40 font-sans"
      >
        <form
          onSubmit={handleCreateThread}
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
            placeholder={t.newThreadPlaceholder}
            maxLength={150}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          
          <div className="flex items-center gap-3 shrink-0 font-sans">
            <span
              className={`text-xs font-bold ${
                newTitle.length > 140 ? 'text-red-500' : 'text-zinc-400'
              }`}
            >
              {newTitle.length}/150
            </span>

            <button
              type="submit"
              disabled={loading || !newTitle.trim()}
              style={{
                backgroundColor: darkMode ? '#ffffff' : '#000000',
                color: darkMode ? '#000000' : '#ffffff',
              }}
              className="px-5 py-2 text-xs font-bold rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 font-sans"
            >
              {loading ? t.creating : t.createButton}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}