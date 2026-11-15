import { useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import { useStaffAuth } from '../../app/StaffAuthContext';
import { apiRequest } from '../../shared/api/http';
import { useAction } from '../../shared/hooks/useAction';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Badge, Button, Card, EmptyMessage, RowMenu, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { TableSkeleton } from '../admin-menu/ProductsTab';
import { StaffFormModal } from './StaffFormModal';
import styles from './Staff.module.css';

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** The business day that was open when the account was created ("Ziua #N"), if we know it. */
function dayOf(createdAt, days) {
  const at = new Date(createdAt).getTime();
  const day = days?.find((d) => new Date(d.openedAt).getTime() <= at && (!d.finalizedAt || at < new Date(d.finalizedAt).getTime()));
  return day ? `Ziua #${day.dayNumber}` : new Intl.DateTimeFormat('ro-RO', { dateStyle: 'medium' }).format(new Date(createdAt));
}

/**
 * 2k — staff accounts. Accounts are never deleted (orders and sessions keep who handled them),
 * only deactivated. You cannot deactivate yourself, and Core refuses to deactivate the last
 * active manager (409).
 */
export function StaffAdminPage() {
  const staff = useApiQuery('/api/admin/staff');
  const days = useApiQuery('/api/admin/business-days');
  const { user } = useStaffAuth();
  const { run } = useAction();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const setActive = (member, active) =>
    run(`staff-${member.id}`, () => apiRequest(`/api/admin/staff/${member.id}/status`, { method: 'PATCH', body: { active } }), {
      success: active ? `Contul lui ${member.fullName} a fost reactivat.` : `Contul lui ${member.fullName} a fost dezactivat.`,
      after: staff.refetch,
      onError: (error) => {
        if (!error.isConflict) return false;
        toast.error('Nu poți dezactiva ultimul manager activ. Creează sau reactivează întâi alt cont de manager.');
        return true;
      },
    });

  const needle = query.trim().toLocaleLowerCase('ro');
  const list = (staff.data ?? [])
    .filter((m) => !needle || m.fullName.toLocaleLowerCase('ro').includes(needle) || m.email.toLowerCase().includes(needle))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.fullName.localeCompare(b.fullName, 'ro'));

  return (
    <>
      <div className={admin.header}>
        <label className={admin.search} style={{ marginLeft: 0 }}>
          <Search size={16} aria-hidden />
          <input type="search" placeholder="Caută după nume sau email…" aria-label="Caută cont" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className={admin.headerEnd}>
          <Button iconLeft={UserPlus} onClick={() => setAdding(true)}>
            Adaugă cont
          </Button>
        </div>
      </div>

      {staff.loading && !staff.data ? (
        <TableSkeleton />
      ) : staff.error && !staff.data ? (
        <Card size="lg">
          <EmptyMessage icon={Users} title="Nu am putut încărca personalul" action={<Button variant="secondary" onClick={staff.refetch}>Reîncearcă</Button>}>
            {staff.error.detail}
          </EmptyMessage>
        </Card>
      ) : (
        <div className={admin.tableCard}>
          <table className={admin.table}>
            <thead>
              <tr>
                <th>Nume</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Stare</th>
                <th>Creat</th>
                <th className={admin.actionsCell}>
                  <span hidden>Acțiuni</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((member) => {
                const isMe = member.id === user?.staffId;
                return (
                  <tr key={member.id} className={member.active ? '' : admin.rowInactive}>
                    <td>
                      <div className={admin.nameCell}>
                        <span className={`${styles.avatar} ${member.role === 'MANAGER' ? styles.avatarManager : ''}`} aria-hidden>
                          {initials(member.fullName)}
                        </span>
                        <span className={member.active ? admin.strong : ''}>
                          {member.fullName}
                          {isMe && <span className={admin.small}> (tu)</span>}
                        </span>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.role === 'MANAGER' ? <Badge tone="reserved">Manager</Badge> : <Badge tone="active">Staff</Badge>}</td>
                    <td>{member.active ? <Badge tone="success">Activ</Badge> : <Badge tone="neutral">Inactiv</Badge>}</td>
                    <td className={admin.muted}>{dayOf(member.createdAt, days.data)}</td>
                    <td className={admin.actionsCell}>
                      {!isMe && (
                        <RowMenu
                          label={`Acțiuni pentru ${member.fullName}`}
                          items={[
                            member.active
                              ? { label: 'Dezactivează contul', tone: 'danger', onSelect: () => setActive(member, false) }
                              : { label: 'Reactivează contul', onSelect: () => setActive(member, true) },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className={admin.muted}>
                    Niciun cont nu se potrivește căutării.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {adding && <StaffFormModal onClose={() => setAdding(false)} onSaved={staff.refetch} />}
    </>
  );
}
