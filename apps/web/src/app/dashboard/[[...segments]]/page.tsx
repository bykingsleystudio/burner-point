'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest, signOut } from '../../../lib/api';

const navigation = [
  { label: 'Home', href: '/dashboard', group: 'Burner Point' },
  { label: 'BP Messenger Pro', href: '/dashboard/messenger', group: 'Burner Point' },
  { label: 'BP Verify Hub', href: '/dashboard/verify-hub', group: 'Burner Point' },
  { label: 'BP Rental Hub', href: '/dashboard/rentals', group: 'Burner Point' },
  { label: 'BP eSIM Store', href: '/dashboard/esim', group: 'Burner Point' },
  { label: 'BP Proxy Store', href: '/dashboard/proxies', group: 'Burner Point' },
  { label: 'BP Secure Tunnel VPN', href: '/dashboard/vpn', group: 'Burner Point' },
  { label: 'Wallet', href: '/dashboard/wallet', group: 'Manage' },
  { label: 'Billing', href: '/dashboard/billing', group: 'Manage' },
  { label: 'Transactions', href: '/dashboard/transactions', group: 'Manage' },
  { label: 'Orders', href: '/dashboard/orders', group: 'Manage' },
  { label: 'Notifications', href: '/dashboard/notifications', group: 'Manage' },
  { label: 'API Keys', href: '/dashboard/api-keys', group: 'Developer' },
  { label: 'API Docs', href: '/dashboard/api', group: 'Developer' },
  { label: 'Webhooks', href: '/dashboard/webhooks', group: 'Developer' },
  { label: 'Tickets', href: '/dashboard/support', group: 'Support' },
  { label: 'Help Center', href: '/help-center', group: 'Support' },
  { label: 'Profile', href: '/dashboard/profile', group: 'Account' },
  { label: 'Settings', href: '/dashboard/settings', group: 'Account' },
  { label: 'Security', href: '/dashboard/security', group: 'Account' },
  { label: 'Appearance', href: '/dashboard/appearance', group: 'Account' }
];

const productActions = [
  ['Messages', 'Send and receive private messages', '/dashboard/messenger'],
  ['Verify', 'Find a verification number', '/dashboard/verify-hub'],
  ['Rentals', 'Manage temporary numbers', '/dashboard/rentals'],
  ['eSIM', 'Browse travel data plans', '/dashboard/esim'],
  ['Proxy', 'Configure a private connection', '/dashboard/proxies'],
  ['VPN', 'Connect to Secure Tunnel', '/dashboard/vpn']
];

function titleForPath(pathname: string) {
  const current = navigation.find((item) => item.href === pathname);
  return current?.label ?? 'Workspace';
}

export default function DashboardPage() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceState, setBalanceState] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fundingOpen, setFundingOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'hub' | 'store' | null>(null);

  useEffect(() => {
    apiRequest<Record<string, unknown>>('/wallet/balance')
      .then((data) => { setBalance(String(data?.balance ?? data?.availableBalance ?? '0.00')); setBalanceState('ready'); })
      .catch(() => setBalanceState('empty'));
  }, []);

  const activeTitle = titleForPath(pathname);
  const isHome = pathname === '/dashboard';
  const groups = Array.from(new Set(navigation.map((item) => item.group)));

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><span className="brand-mark">BP</span><span>Burner Point</span><button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Close navigation">×</button></div>
      <div className="sidebar-scroll">{groups.map((group) => <div className="nav-group" key={group}><p>{group}</p>{navigation.filter((item) => item.group === group).map((item) => <Link className={pathname === item.href ? 'nav-item active' : 'nav-item'} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}><span className="nav-glyph">{item.label.slice(0, 1)}</span>{item.label}</Link>)}</div>)}</div>
      <div className="sidebar-footer"><Link href="/dashboard/profile">Account menu</Link><button onClick={async () => { await signOut(); window.location.href = '/sign-in'; }}>Sign Out <span>↗</span></button></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open navigation">☰</button><div className="search-wrap"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, orders, messages..." aria-label="Search workspace" /></div>{search && <SearchResults query={search} close={() => setSearch('')} />}</div><div className="top-actions"><div className="balance-chip"><Link href="/dashboard/wallet"><span className="balance-label">Balance</span><strong>{balanceState === 'ready' ? `$${balance}` : balanceState === 'loading' ? '...' : '—'}</strong></Link><button className="add-funds-trigger" onClick={() => setFundingOpen(true)} aria-label="Add funds" title="Add funds">+</button></div><Link href="/dashboard/credits" className="credits-link">Credits</Link><Link href="/dashboard/notifications" aria-label="Notifications" className="icon-button">◌</Link><Link href="/dashboard/support" className="support-link">Support</Link><Link href="/dashboard/profile" className="avatar">BP</Link></div></header>
      <main className="workspace"><div className="workspace-heading"><div><p className="eyebrow">{isHome ? 'COMMAND CENTER' : 'BURNER POINT'}</p><h1>{isHome ? 'Your workspace' : activeTitle}</h1></div>{isHome && <Link href="/dashboard/wallet" className="button button-dark">+ Add funds</Link>}</div>
      {isHome ? <HomeContent /> : <ProductContent title={activeTitle} />}</main>
    </div>
    <nav className="mobile-nav"><Link href="/dashboard" className={pathname === '/dashboard' ? 'mobile-active' : ''}><span>H</span>Home</Link><Link href="/dashboard/messenger" className={pathname === '/dashboard/messenger' ? 'mobile-active' : ''}><span>M</span>Messages</Link><button className={mobileSheet === 'hub' ? 'mobile-active' : ''} onClick={() => setMobileSheet('hub')}><span>H</span>Hub</button><button className={mobileSheet === 'store' ? 'mobile-active' : ''} onClick={() => setMobileSheet('store')}><span>S</span>Store</button><Link href="/dashboard/vpn" className={pathname === '/dashboard/vpn' ? 'mobile-active' : ''}><span>V</span>VPN</Link><Link href="/dashboard/transactions" className={pathname === '/dashboard/transactions' ? 'mobile-active' : ''}><span>A</span>Activity</Link></nav>{fundingOpen && <AddFundsDialog close={() => setFundingOpen(false)} />}{mobileSheet && <MobileProductSheet type={mobileSheet} close={() => setMobileSheet(null)} />}
  </div>;
}

