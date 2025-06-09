import React from 'react';
import { AppButton, AppButtonProps } from './AppButton';

// Extend the AppButtonProps interface
export interface FormButtonProps extends AppButtonProps {
  type?: 'submit' | 'reset' | 'button';
  name?: string;
  value?: string;
  form?: string;
}

/**
 * FormButton is a wrapper around AppButton with form submission functionality.
 * It sets the type to 'submit' by default and accepts additional form-related props.
 */
export function FormButton({ type = 'submit', ...buttonProps }: FormButtonProps) {
  return (
    <AppButton
      type={type}
      {...buttonProps}
    />
  );
}