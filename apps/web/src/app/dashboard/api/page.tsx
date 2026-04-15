'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Key, Plus, Trash2 } from 'lucide-react';
import { developerApi } from '@/lib/api';

export default function ApiPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    developerApi.keys().then((r) => setKeys(r.data)).finally(() => setLoading(false));
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const r = await developerApi.createKey({ name: newKeyName, scopes: ['read', 'write'] });
      setKeys((current) => [...current, r.data]);
      setRevealedKey(r.data.rawKey);
      setNewKeyName('');
      toast.success('API key created. Copy it now because it will not be shown again.');
    } catch {
      toast.error('Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this key?')) return;
    await developerApi.revokeKey(id);
    setKeys((current) => current.filter((key) => key.id !== id));
    toast.success('Key revoked');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Developer access</p>
        <h1 className="mt-1 text-xl font-bold">API Keys</h1>
        <p className="mt-1 text-sm leading-6 text-brand-muted">
          Build private verification and number workflows through Burner Point only. Base URL:{' '}
          <code className="font-mono text-brand-green">{process.env.NEXT_PUBLIC_API_URL}</code>
        </p>
      </div>

      {revealedKey ? (
        <div className="rounded-lg border border-brand-green/30 bg-brand-green/10 p-4">
          <p className="mb-2 text-xs font-semibold text-brand-green">Your new API key. Copy it now. It is shown once.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-auto rounded-lg bg-brand-black px-3 py-2 font-mono text-xs">{revealedKey}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success('Copied'); }}
              className="rounded-lg p-2 text-brand-green transition-colors hover:bg-brand-green/10"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        <input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name, for example Production"
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
          className="flex-1 rounded-lg border border-brand-border bg-brand-card px-4 py-2.5 text-sm transition-colors placeholder:text-brand-muted focus:border-brand-green focus:outline-none"
        />
        <button
          type="button"
          onClick={createKey}
          disabled={creating || !newKeyName.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-opacity-90 disabled:opacity-50"
        >
          <Plus size={14} />
          Create
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg border border-brand-border bg-brand-card" />)}</div>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-brand-border bg-brand-card p-8 text-center text-brand-muted">
          <Key size={24} className="mx-auto mb-2" />
          <p className="text-sm">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-card px-4 py-3">
              <Key size={14} className="flex-shrink-0 text-brand-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{key.name}</p>
                <p className="font-mono text-xs text-brand-muted">{key.keyPrefix}........</p>
              </div>
              <span className="text-xs text-brand-muted">{key.usageCount} calls</span>
              <button type="button" onClick={() => revoke(key.id)} className="p-1 text-brand-muted transition-colors hover:text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
