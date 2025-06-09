import { Button, ButtonProps } from '@chakra-ui/react';
import React from 'react';

// Extend the ButtonProps interface from Chakra UI
export interface AppButtonProps extends ButtonProps {
  // Add any additional props specific to our application
}

/**
 * AppButton is a wrapper around Chakra UI's Button component with consistent styling and behavior.
 * It includes the "pressed" animation effect by default and accepts all props that the original Button component accepts.
 */
export function AppButton(props: AppButtonProps) {
  // Default active animation that gives a "pressed" feeling
  const defaultActiveProps = {
    transform: 'scale(0.95)',
    transition: 'transform 0.1s'
  };

  // Merge the default active props with any custom active props
  const activeProps = props._active 
    ? { ...defaultActiveProps, ...props._active } 
    : defaultActiveProps;

  return (
    <Button
      {...props}
      _active={activeProps}
    >
      {props.children}
    </Button>
  );
}