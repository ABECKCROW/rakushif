import { Link, useNavigation } from '@remix-run/react';
import { AppButton, AppButtonProps } from './AppButton';

// Extend the AppButtonProps interface
export interface LinkButtonProps extends AppButtonProps {
  to: string;
  reloadDocument?: boolean;
  isDisabled?: boolean;
}

/**
 * LinkButton is a wrapper around AppButton that adds navigation functionality.
 * It combines the AppButton with a Link component from Remix for navigation.
 * It can be disabled during page transitions.
 */
export function LinkButton({ to, reloadDocument, isDisabled, ...buttonProps }: LinkButtonProps) {
  // Use the navigation hook to track page transitions
  const navigation = useNavigation();
  const isNavigating = navigation.state === "submitting" || navigation.state === "loading";

  // Combine the external isDisabled prop with the navigation state
  const isButtonDisabled = isDisabled || isNavigating;

  return (
    <Link 
      to={isButtonDisabled ? undefined : to} 
      reloadDocument={reloadDocument} 
      onClick={isButtonDisabled ? (e) => e.preventDefault() : undefined}
      style={{ 
        display: 'inline-block',
        pointerEvents: isButtonDisabled ? "none" : "auto",
        opacity: isButtonDisabled ? 0.4 : 1
      }}
    >
      <AppButton 
        {...buttonProps} 
        disabled={isButtonDisabled}
        cursor={isButtonDisabled ? "not-allowed" : "pointer"}
      />
    </Link>
  );
}
