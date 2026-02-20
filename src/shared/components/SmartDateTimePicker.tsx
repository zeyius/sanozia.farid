import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';

interface SmartDateTimePickerProps {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  disabled?: boolean;
  dateError?: string;
  timeError?: string;
  required?: boolean;
  isModal?: boolean; // Reduces safety margin for constrained modal spaces
}

/**
 * Smart responsive Date/Time picker that dynamically measures content width
 * including icons and adapts layout (row vs column) based on available space.
 */
export function SmartDateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  dateLabel = 'Date',
  timeLabel = 'Heure',
  disabled = false,
  dateError,
  timeError,
  required = false,
  isModal = false
}: SmartDateTimePickerProps) {
  const [layout, setLayout] = useState<'row' | 'column'>('row');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dateFieldRef = useRef<HTMLDivElement>(null);
  const timeFieldRef = useRef<HTMLDivElement>(null);

  /**
   * Measure text width using Canvas API for accurate calculation
   */
  const measureText = useCallback((text: string, element?: HTMLElement): number => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) return 0;

    // Use actual element styles for accurate measurement
    if (element) {
      const style = window.getComputedStyle(element);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    } else {
      // Fallback to default
      context.font = '14px sans-serif';
    }

    return context.measureText(text || '').width;
  }, []);

  /**
   * Detect and measure icon space in a field element
   * Handles SVG, CSS icons, and fallback estimation
   */
  const detectIconSize = useCallback((fieldElement: HTMLElement | null): number => {
    if (!fieldElement) return 32; // Default fallback

    // 1. Look for SVG icon (like Lucide Clock icon)
    const svg = fieldElement.querySelector('svg');
    if (svg) {
      const svgRect = svg.getBoundingClientRect();
      return svgRect.width + 8; // +8px for spacing
    }

    // 2. Look for elements with icon classes
    const iconEl = fieldElement.querySelector('[class*="icon"], .fa, .material-icons');
    if (iconEl instanceof HTMLElement) {
      return iconEl.offsetWidth + 8;
    }

    // 3. Check padding-right (often used to make room for icons)
    const input = fieldElement.querySelector('input');
    if (input) {
      const style = window.getComputedStyle(input);
      const paddingRight = parseFloat(style.paddingRight);
      // If padding-right > 30px, likely icon space
      if (paddingRight > 30) {
        return paddingRight;
      }
    }

    // 4. Fallback: estimate based on field height (icons usually square)
    const fieldHeight = fieldElement.offsetHeight;
    return Math.min(fieldHeight * 0.5, 24) + 8; // Max 24px + 8px spacing
  }, []);

  /**
   * Get field spacing (padding + borders)
   */
  const getFieldSpacing = useCallback((input: HTMLInputElement | null): number => {
    if (!input) return 24; // Default padding

    const style = window.getComputedStyle(input);
    return (
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.borderRightWidth)
    );
  }, []);

  /**
   * Calculate total width needed for a field including content, icons, and spacing
   */
  const calculateFieldWidth = useCallback((
    fieldRef: React.RefObject<HTMLDivElement | null>,
    sampleText: string
  ): number => {
    const fieldElement = fieldRef.current;
    if (!fieldElement) return 200; // Fallback

    const input = fieldElement.querySelector('input');
    if (!input) return 200;

    // Measure text content
    const textWidth = measureText(sampleText, input);

    // Measure icon space
    const iconSpace = detectIconSize(fieldElement);

    // Get padding and borders
    const spacing = getFieldSpacing(input);

    // Add extra margin for comfortable display (16px internal margin)
    const totalWidth = textWidth + iconSpace + spacing + 16;

    return totalWidth;
  }, [measureText, detectIconSize, getFieldSpacing]);

  /**
   * Check layout and adapt based on available space
   */
  const checkLayout = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Sample text for measurement (use realistic examples)
    const dateSample = dateValue || '31/12/2025'; // Longest format
    const timeSample = timeValue || '23:59';

    // Calculate required width for each field
    const dateWidth = calculateFieldWidth(dateFieldRef, dateSample);
    const timeWidth = calculateFieldWidth(timeFieldRef, timeSample);

    // Get container gap from styles
    const containerStyle = window.getComputedStyle(container);
    const gap = parseFloat(containerStyle.gap) || 16;

    // Total space needed
    const totalNeeded = dateWidth + timeWidth + gap;
    
    // Available space
    const available = container.offsetWidth;

    // Safety margin: reduced for modals (10px) vs normal pages (20px)
    const safetyMargin = isModal ? 10 : 20;
    const shouldUseRow = available >= totalNeeded + safetyMargin;

    setLayout(shouldUseRow ? 'row' : 'column');
  }, [dateValue, timeValue, calculateFieldWidth, isModal]);

  /**
   * Setup layout detection with ResizeObserver
   */
  useEffect(() => {
    // Initial check with delay to let icons render
    const initialTimer = setTimeout(checkLayout, 100);

    // Setup ResizeObserver for dynamic resizing
    const resizeObserver = new ResizeObserver(() => {
      checkLayout();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      clearTimeout(initialTimer);
    };
  }, [checkLayout]);

  /**
   * Re-check when values change (content width might change)
   */
  useEffect(() => {
    const timer = setTimeout(checkLayout, 50);
    return () => clearTimeout(timer);
  }, [dateValue, timeValue, checkLayout]);

  return (
    <div
      ref={containerRef}
      className={`smart-datetime-picker ${layout === 'row' ? 'flex gap-4' : 'flex flex-col gap-4'}`}
      style={{ width: '100%' }}
    >
      <div ref={dateFieldRef} className={layout === 'row' ? 'flex-1' : 'w-full'}>
        <DatePicker
          value={dateValue}
          onChange={onDateChange}
          label={dateLabel}
          disabled={disabled}
          error={dateError}
        />
      </div>

      <div ref={timeFieldRef} className={layout === 'row' ? 'flex-1' : 'w-full'}>
        <TimePicker
          value={timeValue}
          onChange={onTimeChange}
          label={timeLabel}
          disabled={disabled}
          error={timeError}
          required={required}
        />
      </div>
    </div>
  );
}

