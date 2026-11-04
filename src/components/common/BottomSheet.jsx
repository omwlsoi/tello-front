import breakLines from '../../utils/breakLines';

// 화면 아래에서 올라오는 확인 창 (icon 자리에는 텔로 캐릭터 등 무엇이든 넣을 수 있어요)
export default function BottomSheet({ open, label, title, desc, icon, className = '', children }) {
    if (!open) return null;
    return (
        <div className="sheet-dim">
            <div className={`sheet ${className}`.trim()} role="dialog" aria-modal="true" aria-label={label ?? title}>
                {icon && <div className="sheet__icon">{icon}</div>}
                {title && <h2 className="sheet__title">{breakLines(title)}</h2>}
                {desc && <p className="sheet__desc">{breakLines(desc)}</p>}
                {children}
            </div>
        </div>
    );
}
