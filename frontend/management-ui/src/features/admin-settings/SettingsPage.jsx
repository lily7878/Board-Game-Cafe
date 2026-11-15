import { useNavigate, useSearchParams } from '../../app/router';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Tabs } from '../../shared/ui';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { OpeningHoursTab } from './OpeningHoursTab';

/** 2o / 2p — Setări generale and Program (informative opening hours). Tab in the URL (?tab=hours). */
export function SettingsPage() {
  const params = useSearchParams();
  const navigate = useNavigate();
  const tab = params.get('tab') === 'hours' ? 'hours' : 'general';
  const settings = useApiQuery('/api/admin/settings');
  const hours = useApiQuery('/api/admin/opening-hours');

  return (
    <>
      <div>
        <Tabs
          surface="tinted"
          ariaLabel="Secțiuni setări"
          value={tab}
          onChange={(next) => navigate(next === 'hours' ? '/admin/settings?tab=hours' : '/admin/settings', { replace: true })}
          tabs={[
            { value: 'general', label: 'Setări generale' },
            { value: 'hours', label: 'Program' },
          ]}
        />
      </div>
      {/* key: the form re-initialises from Core after every successful save / refetch. */}
      {tab === 'general' ? (
        <GeneralSettingsTab key={settings.data?.updatedAt ?? 'loading'} query={settings} />
      ) : (
        <OpeningHoursTab key={JSON.stringify(hours.data ?? 'loading')} query={hours} />
      )}
    </>
  );
}
