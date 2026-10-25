// Nền tiên giới và ma giới cho Vạn Kiếp Luân Hồi, 256x160, mặt đất khoảng y=124
pal({
  // tiên giới
  a: "#fff6dc", b: "#ffe9b0", c: "#ffd88a", d: "#f6c26a",      // trời vàng kim
  w: "#ffffff", W: "#f2ecdc", v: "#d8d0bc", V: "#b8ae98",       // mây
  j: "#bfe6d2", J: "#8cc8b0", m: "#e6dcf2", M: "#c4b4dc",       // núi ngọc, núi tím xa
  r: "#d8443a", R: "#a02a24", g: "#ffd040", G: "#c8902a",       // cột đỏ, mái vàng
  p: "#7a5a9a", s: "#5a3a7a",
  // ma giới
  k: "#120608", K: "#24080e", n: "#3a0a14", N: "#5a0e1c", o: "#8a1626", O: "#c02a2a",
  e: "#ff5a2a", E: "#ffb04a", x: "#2a2228", X: "#463a40", z: "#e8dcc8", Z: "#a89a88",
})
ramps("VvWw", "JjJ", "Mm", "RrO", "Gg", "kKnNoOeE", "xXZz")

// ---------- phần dùng chung ----------
sprite("_cloud", { w: 34, h: 12 }, (c) => {
  c.ellipse(9, 7, 8, 4, "W"); c.ellipse(19, 5, 10, 5, "w"); c.ellipse(28, 8, 6, 3, "W")
  c.rect(2, 9, 31, 3, "W"); c.hline(3, 11, 29, "v")
})
sprite("_puff", { w: 18, h: 8 }, (c) => { c.ellipse(6, 4, 5, 3, "w"); c.ellipse(12, 4, 5, 3, "W"); c.hline(2, 7, 14, "v") })

// lầu các trên đảo nổi
sprite("_pavilion", { w: 30, h: 26 }, (c) => {
  c.poly([0, 8, 15, 0, 30, 8], "G"); c.hline(1, 8, 28, "g")            // mái tầng trên
  c.rect(6, 9, 18, 6, "r"); c.vline(9, 9, 6, "R"); c.vline(20, 9, 6, "R")
  c.poly([2, 17, 15, 12, 28, 17], "G"); c.hline(3, 17, 24, "g")        // mái tầng dưới
  c.rect(5, 18, 20, 7, "r"); c.rect(13, 20, 4, 5, "R"); c.vline(7, 18, 7, "R"); c.vline(22, 18, 7, "R")
})
sprite("_island", { w: 54, h: 30 }, (c) => {
  c.poly([0, 4, 54, 4, 44, 14, 34, 24, 26, 29, 18, 22, 8, 12], "J")
  c.poly([0, 4, 54, 4, 50, 8, 4, 8], "j")
  c.ellipse(27, 3, 26, 3, "j")
})

scene("tien", { w: 256, h: 160, bg: "a" },
  layer("sky", grad(0, 0, 256, 120, "abcd", "v", 0.6)),
  // vầng sáng sau núi
  layer("halo", { density: 0.5 }, (c) => { c.circ(70, 86, 46, "a"); c.circ(70, 86, 34, "w") }),
  // núi tím xa
  layer("far", poly([0, 120, 0, 86, 20, 70, 38, 82, 60, 58, 84, 80, 104, 66, 130, 86, 156, 62, 182, 80, 206, 64, 232, 78, 256, 70, 256, 120], "M"),
    poly([60, 58, 66, 64, 56, 66], "m"), poly([156, 62, 162, 68, 151, 70], "m"), poly([206, 64, 211, 69, 201, 71], "m")),
  // núi ngọc gần
  layer("near", poly([0, 124, 0, 98, 18, 88, 36, 100, 52, 92, 74, 108, 96, 96, 112, 110, 140, 100, 166, 112, 196, 96, 226, 108, 256, 98, 256, 124], "J"),
    poly([18, 88, 24, 94, 12, 96], "j"), poly([96, 96, 103, 102, 90, 104], "j"), poly([196, 96, 203, 102, 189, 104], "j")),
  // đảo nổi có lầu các
  layer("isles", stamp("_island", 150, 34), stamp("_pavilion", 162, 12), stamp("_island", 26, 22, { flip: "x" }), stamp("_pavilion", 38, 0)),
  // cột Nam Thiên Môn bên phải
  layer("gate",
    rect(214, 58, 7, 66, "r"), rect(244, 58, 7, 66, "r"), vline(216, 58, 66, "R"), vline(246, 58, 66, "R"),
    // mái cong kiểu cổng lầu
    poly([200, 52, 206, 48, 258, 48, 264, 52, 256, 54, 208, 54], "G"), hline(206, 48, 52, "g"),
    poly([224, 48, 232, 40, 240, 48], "G"), px(232, 39, "g"), px(200, 51, "g"), px(263, 51, "g"),
    rect(210, 56, 46, 4, "R"), hline(210, 56, 46, "r"),
    rect(225, 61, 14, 9, "G"), box(225, 61, 14, 9, "R"), hline(228, 65, 8, "g")),
  // mây trôi trên trời
  layer("clouds", stamp("_cloud", 96, 18), stamp("_puff", 120, 40), stamp("_cloud", 0, 50), stamp("_puff", 196, 28), stamp("_puff", 70, 64)),
  // biển mây ở dưới (chỗ nhân vật đứng)
  layer("sea", (c) => {
    for (let x = 0; x < 256; x++) {
      const top = 118 + Math.round(Math.sin(x / 7) * 2 + Math.sin(x / 17) * 2)
      c.vline(x, top, 160 - top, "W")
      c.px(x, top, "w")
    }
    for (let y = 128; y < 160; y += 7) for (let x = (y * 3) % 20; x < 256; x += 22) c.hline(x, y, 8, "v")
  }),
  glow("g", { r: 4, strength: 0.35, bands: 2 }),
)

