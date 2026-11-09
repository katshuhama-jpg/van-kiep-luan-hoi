/* Vạn Kiếp Luân Hồi - bản thử giao diện lớp chân thân. Số liệu là mẫu, không nối máy chủ. */
(function () {
  var app = document.getElementById('app');
  var S = {
    tv: 1650, layer: 2, taps: 0, burst: 0, kiep: false,
    nvTab: 'gear',
    dc: 'afk', stage: 14, tick: 0, hp: [100, 100, 100], auto: true, fast: false, won: false,
    floor: 37, tPhase: 'fight', deck: ['Kiếm ý +15% công'],
    row: 0, col: 0, last: 'S'
  };
  var timers = [];
  function fmt(n) { return Math.round(n).toLocaleString('vi-VN'); }
  function clear() { timers.forEach(clearInterval); timers.forEach(clearTimeout); timers = []; }
  function route() { return (location.hash || '#home').slice(1); }

  function nav(on) {
    function a(h, t, ic) { return '<a href="#' + h + '"' + (on === h ? ' class="on"' : '') + '><img src="img/' + ic + '.png" alt="">' + t + '</a>'; }
    return '<nav class="bot" aria-label="Điều hướng chính">' + a('home', 'Tu luyện', 'g_lien_hoa_dai') + a('nhanvat', 'Nhân vật', 'g_ngoc_boi_xanh') +
      '<a class="mid" href="#tinhmong"><img src="img/g_thuy_linh_chau.png" alt="">Nhập mộng</a>' + a('dicanh', 'Đi cảnh', 'g_thai_a_kiem') + a('dongphu', 'Động phủ', 'lo_dan') + '</nav>';
  }

  var FX = {"ring":[36,13,8],"ring2":[46,16,8],"motes":[36,44,12],"pillar":[22,60,8],"orbit":[50,40,16],"rays":[70,70,6],"luatien":[60,30,8],"tuongvan":[58,16,1],"sen":[40,12,1],"phatquang":[40,40,6],"kiem":[60,60,8],"halo":[40,40,8],"petals":[50,56,12]};
  function fx(n, top, dur, extra) {
    var d = FX[n];
    return '<span class="pfx" aria-hidden="true" style="top:' + top + '%;width:calc(var(--k)*' + d[0] + 'px);height:calc(var(--k)*' + d[1] + 'px);background-image:url(img/fx_' + n + '.png);' +
      (d[2] > 1 ? 'animation:pfx ' + dur + 's steps(' + (d[2] - 1) + ',jump-none) infinite;background-size:' + (d[2] * 100) + '% 100%;' : 'background-size:100% 100%;') + (extra || '') + '"></span>';
  }
  /* khung 64x64 điểm ảnh như game, hiệu ứng đặt theo % giống components/Sprite.tsx */
  function charbox(img, w, h, alt, back, front) {
    return '<div class="cbox">' + (back || '') + '<img src="img/' + img + '.png" alt="' + alt + '" class="cimg" style="width:calc(var(--k)*' + w + 'px);height:calc(var(--k)*' + h + 'px)">' + (front || '') + '</div>';
  }

  /* ---------- Màn tu tĩnh (bản trước) ---------- */
  function tutinh() {
    var need = 2200 + (S.layer - 2) * 600, p = Math.floor(S.tv / need * 100);
    return '<div class="hdr"><div style="width:52px;height:52px;border:3px solid var(--gold);background:var(--paper2);overflow:hidden;flex-shrink:0"><img src="img/ct_head.png" alt="" style="width:60px;height:48px;margin:4px 0 0 -7px"></div>' +
      '<div style="flex:1;display:flex;flex-direction:column"><span style="font-size:17px;font-weight:700;color:var(--paper)">Lâm Thanh Vân</span><span class="lc">Lực chiến ' + fmt(24180 + (S.layer - 2) * 1350) + '</span></div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;font-size:14px;font-weight:700;color:var(--paper)"><span>2.003 linh thạch</span><span style="color:#c8b0ff">Mộng lực 2/3</span></div></div>' +
      '<div class="scene" style="height:46%;min-height:300px"><img class="bg" src="img/bg_tien_w.png" alt="">' +
      '<div style="position:absolute;left:10px;top:12px;display:flex;flex-direction:column;gap:8px"><button class="side"><img src="img/g_lac_thu.png" alt="">Thư</button><button class="side"><img src="img/van_co_bao.png" alt="">Quà</button><a class="side" href="#mongdiep" style="text-decoration:none"><span class="bf bf-gold" style="--k:2"></span>Mộng điệp</a></div>' +
      '<div style="position:absolute;right:10px;top:12px;display:flex;flex-direction:column;gap:8px"><button class="side"><img src="img/g_thien_co_lenh.png" alt="">Bảng</button><button class="side"><img src="img/g_la_ban_dong.png" alt="">Nhiệm vụ</button></div>' +
      '<div class="q" style="left:38%;bottom:12%"></div><div class="q" style="left:48%;bottom:9%;animation-delay:1.2s;background:#fff8e6"></div><div class="q" style="left:58%;bottom:12%;animation-delay:2.1s"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:4%;display:flex;justify-content:center">' + charbox('chanthan', 28, 47, 'Chân thân đang tọa thiền',
        fx('rays', 45, 2.4, 'opacity:.55') + fx('pillar', 48, 1.2, 'opacity:.7') + fx('halo', 34, 2.4, 'opacity:.9') + fx('ring2', 94, 2.4, 'opacity:.7') + fx('ring', 93, 1.6) + fx('tuongvan', 95, 1),
        fx('motes', 50, 2.4) + fx('orbit', 55, 2)) + '</div>' +
      '<div id="fl" style="position:absolute;left:0;right:0;top:30%;text-align:center;font-size:22px;font-weight:700;color:var(--goldl);text-shadow:2px 2px 0 var(--dark);opacity:0"></div>' +
      (S.kiep ? '<div class="flash" style="position:absolute;inset:0;background:#e8e0ff"></div><div class="kiep" style="position:absolute;left:0;right:0;top:16%;text-align:center;font-family:\'Protest Revolution\';font-size:40px;color:var(--goldl);text-shadow:3px 3px 0 var(--vio)">Tam cửu thiên kiếp</div>' : '') +
      '</div><div class="body"><div class="card"><div class="row"><span class="h">Ngộ Đạo tầng ' + S.layer + '</span><span style="font-size:15px;font-weight:700;color:var(--jade)">+13 tu vi / giây</span></div>' +
      '<div class="bar"><i id="tvb" style="width:' + Math.min(100, p) + '%"></i></div><div class="row sub" style="font-weight:600"><span id="tvt">' + fmt(S.tv) + ' / ' + fmt(need) + ' tu vi</span><span id="tvp">' + p + '%</span></div>' +
      '<div class="g3"><div class="stat"><b>44</b><span>kiếp đã sống</span></div><div class="stat"><b>17 / 60</b><span>kết cục</span></div><div class="stat"><b>+34%</b><span>tu vi từ kết cục</span></div></div></div>' +
      '<div class="g2"><button class="btn vio" data-act="tap">Thổ Nạp<small>' + S.taps + '/10 hôm nay</small></button><button id="dp" class="btn ' + (p >= 100 ? 'gold' : 'off') + '" data-act="dotpha">Đột phá<small>' + (p >= 100 ? 'tu vi đã đủ' : 'chưa đủ tu vi') + '</small></button></div></div>' + nav('home');
  }


  /* ---------- Màn chính chia đôi: trên trảm yêu tự đánh, dưới tọa thiền nâng cấp ---------- */
  var SP = { st: 14, wave: 1, idx: 0, gold: 1260, tv: 1650, lv: { kiem: 3, cp: 2, pet: 1, hp: 1 }, foe: null, boss: false, bt: 0, fail: false, fast: false, kills: 0 };
  var UP = [
    ['kiem', 'Thanh Phong kiếm', 'Pháp khí', 'g_thai_a_kiem', 1200],
    ['cp', 'Thôn Phệ Ma Công', 'Công pháp', 'g_doc_co_kiem_pho', 900],
    ['pet', 'Xích Lang', 'Linh thú', 'pet', 700],
    ['hp', 'Hộ pháp kiếp 31', 'Hộ pháp', 'kt_red', 800]
  ];
  var MOBS = [['Sói hoang', 'm_wolf', 63, 31], ['U hồn', 'm_ghost', 34, 46], ['Hổ yêu', 'm_dk_tiger', 58, 38], ['Kỳ lân non', 'm_dk_qilin', 64, 61]];
  function power() { var l = SP.lv; return 18000 + l.kiem * 1200 + l.cp * 900 + l.pet * 700 + l.hp * 800; }
  function need() { return 23000 + SP.st * 200; }
  function cost(k) { return Math.round(160 * Math.pow(SP.lv[k], 1.35) / 10) * 10; }
  function spawn() {
    if (SP.wave > 4) { SP.boss = true; SP.bt = 0; var hp = need() * 1.7; SP.foe = { n: 'Boss Phi Long', img: 'm_dk_flydragon', w: 112, h: 57, hp: hp, max: hp }; return; }
    var m = MOBS[(SP.st + SP.wave + SP.idx) % MOBS.length], hp2 = 4500 + SP.st * 150;
    SP.foe = { n: m[0], img: m[1], w: m[2], h: m[3], hp: hp2, max: hp2 };
  }
  function hud() {
    var f = SP.foe;
    if (SP.boss) return '<b class="sp-boss-n">' + f.n + '</b><span class="sp-bhp"><i id="sp-fhp2" style="width:' + Math.max(0, f.hp / f.max * 100) + '%"></i></span><span class="sp-turn">' + Math.max(0, 12 - SP.bt) + ' hiệp</span>';
    var seg = '';
    for (var i = 0; i < 12; i++) { var n = (SP.wave - 1) * 3 + SP.idx; seg += '<i class="' + (i < n ? 'd' : i === n ? 'c' : '') + '"></i>'; }
    return '<b>Ải 3-' + SP.st + '</b><span class="sp-seg">' + seg + '<i class="bs"></i></span>';
  }
  function foeHTML(cls) {
    var f = SP.foe, flip = (f.img === 'm_ghost' ? '' : ';transform:scaleX(-1)') + (f.img === 'm_wolf' ? ';filter:brightness(.5) saturate(.4)' : '');
    return '<div id="sp-foe" class="sp-u ' + (SP.boss ? 'boss ' : '') + (cls || '') + '">' + (SP.boss ? '' : '<span class="sp-hpb"><i id="sp-fhp" style="width:' + Math.max(0, f.hp / f.max * 100) + '%"></i></span>') +
      '<img src="img/' + f.img + '.png" alt="' + f.n + '" style="width:calc(var(--k)*' + f.w + 'px);height:calc(var(--k)*' + f.h + 'px)' + flip + '"><span class="shd"></span></div>';
  }
  function arena() {
    return '<div class="sp-hud" id="sp-hud">' + hud() + '</div>' +
      foeHTML('') +
      '<div id="sp-fail" class="sp-fail"' + (SP.fail ? '' : ' hidden') + '><span class="t">Chưa hạ được boss</span><span id="sp-failtx" class="s">Lực chiến ' + fmt(power()) + ' / cần ' + fmt(need()) + '. Nâng pháp khí bên dưới rồi đánh lại.</span><button class="btn gold" data-act="sp-retry" style="min-height:44px;padding:0 16px;font-size:16px">Đánh lại boss</button></div>';
  }
  function upCards() {
    return UP.map(function (u) {
      var c = cost(u[0]), ok = SP.gold >= c, ic = u[3] === 'pet' ? '<img src="img/pet.png" alt="" style="width:40px;height:20px">' : u[3] === 'kt_red' ? '<img src="img/kt_red.png" alt="" style="width:14px;height:31px">' : '<img src="img/' + u[3] + '.png" alt="" style="width:32px;height:32px">';
      return '<button class="sp-up" data-act="sp-up" data-v="' + u[0] + '" aria-label="Nâng ' + u[1] + ', tầng ' + SP.lv[u[0]] + ', giá ' + fmt(c) + ' linh thạch"' + (ok ? '' : ' aria-disabled="true"') + '><span class="sp-ic">' + ic + '<i>' + SP.lv[u[0]] + '</i></span><b>' + u[2] + '</b><span class="sp-cost' + (ok ? '' : ' no') + '"><img src="img/linhthach.png" alt="">' + fmt(c) + '</span></button>';
    }).join('');
  }
  function home() {
    var p = power(), short = p < need();
    return '<div class="hdr"><div style="width:48px;height:48px;border:3px solid var(--gold);background:var(--paper2);overflow:hidden;flex-shrink:0"><img src="img/st_front.png" alt="" style="width:60px;height:108px;margin:-4px 0 0 -9px"></div>' +
      '<div style="flex:1;display:flex;flex-direction:column"><span style="font-size:16px;font-weight:700;color:var(--paper)">Lâm Thanh Vân · Ngộ Đạo 2</span><span class="lc" id="sp-pow">Lực chiến ' + fmt(p) + '</span></div>' +
      '<div style="display:flex;align-items:center;gap:4px;font-size:16px;font-weight:700;color:var(--paper)"><img src="img/linhthach.png" alt="linh thạch" style="width:18px;height:18px"><span id="sp-gold">' + fmt(SP.gold) + '</span></div></div>' +
      '<div class="scene" id="sp-arena" style="--k:2;flex:1;min-height:250px;max-height:340px;background:#e9d6b0"><img class="bg" src="img/bg_dat.png" alt="" style="width:calc(var(--k)*256px);height:calc(var(--k)*160px)">' + arena() + '</div>' +
      '<div class="sp-strip"><span>Boss ải cần lực <b id="sp-need" style="color:' + (short ? '#ff8a6e' : 'var(--goldl)') + '">' + fmt(need()) + '</b></span><span>Trảm <b id="sp-kills">' + SP.kills + '</b> yêu</span><button class="sp-spd" data-act="sp-fast" aria-pressed="' + SP.fast + '">' + (SP.fast ? 'x2' : 'x1') + '</button></div>' +
      '<div class="scene" style="--k:1;height:160px;flex-shrink:0;background:#2e3a52"><img class="bg" src="img/bg_thien_w.png" alt="" style="width:480px;height:150px">' +
      '<div id="sp-ct" style="position:absolute;left:0;right:0;bottom:14px;display:flex;justify-content:center">' + '<img class="sp-fk l" src="img/phikiem.png" alt="">' + charbox('ct_stand1', 52, 51, 'Chân thân đứng giữa, sau lưng có cánh', fx('ring', 94, 1.6), fx('motes', 40, 2.4)) + '<img class="sp-fk r" src="img/phikiem.png" alt="">' + '</div>' +
      '<div id="fl" style="position:absolute;left:0;right:0;top:34%;text-align:center;font-size:22px;font-weight:700;color:var(--goldl);text-shadow:2px 2px 0 var(--dark);opacity:0"></div>' +
      '<div style="position:absolute;left:8px;right:8px;top:6px;display:flex;flex-direction:column;gap:3px"><div class="row" style="color:var(--paper3);font-size:13px;font-weight:700;text-shadow:1px 1px 0 var(--dark)"><span>Chân thân · +13 tu vi/giây</span><span id="sp-tvt">' + fmt(SP.tv) + ' / 2.200</span></div><div class="bar" style="height:10px"><i id="sp-tvb" style="width:' + Math.min(100, SP.tv / 22) + '%"></i></div></div></div>' +
      '<div id="sp-ups" class="sp-ups">' + upCards() + '</div>' + nav('home');
  }
  function spRefresh() {
    if (!document.getElementById('sp-arena')) return;
    var p = power();
    document.getElementById('sp-hud').innerHTML = hud();
    document.getElementById('sp-pow').textContent = 'Lực chiến ' + fmt(p);
    document.getElementById('sp-gold').textContent = fmt(SP.gold);
    var nd = document.getElementById('sp-need'); nd.textContent = fmt(need()); nd.style.color = p < need() ? '#ff8a6e' : 'var(--goldl)';
    document.getElementById('sp-kills').textContent = SP.kills;
    document.getElementById('sp-ups').innerHTML = upCards();
    var fl = document.getElementById('sp-fail'); fl.hidden = !SP.fail;
    document.getElementById('sp-failtx').textContent = 'Lực chiến ' + fmt(p) + ' / cần ' + fmt(need()) + '. Nâng pháp khí bên dưới rồi đánh lại.';
  }
  /* hiệu ứng pixel nướng từ pixelfx (sword-slash, hit-spark, crit-hit, poof, collect-burst): [rộng, cao, số khung, tâm x, tâm y, fps] */
  var VFX = {"sword-slash": [113, 96, 18, 43, 86, 30], "hit-spark": [122, 71, 15, 34, 56, 30], "crit-hit": [174, 131, 22, 77, 102, 30], "poof": [91, 76, 36, 43, 65, 30], "collect-burst": [78, 88, 30, 36, 81, 30]};
  function vfx(box, name, x, y, k, fixed) {
    var d = VFX[name], e = document.createElement('span'), dur = d[2] / d[5];
    e.className = 'vfx'; e.setAttribute('aria-hidden', 'true');
    e.style.cssText = (fixed ? 'position:fixed;z-index:60;' : 'position:absolute;z-index:7;') + 'left:' + (x - d[3] * k) + 'px;top:' + (y - d[4] * k) + 'px;width:' + d[0] * k + 'px;height:' + d[1] * k + 'px;background-image:url(img/vfx_' + name + '.png);background-size:' + d[2] * 100 + '% 100%;animation:pfx ' + dur + 's steps(' + (d[2] - 1) + ',jump-none) forwards';
    box.appendChild(e); setTimeout(function () { e.remove(); }, dur * 1000 + 50);
  }
  /* phi kiếm và chưởng bay từ chân thân đang tọa thiền lên quái ở màn trên */
  function fire(from, to, kind, crit, ms) {
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var n = crit ? 3 : 1;
    for (var i = 0; i < n; i++) (function (i) {
      var x0 = a.left + a.width / 2 + (i - (n - 1) / 2) * 26, y0 = a.top + 10, x1 = b.left + b.width / 2 + (i - (n - 1) / 2) * 10, y1 = b.top + b.height * 0.55;
      var ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI, e = document.createElement('span');
      if (kind === 'chuong') {
        e.className = 'sp-proj chuong';
        e.style.cssText = 'left:' + (x0 - 99) + 'px;top:' + (y0 - 28) + 'px;width:129px;height:56px;transform-origin:99px 28px;transform:rotate(' + ang + 'deg)';
      } else {
        e.className = 'sp-proj kiem';
        e.style.cssText = 'left:' + (x0 - 46) + 'px;top:' + (y0 - 7) + 'px;width:52px;height:14px;transform-origin:46px 7px;transform:rotate(' + ang + 'deg)';
      }
      document.body.appendChild(e);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        e.style.transition = 'transform ' + ms + 'ms cubic-bezier(.5,0,.9,.6)';
        e.style.transform = 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) rotate(' + ang + 'deg)';
      }); });
      setTimeout(function () { e.remove(); }, ms + 30);
    })(i);
  }
  function anim(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function pop(box, x, y, txt, kind) {
    var d = document.createElement('span'); d.className = 'sp-num ' + kind; d.textContent = txt;
    d.style.left = Math.max(4, Math.min(x, box.clientWidth - 90)) + 'px'; d.style.top = Math.max(34, y) + 'px'; box.appendChild(d);
    setTimeout(function () { d.remove(); }, 900);
  }
  function coins(from, n) {
    var to = document.getElementById('sp-gold'); if (!to) return;
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    for (var i = 0; i < n; i++) (function (i) {
      var c = document.createElement('img'); c.src = 'img/linhthach.png'; c.alt = ''; c.className = 'sp-coin';
      var x0 = a.left + a.width / 2 + (i - 1) * 14, y0 = a.top + a.height / 3;
      c.style.left = x0 + 'px'; c.style.top = y0 + 'px'; document.body.appendChild(c);
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        c.style.transitionDelay = (i * 70) + 'ms';
        c.style.transform = 'translate(' + (b.left - x0) + 'px,' + (b.top - y0) + 'px) scale(.8)';
      }); });
      setTimeout(function () {
        c.remove();
        if (i === n - 1) { anim(to, 'pop'); var r = to.getBoundingClientRect(); vfx(document.body, 'collect-burst', r.left - 10, r.top + r.height / 2 + 40, 1, true); }
      }, 720 + i * 70);
    })(i);
  }
  function spTick() {
    if (route() !== 'home' && route() !== '') return;
    SP.tv = (SP.tv + 13 * (SP.fast ? 0.5 : 1)) % 2200;
    var tb = document.getElementById('sp-tvb'); if (tb) { tb.style.width = (SP.tv / 22) + '%'; document.getElementById('sp-tvt').textContent = fmt(SP.tv) + ' / 2.200'; }
    if (SP.fail || SP.lock) return;
    SP.turn = (SP.turn || 0) + 1;
    var who = SP.turn % 3 === 0 ? 'chuong' : 'kiem';
    var f = SP.foe, p = power(), crit = SP.turn % 5 === 0;
    var dmg = Math.round(p / 8 * (0.85 + ((SP.turn * 7) % 5) * 0.075) * (crit ? 1.6 : 1));
    f.hp -= dmg; if (SP.boss) SP.bt++;
    var dead = f.hp <= 0, gain = 0, wasBoss = SP.boss;
    if (dead) {
      gain = SP.boss ? 300 + SP.st * 10 : 20 + (SP.kills * 13) % 25; SP.gold += gain; SP.kills++;
      if (SP.boss) { SP.st++; SP.wave = 1; SP.idx = 0; SP.boss = false; }
      else if (++SP.idx >= 3) { SP.idx = 0; SP.wave++; }
    } else if (SP.boss && SP.bt >= 12) { SP.fail = true; }
    var box = document.getElementById('sp-arena'), at = document.querySelector('#sp-ct .cimg'), fo = document.getElementById('sp-foe');
    if (!box || !at || !fo) return;
    SP.lock = true;
    var T = SP.fast ? 0.5 : 1;
    fire(at, fo, who, crit, 320 * T);
    timers.push(setTimeout(function () {
      if (!document.body.contains(fo)) return;
      var o = box.getBoundingClientRect(), b = fo.getBoundingClientRect();
      anim(fo, 'hurt'); if (wasBoss || crit) anim(box, 'shake');
      var k = 1, hx = b.left - o.left + Math.min(40, b.width * 0.3), fy = b.bottom - o.top - 6;
      var cy = b.top - o.top + b.height * 0.55, cx = b.left - o.left + b.width / 2;
      if (who === 'kiem') vfx(box, 'sword-slash', cx - 30, cy + 24, k);
      vfx(box, crit ? 'crit-hit' : 'hit-spark', cx - 10, cy + 10, k);
      box.classList.add('stop'); setTimeout(function () { box.classList.remove('stop'); }, 90);
      pop(box, b.left - o.left + b.width / 2 - 24, b.top - o.top - 6, fmt(dmg) + (crit ? '!' : ''), crit ? 'crit' : 'hit');
      var bar = document.getElementById(wasBoss ? 'sp-fhp2' : 'sp-fhp'); if (bar) bar.style.width = Math.max(0, f.hp / f.max * 100) + '%';
      if (wasBoss) { var tn = document.querySelector('.sp-turn'); if (tn) tn.textContent = Math.max(0, 12 - SP.bt) + ' hiệp'; }
      if (dead) {
        anim(fo, 'die'); coins(fo, wasBoss ? 5 : 3);
        vfx(box, 'poof', b.left - o.left + b.width / 2, b.bottom - o.top, k);
        pop(box, b.left - o.left + b.width / 2 - 20, b.top - o.top + 20, '+' + gain, 'gold');
        timers.push(setTimeout(function () {
          spawn();
          var old = document.getElementById('sp-foe'); if (old) old.outerHTML = foeHTML('enter');
          document.getElementById('sp-hud').innerHTML = hud();
          if (SP.boss) { var bn = document.createElement('div'); bn.className = 'sp-banner'; bn.textContent = 'Boss xuất hiện'; box.appendChild(bn); setTimeout(function () { bn.remove(); }, 1400); }
          spRefresh(); SP.lock = false;
        }, 520 * T));
      } else {
        if (SP.fail) spRefresh(); else document.getElementById('sp-hud').innerHTML = hud();
        SP.lock = false;
      }
    }, 330 * T));
  }
  function spLoop() { SP.lock = false; timers.push(setInterval(spTick, SP.fast ? 420 : 820)); }
  spawn();

  /* ---------- Nhân vật ---------- */
  function nhanvat() {
    var t = S.nvTab, inner = '';
    if (t === 'gear') {
      inner = '<div class="scene" style="height:380px"><img class="bg" src="img/bg_tien_w.png" alt="" style="filter:brightness(.85)">' +
        '<div style="position:absolute;left:14px;top:16px;display:flex;flex-direction:column;gap:10px"><div class="slot"><img src="img/g_can_tuong_kiem.png" alt="Càn Tượng Kiếm"></div><div class="slot"><img src="img/g_bich_ngoc_boi.png" alt="Bích Ngọc Bội"></div><div class="slot">Áo</div><div class="slot">Giày</div><div class="slot">Mũ</div></div>' +
        '<div style="position:absolute;right:14px;top:16px;display:flex;flex-direction:column;gap:10px"><div class="slot"><img src="img/g_ha_lac_ngoc_phu.png" alt="Hà Lạc Ngọc Phù"></div><div class="slot"><img src="img/g_can_khon_dai.png" alt="Càn Khôn Đại"></div><div class="slot">Pháp bảo</div><div class="slot">Linh thú</div><div class="slot">Mộng điệp</div></div>' +
        '<div class="bob" style="position:absolute;left:0;right:0;top:70px;display:flex;justify-content:center"><img src="img/st_front.png" alt="Chân thân" style="width:calc(var(--k)*30px);height:calc(var(--k)*54px);"></div>' +
        '<div style="position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center"><button class="btn gold" style="min-height:44px;padding:0 20px;font-size:17px">Trang bị nhanh</button></div></div>' +
        '<div class="body">' + [['Công', '3.240'], ['Thủ', '1.980'], ['Khí huyết', '41.500'], ['Tốc', '212']].map(function (r) { return '<div class="row" style="font-size:16px"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('') + '</div>';
    } else if (t === 'end') {
      var got = [['Hóa tro dưới thiên kiếp', 'Gặp 6 lần · lần đầu ở kiếp 3'], ['Tẩu hỏa nhập ma', 'Gặp 4 lần'], ['Xuyên không về Hà Nội 2026', 'Gặp 1 lần'], ['Chứng đạo vĩnh hằng', 'Phi thăng chính đạo · gặp 2 lần'], ['Tọa hóa truyền công', 'Gặp 1 lần']];
      var no = ['Gợi ý: một kiếp ma đạo đi đến tận cùng', 'Gợi ý: ăn thứ không nên ăn trong rừng', 'Gợi ý: ký giấy sinh tử trên lôi đài'];
      function item(n, s, ok) { return '<div style="display:flex;gap:10px;align-items:center;padding:8px 10px;background:' + (ok ? 'var(--paper3)' : 'var(--paper2)') + ';border:3px solid var(--dark)"><span style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:' + (ok ? 'var(--jade)' : '#a88a5a') + ';border:2px solid var(--dark);font-weight:700;color:var(--paper3)">' + (ok ? '✓' : '?') + '</span><div style="display:flex;flex-direction:column"><b style="font-size:16px">' + n + '</b><span style="font-size:13px;color:var(--muted)">' + s + '</span></div></div>'; }
      inner = '<div class="body"><span class="sub" style="font-size:15px">Mỗi kết cục mới gặp lần đầu cộng vĩnh viễn 2% tu vi và lực chiến. Kết cục lặp lại không cộng thêm.</span>' +
        got.map(function (g) { return item(g[0], g[1], true); }).join('') + no.map(function (n) { return item('? ? ?', n, false); }).join('') + '</div>';
    } else {
      var rows = [['Đạo hạnh từ 44 kiếp', '14.600'], ['Cảnh giới chân thân (Ngộ Đạo ' + S.layer + ')', '2.400'], ['Trang bị và pháp bảo', '1.500'], ['Kết cục 17 / 60', '× 1,34']];
      inner = '<div class="body"><span class="sub" style="font-size:15px">Lực chiến cộng từ mọi kiếp đã sống. Chơi kiếp càng sâu, gặp càng nhiều kết cục khác nhau thì càng mạnh.</span><div style="background:var(--paper3);border:3px solid var(--dark)">' +
        rows.map(function (r) { return '<div class="row" style="padding:10px 12px;border-bottom:2px solid var(--paper2);font-size:16px"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') +
        '<div class="row" style="padding:10px 12px;font-size:19px;background:var(--ink);color:var(--goldl)"><b>Lực chiến</b><b>24.180</b></div></div>' +
        '<div class="card dark" style="font-size:15px"><span><b style="color:var(--goldl)">Kiếp tốt nhất:</b> Lâm Thanh Vân, Nguyên Anh, 86 năm. Hai kiếp mạnh nhất theo chân thân làm hộ pháp khi đi cảnh.</span></div></div>';
    }
    function tb(k, l) { return '<button data-act="nv" data-v="' + k + '" class="' + (t === k ? 'on' : '') + '">' + l + '</button>'; }
    return '<div class="hdr" style="justify-content:space-between"><span class="ttl">Nhân vật</span><span class="lc">Lực chiến 24.180</span></div>' +
      '<div class="tabs">' + tb('gear', 'Trang bị') + tb('end', 'Kết cục 17/60') + tb('pow', 'Lực chiến') + '</div><div style="flex:1;overflow-y:auto;display:flex;flex-direction:column">' + inner + '</div>' + nav('nhanvat');
  }

  /* ---------- Đi cảnh ---------- */
  function dicanh() {
    function tb(k, l) { return '<button data-act="dc" data-v="' + k + '" class="' + (S.dc === k ? 'on' : '') + '">' + l + '</button>'; }
    var inner = S.dc === 'afk' ? afk() : (S.dc === 'thap' ? thap() : bicanh());
    return '<div class="hdr" style="justify-content:space-between"><span class="ttl">Đi cảnh</span><span style="font-size:15px;font-weight:700;color:#c8b0ff">Mộng lực 2/3</span></div>' +
      '<div class="tabs">' + tb('afk', 'Ải treo') + tb('thap', 'Tháp Mộng Cảnh') + tb('bc', 'Bí cảnh') + '</div><div style="flex:1;overflow-y:auto;display:flex;flex-direction:column">' + inner + '</div>' + nav('dicanh');
  }
  function afk() {
    var hp = S.hp.map(function (h) { return Math.round(h) + '%'; });
    var c = S.tick === 0 ? '' : ' ';
    return '<div class="scene" style="height:330px"><img class="bg" src="img/bg_dongphu_w.png" alt="">' +
      '<div style="position:absolute;left:10px;top:8px;padding:3px 8px;background:rgba(31,22,13,.7);color:var(--goldl);font-size:14px;font-weight:700">Hắc Phong Lĩnh · Ải 3-' + S.stage + ' · Hiệp ' + Math.min(10, Math.max(1, Math.ceil(S.tick / 2))) + '/10</div>' +
      '<div id="u-me" class="unit" style="left:92px;top:96px"><span class="tag">Chân thân</span><div class="hp" style="width:60px"><i style="width:92%;background:var(--jade)"></i></div><img src="img/st_right.png" alt="Chân thân" style="width:calc(var(--k)*41px);height:calc(var(--k)*52px);"></div>' +
      '<div class="unit" style="left:14px;top:44px"><span class="tag">Hộ pháp kiếp 31</span><div class="hp" style="width:50px"><i style="width:80%;background:var(--jade)"></i></div><img src="img/kt_red.png" alt="Hộ pháp kiếp 31" style="width:calc(var(--k)*22px);height:calc(var(--k)*48px);"></div>' +
      '<div class="unit" style="left:14px;top:200px"><span class="tag">Hộ pháp kiếp 40</span><div class="hp" style="width:50px"><i style="width:100%;background:var(--jade)"></i></div><img src="img/kt_blue.png" alt="Hộ pháp kiếp 40" style="width:calc(var(--k)*21px);height:calc(var(--k)*49px);"></div>' +
      '<div class="unit" style="left:92px;top:240px"><img src="img/pet.png" alt="Linh thú Xích Lang" style="width:calc(var(--k)*63px);height:calc(var(--k)*31px);"></div>' +
      '<div class="unit en" style="right:14px;top:40px"><span class="tag">Hổ yêu</span><div class="hp" style="width:60px"><i style="width:' + hp[0] + ';background:var(--red)"></i></div><img src="img/m_dk_tiger.png" alt="Hổ yêu" style="width:calc(var(--k)*58px);height:calc(var(--k)*38px);transform:scaleX(-1)"></div>' +
      '<div class="unit en" style="right:30px;top:150px"><span class="tag">Sói hoang</span><div class="hp" style="width:60px"><i style="width:' + hp[1] + ';background:var(--red)"></i></div><img src="img/m_wolf.png" alt="Sói hoang" style="width:calc(var(--k)*63px);height:calc(var(--k)*31px);transform:scaleX(-1)"></div>' +
      '<div class="unit en" style="right:42%;top:196px"><span class="tag">U hồn</span><div class="hp" style="width:50px"><i style="width:' + hp[2] + ';background:var(--red)"></i></div><img src="img/m_ghost.png" alt="U hồn" style="width:calc(var(--k)*34px);height:calc(var(--k)*46px);"></div>' +
      '<div id="dmg" style="position:absolute;right:60px;top:100px;font-size:26px;font-weight:700;color:var(--goldl);text-shadow:2px 2px 0 var(--dark);opacity:0"></div>' +
      (S.won ? '<div style="position:absolute;inset:0;background:rgba(31,22,13,.55);display:flex;align-items:center;justify-content:center"><span style="font-family:\'Protest Revolution\';font-size:40px;color:var(--goldl);text-shadow:3px 3px 0 var(--dark)">Qua ải!</span></div>' : '') +
      '<div style="position:absolute;right:10px;bottom:10px;display:flex;gap:8px"><button class="btn ' + (S.auto ? 'gold' : 'off') + '" data-act="auto" style="min-height:44px;font-size:15px;padding:0 10px">Tự động</button><button class="btn" data-act="fast" style="min-height:44px;font-size:15px;padding:0 10px">' + (S.fast ? 'Tốc x2' : 'Tốc x1') + '</button></div></div>' +
      '<div class="body"><div class="card"><div class="row"><span class="h">Thưởng treo</span><span class="sub" style="font-weight:600">7 giờ 40 phút / tối đa 12 giờ</span></div><div class="bar"><i style="width:64%"></i></div>' +
      '<div class="g3"><div class="stat"><b style="color:var(--gold)">1.480</b><span>linh thạch</span></div><div class="stat"><b style="color:var(--jade)">920</b><span>tu vi</span></div><div class="stat"><b style="color:var(--vio)">2</b><span>món đồ</span></div></div><button class="btn jade">Nhận thưởng treo</button></div>' +
      '<div class="card"><div class="row"><b>Chương 3 · đội hình</b><span style="font-size:14px;font-weight:600;color:var(--redd)">Boss 3-20 cần lực 28.000</span></div><span class="sub">Chân thân + 2 kiếp mạnh nhất làm hộ pháp + 1 linh thú. Sống thêm kiếp tốt hơn thì hộ pháp mạnh lên. Chỉ treo khi không nhập mộng.</span></div></div>';
  }
  function thap() {
    var pool = [['Thường', '#6b5233', 'Hồi khí', 'Hồi 10% máu sau mỗi trận'], ['Hiếm', '#3d6fb0', 'Huyết chiến', '+25% công khi máu dưới nửa'], ['Quý', '#a8303a', 'Long uy', 'Boss rơi đồ đôi'], ['Thường', '#6b5233', 'Thân pháp', '+10% né đòn'], ['Hiếm', '#3d6fb0', 'Mộng điệp hộ', 'Bướm theo bên mạnh gấp đôi']];
    var st = S.floor % 3, cards = [pool[st], pool[st + 1], pool[st + 2]];
    var foes = [['Hổ yêu', 'm_dk_tiger', 58], ['Kỳ lân non', 'm_dk_qilin', 64], ['U hồn', 'm_ghost', 34]];
    var f = S.floor % 10 === 0 ? ['Boss: Phi Long', 'm_dk_flydragon', 112] : foes[S.floor % 3];
    var act = S.tPhase === 'fight'
      ? '<button class="btn big" data-act="tfight">Khiêu chiến tầng ' + S.floor + '</button>'
      : '<b style="font-size:18px;color:var(--jade)">Thắng! Chọn 1 lá Mộng phù cho lượt leo này</b><div class="g3" style="gap:8px">' + cards.map(function (c) {
        return '<button data-act="tpick" data-v="' + c[2] + '" style="min-height:120px;padding:8px;border:3px solid var(--dark);background:var(--paper3);color:var(--dark);display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center"><span style="font-size:13px;font-weight:700;color:var(--paper3);background:' + c[1] + ';padding:2px 6px">' + c[0] + '</span><b style="font-size:17px">' + c[2] + '</b><span style="font-size:14px;color:var(--brown)">' + c[3] + '</span></button>';
      }).join('') + '</div>';
    return '<div class="scene" style="height:290px"><img class="bg" src="img/bg_dai_w.png" alt="" style="filter:brightness(.7)">' +
      '<div style="position:absolute;left:12px;right:12px;top:10px;display:flex;justify-content:space-between;gap:16px;color:var(--paper3);font-size:15px;font-weight:700"><span>Tầng ' + S.floor + ' · Chân thân lực 24.180</span><span>' + f[0] + '</span></div>' +
      '<div style="position:absolute;right:12px;top:34px;width:45%" class="hp"><i style="width:' + (S.tPhase === 'pick' ? 0 : 100) + '%;background:var(--red)"></i></div>' +
      '<img class="bob" src="img/chanthan.png" alt="Chân thân" style="width:calc(var(--k)*28px);height:calc(var(--k)*47px);position:absolute;left:40px;bottom:30px;">' +
      '<img class="bob" src="img/' + f[1] + '.png" alt="' + f[0] + '" style="position:absolute;right:20px;bottom:24px;width:calc(var(--k)*' + f[2] + 'px)"></div>' +
      '<div class="body">' + act + '<div class="card"><b>Mộng phù lượt này (' + S.deck.length + ')</b><span class="sub" style="font-size:15px">' + S.deck.join(' · ') + '</span></div>' +
      '<div class="card dark"><b style="color:var(--goldl)">Khi vắng mặt</b><span style="font-size:15px">Chân thân tự leo từ tầng 34 lên 36 trong 8 giờ qua, mở 2 rương.</span></div>' +
      '<div class="card"><b>Bảng tháp tuần này</b><div class="row"><span>1. lacyy</span><span>tầng 58</span></div><div class="row"><span>2. thiende009</span><span>tầng 51</span></div><div class="row" style="font-weight:700;color:var(--redd)"><span>12. bạn</span><span>tầng ' + S.floor + '</span></div></div></div>';
  }
  function bicanh() {
    var map = [[['S', 50]], [['Q', 23], ['?', 50], ['Q', 77]], [['R', 31], ['Q', 69]], [['?', 18], ['D', 50], ['Q', 82]], [['C', 33], ['?', 67]], [['B', 50]]];
    var ys = [372, 300, 230, 160, 92, 26];
    var info = { S: ['Lối vào', 'Sương phủ đầm lầy. Chọn một ô sáng ở hàng trên để đi tiếp.', '#6b5233'], Q: ['Yêu thú chặn đường', 'Một con hổ yêu lông xám lao ra từ bụi lau. Chân thân tự đánh, thắng được chọn 1 trong 3 Mộng phù.', '#b8432f'], '?': ['Cơ duyên', 'Bên bờ nước có một lão ngư đang câu, lưỡi câu không mồi. Lão hỏi ngươi muốn câu cá hay câu người.', '#3d6fb0'], R: ['Rương cũ', 'Rương gỗ mục, khóa đồng đã gỉ. Mở ra được 120 linh thạch và một luống hạt kê vàng.', '#c9962e'], D: ['Lò đan bỏ hoang', 'Lò còn hơi ấm. Luyện một viên đan dùng ngay trong lượt này, hoặc bỏ qua.', '#2f6b5a'], C: ['Cao nhân trong mộng', 'Bóng chân thân của lacyy ngồi dưới gốc liễu. Bái sư thì cả lượt này công tăng, và hai người thành sư đồ.', '#4a3a6a'], B: ['Boss: Thủy Mãng', 'Thủy mãng ba trăm năm nằm dưới đáy đầm. Đánh thắng là xong bí cảnh.', '#8f2f20'] };
    function pos(r, c) { return map[r].length === 1 ? 0.5 : c / (map[r].length - 1); }
    var html = '', lines = '';
    map.forEach(function (row, r) {
      row.forEach(function (n, c) {
        var here = r === S.row && c === S.col, next = r === S.row + 1 && Math.abs(pos(r, c) - pos(S.row, S.col)) <= 0.55, done = r < S.row;
        var w = n[0] === 'B' ? 72 : 46, bg = here ? '#ffcf6e' : (done ? '#5a4128' : info[n[0]][2]);
        html += '<button class="node' + (next ? ' glow' : '') + '" ' + (next ? 'data-act="go" data-r="' + r + '" data-c="' + c + '"' : 'disabled') + ' aria-label="' + info[n[0]][0] + '" style="left:calc(' + n[1] + '% - ' + w / 2 + 'px);top:' + ys[r] + 'px;width:' + w + 'px;height:46px;background:' + bg + ';color:' + (here ? '#1f160d' : '#fff8e6') + ';font-size:' + (n[0] === 'B' ? 16 : 20) + 'px;opacity:' + (next || here ? 1 : (done ? .5 : .75)) + '">' + (n[0] === 'S' ? '▲' : n[0] === 'B' ? 'BOSS' : n[0] === 'D' ? 'Đ' : n[0]) + '</button>';
        if (r + 1 < map.length) map[r + 1].forEach(function (m, d) {
          if (Math.abs(pos(r, c) - pos(r + 1, d)) > 0.55) return;
          lines += '<div class="mline" data-x1="' + n[1] + '" data-y1="' + (ys[r] + 23) + '" data-x2="' + m[1] + '" data-y2="' + (ys[r + 1] + 23) + '"></div>';
        });
      });
    });
    var ev = info[S.last];
    return '<div class="scene" id="bcmap" style="height:440px"><img class="bg" src="img/bg_dongphu_w.png" alt="" style="filter:brightness(.45) saturate(.7)">' + lines + html +
      '<div style="position:absolute;left:10px;bottom:8px;display:flex;gap:8px;flex-wrap:wrap;font-size:12px;font-weight:700;color:var(--paper)"><span>Q quái</span><span>? cơ duyên</span><span>R rương</span><span>Đ lò đan</span><span>C cao nhân</span></div></div>' +
      '<div class="body"><div class="card"><b style="font-size:18px">' + ev[0] + '</b><span style="font-size:16px;line-height:1.35">' + ev[1] + '</span></div>' +
      '<span class="sub">Mỗi lượt vào bí cảnh tốn 1 mộng lực, hồi 1 điểm mỗi 8 giờ. Boss cuối cho rương và một Mộng điệp hiếm.</span></div>';
  }
  function placeLines() {
    var box = document.getElementById('bcmap'); if (!box) return;
    var W = box.clientWidth;
    box.querySelectorAll('.mline').forEach(function (l) {
      var x1 = +l.dataset.x1 / 100 * W, y1 = +l.dataset.y1, x2 = +l.dataset.x2 / 100 * W, y2 = +l.dataset.y2;
      l.style.left = x1 + 'px'; l.style.top = y1 + 'px'; l.style.width = Math.hypot(x2 - x1, y2 - y1) + 'px';
      l.style.transform = 'rotate(' + Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 'deg)';
    });
  }

  /* ---------- Tỉnh mộng ---------- */
  function tinhmong() {
    return '<div class="scene" style="height:300px"><img class="bg" src="img/bg_lo_w.png" alt="" style="filter:brightness(.55)">' +
      '<img src="img/noike.png" alt="Nồi kê Hoàng Lương vừa chín" style="width:calc(var(--k)*20px);height:calc(var(--k)*18px);position:absolute;left:calc(50% - 40px);top:190px;">' +
      '<div class="steam" style="left:calc(50% - 16px);top:185px"></div><div class="steam" style="left:50%;top:180px;animation-delay:.8s"></div><div class="steam" style="left:calc(50% + 16px);top:186px;animation-delay:1.6s"></div>' +
      '<div style="position:absolute;left:20px;right:20px;top:30px;text-align:center"><div style="font-family:\'Protest Revolution\';font-size:40px;color:var(--goldl);text-shadow:3px 3px 0 var(--dark)">Tỉnh mộng</div>' +
      '<div style="margin-top:10px;font-size:19px;font-weight:600;font-style:italic;color:var(--paper3);text-shadow:2px 2px 0 var(--dark)">Kê vừa chín. Tám mươi sáu năm chém giết, một nồi còn chưa nguội.</div></div></div>' +
      '<div class="body"><div class="card"><span class="sub" style="font-weight:600">Giấc mộng thứ 44 · bản thử: nút Nhập mộng sẽ mở cách chơi kiếp hiện tại</span><b style="font-size:22px">Lâm Thanh Vân · Nguyên Anh tầng 3</b><span style="font-size:16px;color:var(--brown)">Sống 86 năm, chính đạo. Tử trận ở Hắc Phong Lĩnh khi che cho sư muội.</span></div>' +
      '<div class="g2"><div class="card"><span class="sub" style="font-weight:600">Mộng ngộ</span><b style="font-size:24px;color:var(--gold)">+640</b><span class="sub">Kim quang, đạo hạnh +640</span></div>' +
      '<div class="card" style="flex-direction:row;align-items:center;gap:8px"><div class="bf bf-red" role="img" aria-label="Mộng điệp Huyết Hận"></div><div style="display:flex;flex-direction:column"><span class="sub" style="font-weight:600">Kết cục mới</span><b style="font-size:17px;color:var(--redd)">Chết vì che cho người khác</b></div></div></div>' +
      '<div class="card" style="flex-direction:row;gap:12px;align-items:center"><img src="img/bia.png" alt="Bia luân hồi" style="width:calc(var(--k)*14px);height:calc(var(--k)*20px);"><div style="display:flex;flex-direction:column;gap:6px;flex:1"><label for="dn" class="sub" style="font-weight:600">Di ngôn khắc lên bia</label><select id="dn" style="font-family:inherit;font-size:16px;font-weight:600;padding:8px;border:2px solid var(--dark);background:var(--paper);color:var(--dark)"><option>Kiếp này nợ một người, kiếp sau trả.</option><option>Kiếm còn, người đã đi.</option><option>Đừng tin sư huynh họ Mạc.</option></select></div></div>' +
      '<a class="btn big" href="#home" style="text-decoration:none">Về tu luyện</a></div>';
  }

  /* ---------- Động phủ + Mộng điệp ---------- */
  function dongphu() {
    function b(name, sub, btn, extra) { return '<div class="card" style="flex-direction:row;align-items:center;gap:12px">' + (extra || '') + '<div style="display:flex;flex-direction:column;gap:4px;flex:1"><b style="font-size:18px">' + name + '</b><span class="sub" style="font-size:15px">' + sub + '</span></div><button class="btn" style="min-height:44px;padding:0 12px;font-size:16px">' + btn + '</button></div>'; }
    return '<div class="scene" style="height:190px"><img class="bg" src="img/bg_dongphu_w.png" alt=""><div style="position:absolute;left:14px;bottom:12px;padding:6px 12px;background:var(--paper);border:3px solid var(--dark)"><div style="font-family:\'Protest Revolution\';font-size:28px;color:#8a1a1a">Thái Sơ Động Phủ</div><div class="sub" style="font-weight:600">Cấp 2 · nâng cấp cần 1.200 linh thạch</div></div></div>' +
      '<div class="body">' + b('Dược viên', 'Kê vàng chín sau 1 giờ 52 phút · 2 luống linh thảo đã chín', 'Thu', '<img src="img/noike.png" alt="" style="width:calc(var(--k)*20px);height:calc(var(--k)*18px);">') +
      b('Đan phòng', 'Phá Chướng Đan · còn thiếu 1 linh thảo', 'Luyện') + b('Luyện khí thất', '7 món trùng mang từ mộng về · gộp 3 món ra một ngoại trang', 'Gộp') +
      '<a class="card" href="#mongdiep" style="text-decoration:none;flex-direction:row;align-items:center;gap:10px"><div class="bf bf-gold"></div><div style="flex:1"><b style="font-size:18px">Mộng điệp</b><div class="sub">Đã gom 14 / 40 con · 3 con theo bên</div></div><b>›</b></a>' +
      '<div class="card dark" style="font-size:15px"><span><b style="color:var(--goldl)">Nồi kê vàng:</b> nấu trước khi nhập mộng, giấc mộng sau dài thêm 10 năm thọ nguyên.</span></div></div>' + nav('dongphu');
  }
  function mongdiep() {
    function set(name, info, color, items) { return '<div class="card"><div class="row"><b style="font-size:18px">' + name + '</b><span style="font-size:15px;font-weight:600;color:' + color + '">' + info + '</span></div><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;justify-items:center">' + items.map(function (c) { return '<div class="bf bf-' + c + '"></div>'; }).join('') + '</div></div>'; }
    return '<div class="hdr" style="justify-content:space-between"><a href="#dongphu" style="color:var(--paper);text-decoration:none;font-size:22px;font-weight:700;min-width:44px">‹</a><span class="ttl">Mộng điệp</span><span style="font-size:15px;font-weight:700;color:var(--goldl)">14 / 40</span></div>' +
      '<div class="body"><span class="sub" style="font-size:15px">Mỗi khoảnh khắc lớn trong mộng hóa thành một con bướm. Gom đủ bộ được ngoại trang.</span>' +
      set('Bộ Bi kịch', '4 / 5 · thưởng Tang y', 'var(--redd)', ['red', 'red', 'red', 'red', 'none']) +
      set('Bộ Phàm trần', '2 / 5', 'var(--jade)', ['jade', 'jade', 'none', 'none', 'none']) +
      set('Bộ Thiên kiêu', '3 / 5', 'var(--gold)', ['gold', 'gold', 'gold', 'none', 'none']) +
      '<div class="card dark"><b style="color:var(--goldl)">Theo bên mình (3 / 3)</b><div style="display:flex;gap:14px"><div class="bf bf-red"></div><div class="bf bf-gold"></div><div class="bf bf-violet"></div></div><span style="font-size:15px">Mỗi con theo bên cho một nội tại nhỏ.</span></div></div>' + nav('dongphu');
  }

  var screens = { home: home, tutinh: tutinh, nhanvat: nhanvat, dicanh: dicanh, tinhmong: tinhmong, dongphu: dongphu, mongdiep: mongdiep };

  var TOP = { 'bg_tien': '#f6c27a', 'bg_dai': '#06061a', 'bg_dongphu': '#cfe8e0', 'bg_lo': '#726b7e' };
  var K = 1;
  try { K = +localStorage.getItem('vkl-k') || 1; } catch (e) {}
  function scaleBar() {
    return '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:3px 8px;background:#120c07;color:#a88a5a;font-size:13px;font-weight:700;flex-shrink:0" role="group" aria-label="Cỡ điểm ảnh"><span>Bản thử · cỡ điểm ảnh</span>' +
      [1, 2, 3].map(function (k) { return '<button data-act="k" data-v="' + k + '" style="min-width:36px;min-height:26px;border:2px solid var(--dark);font-size:13px;font-weight:700;background:' + (K === k ? 'var(--goldl)' : 'var(--paper)') + '">x' + k + '</button>'; }).join('') + '</div>';
  }
  function render() {
    var r = route(); if (!screens[r]) r = 'home';
    app.style.setProperty('--k', K);
    app.innerHTML = (r === 'home' ? '' : scaleBar()) + screens[r]();
    app.querySelectorAll('.scene>.bg').forEach(function (b) {
      var m = b.getAttribute('src').match(/(bg_[a-z]+)_w/); if (m) b.parentNode.style.background = TOP[m[1]];
    });
    placeLines();
  }
  function start() {
    clear(); render();
    var r = route();
    if (r === 'home' || r === '') { if (!SP.foe) spawn(); spRefresh(); spLoop(); }
    if (r === 'tutinh') timers.push(setInterval(tick, 1000));
    if (r === 'dicanh') battleLoop();
  }
  function tick() {
    S.tv += 13;
    var need = 2200 + (S.layer - 2) * 600, p = Math.floor(S.tv / need * 100);
    var t = document.getElementById('tvt'); if (!t) return;
    t.textContent = fmt(S.tv) + ' / ' + fmt(need) + ' tu vi';
    document.getElementById('tvp').textContent = p + '%';
    document.getElementById('tvb').style.width = Math.min(100, p) + '%';
    var d = document.getElementById('dp');
    if (p >= 100 && d.className.indexOf('gold') < 0) { d.className = 'btn gold'; d.innerHTML = 'Đột phá<small>tu vi đã đủ</small>'; }
  }
  function battleLoop() {
    var t = setTimeout(function () {
      if (route() !== 'dicanh') return;
      if (S.dc === 'afk' && S.auto) {
        if (S.won) { S.won = false; S.stage++; S.tick = 0; S.hp = [100, 100, 100]; }
        else {
          S.tick++;
          var hit = [22, 18, 26][S.tick % 3];
          S.hp = S.hp.map(function (h, i) { return Math.max(0, h - (i === S.tick % 3 ? hit + 12 : hit / 3)); });
          S.won = S.hp.every(function (h) { return h <= 0; });
        }
        render();
        var me = document.getElementById('u-me'); if (me) me.classList.add('atk');
        var sc = document.querySelector('.scene'); var en = document.querySelectorAll('.en');
        if (sc && me && en.length && !S.won) {
          var tg = en[S.tick % en.length], a = me.getBoundingClientRect(), b = tg.getBoundingClientRect(), o = sc.getBoundingClientRect();
          var shot = document.createElement('span'); shot.className = 'shot';
          shot.style.left = (a.right - o.left - 6) + 'px'; shot.style.top = (a.top - o.top + a.height / 2) + 'px';
          shot.style.setProperty('--dx', (b.left - a.right + b.width / 3) + 'px'); shot.style.setProperty('--dy', (b.top - a.top + b.height / 2 - a.height / 2) + 'px');
          sc.appendChild(shot);
          setTimeout(function () {
            var sl = document.createElement('span'); sl.className = 'slash'; sl.style.left = (b.left - o.left + b.width / 3) + 'px'; sl.style.top = (b.top - o.top + b.height / 2) + 'px'; sc.appendChild(sl);
            var fw = document.createElement('span'); fw.className = 'flashw'; sc.appendChild(fw); sc.classList.add('shake');
          }, 330);
        }
        document.querySelectorAll('.en').forEach(function (e) { e.classList.add('hit'); });
        var d = document.getElementById('dmg'); if (d && !S.won) { d.textContent = '-' + fmt(3240 + (S.tick * 517) % 1900); d.style.opacity = 1; d.classList.add('float'); }
      }
      battleLoop();
    }, S.fast ? 450 : 900);
    timers.push(t);
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var a = el.dataset.act;
    if (a === 'sp-up') {
      var k = el.dataset.v, c = cost(k);
      if (SP.gold < c) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); return; }
      SP.gold -= c; SP.lv[k]++;
      var u = UP.filter(function (x) { return x[0] === k; })[0];
      spRefresh();
      var f = document.getElementById('fl'); if (f) { f.textContent = u[1] + ' tầng ' + SP.lv[k] + ' · +' + fmt(u[4]) + ' lực'; f.classList.remove('float'); void f.offsetWidth; f.style.opacity = 1; f.classList.add('float'); }
      var pw = document.getElementById('sp-pow'); if (pw) { pw.classList.remove('pop'); void pw.offsetWidth; pw.classList.add('pop'); }
      return;
    } else if (a === 'sp-retry') { SP.fail = false; spawn(); var of = document.getElementById('sp-foe'); if (of) of.outerHTML = foeHTML('enter'); spRefresh(); return; }
    else if (a === 'sp-fast') {
      SP.fast = !SP.fast; clear(); el.textContent = SP.fast ? 'x2' : 'x1'; el.setAttribute('aria-pressed', SP.fast);
      if (SP.foe.hp <= 0) { spawn(); var of2 = document.getElementById('sp-foe'); if (of2) of2.outerHTML = foeHTML('enter'); }
      spRefresh(); spLoop(); return;
    }
    if (a === 'tap') {
      if (S.taps >= 10) return;
      var b = 60 + ((S.taps * 37) % 5) * 40; S.taps++; S.tv += b; render();
      var f = document.getElementById('fl'); f.textContent = '+' + b + ' tu vi'; f.style.opacity = 1; f.classList.add('float');
    } else if (a === 'dotpha') {
      var need = 2200 + (S.layer - 2) * 600; if (S.tv < need) return;
      S.tv -= need; S.layer++; S.kiep = true; render(); setTimeout(function () { S.kiep = false; }, 1700);
    } else if (a === 'k') { K = +el.dataset.v; try { localStorage.setItem('vkl-k', K); } catch (e2) {} render(); }
    else if (a === 'nv') { S.nvTab = el.dataset.v; render(); }
    else if (a === 'dc') { S.dc = el.dataset.v; render(); }
    else if (a === 'auto') { S.auto = !S.auto; render(); }
    else if (a === 'fast') { S.fast = !S.fast; render(); }
    else if (a === 'tfight') { S.tPhase = 'pick'; render(); }
    else if (a === 'tpick') { S.deck.push(el.dataset.v); S.floor++; S.tPhase = 'fight'; render(); }
    else if (a === 'go') {
      var r = +el.dataset.r, c = +el.dataset.c;
      var map = [['S'], ['Q', '?', 'Q'], ['R', 'Q'], ['?', 'D', 'Q'], ['C', '?'], ['B']];
      S.row = r; S.col = c; S.last = map[r][c]; render();
    }
  });
  window.addEventListener('hashchange', start);
  window.addEventListener('resize', placeLines);
  start();
})();
