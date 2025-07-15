import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Phone,
  AlternateEmail,
  Email,
} from '@mui/icons-material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { de } from 'date-fns/locale';

export type InputType = 'text' | 'date' | 'telegram' | 'phone' | 'dropdown' | 'number' | 'email';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface UniversalInputFieldProps {
  type: InputType;
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: boolean;
  helperText?: string;
  name?: string;
  fullWidth?: boolean;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  // Dropdown specific props
  options?: DropdownOption[];
  // Number specific props
  min?: number;
  max?: number;
  step?: number;
}

const UniversalInputField: React.FC<UniversalInputFieldProps> = ({
  type,
  label,
  value,
  onChange,
  error = false,
  helperText,
  name,
  fullWidth = true,
  required = false,
  placeholder,
  disabled = false,
  options = [],
  min,
  max,
  step = 1,
}) => {
  // Format phone number with + prefix
  const formatPhoneValue = (val: string | number): string => {
    const stringVal = String(val);
    if (!stringVal) return '';
    if (stringVal.startsWith('+')) return stringVal;
    return stringVal.startsWith('0') ? `+49${stringVal.slice(1)}` : `+${stringVal}`;
  };

  // Handle value changes based on input type
  const handleChange = (newValue: string | number) => {
    switch (type) {
      case 'phone':
        // Remove formatting for storage, keep only numbers and +
        const phoneValue = String(newValue).replace(/[^\d+]/g, '');
        onChange(phoneValue);
        break;
      case 'telegram':
        // Remove @ for storage
        const telegramValue = String(newValue).replace(/^@/, '');
        onChange(telegramValue);
        break;
      case 'number':
        // Convert to number if valid
        const numValue = Number(newValue);
        onChange(isNaN(numValue) ? 0 : numValue);
        break;
      default:
        onChange(newValue);
    }
  };

  // Get display value with proper formatting
  const getDisplayValue = (): string => {
    switch (type) {
      case 'phone':
        return formatPhoneValue(value);
      default:
        return String(value);
    }
  };

  // Parse date value for DatePicker
  const parseDate = (dateValue: string | number): Date | null => {
    if (!dateValue) return null;
    const dateStr = String(dateValue);
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

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

  // Render date input
  if (type === 'date') {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <DatePicker
          label={label}
          value={parseDate(value)}
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
              disabled,
            },
          }}
        />
      </LocalizationProvider>
    );
  }

  // Render dropdown
  if (type === 'dropdown') {
    return (
      <FormControl fullWidth={fullWidth} error={error} required={required} disabled={disabled}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          label={label}
          name={name}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <div style={{ fontSize: '0.75rem', color: error ? '#d32f2f' : '#666', marginTop: '3px', marginLeft: '14px' }}>
            {helperText}
          </div>
        )}
      </FormControl>
    );
  }

  // Get input props based on type
  const getInputProps = () => {
    const baseProps = {
      startAdornment: undefined as React.ReactNode,
      inputMode: undefined as any,
    };

    switch (type) {
      case 'phone':
        baseProps.startAdornment = (
          <InputAdornment position="start">
            <Phone />
          </InputAdornment>
        );
        baseProps.inputMode = 'tel';
        break;
      case 'telegram':
        baseProps.startAdornment = (
          <InputAdornment position="start">
            <AlternateEmail />
          </InputAdornment>
        );
        break;
      case 'email':
        baseProps.startAdornment = (
          <InputAdornment position="start">
            <Email />
          </InputAdornment>
        );
        baseProps.inputMode = 'email';
        break;
      case 'number':
        baseProps.inputMode = 'numeric';
        break;
    }

    return baseProps;
  };

  const inputProps = getInputProps();

  // Render standard text field for text, phone, telegram, email, and number types
  return (
    <TextField
      type={type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
      label={label}
      value={getDisplayValue()}
      onChange={(e) => handleChange(e.target.value)}
      error={error}
      helperText={helperText}
      name={name}
      fullWidth={fullWidth}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
      variant="outlined"
      InputProps={inputProps}
      inputProps={{
        min: type === 'number' ? min : undefined,
        max: type === 'number' ? max : undefined,
        step: type === 'number' ? step : undefined,
      }}
    />
  );
};

export default UniversalInputField;