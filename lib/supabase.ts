import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

const timedFetch: typeof fetch = (input, init) => {
  if (init?.signal) return fetch(input, init);
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  return fetch(input, { ...init, signal: ctl.signal }).finally(() => clearTimeout(t));
};

/** Promise quá hạn thì báo lỗi, để màn hình không đứng chờ mãi khi mạng chập chờn */
export function within<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((ok, no) => {
    const t = setTimeout(() => no(new Error('timeout')), ms);
    p.then((v) => (clearTimeout(t), ok(v)), (e) => (clearTimeout(t), no(e)));
  });
}

/** Trả về Supabase client, hoặc null nếu chưa cấu hình (khi đó game lưu trên máy) */
export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // game tự quản lý đăng nhập bằng token riêng, không dùng Supabase Auth: tắt hẳn phần auth để không bị khóa phiên
  // (Safari iOS đôi khi treo khóa này, mọi request đứng im). Mỗi request quá 10 giây thì bỏ.
  client =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          global: { fetch: timedFetch },
        })
      : null;
  return client;
}
