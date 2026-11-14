import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { PinPad } from '../components/access/PinPad';
import { Avatar } from '../components/ui/Avatar';
import { BackLink } from '../components/ui/BackLink';
import { Screen } from '../components/ui/Screen';
import { useAccess } from '../features/access/access.context';
import { usePinEntry } from '../features/access/usePinEntry';
import { useChild } from '../features/family/family.context';

/** Secret code prompt of a child profile. */
export function ChildPinPage() {
  const navigate = useNavigate();
  const { id = null } = useParams();
  const child = useChild(id);
  const { enterChild } = useAccess();

  const pin = usePinEntry((typed) => {
    if (!child || typed !== child.pin)
      return false;
    enterChild(child.id);
    navigate('/home', { replace: true });
    return true;
  });

  if (!child)
    return <Navigate to="/" replace />;

  return (
    <Screen>
      <BackLink to="/" label="Changer de profil" />
      <div className="flex flex-col items-center gap-2.5 text-center">
        <Avatar name={child.name} colour={child.colour} size="large" />
        <h1 className="m-0 mt-1 text-[26px] font-bold">Bonjour {child.name} !</h1>
        <p className="m-0 text-[17px] text-muted">Entre ton code secret.</p>
      </div>
      <PinPad
        typed={pin.typed}
        rejected={pin.rejected}
        dotTone="text-brand"
        onDigit={pin.press}
        onErase={pin.erase}
      />
    </Screen>
  );
}
