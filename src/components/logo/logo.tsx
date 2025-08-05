import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  // You can use different images for single/full if you want
  const logoSrc = '/images/White_Logo[1].png';

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 50,
          height: 50,
          ...(!isSingle && { width: 102, height: 36 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <img
        src={logoSrc}
        alt="Logo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain', // changed from 'fill' to 'contain'
          display: 'block',
        }}
      />
      <span
        style={{
          marginLeft: 12,
          fontWeight: 600,
          fontSize: 18,
          color: '#18377e', // You can use theme color if you want
          alignSelf: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        Education Expo 2025
      </span>
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
