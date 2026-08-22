'use client';

import { useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="section-description">{description}</p>}</div>{action}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{status}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) { return <p className="panel-state">{children}</p>; }
export function LoadingState({ children = 'Loading...' }: { children?: ReactNode }) { return <div className="loading-state" role="status"><img src="/brand/burner-point-logo.svg" alt="" aria-hidden="true" /><span>{children}</span></div>; }
export function ErrorState({ title = 'Something went wrong', children, action }: { title?: string; children: ReactNode; action?: ReactNode }) { return <div className="error-state" role="alert"><strong>{title}</strong><p>{children}</p>{action}</div>; }

function useOverlayFocus<T extends HTMLElement>(close: () => void) { const ref = useRef<T>(null); useEffect(() => { ref.current?.focus(); const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); }; document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); }, [close]); return ref; }

export function Modal({ title, eyebrow, close, children, className = '' }: { title: string; eyebrow?: string; close: () => void; children: ReactNode; className?: string }) {
  const dialogRef = useOverlayFocus<HTMLElement>(close);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section ref={dialogRef} tabIndex={-1} className={`ui-modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="ui-modal-title"><button type="button" className="dialog-close" onClick={close} aria-label={`Close ${title}`}>×</button>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id="ui-modal-title">{title}</h2>{children}</section></div>;
}

export function Drawer({ title, close, children, className = '' }: { title: string; close: () => void; children: ReactNode; className?: string }) {
  const drawerRef = useOverlayFocus<HTMLElement>(close);
  return <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><aside ref={drawerRef} tabIndex={-1} className={`ui-drawer ${className}`} role="dialog" aria-modal="true" aria-labelledby="ui-drawer-title"><button type="button" className="dialog-close" onClick={close} aria-label={`Close ${title}`}>×</button><h2 id="ui-drawer-title">{title}</h2>{children}</aside></div>;
}

export function Sheet({ title, close, children, className = '' }: { title: string; close: () => void; children: ReactNode; className?: string }) {
  const sheetRef = useOverlayFocus<HTMLElement>(close);
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section ref={sheetRef} tabIndex={-1} className={`ui-sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby="ui-sheet-title"><div className="sheet-handle" /><button type="button" className="dialog-close" onClick={close} aria-label={`Close ${title}`}>×</button><h2 id="ui-sheet-title">{title}</h2>{children}</section></div>;
}

export function Tabs({ items, value, onChange }: { items: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return <div className="ui-tabs" role="tablist">{items.map((item) => <button type="button" role="tab" aria-selected={value === item.value} className={value === item.value ? 'selected' : ''} onClick={() => onChange(item.value)} key={item.value}>{item.label}</button>)}</div>;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty = 'No records available.' }: { columns: Array<{ key: string; label: string; render?: (row: T) => ReactNode }>; rows: T[]; rowKey: (row: T, index: number) => string; onRowClick?: (row: T) => void; empty?: ReactNode }) {
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return <div className="ui-table-wrap"><table className="ui-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={rowKey(row, index)} onClick={() => onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined} onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) onRowClick(row); }}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '—')}</td>)}</tr>)}</tbody></table></div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="ui-field">{label}{children}</label>; }
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} />; }
export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} />; }
export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} />; }
export function ActionButton({ children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button type={type} className="button" {...props}>{children}</button>; }
export function Panel({ children, className = '' }: HTMLAttributes<HTMLElement>) { return <section className={`ui-panel ${className}`}>{children}</section>; }

export function AppShell({ sidebar, topbar, children, bottomNav }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode; bottomNav?: ReactNode }) { return <div className="app-shell"><aside className="ui-shell-sidebar">{sidebar}</aside><div className="app-main"><header className="ui-shell-topbar">{topbar}</header><main className="workspace">{children}</main></div>{bottomNav && <nav className="ui-shell-bottom-nav">{bottomNav}</nav>}</div>; }
export function Sidebar({ children }: { children: ReactNode }) { return <div className="ui-sidebar-content">{children}</div>; }
export function MobileBottomNav({ children }: { children: ReactNode }) { return <div className="ui-mobile-nav-content">{children}</div>; }
export function Topbar({ children }: { children: ReactNode }) { return <div className="ui-topbar-content">{children}</div>; }
export function BalanceWidget({ label = 'Balance', value }: { label?: string; value: ReactNode }) { return <div className="ui-balance-widget"><span>{label}</span><strong>{value}</strong></div>; }
export function AddFundsButton({ onClick, children = 'Add funds' }: { onClick?: () => void; children?: ReactNode }) { return <button type="button" className="button button-accent" onClick={onClick}>{children}</button>; }
export function ProductCard({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <article className="ui-product-card"><h3>{title}</h3>{description && <p>{description}</p>}{action}</article>; }
export function ProductSwitcher({ items, value, onChange }: { items: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) { return <Tabs items={items} value={value} onChange={onChange} />; }
export function ActivityList({ items, empty = 'No activity yet.' }: { items: Array<{ id: string; title: string; detail?: string; date?: string }>; empty?: ReactNode }) { return <div className="ui-activity-list">{items.length ? items.map((item) => <article key={item.id}><strong>{item.title}</strong>{item.detail && <p>{item.detail}</p>}{item.date && <time>{item.date}</time>}</article>) : <EmptyState>{empty}</EmptyState>}</div>; }
export function NotificationCenter({ items, empty = 'No notifications.' }: { items: Array<{ id: string; title: string; body?: string; read?: boolean }>; empty?: ReactNode }) { return <div className="ui-notification-center">{items.length ? items.map((item) => <article className={item.read ? 'read' : ''} key={item.id}><strong>{item.title}</strong>{item.body && <p>{item.body}</p>}</article>) : <EmptyState>{empty}</EmptyState>}</div>; }
export function TransactionList<T>({ rows, columns, onRowClick }: { rows: T[]; columns: Array<{ key: string; label: string; render?: (row: T) => ReactNode }>; onRowClick?: (row: T) => void }) { return <DataTable rows={rows} columns={columns} rowKey={(row, index) => String((row as Record<string, unknown>).id ?? index)} onRowClick={onRowClick} />; }
export function OrderList<T>({ rows, columns, onRowClick }: { rows: T[]; columns: Array<{ key: string; label: string; render?: (row: T) => ReactNode }>; onRowClick?: (row: T) => void }) { return <DataTable rows={rows} columns={columns} rowKey={(row, index) => String((row as Record<string, unknown>).id ?? index)} onRowClick={onRowClick} />; }
export function MessageComposer({ value, onChange, onSubmit, placeholder = 'Write a message' }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder?: string }) { return <form className="ui-message-composer" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button className="button button-accent" type="submit">Send</button></form>; }
export function ConversationList({ children }: { children: ReactNode }) { return <div className="ui-conversation-list">{children}</div>; }
export function ConversationView({ children }: { children: ReactNode }) { return <div className="ui-conversation-view">{children}</div>; }
export function AttachmentMenu({ children }: { children?: ReactNode }) { return <details className="ui-attachment-menu"><summary>Attachments</summary>{children}</details>; }
export function CallInterface({ children }: { children: ReactNode }) { return <section className="ui-call-interface">{children}</section>; }
