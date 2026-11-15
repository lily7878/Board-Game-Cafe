import { useState } from 'react';
import { ArrowRight, Dices, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Button, Input } from '../../shared/ui';
import { useStaffAuth } from '../../app/StaffAuthContext';
import styles from './LoginPage.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 1a — Login. No role selector: the role comes from the account. */
export function LoginPage() {
  const { login } = useStaffAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Introdu o adresă de email validă.';
    if (!password) errors.password = 'Introdu parola.';
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // StaffAuthContext switches to 'active' and App renders the dashboard.
    } catch (error) {
      setFormError(
        error.status === 401
          ? 'Email sau parolă greșite, ori contul este dezactivat.'
          : error.detail ?? 'Autentificarea nu a reușit. Încearcă din nou.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <span className={`${styles.deco} ${styles.decoBig}`} aria-hidden />
      <span className={`${styles.deco} ${styles.decoSand}`} aria-hidden />
      <span className={`${styles.deco} ${styles.decoRing}`} aria-hidden />

      <section className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <Dices size={24} aria-hidden />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>Board Game Café</span>
            <span className={styles.brandSub}>Management</span>
          </span>
        </div>
        <div className={styles.heroCopy}>
          <div className={styles.overline}>Pentru personalul cafenelei</div>
          <h1 className={styles.display}>Mesele, comenzile și jocurile, într-un singur loc.</h1>
          <p className={styles.lead}>
            Staff-ul urmărește sala în timp real. Managerul are în plus administrarea și rapoartele zilei.
          </p>
        </div>
      </section>

      <div className={styles.cardWrap}>
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <div>
            <h2 className={styles.cardTitle}>Autentificare</h2>
            <p className={styles.cardSub}>Intră cu contul primit de la manager.</p>
          </div>

          <Input
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoFocus
          />
          <Input
            label="Parolă"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          {formError && (
            <div className={styles.formError} role="alert">
              {formError}
            </div>
          )}

          <Button type="submit" size="lg" fullWidth iconRight={ArrowRight} submitting={submitting} className={styles.submit}>
            Intră în aplicație
          </Button>

          <div className={styles.note}>
            <ShieldCheck size={18} className={styles.noteIcon} aria-hidden />
            <span>Rolul (Staff sau Manager) este stabilit de contul tău. Sesiunea expiră după 60 de minute.</span>
          </div>
        </form>
      </div>
    </div>
  );
}
