'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TelegramLog {
  id: string;
  appName: string;
  versionName: string | null;
  status: 'PENDING' | 'POSTED' | 'FAILED';
  retryCount: number;
  createdAt: string;
  errorDetails: string | null;
}

interface DayBucket {
  label: string;
  date: string;
  posted: number;
  failed: number;
  total: number;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLast7Days(): { label: string; date: string }[] {
  const days: { label: string; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: DAY_NAMES[d.getDay()],
      date: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function toDateStr(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Animated Counter Hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

// ─── SVG Ring Component ───────────────────────────────────────────────────────
function AnimatedRing({
  percentage,
  color,
  size = 80,
  strokeWidth = 8,
  label,
  count,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  count: number;
}) {
  const [animated, setAnimated] = useState(false);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (animated ? percentage / 100 : 0) * circumference;

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{count} logs</div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 16, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w,
      height: h,
      borderRadius: r,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.6s infinite',
    }} />
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'PENDING' | 'POSTED' | 'FAILED' }) {
  const badgeColors = {
    POSTED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)', dot: '#10b981' },
    FAILED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)', dot: '#ef4444' },
    PENDING: { bg: 'rgba(234,179,8,0.15)', color: '#eab308', border: 'rgba(234,179,8,0.3)', dot: '#eab308' },
  };
  const cfg = badgeColors[status] || { bg: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'rgba(255,255,255,0.1)', dot: '#94a3b8' };
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {status || 'UNKNOWN'}
    </span>
  );
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────
function TimelineEntry({ log }: { log: TelegramLog }) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = log.status === 'POSTED' ? '#10b981' : log.status === 'FAILED' ? '#ef4444' : '#eab308';

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        borderLeft: `3px solid ${borderColor}`,
        paddingLeft: 14,
        paddingTop: 12,
        paddingBottom: 12,
        paddingRight: 14,
        borderRadius: '0 10px 10px 0',
        background: expanded ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{log.appName}</div>
            {log.versionName && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>v{log.versionName}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusBadge status={log.status} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
            {formatRelativeTime(log.createdAt)}
          </span>
          <span style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
            transition: 'transform 0.25s ease',
          }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.25)',
          fontSize: 12,
          lineHeight: 1.6,
          animation: 'fadeSlideDown 0.25s ease',
        }}>
          {log.status === 'FAILED' && log.errorDetails ? (
            <div style={{ color: '#fca5a5', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>Error: </span>{log.errorDetails}
            </div>
          ) : log.status === 'POSTED' ? (
            <div style={{ color: '#6ee7b7' }}>
              ✓ Successfully posted to Telegram channel
              {log.retryCount > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                  (after {log.retryCount} {log.retryCount === 1 ? 'retry' : 'retries'})
                </span>
              )}
            </div>
          ) : (
            <div style={{ color: '#fde68a' }}>⏳ Post is queued and waiting to be sent...</div>
          )}
          <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            ID: {log.id} · {new Date(log.createdAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  isLoading,
  ring,
}: {
  icon: string;
  label: string;
  value: number;
  sub: string;
  accent: string;
  isLoading: boolean;
  ring?: boolean;
}) {
  const displayed = useCountUp(isLoading ? 0 : value, 1000, 200);

  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 160,
      padding: '20px 22px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(20px)',
      boxShadow: `0 0 0 1px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(0,0,0,0.2), 0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px ${accent}22`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`;
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', background: accent, opacity: 0.08, filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
          {isLoading ? (
            <>
              <Skeleton w={60} h={28} r={6} />
              <div style={{ marginTop: 6 }}><Skeleton w={80} h={12} r={4} /></div>
            </>
          ) : (
            <>
              <div style={{
                fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 20px ${accent}66`,
              }}>
                {ring ? `${displayed}%` : displayed}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, fontWeight: 500 }}>{sub}</div>
            </>
          )}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, color: accent,
          padding: '4px 10px', borderRadius: 20,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          whiteSpace: 'nowrap',
        }}>{label}</div>
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
      }} />
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ buckets, isLoading }: { buckets: DayBucket[]; isLoading: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(t);
  }, []);

  const maxTotal = Math.max(...buckets.map(b => b.total), 1);

  return (
    <div style={{ padding: '20px 24px 0' }}>
      {/* Y-axis hint */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130 }}>
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Skeleton w="100%" h={Math.random() * 80 + 20} r={4} />
            </div>
          ))
          : buckets.map((bucket, i) => {
            const totalH = mounted ? (bucket.total / maxTotal) * 120 : 0;
            const postedH = bucket.total > 0 ? (bucket.posted / bucket.total) * totalH : 0;
            const failedH = totalH - postedH;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  height: 120,
                  gap: 1,
                  position: 'relative',
                }}>
                  {/* Tooltip on hover */}
                  <div className="bar-tooltip" style={{
                    position: 'absolute',
                    bottom: totalH + 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(10,10,20,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 11,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                    zIndex: 10,
                  }}>
                    <div style={{ color: '#10b981' }}>✓ {bucket.posted} posted</div>
                    {bucket.failed > 0 && <div style={{ color: '#ef4444' }}>✗ {bucket.failed} failed</div>}
                  </div>

                  {/* Stacked bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {failedH > 0 && (
                      <div style={{
                        width: '100%', height: failedH,
                        background: 'linear-gradient(180deg, #ef4444, #dc2626)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 1.1s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                      }} />
                    )}
                    {postedH > 0 && (
                      <div style={{
                        width: '100%', height: postedH,
                        background: failedH > 0
                          ? 'linear-gradient(180deg, #10b981, #059669)'
                          : 'linear-gradient(180deg, #10b981, #059669)',
                        borderRadius: failedH > 0 ? '0' : '4px 4px 0 0',
                        transition: 'height 1.1s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                      }} />
                    )}
                    {bucket.total === 0 && (
                      <div style={{
                        width: '100%', height: 3,
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 4,
                      }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* X-axis */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Skeleton w={24} h={11} r={3} />
            </div>
          ))
          : buckets.map((b, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              fontSize: 11, fontWeight: 600,
              color: b.date === todayStr() ? '#a78bfa' : 'rgba(255,255,255,0.35)',
            }}>
              {b.date === todayStr() ? 'Today' : b.label}
            </div>
          ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingBottom: 4 }}>
        {[
          { color: '#10b981', label: 'Posted' },
          { color: '#ef4444', label: 'Failed' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, badge }: { icon: string; title: string; badge?: string | number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>{icon}</div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {badge !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#a78bfa',
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
        }}>{badge}</span>
      )}
    </div>
  );
}