function HomeContent() {
  return <><section className="overview-grid"><div className="balance-panel"><div><p className="eyebrow">AVAILABLE BALANCE</p><strong>Connect your wallet</strong><span>Balance data appears here after you sign in.</span></div><Link href="/dashboard/wallet" className="button button-accent">Add funds <span>→</span></Link></div><div className="status-panel"><p className="eyebrow">ACCOUNT STATUS</p><strong>Ready when you are.</strong><span>Connect a service to start using Burner Point.</span><Link href="/dashboard/settings">Review account <span>→</span></Link></div></section><section className="section-block"><div className="section-head"><div><p className="eyebrow">PRODUCTS</p><h2>Choose a starting point.</h2></div></div><div className="launcher-grid">{productActions.map(([label, text, href], index) => <Link href={href} className="launcher" key={label}><span className="launcher-number">0{index + 1}</span><strong>{label}</strong><span>{text}</span><b>↗</b></Link>)}</div></section><section className="lower-grid"><EmptyPanel title="Recent activity" body="Your real account events will appear here." href="/dashboard/transactions" action="View activity" /><EmptyPanel title="Orders" body="Purchases and service orders will appear here." href="/dashboard/orders" action="View orders" /></section></>;
}

function ProductContent({ title }: { title: string }) {
  const copy: Record<string, string> = { 'BP Messenger Pro': 'Your conversations, calls, and contacts in one focused view.', 'BP Verify Hub': 'Find verification numbers routed through available providers.', 'BP Rental Hub': 'Manage temporary and renewable number rentals.', 'BP eSIM Store': 'Browse available travel data plans and activation details.', 'BP Proxy Store': 'Configure a proxy service when you need one.', 'BP Secure Tunnel VPN': 'Connect and manage your Secure Tunnel subscription.', Wallet: 'Manage your balance, funding, and wallet history.', Billing: 'Subscriptions, payment methods, and receipts.', Transactions: 'A complete record of your funding and purchases.', Orders: 'Your service purchases and order status.', Notifications: 'System, security, billing, and product notices.', 'API Keys': 'Create and revoke developer credentials securely.', 'API Docs': 'Explore the Burner Point API by product.', Webhooks: 'Monitor endpoint configuration and delivery status.', Tickets: 'Get help from the Burner Point support team.', Profile: 'Manage the details attached to your account.', Settings: 'Control preferences that have an effect on your account.', Security: 'Review sessions and available security controls.' };
  const endpointByTitle: Record<string, string> = { 'BP Messenger Pro': '/messages', 'BP Verify Hub': '/verify-hub/services', 'BP Rental Hub': '/numbers', 'BP eSIM Store': '/integrations/esim/orders', 'BP Proxy Store': '/integrations/proxies/orders', 'BP Secure Tunnel VPN': '/integrations/vpn/sessions', Wallet: '/wallet/transactions', Billing: '/billing/overview', Transactions: '/payments/history', Orders: '/numbers', Notifications: '/notifications', 'API Keys': '/developer/keys', 'API Docs': '/integrations/contracts', Webhooks: '/developer/webhooks', Tickets: '/support/tickets', Profile: '/users/me', Settings: '/users/me', Security: '/auth/sessions' };
  const [data, setData] = useState<unknown>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  useEffect(() => { const endpoint = endpointByTitle[title]; if (!endpoint) { setState('empty'); return; } apiRequest<unknown>(endpoint).then((result) => { setData(result); setState(result && (Array.isArray(result) ? result.length > 0 : Object.keys(result as object).length > 0) ? 'ready' : 'empty'); }).catch(() => setState('error')); }, [title]);
  if (title === 'Wallet') return <WalletContent />;
  if (title === 'BP Messenger Pro') return <MessengerContent />;
  if (title === 'Appearance') return <AppearanceContent />;
  return <><section className="empty-workspace"><div className="empty-mark">{title.slice(0, 1)}</div><p className="eyebrow">{title.toUpperCase()}</p><h2>{copy[title] ?? 'This workspace is ready for your account data.'}</h2>{state === 'loading' && <p>Loading your account data...</p>}{state === 'empty' && <p>No {title.toLowerCase()} data is available yet.</p>}{state === 'error' && <p>We could not load this area. Check your session and try again.</p>}{state === 'ready' && <pre className="data-preview">{JSON.stringify(data, null, 2)}</pre>}<Link href="/dashboard" className="button button-dark">Back to overview <span>→</span></Link></section></>;
}

