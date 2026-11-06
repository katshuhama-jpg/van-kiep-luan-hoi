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
    function a(h, t) { return '<a href="#' + h + '"' + (on === h ? ' class="on"' : '') + '>' + t + '</a>'; }
    return '<nav class="bot" aria-label="Điều hướng chính">' + a('home', 'Tu luyện') + a('nhanvat', 'Nhân vật') +
      '<a class="mid" href="#tinhmong">Nhập mộng</a>' + a('dicanh', 'Đi cảnh') + a('dongphu', 'Động phủ') + '</nav>';
  }

  /* ---------- Màn chính ---------- */
  function home() {
    var need = 2200 + (S.layer - 2) * 600, p = Math.floor(S.tv / need * 100);
    return '<div class="hdr"><div style="width:52px;height:52px;border:3px solid var(--gold);background:var(--paper2);overflow:hidden;flex-shrink:0"><img src="img/ct_head.png" alt="" style="width:70px;margin:2px 0 0 -11px"></div>' +
      '<div style="flex:1;display:flex;flex-direction:column"><span style="font-size:17px;font-weight:700;color:var(--paper)">Lâm Thanh Vân</span><span class="lc">Lực chiến ' + fmt(24180 + (S.layer - 2) * 1350) + '</span></div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;font-size:14px;font-weight:700;color:var(--paper)"><span>2.003 linh thạch</span><span style="color:#c8b0ff">Mộng lực 2/3</span></div></div>' +
      '<div class="scene" style="height:46%;min-height:300px"><img class="bg" src="img/bg_tien.png" alt="">' +
      '<div style="position:absolute;left:10px;top:12px;display:flex;flex-direction:column;gap:8px"><button class="side">Thư</button><button class="side">Quà</button><a class="side" href="#mongdiep" style="text-decoration:none">Mộng điệp</a></div>' +
      '<div style="position:absolute;right:10px;top:12px;display:flex;flex-direction:column;gap:8px"><button class="side">Bảng</button><button class="side">Nhiệm vụ</button></div>' +
      '<div class="q" style="left:38%;bottom:12%"></div><div class="q" style="left:48%;bottom:9%;animation-delay:1.2s;background:#fff8e6"></div><div class="q" style="left:58%;bottom:12%;animation-delay:2.1s"></div>' +
      '<div class="bob" style="position:absolute;left:0;right:0;bottom:6%;display:flex;flex-direction:column;align-items:center"><img src="img/chanthan.png" alt="Chân thân đang tọa thiền" style="width:160px;height:220px;position:relative;z-index:2"><img src="img/cloud.png" alt="" style="width:248px;height:80px;margin-top:-42px"></div>' +
      '<div id="fl" style="position:absolute;left:0;right:0;top:30%;text-align:center;font-size:22px;font-weight:700;color:var(--goldl);text-shadow:2px 2px 0 var(--dark);opacity:0"></div>' +
      (S.kiep ? '<div class="flash" style="position:absolute;inset:0;background:#e8e0ff"></div><div class="kiep" style="position:absolute;left:0;right:0;top:16%;text-align:center;font-family:\'Protest Revolution\';font-size:40px;color:var(--goldl);text-shadow:3px 3px 0 var(--vio)">Tam cửu thiên kiếp</div>' : '') +
      '</div><div class="body"><div class="card"><div class="row"><span class="h">Ngộ Đạo tầng ' + S.layer + '</span><span style="font-size:15px;font-weight:700;color:var(--jade)">+13 tu vi / giây</span></div>' +
      '<div class="bar"><i id="tvb" style="width:' + Math.min(100, p) + '%"></i></div><div class="row sub" style="font-weight:600"><span id="tvt">' + fmt(S.tv) + ' / ' + fmt(need) + ' tu vi</span><span id="tvp">' + p + '%</span></div>' +
      '<div class="g3"><div class="stat"><b>44</b><span>kiếp đã sống</span></div><div class="stat"><b>17 / 60</b><span>kết cục</span></div><div class="stat"><b>+34%</b><span>tu vi từ kết cục</span></div></div></div>' +
      '<div class="g2"><button class="btn vio" data-act="tap">Thổ Nạp<small>' + S.taps + '/10 hôm nay</small></button><button id="dp" class="btn ' + (p >= 100 ? 'gold' : 'off') + '" data-act="dotpha">Đột phá<small>' + (p >= 100 ? 'tu vi đã đủ' : 'chưa đủ tu vi') + '</small></button></div></div>' + nav('home');
  }

  /* ---------- Nhân vật ---------- */
  function nhanvat() {
    var t = S.nvTab, inner = '';
    if (t === 'gear') {
      inner = '<div class="scene" style="height:380px"><img class="bg" src="img/bg_tien.png" alt="" style="filter:brightness(.85)">' +
        '<div style="position:absolute;left:14px;top:16px;display:flex;flex-direction:column;gap:10px"><div class="slot"><img src="img/g_can_tuong_kiem.png" alt="Càn Tượng Kiếm"></div><div class="slot"><img src="img/g_bich_ngoc_boi.png" alt="Bích Ngọc Bội"></div><div class="slot">Áo</div><div class="slot">Giày</div><div class="slot">Mũ</div></div>' +
        '<div style="position:absolute;right:14px;top:16px;display:flex;flex-direction:column;gap:10px"><div class="slot"><img src="img/g_ha_lac_ngoc_phu.png" alt="Hà Lạc Ngọc Phù"></div><div class="slot"><img src="img/g_can_khon_dai.png" alt="Càn Khôn Đại"></div><div class="slot">Pháp bảo</div><div class="slot">Linh thú</div><div class="slot">Mộng điệp</div></div>' +
        '<div class="bob" style="position:absolute;left:0;right:0;top:70px;display:flex;justify-content:center"><img src="img/st_front.png" alt="Chân thân" style="width:150px;height:270px"></div>' +
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
    return '<div class="scene" style="height:330px"><img class="bg" src="img/bg_dongphu.png" alt="">' +
      '<div style="position:absolute;left:10px;top:8px;padding:3px 8px;background:rgba(31,22,13,.7);color:var(--goldl);font-size:14px;font-weight:700">Hắc Phong Lĩnh · Ải 3-' + S.stage + ' · Hiệp ' + Math.min(10, Math.max(1, Math.ceil(S.tick / 2))) + '/10</div>' +
      '<div id="u-me" class="unit" style="left:92px;top:96px"><span class="tag">Chân thân</span><div class="hp" style="width:60px"><i style="width:92%;background:var(--jade)"></i></div><img src="img/st_right.png" alt="Chân thân" style="width:92px;height:116px"></div>' +
      '<div class="unit" style="left:14px;top:44px"><span class="tag">Hộ pháp kiếp 31</span><div class="hp" style="width:50px"><i style="width:80%;background:var(--jade)"></i></div><img src="img/kt_red.png" alt="Hộ pháp kiếp 31" style="width:66px;height:144px"></div>' +
      '<div class="unit" style="left:14px;top:200px"><span class="tag">Hộ pháp kiếp 40</span><div class="hp" style="width:50px"><i style="width:100%;background:var(--jade)"></i></div><img src="img/kt_blue.png" alt="Hộ pháp kiếp 40" style="width:63px;height:98px;object-fit:cover;object-position:top"></div>' +
      '<div class="unit" style="left:92px;top:240px"><img src="img/pet.png" alt="Linh thú Xích Lang" style="width:126px;height:62px"></div>' +
      '<div class="unit en" style="right:14px;top:40px"><span class="tag">Hổ yêu</span><div class="hp" style="width:60px"><i style="width:' + hp[0] + ';background:var(--red)"></i></div><img src="img/m_dk_tiger.png" alt="Hổ yêu" style="width:116px;transform:scaleX(-1)"></div>' +
      '<div class="unit en" style="right:30px;top:150px"><span class="tag">Sói hoang</span><div class="hp" style="width:60px"><i style="width:' + hp[1] + ';background:var(--red)"></i></div><img src="img/m_wolf.png" alt="Sói hoang" style="width:126px;transform:scaleX(-1)"></div>' +
      '<div class="unit en" style="right:42%;top:196px"><span class="tag">U hồn</span><div class="hp" style="width:50px"><i style="width:' + hp[2] + ';background:var(--red)"></i></div><img src="img/m_ghost.png" alt="U hồn" style="width:68px"></div>' +
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
    var foes = [['Hổ yêu', 'm_dk_tiger', 174], ['Kỳ lân non', 'm_dk_qilin', 160], ['U hồn', 'm_ghost', 102]];
    var f = S.floor % 10 === 0 ? ['Boss: Phi Long', 'm_dk_flydragon', 224] : foes[S.floor % 3];
    var act = S.tPhase === 'fight'
      ? '<button class="btn big" data-act="tfight">Khiêu chiến tầng ' + S.floor + '</button>'
      : '<b style="font-size:18px;color:var(--jade)">Thắng! Chọn 1 lá Mộng phù cho lượt leo này</b><div class="g3" style="gap:8px">' + cards.map(function (c) {
        return '<button data-act="tpick" data-v="' + c[2] + '" style="min-height:120px;padding:8px;border:3px solid var(--dark);background:var(--paper3);color:var(--dark);display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center"><span style="font-size:13px;font-weight:700;color:var(--paper3);background:' + c[1] + ';padding:2px 6px">' + c[0] + '</span><b style="font-size:17px">' + c[2] + '</b><span style="font-size:14px;color:var(--brown)">' + c[3] + '</span></button>';
      }).join('') + '</div>';
    return '<div class="scene" style="height:290px"><img class="bg" src="img/bg_dai.png" alt="" style="filter:brightness(.7)">' +
      '<div style="position:absolute;left:12px;right:12px;top:10px;display:flex;justify-content:space-between;gap:16px;color:var(--paper3);font-size:15px;font-weight:700"><span>Tầng ' + S.floor + ' · Chân thân lực 24.180</span><span>' + f[0] + '</span></div>' +
      '<div style="position:absolute;right:12px;top:34px;width:45%" class="hp"><i style="width:' + (S.tPhase === 'pick' ? 0 : 100) + '%;background:var(--red)"></i></div>' +
      '<img class="bob" src="img/chanthan.png" alt="Chân thân" style="position:absolute;left:24px;top:110px;width:111px;height:153px">' +
      '<img class="bob" src="img/' + f[1] + '.png" alt="' + f[0] + '" style="position:absolute;right:20px;bottom:24px;width:' + f[2] + 'px"></div>' +
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
    return '<div class="scene" id="bcmap" style="height:440px"><img class="bg" src="img/bg_dongphu.png" alt="" style="filter:brightness(.45) saturate(.7)">' + lines + html +
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
    return '<div class="scene" style="height:300px"><img class="bg" src="img/bg_lo.png" alt="" style="filter:brightness(.55)">' +
      '<img src="img/noike.png" alt="Nồi kê Hoàng Lương vừa chín" style="position:absolute;left:calc(50% - 40px);top:190px;width:80px;height:72px">' +
      '<div class="steam" style="left:calc(50% - 16px);top:185px"></div><div class="steam" style="left:50%;top:180px;animation-delay:.8s"></div><div class="steam" style="left:calc(50% + 16px);top:186px;animation-delay:1.6s"></div>' +
      '<div style="position:absolute;left:20px;right:20px;top:30px;text-align:center"><div style="font-family:\'Protest Revolution\';font-size:40px;color:var(--goldl);text-shadow:3px 3px 0 var(--dark)">Tỉnh mộng</div>' +
      '<div style="margin-top:10px;font-size:19px;font-weight:600;font-style:italic;color:var(--paper3);text-shadow:2px 2px 0 var(--dark)">Kê vừa chín. Tám mươi sáu năm chém giết, một nồi còn chưa nguội.</div></div></div>' +
      '<div class="body"><div class="card"><span class="sub" style="font-weight:600">Giấc mộng thứ 44 · bản thử: nút Nhập mộng sẽ mở cách chơi kiếp hiện tại</span><b style="font-size:22px">Lâm Thanh Vân · Nguyên Anh tầng 3</b><span style="font-size:16px;color:var(--brown)">Sống 86 năm, chính đạo. Tử trận ở Hắc Phong Lĩnh khi che cho sư muội.</span></div>' +
      '<div class="g2"><div class="card"><span class="sub" style="font-weight:600">Mộng ngộ</span><b style="font-size:24px;color:var(--gold)">+640</b><span class="sub">Kim quang, đạo hạnh +640</span></div>' +
      '<div class="card" style="flex-direction:row;align-items:center;gap:8px"><div class="bf bf-red" role="img" aria-label="Mộng điệp Huyết Hận"></div><div style="display:flex;flex-direction:column"><span class="sub" style="font-weight:600">Kết cục mới</span><b style="font-size:17px;color:var(--redd)">Chết vì che cho người khác</b></div></div></div>' +
      '<div class="card" style="flex-direction:row;gap:12px;align-items:center"><img src="img/bia.png" alt="Bia luân hồi" style="width:42px;height:60px"><div style="display:flex;flex-direction:column;gap:6px;flex:1"><label for="dn" class="sub" style="font-weight:600">Di ngôn khắc lên bia</label><select id="dn" style="font-family:inherit;font-size:16px;font-weight:600;padding:8px;border:2px solid var(--dark);background:var(--paper);color:var(--dark)"><option>Kiếp này nợ một người, kiếp sau trả.</option><option>Kiếm còn, người đã đi.</option><option>Đừng tin sư huynh họ Mạc.</option></select></div></div>' +
      '<a class="btn big" href="#home" style="text-decoration:none">Về tu luyện</a></div>';
  }

  /* ---------- Động phủ + Mộng điệp ---------- */
  function dongphu() {
    function b(name, sub, btn, extra) { return '<div class="card" style="flex-direction:row;align-items:center;gap:12px">' + (extra || '') + '<div style="display:flex;flex-direction:column;gap:4px;flex:1"><b style="font-size:18px">' + name + '</b><span class="sub" style="font-size:15px">' + sub + '</span></div><button class="btn" style="min-height:44px;padding:0 12px;font-size:16px">' + btn + '</button></div>'; }
    return '<div class="scene" style="height:190px"><img class="bg" src="img/bg_dongphu.png" alt=""><div style="position:absolute;left:14px;bottom:12px;padding:6px 12px;background:var(--paper);border:3px solid var(--dark)"><div style="font-family:\'Protest Revolution\';font-size:28px;color:#8a1a1a">Thái Sơ Động Phủ</div><div class="sub" style="font-weight:600">Cấp 2 · nâng cấp cần 1.200 linh thạch</div></div></div>' +
      '<div class="body">' + b('Dược viên', 'Kê vàng chín sau 1 giờ 52 phút · 2 luống linh thảo đã chín', 'Thu', '<img src="img/noike.png" alt="" style="width:52px;height:47px">') +
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

  var screens = { home: home, nhanvat: nhanvat, dicanh: dicanh, tinhmong: tinhmong, dongphu: dongphu, mongdiep: mongdiep };

  function render() {
    var r = route(); if (!screens[r]) r = 'home';
    app.innerHTML = screens[r]();
    placeLines();
  }
  function start() {
    clear(); render();
    var r = route();
    if (r === 'home' || r === '') timers.push(setInterval(tick, 1000));
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
    if (a === 'tap') {
      if (S.taps >= 10) return;
      var b = 60 + ((S.taps * 37) % 5) * 40; S.taps++; S.tv += b; render();
      var f = document.getElementById('fl'); f.textContent = '+' + b + ' tu vi'; f.style.opacity = 1; f.classList.add('float');
    } else if (a === 'dotpha') {
      var need = 2200 + (S.layer - 2) * 600; if (S.tv < need) return;
      S.tv -= need; S.layer++; S.kiep = true; render(); setTimeout(function () { S.kiep = false; }, 1700);
    } else if (a === 'nv') { S.nvTab = el.dataset.v; render(); }
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
