import { Link } from '@remix-run/react';
import React from 'react';
import { AppButton, AppButtonProps } from './AppButton';

// Extend the AppButtonProps interface
export interface LinkButtonProps extends AppButtonProps {
  to: string;
  reloadDocument?: boolean;
}

/**
 * LinkButton is a wrapper around AppButton that adds navigation functionality.
 * It combines the AppButton with a Link component from Remix for navigation.
 */
export function LinkButton({ to, reloadDocument, ...buttonProps }: LinkButtonProps) {
  return (
    <Link to={to} reloadDocument={reloadDocument} style={{ display: 'inline-block' }}>
      <AppButton {...buttonProps} />
    </Link>
  );
}