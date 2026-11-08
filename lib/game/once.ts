/**
 * tr(vi, en) tính cả hai câu trước khi chọn một, nên hàm có tác dụng phụ (hurt, promote, switchPath...)
 * đặt trong cả hai câu sẽ chạy hai lần. Câu tiếng Việt gán kết quả vào once.v, câu tiếng Anh đọc lại once.v.
 */
export const once: { v: string | null } = { v: null };
