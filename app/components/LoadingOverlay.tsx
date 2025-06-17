import React from 'react';
import { Box, Spinner, Text, Center, useColorModeValue } from '@chakra-ui/react';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  text = 'Loading...', 
  children 
}) => {
  const bgColor = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(0, 0, 0, 0.8)');
  
  return (
    <Box position="relative">
      {children}
      
      {isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg={bgColor}
          zIndex="overlay"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="inherit"
        >
          <Center flexDirection="column">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
            {text && (
              <Text mt={4} fontWeight="medium">
                {text}
              </Text>
            )}
          </Center>
        </Box>
      )}
    </Box>
  );
};