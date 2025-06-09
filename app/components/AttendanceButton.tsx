import React from 'react';
import { FormButton, FormButtonProps } from './FormButton';

// Extend the FormButtonProps interface
export interface AttendanceButtonProps extends FormButtonProps {
  // No additional props needed for now
}

/**
 * AttendanceButton is a wrapper around FormButton with specific styling for attendance buttons.
 * It sets common styling props like padding, font size, etc. to ensure consistent appearance.
 */
export function AttendanceButton({ children, ...buttonProps }: AttendanceButtonProps) {
  return (
    <FormButton
      size="lg"
      width="100%"
      py={10}
      px={12}
      fontSize="2xl"
      {...buttonProps}
    >
      {children}
    </FormButton>
  );
}