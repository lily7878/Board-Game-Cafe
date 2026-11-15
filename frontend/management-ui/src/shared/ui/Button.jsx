import { Lock } from 'lucide-react';
import { Spinner } from './Spinner';
import styles from './Button.module.css';

/**
 * Pill button.
 *  - variant: primary | secondary | ghost
 *  - size:    md (42px) | lg (54px) | sm (38px)
 *  - submitting: shows spinner + "Se procesează…" and blocks clicks
 *  - locked: disabled because a business rule blocks the action (shows lock icon)
 */
export function Button({
  variant = 'primary',
  size = 'md',
  submitting = false,
  locked = false,
  disabled = false,
  fullWidth = false,
  iconLeft: IconLeft,
  iconRight: IconRight,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || locked || submitting;
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    className,
  ].join(' ');

  return (
    <button type={type} className={classes} disabled={isDisabled} aria-busy={submitting} {...rest}>
      {submitting ? (
        <>
          <Spinner size={18} />
          Se procesează…
        </>
      ) : (
        <>
          {locked ? <Lock size={16} aria-hidden /> : IconLeft && <IconLeft size={18} aria-hidden />}
          {children}
          {IconRight && !locked && <IconRight size={18} aria-hidden />}
        </>
      )}
    </button>
  );
}
