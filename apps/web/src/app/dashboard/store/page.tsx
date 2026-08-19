'use client';

import Link from 'next/link';
import { Smartphone, Globe, Shield, Home, ArrowRight } from 'lucide-react';

const STORE_PRODUCTS = [
  {
    name: 'BP eSIM Store',
    description: 'Travel-ready data plans with global coverage',
    icon: Smartphone,
    href: '/dashboard/esim',
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    name: 'BP Proxy Store',
    description: 'Residential and datacenter proxies',
    icon: Globe,
    href: '/dashboard/proxies',
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    name: 'BP Secure Tunnel VPN',
    description: 'Private, fast, and secure VPN connections',
    icon: Shield,
    href: '/dashboard/vpn',
    color: 'from-green-500/20 to-green-600/20',
  },
];

export default function StorePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-brand-accent hover:text-brand-accent/80 mb-4">
          <Home className="w-4 h-4" />
          Back to dashboard
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Burner Point Store</h1>
        <p className="text-[var(--bp-foreground-muted)] max-w-2xl">
          Browse and manage your connectivity and privacy products all in one place.
        </p>
      </div>

      {/* Store Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {STORE_PRODUCTS.map((product) => {
          const Icon = product.icon;
          return (
            <Link
              key={product.href}
              href={product.href}
              className="group relative overflow-hidden rounded-2xl border border-[var(--bp-border-subtle)] bg-[var(--bp-surface)] hover:border-brand-accent/50 transition-all"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

              {/* Content */}
              <div className="relative p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-lg bg-[var(--bp-surface-muted)] group-hover:bg-brand-accent/10 transition">
                    <Icon className="w-6 h-6 text-brand-accent" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-brand-accent opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                </div>

                <div>
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-[var(--bp-foreground-muted)] mt-2">{product.description}</p>
                </div>

                <div className="pt-4 border-t border-[var(--bp-border-subtle)] text-xs font-semibold text-brand-accent">
                  Browse now →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 lg:grid-cols-2 pt-8 border-t border-[var(--bp-border-subtle)]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent">Your products</h2>
          <p className="text-sm text-[var(--bp-foreground-muted)]">Manage and monitor your active subscriptions and products.</p>
          <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-accent/80">
            View orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent">Need help?</h2>
          <p className="text-sm text-[var(--bp-foreground-muted)]">Browse documentation or contact our support team.</p>
          <Link href="/dashboard/support" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-accent/80">
            Contact support <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