function WalletContent() {
  const [packages, setPackages] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<string>('');
  const [gateway, setGateway] = useState('paystack');
  const [history, setHistory] = useState<unknown>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { apiRequest<unknown>('/payments/packages').then((value) => setPackages(Array.isArray(value) ? value as Array<Record<string, unknown>> : [])).catch(() => setMessage('Funding packages are unavailable right now.')); apiRequest<unknown>('/wallet/transactions').then(setHistory).catch(() => undefined); }, []);
  async function startFunding() { if (!selected) return; setMessage(''); try { const result = await apiRequest<{ checkoutUrl?: string }>('/payments/initialize', { method: 'POST', body: JSON.stringify({ paymentType: 'wallet', gateway, packageId: selected, clientPlatform: 'web' }) }); if (result.checkoutUrl) window.location.href = result.checkoutUrl; else setMessage('The payment session was created without a redirect URL.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to start funding.'); } }
  return <section className="wallet-layout"><div className="wallet-funding"><p className="eyebrow">ADD FUNDS</p><h2>Fund your Burner Point balance.</h2><p>Choose a server-priced package and continue through the secure payment gateway.</p><div className="package-list">{packages.map((item, index) => { const id = String(item.id ?? item.packageId ?? index); return <button className={selected === id ? 'package-option selected' : 'package-option'} key={id} onClick={() => setSelected(id)}><strong>{String(item.name ?? item.label ?? 'Funding package')}</strong><span>{String(item.amount ?? item.price ?? '')}</span></button>; })}</div><label className="gateway-select">Payment gateway<select value={gateway} onChange={(event) => setGateway(event.target.value)}><option value="paystack">Paystack</option><option value="flutterwave">Flutterwave</option><option value="nowpayments">NOWPayments</option></select></label><button className="button button-accent" disabled={!selected} onClick={startFunding}>Continue to payment <span>→</span></button>{message && <p className="form-message">{message}</p>}</div><div className="wallet-history"><p className="eyebrow">FUNDING HISTORY</p><h3>Transactions</h3>{history ? <pre className="data-preview">{JSON.stringify(history, null, 2)}</pre> : <p>Your confirmed funding and purchases will appear here.</p>}<Link href="/dashboard/transactions">Open full history <span>→</span></Link></div></section>;
}

