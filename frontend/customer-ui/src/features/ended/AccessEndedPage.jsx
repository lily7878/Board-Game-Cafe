import { useState } from 'react';
import { Camera, Dices, DoorOpen, LogOut, QrCode, ScanLine } from 'lucide-react';
import { Button } from '../../shared/ui';
import styles from './AccessEnded.module.css';

const VARIANTS = {
  closed: {
    icon: DoorOpen,
    title: 'Această masă nu mai este activă',
    text: 'Sesiunea s-a închis sau codul QR nu mai este valabil. Coșul de pe acest telefon a fost golit.',
  },
  invalid: {
    icon: DoorOpen,
    title: 'Această masă nu mai este activă',
    text: 'Codul QR nu mai este valabil: masa a fost plătită sau închisă.',
  },
  left: {
    icon: LogOut,
    title: 'Ai ieșit de pe acest telefon',
    text: 'Comenzile tale rămân pe nota mesei. Ca să revii, scanează din nou codul QR și introdu PIN-ul.',
  },
  none: {
    icon: QrCode,
    title: 'Scanează codul de pe masă',
    text: 'Aplicația se deschide din codul QR afișat de personal când îți deschide masa.',
  },
};

/**
 * 4n — access ended / invalid link. Nothing from the old session stays on the phone.
 * A web page cannot open the camera's QR scanner, so the CTA explains how to scan instead.
 */
export function AccessEndedPage({ reason = 'closed' }) {
  const variant = VARIANTS[reason] ?? VARIANTS.closed;
  const Icon = variant.icon;
  const [help, setHelp] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          <Dices size={22} />
        </span>
        Board Game Café
      </div>
      <span className={styles.icon} aria-hidden>
        <Icon size={34} />
      </span>
      <div>
        <h1 className={styles.title}>{variant.title}</h1>
        <p className={styles.text}>{variant.text}</p>
      </div>
      <Button size="lg" fullWidth iconLeft={ScanLine} onClick={() => setHelp(true)}>
        Scanează un cod nou
      </Button>
      {help && (
        <p className={styles.help} role="status">
          <Camera size={18} aria-hidden /> Deschide camera telefonului și îndreapt-o spre codul QR de pe masă. Linkul se deschide singur.
        </p>
      )}
      <p className={styles.note}>Pentru o masă nouă, cereți codul personalului.</p>
    </div>
  );
}
