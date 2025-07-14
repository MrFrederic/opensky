import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  name?: string;
  fullWidth?: boolean;
  required?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  name,
  fullWidth = true,
  required = false,
}) => {
  // Convert string value to Date object
  const dateValue = value ? new Date(value) : null;

  // Handle date change and convert back to ISO string
  const handleDateChange = (newValue: Date | null) => {
    if (newValue) {
      // Convert to ISO string (YYYY-MM-DD format) for backend compatibility
      const isoString = newValue.toISOString().split('T')[0];
      onChange(isoString);
    } else {
      onChange('');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <DatePicker
        label={label}
        value={dateValue}
        onChange={handleDateChange}
        format="dd.MM.yyyy"
        slotProps={{
          textField: {
            fullWidth,
            error,
            helperText,
            name,
            required,
            variant: 'outlined',
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default DateInput;
