'use client';

import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '../../components/dashboard-ui';

const articles = [
  { title: 'Account access and sessions', category: 'Account', body: 'Sign in through the auth flow, review active sessions in Security, and revoke sessions you no longer recognize.', paths: ['/auth/login', '/auth/sessions'] },
  { title: 'Wallet funding', category: 'Billing', body: 'Choose a supported funding package, continue through the configured gateway, and wait for verified webhook confirmation before balance credit.', paths: ['/payments/packages', '/payments/initialize'] },
  { title: 'Messaging and calling', category: 'Messaging', body: 'Use an owned number to send messages and access conversations. Messenger access and call-credit requirements are enforced by the backend.', paths: ['/messages', '/messenger/call-credits'] },
  { title: 'Verification orders', category: 'Verification', body: 'Select a service and country, create a verification order, and follow its provider-backed status until expiry or completion.', paths: ['/verify-hub/services', '/verify-hub/orders'] },
  { title: 'Number rentals', category: 'Rentals', body: 'Search available numbers, provision a burner or rental number, and manage renewal or release from the Rentals workspace.', paths: ['/numbers/search', '/numbers'] },
  { title: 'eSIM orders', category: 'eSIM', body: 'Request available travel plans through the backend and review activation and expiry details in your order history.', paths: ['/integrations/esim/plans', '/integrations/esim/orders'] },
  { title: 'Proxy orders', category: 'Proxy', body: 'Configure a supported proxy order through the backend and review its region, protocol, duration, and status.', paths: ['/integrations/proxies/orders'] },
  { title: 'VPN sessions', category: 'VPN', body: 'Create and monitor Secure Tunnel sessions. Private keys and provider credentials remain server-side.', paths: ['/integrations/vpn/sessions'] },
  { title: 'Developer webhooks', category: 'Developer', body: 'Create endpoint subscriptions from the Developer area, then inspect delivery status, attempts, retries, and errors.', paths: ['/developer/webhooks', '/developer/webhooks/:id/deliveries'] },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleArticles = articles.filter((article) => `${article.title} ${article.category} ${article.body} ${article.paths.join(' ')}`.toLowerCase().includes(normalizedQuery));

  return <main className="help-center-page"><header className="help-center-header"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link><Link href="/dashboard" className="text-link">Open workspace</Link></header><section className="help-center-intro"><p className="eyebrow">SUPPORT / HELP CENTER</p><h1>Find an answer.</h1><p>Operational documentation for account, product, billing, and developer workflows.</p><label>Search documentation<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by product or task" /></label></section><section className="help-center-results" aria-live="polite">{visibleArticles.length ? visibleArticles.map((article) => <article className="help-article" key={article.title}><div className="help-article-top"><StatusBadge status={article.category} /><span>{article.paths.length} routes</span></div><h2>{article.title}</h2><p>{article.body}</p><div className="help-paths">{article.paths.map((path) => <code key={path}>{path}</code>)}</div></article>) : <p className="panel-state">No documentation matches this search.</p>}</section></main>;
}
