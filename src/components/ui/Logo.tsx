import logo from '../../../assets/logo/logo.svg';

/**
 * Application logo.
 * @param props Size in pixels.
 */
export const Logo = ({ size = 76 }: { size?: number }) => (
  <img src={logo} width={size} height={size} alt="Logo Entraînement aux calculs" />
);
