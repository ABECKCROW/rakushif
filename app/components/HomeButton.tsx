import { Button } from '@chakra-ui/react';
import { Link } from '@remix-run/react';
import React from 'react';

interface HomeButtonProps {
  size?: string;
  colorScheme?: string;
  children?: React.ReactNode;
}

export function HomeButton({ 
  size = "sm", 
  colorScheme = "blue", 
  children = "ホームに戻る" 
}: HomeButtonProps) {
  return (
    <Link to="/">
      <Button
        size={size}
        colorScheme={colorScheme}
        _active={{
          transform: 'scale(0.95)',
          transition: 'transform 0.1s'
        }}
      >
        {children}
      </Button>
    </Link>
  );
}