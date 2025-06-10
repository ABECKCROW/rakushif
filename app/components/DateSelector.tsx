import { HStack, Select } from '@chakra-ui/react';

type DateSelectorProps = {
  year: string;
  month: string;
  day: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  onDayChange: (day: string) => void;
  size?: string;
  width?: string;
  minW?: string;
  yearLabel?: string;
  monthLabel?: string;
  dayLabel?: string;
}

export const DateSelector = ({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
  size = "md",
  width = "auto",
  minW,
  yearLabel = "年",
  monthLabel = "月",
  dayLabel = "日",
}: DateSelectorProps) => {
  return (
    <HStack spacing={2}>
      <Select
        value={year}
        onChange={(e) => onYearChange(e.target.value)}
        whiteSpace="nowrap"
        size={size}
        h={size === "lg" ? "50px" : undefined}
        fontSize={size === "lg" ? "lg" : undefined}
        width={width}
        minW={minW || "120px"}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const yearValue = new Date().getFullYear() - 2 + i;
          return (
            <option key={yearValue} value={yearValue.toString()}>
              {yearValue}{yearLabel}
            </option>
          );
        })}
      </Select>
      <Select
        value={month}
        onChange={(e) => onMonthChange(e.target.value)}
        whiteSpace="nowrap"
        size={size}
        h={size === "lg" ? "50px" : undefined}
        fontSize={size === "lg" ? "lg" : undefined}
        width={width}
        minW={minW || "100px"}
      >
        {Array.from({ length: 12 }, (_, i) => {
          const monthValue = (i + 1).toString().padStart(2, '0');
          return (
            <option key={monthValue} value={monthValue}>
              {i + 1}{monthLabel}
            </option>
          );
        })}
      </Select>
      <Select
        value={day}
        onChange={(e) => onDayChange(e.target.value)}
        whiteSpace="nowrap"
        size={size}
        h={size === "lg" ? "50px" : undefined}
        fontSize={size === "lg" ? "lg" : undefined}
        width={width}
        minW={minW || "100px"}
      >
        {Array.from({ length: 31 }, (_, i) => {
          const dayValue = (i + 1).toString().padStart(2, '0');
          return (
            <option key={dayValue} value={dayValue}>
              {i + 1}{dayLabel}
            </option>
          );
        })}
      </Select>
    </HStack>
  );
};