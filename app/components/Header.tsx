import { Box, Heading } from '@chakra-ui/react';
import React from 'react';

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <Box
      bg="blue.500"
      color="white"
      p={4}
      borderRadius="md"
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <Heading as="h1" size="xl">{title}</Heading>
      {children}
    </Box>
  );
}