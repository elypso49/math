import { useState } from 'react';
import { ChildSettingsCard } from '../components/parent/ChildSettingsCard';
import { InlineEdit } from '../components/parent/InlineEdit';
import { ParentNav } from '../components/parent/ParentNav';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Dialog';
import { Icon } from '../components/ui/Icon';
import { ErrorText, Notice } from '../components/ui/Notice';
import { Screen, Spacer } from '../components/ui/Screen';
import { randomPin, useParentConfig } from '../features/family/useParentConfig';
import type { Child } from '../types/math.types';

/** Parent configuration: children, their codes, school years and operations, and the parent code. */
export function ParentConfigPage() {
  const config = useParentConfig();
  const [editingParentPin, setEditingParentPin] = useState(false);
  const [removing, setRemoving] = useState<Child | null>(null);

  const remove = () => {
    if (removing)
      void config.remove(removing);
    setRemoving(null);
  };

  return (
    <Screen gap="tight">
      <ParentNav current="config" />

      <ErrorText>{config.error}</ErrorText>

      <h2 className="m-0 mt-1 text-[19px] font-bold">Enfants</h2>
      {config.children.map((child) => (
        <ChildSettingsCard
          key={child.id}
          child={child}
          busy={config.busy}
          suggestedPin={randomPin}
          onRename={(name) => config.rename(child, name)}
          onSetPin={(pin) => config.setPin(child, pin)}
          onSetGrade={(grade) => void config.setGrade(child, grade)}
          onToggleOperation={(operation) => void config.toggleOperation(child, operation)}
          onDelete={() => setRemoving(child)}
        />
      ))}

      {config.adding ? (
        <div className="rounded-[18px] bg-white p-[18px]">
          <InlineEdit
            label="Prénom du nouvel enfant"
            initial=""
            busy={config.busy}
            submitLabel="Ajouter"
            onSave={(name) => void config.addChild(name)}
            onCancel={() => config.setAdding(false)}
          />
        </div>
      ) : (
        <Button variant="dashed" onClick={() => config.setAdding(true)}>
          <Icon name="plus" size={20} />
          Ajouter un enfant
        </Button>
      )}

      <h2 className="m-0 mt-2 text-[19px] font-bold">Espace parent</h2>
      <div className="rounded-[18px] bg-white p-[18px]">
        {editingParentPin ? (
          <InlineEdit
            label="Nouveau code parent (4 chiffres)"
            initial=""
            pin
            busy={config.busy}
            onSave={(pin) => void config.changeParentPin(pin).then((done) => done && setEditingParentPin(false))}
            onCancel={() => setEditingParentPin(false)}
          />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-muted">Code parent</span>
              <span className="text-xl font-bold tracking-[2px]">● ● ● ●</span>
            </div>
            <Button variant="outline" onClick={() => setEditingParentPin(true)}>
              Modifier
            </Button>
          </div>
        )}
      </div>

      <Spacer />
      <Notice>Les codes sont visibles par le parent et ne sont pas chiffrés. Un enfant sans code accède directement à son profil.</Notice>
      <button type="button" onClick={config.signOutDevice} className="flex items-center justify-center gap-1.5 text-[15px] text-muted">
        <Icon name="log-out" size={16} />
        Déconnecter le compte Google de cet appareil
      </button>
      <ConfirmDialog
        open={removing !== null}
        title={`Supprimer le profil de ${removing?.name ?? ''} ?`}
        message="Toutes ses séries seront effacées."
        confirmLabel="Supprimer"
        danger
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </Screen>
  );
}
