import { Navigate } from 'react-router-dom';
import { GoogleButton } from '../components/access/GoogleButton';
import { PinPad } from '../components/access/PinPad';
import { BackLink } from '../components/ui/BackLink';
import { Button } from '../components/ui/Button';
import { ErrorText } from '../components/ui/Notice';
import { Screen, Spacer } from '../components/ui/Screen';
import { usePinEntry } from '../features/access/usePinEntry';
import { useSetup } from '../features/access/useSetup';
import { DATA_MODE } from '../lib/config';

const StepTitle = ({ step, title, text }: { step: number; title: string; text: string }) => (
  <div className="flex flex-col gap-2.5">
    <div className="text-[15px] font-bold text-muted">Étape {step} sur 2</div>
    <h1 className="m-0 text-[30px] leading-tight font-bold">{title}</h1>
    <p className="m-0 text-[17px] leading-normal text-muted">{text}</p>
  </div>
);

/** First setup of the device: Google sign-in, then the parent code. */
export function SetupPage() {
  const { step, signingIn, error, signIn, savePin, retry, parentUnlocked } = useSetup();
  const pin = usePinEntry(savePin);

  if (step === 'done')
    return <Navigate to={parentUnlocked ? '/parent/config' : '/'} replace />;

  return (
    <Screen>
      <BackLink to="/" label="Retour" />

      {step === 'google' && (
        <>
          <StepTitle
            step={1}
            title="Bienvenue !"
            text="Connecte-toi avec ton compte Google. Toutes les données de la famille y seront rattachées."
          />
          <GoogleButton busy={signingIn} onClick={() => void signIn()} />
          <ErrorText>{error}</ErrorText>
          {DATA_MODE === 'local' && (
            <p className="m-0 text-center text-sm text-muted">Mode local : la connexion Google est simulée.</p>
          )}
        </>
      )}

      {step === 'loading' && (
        <>
          <p className="m-0 text-center text-lg text-muted">{error ?? 'Chargement du compte…'}</p>
          {error && <Button onClick={() => void retry()}>Réessayer</Button>}
        </>
      )}

      {step === 'pin' && (
        <>
          <StepTitle
            step={2}
            title="Crée ton code parent"
            text="Quatre chiffres pour ouvrir l’espace parent. Tu pourras le changer quand tu veux."
          />
          <PinPad
            typed={pin.typed}
            rejected={pin.rejected}
            busy={pin.busy}
            onDigit={pin.press}
            onErase={pin.erase}
          />
        </>
      )}

      <Spacer />
      <p className="m-0 text-center text-sm leading-normal text-muted">
        Cet appareil retient ta connexion : tu n’auras pas à la refaire à chaque fois.
      </p>
    </Screen>
  );
}
