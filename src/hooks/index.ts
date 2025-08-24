import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useDraftStore } from '../stores/draftStore';

// ============================================================================
// SHARED HOOK LIBRARY FOR WIDGET OPTIMIZATION
// Professional patterns for consistent, performant React components
// ============================================================================

// Performance monitoring hook for development
export function usePerformanceMonitor(label: string) {
  const startTimeRef = useRef<number>();
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCountRef.current += 1;
      startTimeRef.current = performance.now();
      
      return () => {
        const duration = performance.now() - (startTimeRef.current || 0);
        if (duration > 16) { // Slower than 60fps
          console.warn(`[Perf] ${label} render took ${duration.toFixed(2)}ms (render #${renderCountRef.current})`);
        }
      };
    }
  });
  
  return renderCountRef.current;
}

// Optimized data selector hook with custom equality
export function useOptimizedSelector<T>(
  selector: (state: any) => T,
  equalityFn?: (a: T, b: T) => boolean
) {
  return useDraftStore(selector, equalityFn);
}

// Widget state management hook for common patterns
export function useWidgetState(widgetId: string) {
  const { players, picks, settings, roster } = useDraftStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance tracking
  const renderCount = usePerformanceMonitor(`Widget[${widgetId}]`);
  
  const clearError = useCallback(() => setError(null), []);
  
  const withErrorHandling = useCallback(<T>(fn: () => T, errorMessage: string): T | null => {
    try {
      setError(null);
      return fn();
    } catch (err) {
      console.error(`[${widgetId}] ${errorMessage}:`, err);
      setError(errorMessage);
      return null;
    }
  }, [widgetId]);
  
  return {
    // Data
    players,
    picks,
    settings,
    roster,
    
    // State
    loading,
    setLoading,
    error,
    clearError,
    
    // Utils
    withErrorHandling,
    renderCount
  };
}

// Debounced value hook for search and filters
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Keyboard navigation hook for consistent behavior
export interface UseKeyboardNavigationOptions {
  items: any[];
  onSelect: (item: any, index: number) => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  items,
  onSelect,
  onEscape,
  enabled = true
}: UseKeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || items.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          onSelect(items[selectedIndex], selectedIndex);
        }
        break;
        
      case 'Escape':
        setSelectedIndex(-1);
        onEscape?.();
        break;
    }
  }, [enabled, items, selectedIndex, onSelect, onEscape]);
  
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
  
  // Reset when items change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [items]);
  
  return {
    selectedIndex,
    setSelectedIndex,
    isSelected: (index: number) => selectedIndex === index
  };
}

// Memoized calculation hook for expensive operations
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList,
  label?: string
): T {
  return useMemo(() => {
    if (process.env.NODE_ENV === 'development' && label) {
      const start = performance.now();
      const result = calculation();
      const duration = performance.now() - start;
      if (duration > 50) {
        console.warn(`[Calc] ${label} took ${duration.toFixed(2)}ms`);
      }
      return result;
    }
    return calculation();
  }, dependencies);
}

// Resize observer hook for responsive components
export function useResizeObserver<T extends Element>() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const elementRef = useRef<T>(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !window.ResizeObserver) return;
    
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, []);
  
  return { elementRef, size };
}

// Previous value hook for detecting changes
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Selection state hook for consistent selection management
export function useSelection<T>(initialSelection?: T) {
  const [selectedItem, setSelectedItem] = useState<T | null>(initialSelection || null);
  const [hoveredItem, setHoveredItem] = useState<T | null>(null);
  
  const isSelected = useCallback((item: T) => selectedItem === item, [selectedItem]);
  const isHovered = useCallback((item: T) => hoveredItem === item, [hoveredItem]);
  
  const select = useCallback((item: T | null) => {
    setSelectedItem(item);
    // Clear hover when selecting
    if (item !== null) {
      setHoveredItem(null);
    }
  }, []);
  
  const hover = useCallback((item: T | null) => {
    setHoveredItem(item);
  }, []);
  
  const clear = useCallback(() => {
    setSelectedItem(null);
    setHoveredItem(null);
  }, []);
  
  return {
    selectedItem,
    hoveredItem,
    isSelected,
    isHovered,
    select,
    hover,
    clear
  };
}

// Draft-specific hooks for common operations
export function useDraftCalculations() {
  const { picks, settings, players } = useDraftStore();
  
  const budgetData = useMemoizedCalculation(
    () => {
      // Import budget calculation functions when needed
      return {
        remaining: 0, // Placeholder - implement real calculations
        maxBid: 0,
        avgPerSpot: 0
      };
    },
    [picks, settings],
    'Budget calculations'
  );
  
  const playerStats = useMemoizedCalculation(
    () => {
      return {
        totalPlayers: players.length,
        draftedCount: players.filter((p: any) => p.drafted).length,
        availableCount: players.filter((p: any) => !p.drafted).length
      };
    },
    [players],
    'Player statistics'
  );
  
  return {
    budgetData,
    playerStats
  };
}

// Export all hooks for easy importing
export * from './useCanvas';
