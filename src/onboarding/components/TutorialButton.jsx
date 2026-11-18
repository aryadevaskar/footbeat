export default function TutorialButton({ children, onClick, variant = 'primary', type = 'button', ...props }) {
  return (
    <button className={`tutorial-button tutorial-button--${variant}`} type={type} onClick={onClick} {...props}>
      {children}
      {variant === 'primary' && <span aria-hidden="true">↗</span>}
    </button>
  );
}
