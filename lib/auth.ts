'use client';

import { supabase } from './supabase';
import { tr } from './i18n';

/**
 * Tài khoản riêng của game: tên đăng nhập + mật khẩu 3-6 ký tự.
 * Database lưu mật khẩu dạng mã hóa (bcrypt) và trả về một token phiên,
 * token được giữ trong trình duyệt.
 */

export interface Player {
  username: string;
  token: string;
}

const KEY = 'vkl.session';
export const USERNAME_RE = /^[a-z0-9_]{3,16}$/;
const listeners = new Set<(p: Player | null) => void>();

/** Tên đăng nhập sai quy tắc thì trả lời cảnh báo cụ thể, đúng thì trả null */
export function usernameIssue(u: string): string | null {
  if (!u) return null;
  if (/[^\x00-\x7F]/.test(u)) return tr('Tên đăng nhập không được có dấu tiếng Việt.', "Usernames can't contain Vietnamese diacritics.");
  if (/\s/.test(u)) return tr('Tên đăng nhập không được có khoảng trắng.', "Usernames can't contain spaces.");
  if (/[A-Z]/.test(u)) return tr('Tên đăng nhập không được có chữ hoa.', "Usernames can't contain uppercase letters.");
  if (/[^a-z0-9_]/.test(u)) return tr('Tên đăng nhập chỉ gồm chữ thường, số và dấu _.', "Usernames may only contain lowercase letters, numbers and _.");
  if (u.length < 3 || u.length > 16) return tr('Tên đăng nhập dài từ 3 đến 16 ký tự.', "Usernames must be 3 to 16 characters.");
  return null;
}

export function currentPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Player) : null;
  } catch {
    return null;
  }
}

function setPlayer(p: Player | null) {
  try {
    if (p) localStorage.removeItem('vkl.dropped');
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
  listeners.forEach((fn) => fn(p));
}

export function onPlayerChange(fn: (p: Player | null) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function validate(username: string, password: string): string | null {
  const bad = usernameIssue(username);
  if (bad) return bad;
  if (!USERNAME_RE.test(username)) return tr('Tên đăng nhập dài 3-16 ký tự: chữ thường không dấu, số, dấu _.', "Username: 3-16 characters, lowercase letters without diacritics, numbers, _.");
  if (password.length < 3 || password.length > 6) return tr('Mật khẩu dài từ 3 đến 6 ký tự.', "Password must be 3 to 6 characters.");
  return null;
}

function translate(msg: string): string {
  if (msg.includes('USERNAME_TAKEN')) return tr('Tên đăng nhập này đã có người dùng.', "This username is already taken.");
  if (msg.includes('USERNAME_INVALID')) return tr('Tên đăng nhập không hợp lệ.', "Invalid username.");
  if (msg.includes('PASSWORD_INVALID')) return tr('Mật khẩu dài từ 3 đến 6 ký tự.', "Password must be 3 to 6 characters.");
  if (msg.includes('LOGIN_FAILED')) return tr('Sai tên đăng nhập hoặc mật khẩu.', "Wrong username or password.");
  if (msg.includes('LOCKED')) return tr('Sai quá nhiều lần. Đợi 5 phút rồi thử lại.', "Too many attempts. Wait 5 minutes and try again.");
  return tr('Không kết nối được máy chủ, thử lại sau.', "Can't reach the server, try again later.");
}

async function call(fn: 'vkl_register' | 'vkl_login', username: string, password: string): Promise<string | null> {
  const err = validate(username, password);
  if (err) return err;
  const sb = supabase();
  if (!sb) return tr('Chưa cấu hình máy chủ.', "Server not configured.");
  const { data, error } = await sb.rpc(fn, { p_username: username, p_password: password });
  if (error) return translate(error.message);
  const d = data as { token: string; username: string };
  setPlayer({ token: d.token, username: d.username });
  return null;
}

export const signUp = (u: string, p: string) => call('vkl_register', u, p);
export const signIn = (u: string, p: string) => call('vkl_login', u, p);

export async function signOut() {
  const p = currentPlayer();
  setPlayer(null);
  if (p) await supabase()?.rpc('vkl_logout', { p_token: p.token });
}

/** Phiên hết hạn hoặc bị xóa thì tự đăng xuất */
export function dropSession() {
  // đánh dấu để màn chơi đưa về trang đăng nhập thay vì lặng lẽ chuyển sang chơi thử
  try {
    localStorage.setItem('vkl.dropped', '1');
  } catch {}
  setPlayer(null);
}
/** Phiên vừa bị hết hạn (không phải tự đăng xuất) */
export function sessionDropped(): boolean {
  try {
    return localStorage.getItem('vkl.dropped') === '1';
  } catch {
    return false;
  }
}
