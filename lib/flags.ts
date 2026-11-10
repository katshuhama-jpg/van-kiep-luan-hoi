/**
 * Cờ bật tắt tính năng đang làm dở.
 * CHAN_THAN_ON (4.5.0 Chân Thân, Tam Tài): tắt mặc định tới khối Ngày 4 (13/11).
 * Lúc thử trên máy: chạy `NEXT_PUBLIC_CHAN_THAN=1 npx next dev` để bật tạm.
 */
export const CHAN_THAN_ON = process.env.NEXT_PUBLIC_CHAN_THAN === '1';