// ---------- ma giới ----------
sprite("_spire", { w: 14, h: 60 }, (c) => {
  c.poly([2, 60, 6, 6, 7, 0, 8, 6, 12, 60], "k")
  c.px(7, 20, "e"); c.px(6, 32, "o"); c.px(8, 44, "e")
})
sprite("_castle", { w: 70, h: 50 }, (c) => {
  c.rect(10, 22, 50, 28, "k")
  c.poly([6, 22, 14, 4, 22, 22], "k"); c.poly([28, 22, 35, 0, 42, 22], "k"); c.poly([48, 22, 56, 6, 64, 22], "k")
  for (const [x, y] of [[15, 28], [33, 26], [35, 34], [53, 30], [24, 38], [45, 40]]) c.rect(x, y, 2, 3, "e")
  c.rect(31, 40, 8, 10, "K")
})
sprite("_bone", { w: 10, h: 18 }, (c) => { c.poly([1, 18, 4, 2, 5, 0, 6, 2, 9, 18], "Z"); c.vline(5, 3, 14, "z") })

scene("ma", { w: 256, h: 160, bg: "k" },
  layer("sky", grad(0, 0, 256, 124, "KnNo", "v", 0.6)),
  // huyết nguyệt
  layer("moon", circ(196, 34, 20, "O"), circ(196, 34, 17, "o"), circ(190, 30, 5, "O"), circ(203, 40, 3, "N")),
  layer("moonglow", { density: 0.25 }, circ(196, 34, 30, "O")),
  // dãy núi đen răng cưa
  layer("far", poly([0, 124, 0, 92, 16, 76, 26, 88, 44, 64, 58, 84, 76, 70, 92, 90, 118, 72, 136, 88, 160, 66, 178, 86, 214, 74, 236, 90, 256, 80, 256, 124], "K")),
  // ma thành
  layer("castle", stamp("_castle", 92, 56)),
  layer("near", poly([0, 124, 0, 104, 22, 96, 40, 108, 60, 100, 86, 112, 120, 106, 150, 114, 180, 100, 206, 110, 230, 102, 256, 108, 256, 124], "x")),
  layer("spires", stamp("_spire", 14, 64), stamp("_spire", 226, 58), stamp("_spire", 60, 76, { flip: "x" })),
  // mặt đất đá đen, xương trắng, khe dung nham
  layer("ground", rect(0, 122, 256, 38, "x"),
    (c) => { for (let x = 0; x < 256; x += 2) c.px(x, 122 + ((x * 7) % 3), "X") },
    (c) => {
      const cracks = [[20, 132, 40], [90, 140, 56], [170, 130, 36], [210, 148, 40], [40, 152, 30]]
      for (const [x, y, l] of cracks) { c.line(x, y, x + l, y + 3, "o", 2); c.line(x + 2, y + 1, x + l - 2, y + 3, "e") }
    },
    stamp("_bone", 120, 112), stamp("_bone", 236, 114, { flip: "x" }), stamp("_bone", 6, 116)),
  glow("eE", { r: 3, strength: 0.5, bands: 2 }),
)
