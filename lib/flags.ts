/**
 * Cờ bật tắt tính năng.
 * CHAN_THAN_ON (4.5.0 Chân Thân, Tam Tài): bật từ khối Ngày 4 (lên bản 13/11).
 * Muốn tắt gấp: đặt biến môi trường `NEXT_PUBLIC_CHAN_THAN=0` rồi build lại.
 */
export const CHAN_THAN_ON = process.env.NEXT_PUBLIC_CHAN_THAN !== '0';