function MessengerContent() {
  const [messages, setMessages] = useState<unknown>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [body, setBody] = useState(''); const [callTo, setCallTo] = useState(''); const [callMessage, setCallMessage] = useState('');
  useEffect(() => { apiRequest<unknown>('/messages').then(setMessages).catch(() => setMessage('Messages are unavailable until a phone number is connected.')); }, []);
  async function send(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); try { await apiRequest('/messages', { method: 'POST', body: JSON.stringify({ from, to, body }) }); setBody(''); setMessage('Message sent.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to send message.'); } finally { setBusy(false); } }
  async function startCall(event: React.FormEvent) { event.preventDefault(); setCallMessage(''); try { const result = await apiRequest<Record<string, unknown>>('/messenger/calls/start', { method: 'POST', body: JSON.stringify({ to: callTo, idempotencyKey: `web-${Date.now()}-${crypto.randomUUID()}` }) }); setCallMessage(`Call request accepted${result.id ? `: ${String(result.id)}` : '.'}`); } catch (error) { setCallMessage(error instanceof Error ? error.message : 'Unable to start call.'); } }
  return <section className="messenger-layout"><div className="messenger-panel"><div className="messenger-header"><div><p className="eyebrow">MESSENGER PRO</p><h2>Private messaging.</h2></div><span className="live-pill">● LIVE</span></div><div className="message-feed">{messages ? <pre className="data-preview">{JSON.stringify(messages, null, 2)}</pre> : <p>Your conversations will appear here when you connect a Burner Point number.</p>}</div><form className="message-composer" onSubmit={send}><div className="composer-fields"><input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="From: +15551234567" pattern="^\+[1-9]\d{6,14}$" required aria-label="Sender number" /><input value={to} onChange={(event) => setTo(event.target.value)} placeholder="To: +15557654321" pattern="^\+[1-9]\d{6,14}$" required aria-label="Recipient number" /></div><div className="composer-row"><button type="button" aria-label="Attachments" title="Attachments require a connected private upload intent">+</button><input value={body} onChange={(event) => setBody(event.target.value)} maxLength={1600} placeholder="Write a message" required aria-label="Message" /><button className="send-button" disabled={busy} aria-label="Send message">{busy ? '...' : '↑'}</button></div></form><form className="call-row" onSubmit={startCall}><input value={callTo} onChange={(event) => setCallTo(event.target.value)} placeholder="Number to call" pattern="^\+[1-9]\d{6,14}$" required aria-label="Number to call" /><button className="button button-dark">Start call <span>↗</span></button></form>{message && <p className="form-message">{message}</p>}{callMessage && <p className="form-message">{callMessage}</p>}</div></section>;
}

function AppearanceContent() {
  const [theme, setTheme] = useState(() => typeof window === 'undefined' ? 'system' : window.localStorage.getItem('bp_theme') ?? 'system');
  function changeTheme(value: string) { setTheme(value); window.localStorage.setItem('bp_theme', value); document.documentElement.dataset.theme = value; }
  return <section className="appearance-panel"><p className="eyebrow">APPEARANCE</p><h2>Make the workspace comfortable.</h2><p>Choose how Burner Point should follow your device and remain readable in every mode.</p><div className="theme-options">{['light', 'dark', 'system'].map((option) => <button className={theme === option ? 'theme-option selected' : 'theme-option'} onClick={() => changeTheme(option)} key={option}><strong>{option[0].toUpperCase() + option.slice(1)}</strong><span>{theme === option ? 'Selected' : 'Use this mode'}</span></button>)}</div></section>;
}

function EmptyPanel({ title, body, href, action }: { title: string; body: string; href: string; action: string }) { return <section className="empty-panel"><div><p className="eyebrow">{title.toUpperCase()}</p><h3>{title}</h3><p>{body}</p></div><Link href={href}>{action} <span>→</span></Link></section>; }

function SearchResults({ query, close }: { query: string; close: () => void }) {
  const searchItems = [...navigation, { label: 'Contacts', href: '/dashboard/contacts', group: 'Messenger' }, { label: 'Help articles', href: '/help-center', group: 'Support' }, { label: 'API documentation', href: '/dashboard/api', group: 'Developer' }];
  const matches = searchItems.filter((item, index, all) => all.findIndex((candidate) => candidate.href === item.href) === index && item.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="search-results" role="listbox">{matches.length ? matches.slice(0, 8).map((item) => <Link href={item.href} onClick={close} key={item.href}><span>{item.group}</span><strong>{item.label}</strong><b>↗</b></Link>) : <p>No matching workspace destinations.</p>}</div>;
}

function AddFundsDialog({ close }: { close: () => void }) { return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="funding-dialog" role="dialog" aria-modal="true" aria-labelledby="funding-title"><button className="dialog-close" onClick={close} aria-label="Close add funds dialog">×</button><p className="eyebrow">WALLET</p><h2 id="funding-title">Add funds.</h2><p>Choose a server-priced funding package and continue through the configured payment gateway.</p><Link href="/dashboard/wallet" className="button button-accent" onClick={close}>Open Add Funds <span>→</span></Link></section></div>; }

function MobileProductSheet({ type, close }: { type: 'hub' | 'store'; close: () => void }) { const items = type === 'hub' ? [['BP Verify Hub', '/dashboard/verify-hub'], ['BP Rental Hub', '/dashboard/rentals']] : [['BP eSIM Store', '/dashboard/esim'], ['BP Proxy Store', '/dashboard/proxies']]; return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="mobile-sheet" role="dialog" aria-modal="true" aria-labelledby={`${type}-sheet-title`}><div className="sheet-handle" /><button className="dialog-close" onClick={close} aria-label={`Close ${type} menu`}>×</button><p className="eyebrow">BURNER POINT</p><h2 id={`${type}-sheet-title`}>{type === 'hub' ? 'Hubs' : 'Store'}</h2><div className="sheet-links">{items.map(([label, href]) => <Link href={href} onClick={close} key={href}><strong>{label}</strong><span>Open workspace ↗</span></Link>)}</div></section></div>; }
