import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
  error?: boolean;
}

export function DateInput({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled = false,
  className,
  'data-testid': testId,
  error = false
}: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Update input value when value prop changes
  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  // Auto-format as user types dd/mm/yyyy
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Remove all non-digit characters
    newValue = newValue.replace(/\D/g, '');
    
    // Add slashes at appropriate positions
    if (newValue.length >= 3) {
      newValue = newValue.slice(0, 2) + '/' + newValue.slice(2);
    }
    if (newValue.length >= 6) {
      newValue = newValue.slice(0, 5) + '/' + newValue.slice(5, 9);
    }
    
    setInputValue(newValue);
    
    // Parse and validate complete date
    if (newValue.length === 10) {
      const parts = newValue.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        // Validate date
        if (!isNaN(date.getTime()) && 
            date.getDate() === parseInt(day) &&
            date.getMonth() === parseInt(month) - 1 &&
            date.getFullYear() === parseInt(year)) {
          onChange(date);
        }
      }
    } else if (newValue === '') {
      onChange(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    setShowCalendar(false);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        className={cn(className, error && "border-destructive", "pr-10")}
        data-testid={testId}
      />
      
      <Popover open={showCalendar} onOpenChange={setShowCalendar}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}