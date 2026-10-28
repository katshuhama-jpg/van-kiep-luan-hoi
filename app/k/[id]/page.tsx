import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cardMeta } from '@/lib/cardServer';
import { SITE_NAME } from '@/lib/seo';
import { tr } from '@/lib/i18n';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = /^[A-Za-z0-9]{6,16}$/.test(id) ? await cardMeta(id) : null;
  if (!m) return { title: tr('Không tìm thấy thẻ', "Card not found"), robots: { index: false } };
  const path = `/k/${id}`;
  const img = { url: `${path}/og`, width: 1200, height: 630, alt: m.title };
  const full = `${m.title} · ${SITE_NAME}`;
  return {
    title: { absolute: full },
    description: m.desc,
    alternates: { canonical: path },
    openGraph: { type: 'article', locale: 'vi_VN', siteName: SITE_NAME, url: path, title: full, description: m.desc, images: [img] },
    twitter: { card: 'summary_large_image', title: full, description: m.desc, images: [img.url] },
  };
}

/** Trang của một thẻ khoe: hình thẻ, lời mời vào chơi */
export default async function CardPage({ params }: Props) {
  const { id } = await params;
  const m = /^[A-Za-z0-9]{6,16}$/.test(id) ? await cardMeta(id) : null;
  if (!m) notFound();
  return (
    <main className="app k-page">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 26 }}>
            {m.kind === 'match' ? tr('Lôi đài', "Arena") : tr('Một đời', "Life")}
          </span>
          <span className="meta">@{m.owner} {tr("khoe", "shared")}</span>
        </div>
      </header>
      <h1 className="k-title">{m.title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="k-img" src={`/k/${id}/og`} width={1200} height={630} alt={m.title} />
      <p className="k-desc">{m.desc}</p>
      <Link href="/choi" className="btn btn-red btn-big k-cta">
        
        {tr("Đầu thai thử một kiếp", "Try living one life")}
      </Link>
      <p className="k-sub">
        {SITE_NAME}{tr(": game pixel tu tiên trùng sinh, chơi ngay trên trình duyệt, không cần cài.", ": a pixel xianxia rebirth game, play right in your browser, no install needed.")}{' '}
        {m.kind === 'match' ? <Link href="/loi-dai">{tr("Xem lôi đài", "View the arena")}</Link> : <Link href="/nghia-trang">{tr("Xem nghĩa trang giang hồ", "Visit the Cultivators' Cemetery")}</Link>}
      </p>
    </main>
  );
}
