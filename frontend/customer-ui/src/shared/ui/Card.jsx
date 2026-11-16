import styles from './Card.module.css';

/**
 * White surface. `interactive` adds the blush hover ring and makes it a button.
 *  size: sm (radius 24) | lg (radius 32)
 */
export function Card({ as, interactive = false, size = 'sm', className = '', children, ...rest }) {
  const Tag = as ?? (interactive ? 'button' : 'div');
  const classes = [styles.card, styles[size], interactive ? styles.interactive : '', className].join(' ');
  return (
    <Tag className={classes} {...(Tag === 'button' ? { type: 'button' } : {})} {...rest}>
      {children}
    </Tag>
  );
}
