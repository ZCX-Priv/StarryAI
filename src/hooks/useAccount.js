import { useCallback, useRef } from 'react';
import useAppStore from '@/store/useAppStore';
import { API_BASE } from '@/lib/config';

export default function useAccount() {
  const cacheRef = useRef(null);
  const cacheTsRef = useRef(0);

  const fetch = useCallback(async () => {
    const activeKey = useAppStore.getState().activeKey;
    if (!activeKey) return null;

    const now = Date.now();
    if (cacheRef.current && (now - cacheTsRef.current) < 30000) return cacheRef.current;

    try {
      const headers = { 'Authorization': `Bearer ${activeKey}` };
      const [balRes, profRes, keyRes] = await Promise.allSettled([
        fetch(`${API_BASE}/account/balance`, { headers }),
        fetch(`${API_BASE}/account/profile`, { headers }),
        fetch(`${API_BASE}/account/key`, { headers }),
      ]);

      const bal = balRes.status === 'fulfilled' && balRes.value.ok ? await balRes.value.json() : null;
      const prof = profRes.status === 'fulfilled' && profRes.value.ok ? await profRes.value.json() : null;
      const key = keyRes.status === 'fulfilled' && keyRes.value.ok ? await keyRes.value.json() : null;

      const balance = bal?.balance ?? bal?.pollen ?? bal?.total ?? null;
      const tierBalance = bal?.tierBalance ?? bal?.tier_balance ?? bal?.dailyBalance ?? null;
      const packBalance = bal?.packBalance ?? bal?.pack_balance ?? bal?.purchased ?? null;
      const tier = prof?.tier ?? bal?.tier ?? key?.tier ?? null;
      const nextResetAt = prof?.nextResetAt ?? bal?.nextResetAt ?? prof?.next_reset ?? bal?.next_reset ?? null;
      const keyType = key?.type ?? (activeKey?.startsWith('sk_') ? 'secret' : 'publishable');
      const permissions = key?.permissions ?? key?.scopes ?? null;

      const result = { balance, tierBalance, packBalance, tier, nextResetAt, keyType, permissions };
      cacheRef.current = result;
      cacheTsRef.current = now;
      return result;
    } catch {
      return null;
    }
  }, []);

  const getCost = useCallback((modelId) => {
    if (!modelId) return null;
    const models = useAppStore.getState().models;
    const m = models.find(m => m.id === modelId);
    if (m && m.pollen !== null && m.pollen !== undefined) return m.pollen;
    return null;
  }, []);

  const invalidate = useCallback(() => {
    cacheRef.current = null;
    cacheTsRef.current = 0;
  }, []);

  return { fetch, getCost, invalidate };
}
