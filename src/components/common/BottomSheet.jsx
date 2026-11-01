const TONE_COLORS = {
    warn: { bg: 'var(--warn-bg)', fg: 'var(--warn-ink-strong)' },
    info: { bg: 'var(--blue-soft)', fg: 'var(--blue-deep)' },
    ok: { bg: 'var(--ok-bg)', fg: 'var(--ok-ink)' },
};

// 화면 아래에서 올라오는 확인 창
export default function BottomSheet({ open, label, title, desc, icon, tone = 'info', children }) {
    if (!open) return null;
    const colors = TONE_COLORS[tone] ?? TONE_COLORS.info;
    return (
        <div className="sheet-dim">
            <div className="sheet" role="dialog" aria-modal="true" aria-label={label ?? title}>
                {icon && (
                    <div className="sheet__icon" style={{ background: colors.bg, color: colors.fg }}>
                        {icon}
                    </div>
                )}
                {title && <h2 className="sheet__title">{title}</h2>}
                {desc && <p className="sheet__desc">{desc}</p>}
                {children}
            </div>
        </div>
    );
}
