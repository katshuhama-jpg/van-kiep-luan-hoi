/* Bản thử giao diện "chân thân treo máy": Động phủ (treo máy), Đi cảnh (đánh theo lượt kiểu Fire Emblem), Nhập mộng (đi một kiếp).
   Ảnh LPC ghép sẵn ở afk/*.png (khung 96px, phóng x2), hiệu ứng pixelfx ở ../img/fx2_*.png. */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var K = 2; // phóng nguyên lần, giữ pixel sắc
  var S = { tab: 'home', lt: 31240, ngoc: 86, dq: 3, tuvi: 6840, need: 9000, rate: 127, afkSec: 2 * 3600 + 14 * 60, stage: [1, 3], wave: 1, auto: true, fast: false, kiep: 6 };
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, S.fast ? ms / 2 : ms); timers.push(t); return t; }
  function clearAll() { timers.forEach(clearTimeout); timers = []; anims.forEach(clearInterval); anims = []; }
  function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }
  function h(s) { var d = document.createElement('div'); d.innerHTML = s.trim(); return d.firstChild; }
  function toast(t) { var e = h('<div class="toast">' + t + '</div>'); app.appendChild(e); setTimeout(function () { e.remove(); }, 1600); }

  // ---------- sprite theo khung ----------
  var anims = [];
  function sprite(el, src, n, fps, loop, onFrame, onEnd) {
    var spr = el.querySelector('.spr');
    if (spr._iv) { clearInterval(spr._iv); anims = anims.filter(function (x) { return x !== spr._iv; }); }
    spr.style.backgroundImage = 'url(' + src + ')';
    spr.style.backgroundSize = (n * 100) + '% 100%';
    var i = 0;
    function draw() { spr.style.backgroundPosition = (n > 1 ? (i / (n - 1)) * 100 : 0) + '% 0'; if (onFrame) onFrame(i); }
    draw();
    spr._iv = setInterval(function () {
      i++;
      if (i >= n) { if (loop) i = 0; else { clearInterval(spr._iv); if (onEnd) onEnd(); return; } }
      draw();
    }, 1000 / fps / (S.fast ? 2 : 1));
    anims.push(spr._iv);
  }
  // hiệu ứng pixelfx: [rộng, cao, số khung, neo x, neo y]
  var VFX = { 'sword-slash': [113, 96, 18, 43, 86], 'hit-spark': [122, 71, 15, 34, 56], 'crit-hit': [174, 131, 22, 77, 102], 'tan': [80, 79, 30, 33, 77], 'collect-burst': [78, 88, 30, 36, 81] };
  function vfx(box, name, x, y, k, flip) {
    var d = VFX[name]; k = k || 1;
    var e = h('<span class="vfx"></span>');
    e.style.cssText += 'left:' + (x - d[3] * k) + 'px;top:' + (y - d[4] * k) + 'px;width:' + d[0] * k + 'px;height:' + d[1] * k + 'px;background-image:url(../img/fx2_' + name + '.png);background-size:' + d[2] * 100 + '% 100%;' + (flip ? 'transform:scaleX(-1);' : '');
    box.appendChild(e);
    var i = 0, iv = setInterval(function () { i++; if (i >= d[2]) { clearInterval(iv); e.remove(); return; } e.style.backgroundPosition = (i / (d[2] - 1)) * 100 + '% 0'; }, 1000 / 30 / (S.fast ? 2 : 1));
  }

  // ---------- khung chung ----------
  function shell() {
    var h0 = Math.floor(S.afkSec / 3600), m0 = Math.floor((S.afkSec % 3600) / 60);
    return '<div class="top"><div class="ava"></div><div class="who"><b>Lâm Hạo</b><small>Kim Đan Trung kỳ · Kiếp ' + S.kiep + '</small></div>' +
      '<div class="res"><span><i style="background-image:url(../img/linhthach.png)"></i><b id="lt">' + fmt(S.lt) + '</b></span>' +
      '<span style="color:#ffcf6e;font-size:13px">Treo ' + h0 + ' giờ ' + m0 + ' phút · Đạo quả ' + S.dq + '</span></div></div>' +
      '<div class="view" id="view"></div>' +
      '<div class="nav">' + nav('home', 'Động phủ', 'g_lien_hoa_dai') + nav('canh', 'Đi cảnh', 'g_thai_a_kiem') + nav('mong', 'Nhập mộng', 'g_ha_lac_ngoc_phu') + nav('tui', 'Túi đồ', 'g_can_khon_dai', 1) + nav('tong', 'Tông môn', 'g_thien_co_lenh', 1) + '</div>';
  }
  function nav(id, t, ic, off) { return '<button data-tab="' + id + '" class="' + (S.tab === id ? 'on' : '') + (off ? ' off' : '') + '"><span class="ic" style="background-image:url(../img/' + ic + '.png)"></span>' + t + '</button>'; }
  function render() {
    clearAll();
    app.innerHTML = shell();
    var v = document.getElementById('view');
    if (S.tab === 'home') home(v); else if (S.tab === 'canh') canh(v); else mong(v);
  }
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    if (b.classList.contains('off')) { toast('Bản thử chưa có mục này'); return; }
    S.tab = b.dataset.tab; render();
  });

  // ---------- Động phủ: chân thân ở giữa, treo máy ----------
  function slot(img, label) { return '<div class="slot' + (img ? '' : ' empty') + '">' + (img ? '<img src="../img/' + img + '.png" alt="">' : '') + '<small>' + label + '</small></div>'; }
  function home(v) {
    v.innerHTML = '<div class="home"><div class="sky" style="background:#cfe8e0"></div><img class="bg" src="../img/bg_dongphu.png" alt=""><div class="ground" style="background:#b98650"></div>' +
      '<div class="cp"><small>Chiến lực</small>11.500</div>' +
      '<div class="slots l">' + slot('g_thai_a_kiem', 'Vũ khí') + slot('', 'Áo') + slot('g_bich_ngoc_boi', 'Ngọc bội') + slot('', 'Cánh') + '</div>' +
      '<div class="slots r">' + slot('g_thuy_linh_chau', 'Pháp bảo') + slot('g_lac_thu', 'Bí tịch') + slot('pet', 'Linh thú') + slot('', 'Hộ pháp') + '</div>' +
      '<span class="halo px" style="background-image:url(../img/fx_halo.png)"></span><div class="cloud"></div>' +
      '<div class="hero" id="hero"><div class="spr px"></div></div>' +
      '<div class="afk"><div class="rl"><b>Kim Đan Trung kỳ</b><span>+' + S.rate + ' tu vi / 10 giây<br>treo động phủ +40%</span></div>' +
      '<div class="bar"><i id="tvbar"></i><em id="tvtxt"></em></div>' +
      '<div class="stats"><span><i style="background:#b8432f"></i>Công 2.360</span><span><i style="background:#3d6fb0"></i>Thủ 1.327</span><span><i style="background:#2f6b5a"></i>Máu 40.200</span><span><i style="background:#c9962e"></i>Tốc 253</span></div>' +
      '<div class="collect"><div><small>Đồ treo máy đã tích (' + Math.floor(S.afkSec / 3600) + ' giờ)</small><b id="afkloot">+' + fmt(S.afkSec * 0.55) + ' linh thạch · 3 tàn quyển</b></div><button class="btn gold" id="thu">Thu</button></div>' +
      '</div></div>';
    sprite(v.querySelector('#hero'), 'hero_idle_f.png', 2, 1.6, true);
    // hào quang sau lưng (chạy bằng css, đổi cỡ nền theo số khung)
    var halo = v.querySelector('.halo');
    halo.style.backgroundSize = '800% 100%';
    function upd() {
      var p = Math.min(1, S.tuvi / S.need);
      v.querySelector('#tvbar').style.width = (p * 100) + '%';
      v.querySelector('#tvtxt').textContent = fmt(S.tuvi) + ' / ' + fmt(S.need) + ' tu vi tới Kim Đan Hậu kỳ';
    }
    upd();
    var iv = setInterval(function () { S.tuvi = Math.min(S.need, S.tuvi + S.rate / 10); S.afkSec += 1; upd(); var l = v.querySelector('#afkloot'); if (l) l.textContent = '+' + fmt(S.afkSec * 0.55) + ' linh thạch · 3 tàn quyển'; }, 1000);
    anims.push(iv);
    v.querySelector('#thu').onclick = function () {
      var g = Math.round(S.afkSec * 0.55);
      S.lt += g; S.afkSec = 0;
      var box = v.querySelector('.home');
      for (var i = 0; i < 5; i++) (function (i) { setTimeout(function () { vfx(box, 'collect-burst', 90 + i * 60, 470, 1); }, i * 90); })(i);
      document.getElementById('lt').textContent = fmt(S.lt);
      v.querySelector('#afkloot').textContent = 'Đã thu +' + fmt(g) + ' linh thạch, 3 tàn quyển';
      this.disabled = true;
    };
  }

  // ---------- Đi cảnh: đánh theo lượt kiểu Fire Emblem ----------
  var FOES = [
    { name: 'Hắc Lang Đồ', w: 'Hắc lang đao', wi: 'g_doc_co_kiem_pho', hp: 22, cx: 69, st: 8, cm: 2, filter: '' },
    { name: 'Lang Vương', w: 'Huyết nguyệt đao', wi: 'g_doc_co_kiem_pho', hp: 30, cx: 74, st: 11, cm: 5, filter: 'hue-rotate(160deg) saturate(1.6)' },
    { name: 'Hoàng Cân Lang', w: 'Hoàng cân đao', wi: 'g_doc_co_kiem_pho', hp: 26, cx: 71, st: 9, cm: 3, filter: 'sepia(.6) saturate(2)' },
  ];
  function canh(v) {
    var me = { hp: 24, max: 24, cx: 85, st: 15, cm: 19 };
    var fi = (S.wave - 1) % FOES.length, f = JSON.parse(JSON.stringify(FOES[fi])); f.max = f.hp;
    v.innerHTML = '<div class="stage" id="st"><img class="bg" src="../img/bg_rung.png" alt="">' +
      '<div class="ban me"><i>仙</i>Lâm Hạo</div><div class="ban foe">' + f.name + '<i>妖</i></div>' +
      '<div class="lvl">Rừng Hắc Phong · Ải ' + S.stage[0] + '-' + S.stage[1] + ' · đợt ' + S.wave + '/5</div>' +
      '<div class="under"></div><div class="plat"></div>' +
      '<div class="ftr" id="me" style="left:30px"><div class="spr"></div></div>' +
      '<div class="ftr" id="foe" style="left:calc(100% - 222px)"><div class="spr" style="filter:' + f.filter + '"></div></div>' +
      box('me', 'Thái A kiếm', 'g_thai_a_kiem', me) + box('foe', f.w, f.wi, f) +
      '</div><div class="ctl"><div class="log" id="log">Lâm Hạo bước vào Rừng Hắc Phong.</div><button class="btn" id="fast">x' + (S.fast ? 2 : 1) + '</button><button class="btn vio" id="ve">Về động phủ</button></div>';
    var st = v.querySelector('#st'), elMe = v.querySelector('#me'), elFoe = v.querySelector('#foe');
    sprite(elMe, 'hero_idle_r.png', 2, 2, true);
    sprite(elFoe, 'foe_idle_l.png', 2, 2, true);
    v.querySelector('#fast').onclick = function () { S.fast = !S.fast; this.textContent = 'x' + (S.fast ? 2 : 1); };
    v.querySelector('#ve').onclick = function () { S.tab = 'home'; render(); };
    function log(t) { v.querySelector('#log').textContent = t; }
    function setHp(side, u) {
      var b = v.querySelector('.box.' + side), n = b.querySelector('.hpn'), pips = b.querySelectorAll('.pips i');
      n.textContent = u.hp;
      for (var i = 0; i < pips.length; i++) pips[i].className = i < u.hp ? '' : 'x';
    }
    function tick(side, u, to, done) { // trừ máu từng nấc như Fire Emblem
      var iv = setInterval(function () { if (u.hp <= to) { clearInterval(iv); done(); return; } u.hp--; setHp(side, u); }, 45 / (S.fast ? 2 : 1));
      anims.push(iv);
    }
    function num(x, y, t, cls) { var e = h('<div class="dmg ' + (cls || '') + '">' + t + '</div>'); e.style.left = x + 'px'; e.style.top = y + 'px'; st.appendChild(e); setTimeout(function () { e.remove(); }, 1000); }
    // một đòn: kẻ đánh lướt tới, chém, trúng thì chớp sáng và trừ máu, rồi lùi về
    function strike(att, atkEl, def, defEl, side, defSide, dir, name, then) {
      var x0 = parseInt(atkEl.style.left) || atkEl.offsetLeft;
      var isMe = side === 'me';
      var walk = isMe ? 'hero_walk_r.png' : 'foe_walk_l.png', slash = isMe ? 'hero_slash_r.png' : 'foe_slash_l.png', idle = isMe ? 'hero_idle_r.png' : 'foe_idle_l.png';
      var hitRoll = Math.random() * 100 < att.cx, crit = hitRoll && Math.random() * 100 < att.cm;
      sprite(atkEl, walk, 8, 16, true);
      atkEl.style.transition = 'left ' + (0.32 / (S.fast ? 2 : 1)) + 's steps(6)';
      atkEl.style.left = (x0 + dir * 92) + 'px';
      later(function () {
        sprite(atkEl, slash, 6, 14, false, function (i) {
          if (i !== 3) return;
          var bx = defEl.offsetLeft + 96, by = defEl.offsetTop + 100;
          if (!hitRoll) { num(bx - 20, by - 70, 'Né!', 'miss'); log(name + ' chém hụt.'); return; }
          var d = att.st * (crit ? 3 : 1);
          vfx(st, 'sword-slash', bx - dir * 10, by + 20, 1, dir < 0);
          vfx(st, crit ? 'crit-hit' : 'hit-spark', bx, by, 1);
          if (crit) { st.classList.remove('shake'); void st.offsetWidth; st.classList.add('shake'); }
          defEl.classList.add('flash'); later(function () { defEl.classList.remove('flash'); }, 120);
          num(bx - 24, by - 80, crit ? 'Chí mạng ' + d : d, crit ? 'crit' : '');
          log(name + (crit ? ' tung đòn chí mạng, ' : ' chém trúng, ') + d + ' sát thương.');
          tick(defSide, def, Math.max(0, def.hp - d), function () {});
        }, function () {
          sprite(atkEl, walk, 8, 16, true);
          atkEl.style.left = x0 + 'px';
          later(function () { sprite(atkEl, idle, 2, 2, true); then(); }, 360);
        });
      }, 340);
    }
    function ko(defEl, isFoe) {
      sprite(defEl, isFoe ? 'foe_hurt.png' : 'hero_hurt.png', 6, 10, false, null, function () {
        vfx(st, 'tan', defEl.offsetLeft + 96, defEl.offsetTop + 150, 1);
        later(function () { defEl.style.visibility = 'hidden'; }, 300);
      });
    }
    function round() {
      strike(me, elMe, f, elFoe, 'me', 'foe', 1, 'Lâm Hạo', function () {
        if (f.hp <= 0) return win();
        later(function () {
          strike(f, elFoe, me, elMe, 'foe', 'me', -1, f.name, function () {
            if (me.hp <= 0) { ko(elMe, false); log('Lâm Hạo ngã xuống. Chân thân tỉnh dậy ở động phủ.'); later(function () { S.tab = 'home'; render(); }, 2200); return; }
            // nhanh hơn thì đánh thêm một lượt (như Fire Emblem)
            later(function () {
              strike(me, elMe, f, elFoe, 'me', 'foe', 1, 'Lâm Hạo (đánh thêm)', function () { if (f.hp <= 0) return win(); later(round, 600); });
            }, 400);
          });
        }, 500);
      });
    }
    function win() {
      ko(elFoe, true);
      var g = 80 + Math.floor(Math.random() * 60);
      S.lt += g; document.getElementById('lt').textContent = fmt(S.lt);
      later(function () {
        var drop = Math.random() < 0.4 ? '<span>Tàn quyển Hắc Phong đao pháp</span><br>' : '';
        var l = h('<div class="loot"><b>Hạ ' + f.name + '</b><span>+' + g + ' linh thạch</span><br>' + drop + '<span style="color:#2f6b5a">+12 tu vi cho chân thân</span></div>');
        st.appendChild(l);
        log('Thắng đợt ' + S.wave + '. Đợt sau đang tới.');
        later(function () {
          S.wave++;
          if (S.wave > 5) { S.wave = 1; S.stage[1]++; toast('Qua ải! Mở Ải ' + S.stage[0] + '-' + S.stage[1]); }
          canh(v);
        }, 1600);
      }, 900);
    }
    later(round, 900);
  }
  function box(side, wname, wimg, u) {
    var pips = ''; for (var i = 0; i < u.max; i++) pips += '<i></i>';
    var st = '<div class="st"><b>CX</b>' + u.cx + '<b>ST</b>' + u.st + '<b>CM</b>' + u.cm + '</div>';
    var wp = '<div class="wp"><div class="wn"><img src="../img/' + wimg + '.png" alt="">' + wname + '</div><div class="hp"><span class="hpn">' + u.hp + '</span><span class="pips">' + pips + '</span></div></div>';
    return '<div class="box ' + side + '">' + (side === 'me' ? st + wp : wp + st) + '</div>';
  }

  // ---------- Nhập mộng: đi một kiếp để farm ----------
  function mong(v) {
    var bfs = '';
    [['violet', 60, 70], ['gold', 330, 110], ['jade', 120, 200], ['violet', 300, 40]].forEach(function (b) { bfs += '<span class="bf" style="left:' + b[1] + 'px;top:' + b[2] + 'px;background-image:url(../img/bf_' + b[0] + '.png)"></span>'; });
    v.innerHTML = '<div class="dream" id="dr"><img class="bg" src="../img/bg_menh.png" alt="">' + bfs +
      '<span class="halo px" style="background-image:url(../img/fx_halo.png);top:26px;filter:hue-rotate(200deg)"></span>' +
      '<div class="hero" id="hero" style="top:40px;filter:brightness(.85) saturate(.7)"><div class="spr px"></div></div>' +
      '<div class="dcard" id="dc">' +
      '<h3>Nhập mộng</h3>' +
      '<p>Chân thân ngồi yên trong động phủ, thần thức nhập vào một kiếp phàm. Kiếp ấy chơi y như bản hiện tại: sinh ra, tu luyện, kết duyên, độ kiếp, rồi chết.</p>' +
      '<p>Tỉnh mộng, kiếp đi được tới đâu thì chân thân nhận về tới đó.</p>' +
      '<div class="tiers"><span>Chết trước Trúc Cơ</span><b>+200 tu vi</b><span>Trúc Cơ, Kim Đan</span><b>+800 tu vi, 1 đạo quả</b><span>Nguyên Anh trở lên</span><b>+3.000 tu vi, 2 đạo quả, 1 ký ức chiêu</b><span>Phi thăng</span><b>Cánh mới cho chân thân</b></div>' +
      '<div style="display:flex;gap:8px"><button class="btn vio" id="vao" style="flex:1">Nhập mộng · Kiếp ' + (S.kiep + 1) + '</button></div>' +
      '</div></div>';
    sprite(v.querySelector('#hero'), 'hero_idle_f.png', 2, 1, true);
    v.querySelector('#vao').onclick = function () {
      app.appendChild(h('<div class="white"></div>'));
      setTimeout(function () { var w = app.querySelector('.white'); if (w) w.remove(); }, 1500);
      setTimeout(function () {
        S.kiep++;
        var dc = v.querySelector('#dc');
        dc.innerHTML = '<h3>Tỉnh mộng</h3>' +
          '<p><b>Kiếp ' + S.kiep + ' · Lý Thanh</b> · sống 132 tuổi, Trúc Cơ Hậu kỳ. Chết vì lôi kiếp lúc độ Kim Đan.</p>' +
          '<p style="color:#5a4128">(Bản thử: đoạn này là kiếp chơi trong game hiện tại. Bấm nút dưới để chơi thật.)</p>' +
          '<div class="tiers"><span>Tu vi chân thân</span><b>+800</b><span>Đạo quả</span><b>+1 (Kiếm)</b><span>Ký ức</span><b>Kim Xà Kiếm Pháp</b></div>' +
          '<div style="display:flex;gap:8px"><a class="btn gold" style="flex:1;text-align:center;text-decoration:none" href="https://van-kiep-luan-hoi.vercel.app/choi" target="_blank" rel="noopener">Chơi kiếp thật</a><button class="btn" id="ve" style="flex:1">Về động phủ</button></div>';
        S.tuvi = Math.min(S.need, S.tuvi + 800); S.dq++;
        dc.querySelector('#ve').onclick = function () { S.tab = 'home'; render(); };
      }, 700);
    };
  }

  render();
})();
