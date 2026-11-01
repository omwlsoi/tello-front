// 높이 60px 이상의 큰 버튼 (고령층·아동도 누르기 쉽게)
// variant: primary(파랑) | dark(검정) | outline(흰 바탕 테두리) | soft(연파랑)
export default function BigButton({
    variant = 'primary',
    icon,
    className = '',
    children,
    type = 'button',
    ...props
}) {
    return (
        <button
            type={type}
            className={`big-btn big-btn--${variant} ${className}`.trim()}
            {...props}
        >
            {icon}
            {children}
        </button>
    );
}
