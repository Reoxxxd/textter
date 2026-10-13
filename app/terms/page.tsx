'use client';

import { use, Suspense } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';

const termsContent = {
  ja: {
    title: '利用規約',
    backHome: '← ホームに戻る',
    backThread: '← スレッドに戻る',
    termsBtn: '規約',
    intro: 'この利用規約（以下、「本規約」と言います。）は、Textter（以下、「当サービス」と言います。）の利用条件を定めるものです。ユーザーの皆さまには、本規約に従って当サービスをご利用いただきます。',
    sections: [
      {
        heading: '第1条（適用）',
        body: '本規約は、ユーザーと当サービス運営者との間の当サービスの利用に関わる一切の関係に適用されるものとします。',
      },
      {
        heading: '第2条（禁止事項）',
        body: 'ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。\n\n1. 法令または公序良俗に違反する行為\n2. 犯罪行為に関連する行為\n3. 他のユーザー、第三者、または運営者に対する誹謗中傷、脅迫、嫌がらせ、プライバシー侵害\n4. アダルト、グロテスク、暴力的、または差別的な表現の投稿\n5. スパム行為、大量の無意義な連投、またはサーバーに過度な負担をかける行為\n6. 広告宣伝、勧誘、または営利を目的とした投稿\n7. その他、運営者が不適切と判断する行為',
      },
      {
        heading: '第3条（投稿内容の管理と削除）',
        body: '運営者は、ユーザーが投稿した内容が本規約に違反すると判断した場合、またはGoogle AdSense等の広告配信基準に抵触する恐れがあると判断した場合、事前の通知なく当該投稿を削除することができるものとします。',
      },
      {
        heading: '第4条（免責事項）',
        body: '当サービスに掲載される情報の正確性について、いかなる保証も行いません。当サービスの利用によってユーザーに生じた損害について、運営者は一切の責任を負わないものとします。ユーザー間のトラブルについても、当事者間で解決するものとします。',
      },
      {
        heading: '第5条（規約の変更）',
        body: '運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    backHome: '← Back to Home',
    backThread: '← Back to Thread',
    termsBtn: 'Terms',
    intro: 'These Terms of Service (hereinafter referred to as "Terms") set forth the conditions for using Textter (hereinafter referred to as "Service"). Users shall use the Service in accordance with these Terms.',
    sections: [
      {
        heading: 'Article 1 (Application)',
        body: 'These Terms apply to all relationships related to the use of the Service between the user and the operator of the Service.',
      },
      {
        heading: 'Article 2 (Prohibited Matters)',
        body: 'Users must not engage in the following acts when using the Service:\n\n1. Acts that violate laws or public order and morals\n2. Acts related to criminal activity\n3. Defamation, threats, harassment, or invasion of privacy against other users, third parties, or operators\n4. Posting adult, grotesque, violent, or discriminatory expressions\n5. Spamming, meaningless repeated posting, or placing an excessive load on the server\n6. Posts for advertising, solicitation, or commercial purposes\n7. Any other acts that the operator deems inappropriate',
      },
      {
        heading: 'Article 3 (Management and Deletion of Content)',
        body: 'If the operator determines that content posted by a user violates these Terms, or may violate advertising distribution standards such as Google AdSense, the operator may delete the content without prior notice.',
      },
      {
        heading: 'Article 4 (Disclaimer)',
        body: 'The operator makes no warranties regarding the accuracy of the information published on the Service. The operator shall not be liable for any damages incurred by users through the use of the Service. Troubles between users shall be resolved among the parties involved.',
      },
      {
        heading: 'Article 5 (Changes to Terms)',
        body: 'The operator may change these Terms at any time without notifying users if deemed necessary.',
      },
    ],
  },
};

function TermsContent() {
  const searchParams = useSearchParams();
  const darkMode = searchParams.get('dark') === '1';
  const lang = (searchParams.get('lang') as 'ja' | 'en') || 'ja';
  const fromThread = searchParams.get('from_thread'); // スレッドIDを取得

  const t = termsContent[lang];

  const nextLang = lang === 'ja' ? 'en' : 'ja';
  const nextDark = darkMode ? '0' : '1';

  // 戻り先のURLと文言を自動切り替え
  const backUrl = fromThread 
    ? `/thread/${fromThread}?dark=${darkMode ? '1' : '0'}&lang=${lang}`
    : `/?dark=${darkMode ? '1' : '0'}&lang=${lang}`;
  const backText = fromThread ? t.backThread : t.backHome;

  // 規約ページ内での言語・テーマ切り替え時にも from_thread を引き継ぐパラメータ文字列
  const threadParam = fromThread ? `&from_thread=${fromThread}` : '';

  return (
    <div style={{ backgroundColor: darkMode ? '#0a0a0a' : '#ffffff', color: darkMode ? '#ffffff' : '#000000', minHeight: '100vh', transition: 'background-color 0.2s, color 0.2s' }}>
      <main className="max-w-xl mx-auto px-4 pt-8 pb-20 font-sans tracking-tight">
        
        {/* ヘッダー */}
        <header className="mb-8 pb-4 border-b border-zinc-300 dark:border-zinc-800 flex justify-between items-center font-sans">
          <NextLink
            href={backUrl}
            className="text-xs font-bold text-zinc-500 hover:underline font-sans"
          >
            {backText}
          </NextLink>

          {/* 右上の操作ボタン群 */}
          <div className="flex items-center gap-2 font-sans">
            <NextLink
              href={`/terms?dark=${darkMode ? '1' : '0'}&lang=${lang}${threadParam}`}
              className="px-3 py-1.5 text-xs font-bold rounded-full transition"
              style={{ backgroundColor: darkMode ? '#27272a' : '#e4e4e7', color: darkMode ? '#ffffff' : '#000000', border: '1px solid #a1a1aa' }}
            >
              {t.termsBtn}
            </NextLink>

            <NextLink
              href={`/terms?dark=${darkMode ? '1' : '0'}&lang=${nextLang}${threadParam}`}
              className="px-3 py-1.5 text-xs font-bold rounded-full transition"
              style={{ backgroundColor: darkMode ? '#18181b' : '#f4f4f5', color: darkMode ? '#ffffff' : '#000000', border: '1px solid #d4d4d8' }}
            >
              {lang === 'ja' ? 'EN' : 'JP'}
            </NextLink>

            <NextLink
              href={`/terms?dark=${nextDark}&lang=${lang}${threadParam}`}
              className="p-2 text-xs rounded-full transition"
              style={{ backgroundColor: darkMode ? '#18181b' : '#f4f4f5', color: darkMode ? '#fbbf24' : '#000000', border: '1px solid #d4d4d8' }}
              title="Toggle Theme"
            >
              {darkMode ? '☀️' : '🌙'}
            </NextLink>
          </div>
        </header>

        {/* 本文 */}
        <article className="space-y-6 font-sans">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider mb-6 font-sans">
            {t.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
            {t.intro}
          </p>

          <div className="space-y-6 pt-4 font-sans">
            {t.sections.map((section, index) => (
              <section key={index} className="space-y-2 font-sans">
                <h2 className="text-base sm:text-lg font-bold font-sans">
                  {section.heading}
                </h2>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </article>

      </main>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-sans">Loading...</div>}>
      <TermsContent />
    </Suspense>
  );
}