// ─── Panel Wrapper ────────────────────────────────────────────────────────────
function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      padding: '22px 24px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', gap: 16, textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'rgba(167,139,250,0.08)',
        border: '1px solid rgba(167,139,250,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, animation: 'float 3s ease-in-out infinite',
      }}>📭</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>No Telegram Logs Yet</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 300 }}>
          Telegram auto-posting activity will appear here once your first post is queued.
        </div>
      </div>
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      padding: '14px 18px',
      borderRadius: 12,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      color: '#fca5a5',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 20,
      animation: 'fadeSlideDown 0.3s ease',
    }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div>
        <strong>Failed to load analytics</strong>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{message}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TelegramAnalytics() {
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch('/api/admin/telegram-logs?page=1&limit=100')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          const logsArray: TelegramLog[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.logs)
            ? data.logs
            : Array.isArray(data?.data)
            ? data.data
            : [];
          setLogs(logsArray);
          setLastRefreshed(new Date());
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Unknown error');
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  // Derived stats
  const totalPosted = logs.filter(l => l.status === 'POSTED').length;
  const totalFailed = logs.filter(l => l.status === 'FAILED').length;
  const totalPending = logs.filter(l => l.status === 'PENDING').length;
  const postsToday = logs.filter(l => toDateStr(l.createdAt) === todayStr()).length;
  const successRate = logs.length > 0 ? Math.round((totalPosted / logs.length) * 100) : 0;
  const totalRetries = logs.reduce((acc, l) => acc + l.retryCount, 0);

  // 7-day buckets
  const days = getLast7Days();
  const buckets: DayBucket[] = days.map(d => {
    const dayLogs = logs.filter(l => toDateStr(l.createdAt) === d.date);
    return {
      label: d.label,
      date: d.date,
      posted: dayLogs.filter(l => l.status === 'POSTED').length,
      failed: dayLogs.filter(l => l.status === 'FAILED').length,
      total: dayLogs.length,
    };
  });

  // Performance metrics
  const avgPerDay = logs.length > 0 ? (logs.length / 7).toFixed(1) : '0';
  const bestDay = buckets.reduce((best, b) => b.total > best.total ? b : best, buckets[0]);

  // Recent 5
  const recentLogs = [...logs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <>
      {/* ─── Injected CSS ─── */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
          50%       { box-shadow: 0 0 0 6px rgba(167,139,250,0.15); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .telegram-analytics-root {
          animation: fadeIn 0.4s ease;
        }
        .bar-group:hover .bar-tooltip {
          opacity: 1 !important;
        }
      `}</style>

      <div className="telegram-analytics-root" style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>

        {/* ─── Header ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }}>✈️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Telegram Analytics
              </h2>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                Auto-posting performance dashboard · Last {logs.length} logs
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Updated {formatRelativeTime(lastRefreshed.toISOString())}
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f1f5f9', fontSize: 12, fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <span style={{ display: 'inline-block', animation: isLoading ? 'spin 1s linear infinite' : 'none', fontSize: 13 }}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Error ─── */}
        {error && <ErrorBanner message={error} />}

        {/* ─── Stat Cards ─── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <StatCard icon="📅" label="TODAY" value={postsToday} sub="posts sent today" accent="#a78bfa" isLoading={isLoading} />
          <StatCard icon="✅" label="POSTED" value={totalPosted} sub="successfully sent" accent="#10b981" isLoading={isLoading} />
          <StatCard icon="❌" label="FAILED" value={totalFailed} sub="delivery failures" accent="#ef4444" isLoading={isLoading} />
          <StatCard icon="🎯" label="RATE" value={successRate} sub="delivery success rate" accent="#3b82f6" isLoading={isLoading} ring />
        </div>

        {/* ─── Charts Row ─── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

          {/* 7-Day Bar Chart */}
          <Panel style={{ flex: '2 1 360px' }}>
            <SectionHeader icon="📊" title="7-Day Activity" badge={`${logs.length} total`} />
            <BarChart buckets={buckets} isLoading={isLoading} />
          </Panel>

          {/* Status Distribution */}
          <Panel style={{ flex: '1 1 240px', minWidth: 240 }}>
            <SectionHeader icon="🍩" title="Status Distribution" />
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Skeleton w={80} h={80} r={40} />
                    <Skeleton w={50} h={11} r={4} />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                No data yet
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 10 }}>
                <AnimatedRing
                  percentage={logs.length > 0 ? (totalPosted / logs.length) * 100 : 0}
                  color="#10b981"
                  label="Posted"
                  count={totalPosted}
                />
                <AnimatedRing
                  percentage={logs.length > 0 ? (totalFailed / logs.length) * 100 : 0}
                  color="#ef4444"
                  label="Failed"
                  count={totalFailed}
                />
                <AnimatedRing
                  percentage={logs.length > 0 ? (totalPending / logs.length) * 100 : 0}
                  color="#eab308"
                  label="Pending"
                  count={totalPending}
                />
              </div>
            )}

            {/* Total count */}
            {!isLoading && logs.length > 0 && (
              <div style={{
                marginTop: 20, paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'center', gap: 0,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc' }}>{logs.length}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Total Logs</div>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* ─── Performance Metrics ─── */}
        <Panel>
          <SectionHeader icon="⚡" title="Performance Metrics" />
          {isLoading ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ flex: '1 1 150px', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                  <Skeleton w="60%" h={26} r={6} />
                  <div style={{ marginTop: 8 }}><Skeleton w="80%" h={12} r={4} /></div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                {
                  icon: '📈',
                  label: 'Avg Posts / Day',
                  value: avgPerDay,
                  sub: 'over last 7 days',
                  color: '#a78bfa',
                },
                {
                  icon: '🏆',
                  label: 'Best Day',
                  value: bestDay?.total > 0 ? (bestDay.date === todayStr() ? 'Today' : `${bestDay.label} (${bestDay.total})`) : '—',
                  sub: bestDay?.total > 0 ? `${bestDay.total} posts` : 'No posts yet',
                  color: '#f59e0b',
                },
                {
                  icon: '🔁',
                  label: 'Total Retries',
                  value: totalRetries,
                  sub: 'retry attempts across all posts',
                  color: '#06b6d4',
                },
                {
                  icon: '📋',
                  label: 'Pending Queue',
                  value: totalPending,
                  sub: 'waiting to be posted',
                  color: '#eab308',
                },
              ].map(({ icon, label, value, sub, color }) => (
                <div key={label} style={{
                  flex: '1 1 150px',
                  padding: '18px 20px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'background 0.2s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: `0 0 16px ${color}55` }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 4 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* ─── Recent Posts Timeline ─── */}
        <Panel>
          <SectionHeader icon="🕐" title="Recent Posts" badge={recentLogs.length} />
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  borderLeft: '3px solid rgba(255,255,255,0.08)',
                  paddingLeft: 14,
                  paddingTop: 12, paddingBottom: 12,
                  borderRadius: '0 10px 10px 0',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton w={140} h={14} r={4} />
                      <Skeleton w={80} h={11} r={3} />
                    </div>
                    <Skeleton w={64} h={22} r={20} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {recentLogs.map(log => (
                <TimelineEntry key={log.id} log={log} />
              ))}
              {logs.length > 5 && (
                <div style={{
                  textAlign: 'center', marginTop: 12, fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  Showing latest 5 of {logs.length} total entries
                </div>
              )}
            </div>
          )}
        </Panel>

      </div>
    </>
  );
}
