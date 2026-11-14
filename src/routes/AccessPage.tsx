import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentEntry, ProfileCard } from '../components/access/ProfileCard';
import { Logo } from '../components/ui/Logo';
import { Screen } from '../components/ui/Screen';
import { useAccess } from '../features/access/access.context';
import { useFamily } from '../features/family/family.context';
import type { Child } from '../types/math.types';

/** "Who is signing in?" screen: one card per child, then the parent area. Reaching it locks the parent area. */
export function AccessPage() {
  const navigate = useNavigate();
  const { family } = useFamily();
  const { enterChild, lockParent } = useAccess();
  const children = family?.children ?? [];

  useEffect(lockParent, [lockParent]);

  const select = (child: Child) => {
    if (child.pin) {
      navigate(`/child/${child.id}/pin`);
      return;
    }
    enterChild(child.id);
    navigate('/home');
  };

  return (
    <Screen className="pt-16">
      <div className="flex flex-col items-center gap-3.5 text-center">
        <Logo />
        <h1 className="m-0 text-[30px] leading-tight font-bold">Qui se connecte ?</h1>
        <p className="m-0 text-[17px] leading-normal text-muted">Choisis ton profil pour commencer.</p>
      </div>

      <div className="mt-2 flex flex-col gap-3.5">
        {children.map((child) => (
          <ProfileCard key={child.id} name={child.name} colour={child.colour} locked={!!child.pin} onSelect={() => select(child)} />
        ))}
        {children.length === 0 && (
          <p className="m-0 rounded-[20px] bg-white p-[18px] text-center text-[17px] text-muted">
            Aucun profil enfant pour l’instant. Ouvre l’espace parent pour en ajouter un.
          </p>
        )}
      </div>

      <ParentEntry onSelect={() => navigate('/parent/pin?next=/parent')} />
    </Screen>
  );
}
