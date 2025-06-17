import { Button } from '@chakra-ui/react';
import { Link, useNavigation } from '@remix-run/react';
import React from 'react';

interface HomeButtonProps {
  size?: string;
  colorScheme?: string;
  children?: React.ReactNode;
  isDisabled?: boolean;
}

export function HomeButton({ 
  size = "sm", 
  colorScheme = "blue", 
  children = "ホームに戻る",
  isDisabled = false
}: HomeButtonProps) {
  // Use the navigation hook to track page transitions
  const navigation = useNavigation();
  const isNavigating = navigation.state === "submitting" || navigation.state === "loading";

  // Combine the external isDisabled prop with the navigation state
  const isButtonDisabled = isDisabled || isNavigating;

  return (
    <Link 
      to={isButtonDisabled ? undefined : "/"} 
      onClick={isButtonDisabled ? (e) => e.preventDefault() : undefined}
      style={{
        pointerEvents: isButtonDisabled ? "none" : "auto",
        opacity: isButtonDisabled ? 0.4 : 1
      }}
    >
      <Button
        size={size}
        colorScheme={colorScheme}
        _active={{
          transform: 'scale(0.95)',
          transition: 'transform 0.1s'
        }}
        disabled={isButtonDisabled}
        cursor={isButtonDisabled ? "not-allowed" : "pointer"}
      >
        {children}
      </Button>
    </Link>
  );
}
