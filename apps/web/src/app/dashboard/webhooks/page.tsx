'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Copy, Link2, Plus, ShieldCheck, Trash2, Webhook } from 'lucide-react';
import { developerApi } from '@/lib/api';

type DeveloperWebhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive?: boolean;
  signingSecret?: string;
  deliverySuccessCount?: number;
  deliveryFailureCount?: number;
  lastDeliveryAt?: string;
  createdAt?: string;
};

const EVENT_OPTIONS = [
  'message.received',
  'message.sent',
  'call.incoming',
  'voicemail.created',
  'number.provisioned',
  'number.expiring',
  'verification.completed',
  'payment.succeeded',
  'payment.failed',
  'subscription.updated',
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<DeveloperWebhook[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['message.received', 'payment.succeeded']);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  useEffect(() => {
    developerApi.webhooks()
      .then((response) => setWebhooks(response.data))
      .catch(() => toast.error('Unable to load webhooks'))
      .finally(() => setLoading(false));
  }, []);

  const urlIsValid = useMemo(() => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, [url]);

  const toggleEvent = (event: string) => {
    setEvents((current) => current.includes(event) ? current.filter((item) => item !== event) : [...current, event]);
  };

  const createWebhook = async () => {
    if (!name.trim()) {
      toast.error('Add a webhook name');
      return;
    }
    if (!urlIsValid) {
      toast.error('Webhook URL must be HTTPS');
      return;
    }
    if (!events.length) {
      toast.error('Choose at least one event');
      return;
    }
    setCreating(true);
    try {
      const response = await developerApi.createWebhook({ name: name.trim(), url: url.trim(), events });
      setWebhooks((current) => [response.data, ...current]);
      setRevealedSecret(response.data.signingSecret ?? null);
      setName('');
      setUrl('');
      toast.success('Webhook endpoint created');
    } catch {
      toast.error('Unable to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook endpoint?')) return;
    try {
      await developerApi.deleteWebhook(id);
      setWebhooks((current) => current.filter((item) => item.id !== id));
      toast.success('Webhook deleted');
    } catch {
      toast.error('Unable to delete webhook');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-bp-lg border border-brand-border bg-brand-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Developer Webhooks</p>
            <h1 className="mt-2 text-3xl font-black uppercase leading-none text-white md:text-5xl">
              Event delivery for private telecom workflows.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted">
              Send message, call, number, payment, verification, and subscription events to your backend with signed delivery and idempotent processing.
            </p>
          </div>
          <div className="rounded-bp-lg border border-brand-green/16 bg-brand-green/[0.045] p-4 text-sm leading-6 text-white/64 lg:max-w-sm">
            <ShieldCheck className="mb-3 h-5 w-5 text-brand-green" />
            Signing secrets are shown once. Store them server-side and verify every request before processing.
          </div>
        </div>
      </section>

      {revealedSecret ? (
        <section className="rounded-bp-lg border border-brand-green/28 bg-brand-green/10 p-4">
          <p className="text-sm font-semibold text-brand-green">New webhook signing secret. Copy it now.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-auto rounded-bp bg-black/40 px-3 py-2 font-mono text-xs text-white">{revealedSecret}</code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(revealedSecret); toast.success('Copied'); }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-bp border border-brand-green/20 text-brand-green transition hover:bg-brand-green/10"
              aria-label="Copy signing secret"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-green" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Create endpoint</h2>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block text-sm text-white/70">
              Endpoint name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Production webhook"
                className="bp-input mt-2"
              />
            </label>
            <label className="block text-sm text-white/70">
              HTTPS URL
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/burner-point/webhooks"
                inputMode="url"
                autoCapitalize="none"
                className="bp-input mt-2"
              />
              <span className="mt-1 block text-xs text-brand-muted">Only HTTPS URLs are accepted for production delivery.</span>
            </label>

            <div>
              <p className="mb-2 text-sm text-white/70">Events</p>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_OPTIONS.map((event) => {
                  const selected = events.includes(event);
                  return (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleEvent(event)}
                      className={`min-h-11 rounded-bp border px-3 py-2 text-left font-mono text-[10px] uppercase transition ${
                        selected ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-white/10 text-white/46 hover:border-brand-green/28 hover:text-white'
                      }`}
                    >
                      {event}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={createWebhook}
              disabled={creating}
              className="bp-primary-action inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] disabled:opacity-50"
            >
              <Webhook className="h-4 w-4" />
              {creating ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </div>

        <div className="rounded-bp-lg border border-brand-border bg-brand-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-green" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Configured endpoints</h2>
            </div>
            <span className="rounded-bp border border-white/10 px-2 py-1 font-mono text-[10px] uppercase text-white/42">
              {webhooks.length} total
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-bp border border-brand-border bg-black/20" />)
            ) : webhooks.length ? (
              webhooks.map((webhook) => (
                <article key={webhook.id} className="rounded-bp-lg border border-white/8 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold uppercase text-white">{webhook.name}</h3>
                        <span className={`rounded-bp px-2 py-1 font-mono text-[10px] uppercase ${
                          webhook.isActive === false ? 'bg-white/5 text-white/34' : 'bg-brand-green/10 text-brand-green'
                        }`}>
                          {webhook.isActive === false ? 'disabled' : 'active'}
                        </span>
                      </div>
                      <p className="mt-2 truncate font-mono text-xs text-white/46">{webhook.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteWebhook(webhook.id)}
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-bp text-brand-muted transition hover:bg-red-400/10 hover:text-red-300"
                      aria-label={`Delete webhook ${webhook.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="rounded-bp border border-white/8 bg-white/[0.025] px-2 py-1 font-mono text-[10px] uppercase text-white/42">
                        {event}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Metric label="Success" value={webhook.deliverySuccessCount ?? 0} />
                    <Metric label="Failed" value={webhook.deliveryFailureCount ?? 0} />
                    <Metric label="Last" value={webhook.lastDeliveryAt ? new Date(webhook.lastDeliveryAt).toLocaleDateString() : 'None'} />
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-bp-lg border border-white/8 bg-black/18 p-8 text-center">
                <Link2 className="mx-auto h-7 w-7 text-brand-muted" />
                <p className="mt-3 text-sm text-brand-muted">No webhooks yet. Create one to receive signed product events.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-bp border border-white/8 bg-white/[0.02] p-2">
      <p className="font-mono text-sm text-brand-green">{value}</p>
      <p className="mt-1 text-[10px] uppercase text-white/34">{label}</p>
    </div>
  );
}
