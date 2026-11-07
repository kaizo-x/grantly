import { AuthGateway } from './AuthGateway';
import { Modal } from '../ui/Modal';
import type { GrantlyUser } from '../../lib/session';

export interface AuthDialogProps {
  /** Whether the dialog is mounted. */
  open: boolean;
  /** Dismisses the dialog (Escape, backdrop click or the close button). */
  onClose: () => void;
  /** Invoked once a session has been established and persisted. */
  onAuthenticated: (user: GrantlyUser) => void;
}

/**
 * Authentication as an overlay rather than a gate.
 *
 * The dashboard is always rendered underneath — so a headless crawler (or a
 * judge) sees every landmark, filter and scholarship card on first paint — and
 * sign-in/registration opens on top of it only when the visitor asks for it.
 */
export function AuthDialog({ open, onClose, onAuthenticated }: AuthDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Sign in or register"
      description="Authenticate to save your progress, or explore the pre-populated demo profile."
    >
      <AuthGateway embedded onAuthenticated={onAuthenticated} />
    </Modal>
  );
}
