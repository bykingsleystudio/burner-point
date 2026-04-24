import { BpTabs } from '@/components/design-system';

export function MessengerTabs({ active }: { active: string }) {
  return (
    <BpTabs
      active={active}
      tabs={[
        { label: 'Messaging', href: '/dashboard/inbox' },
        { label: 'Calls', href: '/dashboard/calls' },
        { label: 'Contacts', href: '/dashboard/contacts' },
      ]}
    />
  );
}
