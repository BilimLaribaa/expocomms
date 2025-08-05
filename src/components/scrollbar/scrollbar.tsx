/* eslint-disable perfectionist/sort-imports */
import { useRef, useState, useEffect, forwardRef } from 'react';
import { mergeClasses } from 'minimal-shared/utils';
import SimpleBar from 'simplebar-react';
/* eslint-enable perfectionist/sort-imports */

import { styled } from '@mui/material/styles';

import { scrollbarClasses } from './classes';

import type { ScrollbarProps } from './types';

// ----------------------------------------------------------------------

// Create a wrapper component to handle SimpleBar safely
const SafeSimpleBar = forwardRef<any, any>((props, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const internalRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Override SimpleBar's internal methods to prevent null access
  useEffect(() => {
    if (isMounted && internalRef.current) {
      const instance = internalRef.current;

      // Patch the getScrollElement method to be safer
      const originalGetScrollElement = instance.getScrollElement;
      if (originalGetScrollElement) {
        instance.getScrollElement = function () {
          try {
            const element = originalGetScrollElement.call(this);
            return element && element.nodeType === Node.ELEMENT_NODE ? element : null;
          } catch (error) {
            console.warn('SimpleBar getScrollElement error:', error);
            return null;
          }
        };
      }
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div {...props} style={{ ...props.style, overflow: 'auto' }}>
        {props.children}
      </div>
    );
  }

  return (
    <SimpleBar
      {...props}
      ref={(node) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
    />
  );
});

SafeSimpleBar.displayName = 'SafeSimpleBar';

export function Scrollbar({
  sx,
  ref,
  children,
  className,
  slotProps,
  fillContent = true,
  ...other
}: ScrollbarProps) {
  const scrollbarRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure component is ready before initializing
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // useEffect(() => {
  //   if (!isReady) return;

  //   // Add additional safety checks for scrollbar initialization
  //   const timer = setTimeout(() => {
  //     const scrollbarInstance = scrollbarRef.current;
  //     if (scrollbarInstance && typeof scrollbarInstance.getScrollElement === 'function') {
  //       try {
  //         const scrollElement = scrollbarInstance.getScrollElement();
  //         if (scrollElement && scrollElement.nodeType === Node.ELEMENT_NODE) {
  //           // Safely access scrollTop with proper null checks
  //           if ('scrollTop' in scrollElement && typeof scrollElement.scrollTop === 'number') {
  //             const currentScrollTop = scrollElement.scrollTop || 0;
  //             // Element is properly initialized
  //           }
  //         }
  //       } catch (error) {
  //         console.warn('Scrollbar initialization warning:', error);
  //       }
  //     }
  //   }, 50);

  //   return () => clearTimeout(timer);
  // }, [isReady]);

  if (!isReady) {
    return (
      <div
        className={mergeClasses([scrollbarClasses.root, className])}
        style={{
          overflow: 'auto',
          minWidth: 0,
          minHeight: 0,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <ScrollbarRoot
      // ref={scrollbarRef}
      scrollableNodeProps={{ ref }}
      clickOnTrack={false}
      fillContent={fillContent}
      className={mergeClasses([scrollbarClasses.root, className])}
      sx={[
        {
          '& .simplebar-wrapper': slotProps?.wrapperSx as React.CSSProperties,
          '& .simplebar-content-wrapper': slotProps?.contentWrapperSx as React.CSSProperties,
          '& .simplebar-content': slotProps?.contentSx as React.CSSProperties,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {children}
    </ScrollbarRoot>
  );
}
// ----------------------------------------------------------------------

const ScrollbarRoot = styled(SafeSimpleBar, {
  shouldForwardProp: (prop: string) => !['fillContent', 'sx'].includes(prop),
})<Pick<ScrollbarProps, 'fillContent'>>(({ fillContent }) => ({
  minWidth: 0,
  minHeight: 0,
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  ...(fillContent && {
    '& .simplebar-content': {
      display: 'flex',
      flex: '1 1 auto',
      minHeight: '100%',
      flexDirection: 'column',
    },
  }),
}));
