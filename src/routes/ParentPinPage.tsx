import { useNavigate, useSearchParams } from 'react-router-dom';
import { PinPad } from '../components/access/PinPad';
import { BackLink } from '../components/ui/BackLink';
import { Icon } from '../components/ui/Icon';
import { Screen } from '../components/ui/Screen';
import { useAccess } from '../features/access/access.context';
import { usePinEntry } from '../features/access/usePinEntry';
import { useFamily } from '../features/family/family.context';

const safeNext = (next: string | null) => (next?.startsWith('/parent') ? next : '/parent');

/** Parent code prompt guarding the parent area. */
export function ParentPinPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { family } = useFamily();
  const { unlockParent, leaveChild } = useAccess();

  const pin = usePinEntry((typed) => {
    if (typed !== family?.parentPin)
      return false;
    leaveChild();
    unlockParent();
    navigate(safeNext(params.get('next')), { replace: true });
    return true;
  });

  return (
    <Screen>
      <BackLink to="/" label="Changer de profil" />
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white">
          <Icon name="lock" size={28} />
        </div>
        <h1 className="m-0 mt-1 text-[26px] font-bold">Espace parent</h1>
        <p className="m-0 text-[17px] leading-normal text-muted">Entre ton code parent à 4 chiffres.</p>
      </div>
      <PinPad
        typed={pin.typed}
        rejected={pin.rejected}
        onDigit={pin.press}
        onErase={pin.erase}
      />
    </Screen>
  );
}
