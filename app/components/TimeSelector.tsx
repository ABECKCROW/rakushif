import { HStack, Select } from '@chakra-ui/react';

interface TimeSelectorProps {
  hour: string;
  minute: string;
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  size?: string;
  width?: string;
  minW?: string;
  hourLabel?: string;
  minuteLabel?: string;
}

export const TimeSelector = ({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  size = "md",
  width = "auto",
  minW,
  hourLabel = "時",
  minuteLabel = "分",
}: TimeSelectorProps) => {
  return (
    <HStack spacing={2}>
      <Select
        value={hour}
        onChange={(e) => onHourChange(e.target.value)}
        whiteSpace="nowrap"
        size={size}
        h={size === "lg" ? "50px" : undefined}
        fontSize={size === "lg" ? "lg" : undefined}
        width={width}
        minW={minW || "100px"}
      >
        {Array.from({ length: 24 }, (_, i) => {
          const hourValue = i.toString().padStart(2, '0');
          return (
            <option key={hourValue} value={hourValue}>
              {hourValue}{hourLabel}
            </option>
          );
        })}
      </Select>
      <Select
        value={minute}
        onChange={(e) => onMinuteChange(e.target.value)}
        whiteSpace="nowrap"
        size={size}
        h={size === "lg" ? "50px" : undefined}
        fontSize={size === "lg" ? "lg" : undefined}
        width={width}
        minW={minW || "100px"}
      >
        {Array.from({ length: 60 }, (_, i) => {
          const minuteValue = i.toString().padStart(2, '0');
          return (
            <option key={minuteValue} value={minuteValue}>
              {minuteValue}{minuteLabel}
            </option>
          );
        })}
      </Select>
    </HStack>
  );
};