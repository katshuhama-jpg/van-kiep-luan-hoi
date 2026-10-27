import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cardMeta } from '@/lib/cardServer';
import { SITE_NAME } from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = /^[A-Za-z0-9]{6,16}$/.test(id) ? await cardMeta(id) : null;
  if (!m) return { title: 'Không tìm thấy thẻ', robots: { index: false } };
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
            {m.kind === 'match' ? 'Lôi đài' : 'Một đời'}
          </span>
          <span className="meta">@{m.owner} khoe</span>
        </div>
      </header>
      <h1 className="k-title">{m.title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="k-img" src={`/k/${id}/og`} width={1200} height={630} alt={m.title} />
      <p className="k-desc">{m.desc}</p>
      <Link href="/choi" className="btn btn-red btn-big k-cta">
        Đầu thai thử một kiếp
      </Link>
      <p className="k-sub">
        {SITE_NAME}: game pixel tu tiên trùng sinh, chơi ngay trên trình duyệt, không cần cài.{' '}
        {m.kind === 'match' ? <Link href="/loi-dai">Xem lôi đài</Link> : <Link href="/nghia-trang">Xem nghĩa trang giang hồ</Link>}
      </p>
    </main>
  );
}
