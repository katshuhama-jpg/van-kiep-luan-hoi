'use client';

import BackButton from '@/components/BackButton';
import credits from '@/lib/lpc-credits.json';

export default function TacGia() {
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            Tác giả hình ảnh
          </span>
          <span className="meta">Cảm ơn các họa sĩ đã chia sẻ miễn phí</span>
          <BackButton fallback="/" />
        </div>
      </header>
      <section className="panel">
        <h2>Nhân vật</h2>
        <p style={{ marginTop: 0 }}>
          Nhân vật được ghép từ bộ <a href="https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator">Universal LPC Spritesheet Character Generator</a> (Liberated Pixel Cup). Màu tóc và áo được nhuộm lại trong game.
        </p>
        <p className="note">Giấy phép: {credits.licenses.join(', ')}. Hình ảnh đã chỉnh sửa được chia sẻ theo cùng giấy phép CC-BY-SA 3.0.</p>
        <h3 className="credit-h">Họa sĩ</h3>
        <p className="credit-list">{credits.authors.join(' · ')}</p>
        <details className="more">
          <summary>Nguồn gốc từng bộ hình ({credits.urls.length})</summary>
          <ul className="credit-urls">
            {credits.urls.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer">
                  {u.replace(/^https?:\/\//, '')}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="panel">
        <h2>Nền cảnh</h2>
        <p style={{ margin: 0 }}>
          Cây, đá, thác nước, tường, đồ vật lấy từ <a href="https://opengameart.org/content/lpc-tile-atlas">LPC Tile Atlas</a> (Liberated Pixel Cup: Lanea Zimmerman (Sharm), Daniel Cook, Casper Nilsson, Daniel Armstrong, Johann Charlot, Guido Bos, Barbara Rivera và nhiều họa sĩ khác), giấy phép CC-BY-SA 3.0 / GPL 3.0. Trời, núi và mùa được vẽ thêm trong game.
        </p>
      </section>
      <section className="panel">
        <h2>Font chữ</h2>
        <p style={{ margin: 0 }}>Handjet (Rosetta Type) cho chữ trong game, Protest Revolution (Octavio Pardo) cho logo. Cả hai theo giấy phép SIL Open Font License.</p>
      </section>
    </main>
  );
}
