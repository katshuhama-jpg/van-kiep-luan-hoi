'use client';
import { useEffect } from 'react';

export default function EnGo() {
  useEffect(() => {
    location.replace('/?lang=en');
  }, []);
  return <p style={{ textAlign: 'center', padding: 40 }}>Loading Ten Thousand Rebirths...</p>;
}
