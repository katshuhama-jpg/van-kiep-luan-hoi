-- Thử đứt mạch (Ngày 30): cùng câu đệ quy như vkl_priv.sm_lien, chạy trên dữ liệu giả, chỉ đọc.
-- Kết quả 20/11 tối: day_mat_o1 -> 2,0 3,0 | day_nguyen -> - | vong_mat_1 -> - | nhanh -> - | cd_bi_vay -> 2,2 3,2 | cach_2 -> 2,-2
with cases(ca, cdq, cdr, tiles) as (values
 ('day_mat_o1', 0, 0, array[[0,0],[2,0],[3,0]]),                                   -- dây 3 bước, mất ô (1,0)
 ('day_nguyen', 0, 0, array[[0,0],[1,0],[2,0],[3,0]]),                             -- dây còn nguyên
 ('vong_mat_1', 0, 0, array[[0,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1],[2,-1],[2,0]]), -- vòng quanh chính điện, mất (1,0)
 ('nhanh', 0, 0, array[[0,0],[1,-1],[2,-1],[2,0],[3,0]]),                           -- nhánh vòng qua (2,-1)
 ('cd_bi_vay', 0, 0, array[[0,0],[2,2],[3,2]]),                                     -- chính điện bị vây
 ('cach_2', 0, 0, array[[0,0],[2,-2]])                                              -- ô cách 2 bước
),
t as (select ca, cdq, cdr, tiles[i][1] q, tiles[i][2] r from cases, generate_subscripts(tiles, 1) i)
select ca, (
  with recursive own as (select q, r from t t2 where t2.ca = c.ca),
  reach(q, r) as (select c.cdq, c.cdr union select o.q, o.r from own o join reach x on (o.q - x.q, o.r - x.r) in ((1,0),(-1,0),(0,1),(0,-1),(1,-1),(-1,1)))
  select coalesce(string_agg(q || ',' || r, ' ' order by q, r), '-') from (select q, r from own except select q, r from reach) z) dut
from cases c;
