'use client';

import BackButton from '@/components/BackButton';
import credits from '@/lib/lpc-credits.json';
import MoiTra from '@/components/MoiTra';
import { tr } from '@/lib/i18n';

export default function TacGia() {
  return (
    <main className="app">
      <header className="topbar">
        <div className="topbar-row">
          <span className="age-big" style={{ fontSize: 28 }}>
            
            {tr("Tác giả", "Credits")}
          </span>
          <span className="meta">{tr("Game làm bằng prompt, hình của các họa sĩ chia sẻ miễn phí", "Made with prompts, with art shared freely by artists")}</span>
          <BackButton fallback="/" />
        </div>
      </header>
      <MoiTra />
      <section className="panel">
        <h2>{tr("Nhân vật", "Characters")}</h2>
        <p style={{ marginTop: 0 }}>
          
          {tr("Nhân vật được ghép từ bộ ", "Characters are assembled from the ")}<a href="https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator">Universal LPC Spritesheet Character Generator</a>{tr(" (Liberated Pixel Cup). Màu tóc và áo được nhuộm lại trong game.", " (Liberated Pixel Cup) set. Hair and clothing colors are recolored in-game.")}
        </p>
        <p className="note">{tr("Giấy phép: ", "License: ")}{credits.licenses.join(', ')}{tr(". Hình ảnh đã chỉnh sửa được chia sẻ theo cùng giấy phép CC-BY-SA 3.0.", ". Modified art is shared under the same CC-BY-SA 3.0 license.")}</p>
        <h3 className="credit-h">{tr("Họa sĩ", "Artists")}</h3>
        <p className="credit-list">{credits.authors.join(' · ')}</p>
        <details className="more">
          <summary>{tr("Nguồn gốc từng bộ hình (", "Source of each art set (")}{credits.urls.length})</summary>
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
        <h2>{tr("Quái vật và vật phẩm", "Monsters and items")}</h2>
        <p style={{ margin: 0 }}>
          
          {tr("Quái thú (rắn, dơi, ong) từ ", "Beasts (snakes, bats, bees) from ")}<a href="https://opengameart.org/content/lpc-monsters">[LPC] Monsters</a>{tr(" của Charles Sanchez (CharlesGabriel), bagzie và bluecarrot16, giấy phép CC-BY-SA 3.0 / GPL 3.0. Sói từ ", " by Charles Sanchez (CharlesGabriel), bagzie and bluecarrot16, licensed CC-BY-SA 3.0 / GPL 3.0. Wolves from ")}<a href="https://opengameart.org/content/lpc-wolf-animation">LPC Wolf Animation</a>{tr(" của Stephen Challener (Redshrike) và William.Thompsonj (CC-BY-SA 3.0 / GPL 3.0). Cáo, gấu, sư tử từ ", " by Stephen Challener (Redshrike) and William.Thompsonj (CC-BY-SA 3.0 / GPL 3.0). Foxes, bears and lions from ")}<a href="https://opengameart.org/content/lpc-animals-2022">LPC Animals 2022</a>{tr(" của tapatilorenzo và Sevarihk (CC-BY 4.0). Đại bàng từ ", " by tapatilorenzo and Sevarihk (CC-BY 4.0). Eagles from ")}<a href="https://opengameart.org/content/lpc-birds">LPC Birds</a>{tr(" của bluecarrot16 (CC-BY-SA 3.0). Cá voi từ ", " by bluecarrot16 (CC-BY-SA 3.0). Whales from ")}<a href="https://opengameart.org/content/swimming-whale">swimming whale</a>{tr(" của You&apos;re Perfect Studio (CC-BY 4.0), đã nhuộm lại màu. Rồng vàng trên bục Long Ỷ từ ", " by You&apos;re Perfect Studio (CC-BY 4.0), recolored. The golden dragon on the Long Ỷ dais from ")}<a href="https://opengameart.org/content/chinese-green-dragon">Chinese Green Dragon</a>{tr(" của Pixel Archer (CC0), đã nhuộm vàng. Cần câu, roi, cuốc từ ", " by Pixel Archer (CC0), tinted gold. Fishing rods, whips and hoes from ")}<a href="https://opengameart.org/content/lpc-hand-tools">LPC Hand Tools</a>{tr(" của bluecarrot16, JaidynReiman, Pierre Vigier, Tuomo Untinen (OGA-BY 3.0 / CC-BY-SA 3.0); găng sắt của wulax, makrohn, bigbeargames, bluecarrot16, JaidynReiman. Quái hình người và boss ghép từ bộ nhân vật LPC ở trên. Biểu tượng vật phẩm từ ", " by bluecarrot16, JaidynReiman, Pierre Vigier, Tuomo Untinen (OGA-BY 3.0 / CC-BY-SA 3.0); iron gauntlets by wulax, makrohn, bigbeargames, bluecarrot16, JaidynReiman. Humanoid monsters and bosses are assembled from the LPC character set above. Item icons from ")}<a href="https://opengameart.org/content/496-pixel-art-icons-for-medievalfantasy-rpg">496 pixel art icons</a>{tr(" của Henrique Lazarini (7Soul1), giấy phép CC0.", " by Henrique Lazarini (7Soul1), licensed CC0.")}
        </p>
      </section>
      <section className="panel">
        <h2>{tr("Nền cảnh", "Scenery")}</h2>
        <p style={{ margin: 0 }}>
          
          {tr("Cây, đá, thác nước, tường, đồ vật lấy từ ", "Trees, rocks, waterfalls, walls and objects from ")}<a href="https://opengameart.org/content/lpc-tile-atlas">LPC Tile Atlas</a>{tr(" (Liberated Pixel Cup: Lanea Zimmerman (Sharm), Daniel Cook, Casper Nilsson, Daniel Armstrong, Johann Charlot, Guido Bos, Barbara Rivera và nhiều họa sĩ khác), giấy phép CC-BY-SA 3.0 / GPL 3.0. Trời, núi và mùa được vẽ thêm trong game.", " (Liberated Pixel Cup: Lanea Zimmerman (Sharm), Daniel Cook, Casper Nilsson, Daniel Armstrong, Johann Charlot, Guido Bos, Barbara Rivera and many other artists), licensed CC-BY-SA 3.0 / GPL 3.0. Sky, mountains and seasons are painted in-game.")}
        </p>
      </section>
      <section className="panel">
        <h2>{tr("Font chữ", "Fonts")}</h2>
        <p style={{ margin: 0 }}>{tr("Barlow Semi Condensed (Jeremy Tribby) cho chữ trong game, Protest Revolution (Octavio Pardo) cho logo. Cả hai theo giấy phép SIL Open Font License.", "Barlow Semi Condensed (Jeremy Tribby) for in-game text, Protest Revolution (Octavio Pardo) for the logo. Both under the SIL Open Font License.")}</p>
      </section>
    </main>
  );
}
