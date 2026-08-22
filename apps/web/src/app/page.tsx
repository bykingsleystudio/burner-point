import Link from 'next/link';

const products = [
  ['Messenger Pro', 'Private messaging and calling', '/dashboard/messenger'],
  ['Verify Hub', 'One-time verification numbers', '/dashboard/verify-hub'],
  ['Rental Hub', 'Temporary and renewable numbers', '/dashboard/rentals'],
  ['eSIM Store', 'Travel data without the friction', '/dashboard/esim'],
  ['Proxy Store', 'Configure a private connection', '/dashboard/proxies'],
  ['Secure Tunnel VPN', 'A quieter way online', '/dashboard/vpn']
];

export default function HomePage() {
  return <main className="public-home">
    <nav className="public-nav"><Link href="/" className="brand"><span className="brand-mark">BP</span><span>Burner Point</span></Link><div className="nav-actions"><Link href="/sign-in">Sign in</Link><Link href="/sign-up" className="button button-dark">Create account <span>→</span></Link></div></nav>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">PRIVATE TELECOM, WITHOUT THE NOISE</p><h1>One calm workspace for the way you connect.</h1><p className="hero-text">Messages, numbers, travel data, proxies, and VPN access, held together by one account and one clear balance.</p><div className="hero-actions"><Link href="/sign-up" className="button button-accent">Get started <span>→</span></Link><Link href="/sign-in" className="text-link">Open workspace</Link></div></div><div className="hero-panel"><div className="panel-top"><span className="status-dot" />Workspace ready</div><div className="signal-grid"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div><div className="panel-caption"><strong>Less switching.</strong><span>More control over every connection.</span></div></div></section>
    <section className="product-strip"><div><p className="eyebrow">THE PLATFORM</p><h2>Tools that stay out of your way.</h2></div><div className="product-grid">{products.map(([title, text, href], index) => <Link className="product-tile" href={href} key={title}><span className="tile-index">0{index + 1}</span><strong>{title}</strong><span>{text}</span><b>↗</b></Link>)}</div></section>
    <footer className="public-footer"><span>© Burner Point</span><span>Private by design.</span><div><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link></div></footer>
  </main>;
}
