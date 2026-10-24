'use client';

import { useEffect, useState } from 'react';
import { currentPlayer, onPlayerChange, type Player } from './auth';
import { supabase } from './supabase';

export function useAuth() {
  const [user, setUser] = useState<Player | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(currentPlayer());
    setReady(true);
    return onPlayerChange(setUser);
  }, []);

  return { user, ready, enabled: !!supabase() };
}
