import React from 'react';
import { AppButton, AppButtonProps } from './AppButton';
import { useToast, UseToastOptions } from '@chakra-ui/react';

// Extend the AppButtonProps interface
export interface ActionButtonProps extends AppButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  toastOptions?: UseToastOptions;
  showToast?: boolean;
  actionFn?: () => void | Promise<void>;
  delay?: number;
}

/**
 * ActionButton is a wrapper around AppButton with click handler functionality.
 * It can optionally show a toast notification and execute an action function after a delay.
 */
export function ActionButton({ 
  onClick, 
  toastOptions, 
  showToast = false, 
  actionFn, 
  delay = 500, 
  ...buttonProps 
}: ActionButtonProps) {
  const toast = useToast();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e);
    }

    // Show toast if requested
    if (showToast && toastOptions) {
      toast(toastOptions);
    }

    // Execute action function after delay if provided
    if (actionFn) {
      setTimeout(() => {
        actionFn();
      }, delay);
    }
  };

  return (
    <AppButton
      onClick={handleClick}
      type="button"
      {...buttonProps}
    />
  );
}