'use client';

import * as React from 'react';
import Link from 'next/link';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive/90',
        cool:
          'dark:inset-shadow-2xs dark:inset-shadow-white/10 bg-linear-to-t border border-b-2 border-zinc-950/40 from-primary to-primary/85 shadow-md shadow-primary/20 ring-1 ring-inset ring-white/25 transition-[filter] duration-200 hover:brightness-110 active:brightness-90 dark:border-x-0 text-primary-foreground dark:text-primary-foreground dark:border-t-0 dark:border-primary/50 dark:ring-white/5',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

const liquidbuttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-brand-green focus-visible:ring-brand-green/30 focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default: 'bg-transparent text-white hover:scale-[1.02]',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 text-xs gap-1.5 px-4 has-[>svg]:px-4',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        xl: 'h-12 rounded-full px-8 has-[>svg]:px-6',
        xxl: 'h-14 rounded-full px-10 has-[>svg]:px-8',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'xxl',
    },
  },
);

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <>
      <Comp
        data-slot="button"
        className={cn('relative active:scale-[0.98]', liquidbuttonVariants({ variant, size, className }))}
        {...props}
      >
        <div
          className="absolute left-0 top-0 z-0 h-full w-full rounded-full border border-white/15 bg-[linear-gradient(135deg,rgba(229,231,235,0.32),rgba(0,255,157,0.16)_45%,rgba(1,50,32,0.82))] shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.26),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.65),inset_0_0_16px_4px_rgba(0,255,157,0.12),0_0_18px_rgba(255,255,255,0.06)] transition-all"
        />
        <div
          className="absolute left-0 top-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
          style={{ backdropFilter: 'url("#container-glass")' }}
        />
        <div className="pointer-events-none z-10">{children}</div>
        <GlassFilter />
      </Comp>
    </>
  );
}

function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

type ColorVariant = 'default' | 'primary' | 'success' | 'error' | 'gold' | 'bronze';

interface MetalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant;
  asChild?: boolean;
}

const colorVariants: Record<
  ColorVariant,
  {
    outer: string;
    inner: string;
    button: string;
    textColor: string;
    textShadow: string;
  }
> = {
  default: {
    outer: 'bg-gradient-to-b from-[#000] to-[#A0A0A0]',
    inner: 'bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]',
    button: 'bg-gradient-to-b from-[#B9B9B9] to-[#969696]',
    textColor: 'text-white',
    textShadow: '[text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]',
  },
  primary: {
    outer: 'bg-gradient-to-b from-[#00170E] to-[#A0A0A0]',
    inner: 'bg-gradient-to-b from-[#E9FFF6] via-[#013220] to-[#C9FFE8]',
    button: 'bg-gradient-to-b from-[#00FF9D] to-[#01754C]',
    textColor: 'text-black',
    textShadow: '[text-shadow:_0_1px_0_rgb(255_255_255_/_35%)]',
  },
  success: {
    outer: 'bg-gradient-to-b from-[#005A43] to-[#7CCB9B]',
    inner: 'bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]',
    button: 'bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]',
    textColor: 'text-[#FFF7F0]',
    textShadow: '[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]',
  },
  error: {
    outer: 'bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]',
    inner: 'bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]',
    button: 'bg-gradient-to-b from-[#F08D8F] to-[#A45253]',
    textColor: 'text-[#FFF7F0]',
    textShadow: '[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]',
  },
  gold: {
    outer: 'bg-gradient-to-b from-[#917100] to-[#EAD98F]',
    inner: 'bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]',
    button: 'bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]',
    textColor: 'text-[#FFFDE5]',
    textShadow: '[text-shadow:_0_-1px_0_rgb(178_140_2_/_100%)]',
  },
  bronze: {
    outer: 'bg-gradient-to-b from-[#864813] to-[#E9B486]',
    inner: 'bg-gradient-to-b from-[#EDC5A1] via-[#5F2D01] to-[#FFDEC1]',
    button: 'bg-gradient-to-b from-[#FFE3C9] to-[#A36F3D]',
    textColor: 'text-[#FFF7F0]',
    textShadow: '[text-shadow:_0_-1px_0_rgb(124_45_18_/_100%)]',
  },
};

const metalButtonVariants = (
  variant: ColorVariant = 'default',
  isPressed: boolean,
  isHovered: boolean,
  isTouchDevice: boolean,
) => {
  const colors = colorVariants[variant];
  const transitionStyle = 'all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)';

  return {
    wrapper: cn('relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform', colors.outer),
    wrapperStyle: {
      transform: isPressed ? 'translateY(2.5px) scale(0.99)' : 'translateY(0) scale(1)',
      boxShadow: isPressed
        ? '0 1px 2px rgba(0, 0, 0, 0.15)'
        : isHovered && !isTouchDevice
          ? '0 4px 12px rgba(0, 0, 0, 0.12)'
          : '0 3px 8px rgba(0, 0, 0, 0.08)',
      transition: transitionStyle,
      transformOrigin: 'center center' as const,
    },
    inner: cn('absolute inset-[1px] transform-gpu rounded-lg will-change-transform', colors.inner),
    innerStyle: {
      transition: transitionStyle,
      transformOrigin: 'center center' as const,
      filter: isHovered && !isPressed && !isTouchDevice ? 'brightness(1.05)' : 'none',
    },
    button: cn(
      'relative z-10 m-[1px] inline-flex h-11 transform-gpu cursor-pointer items-center justify-center overflow-hidden rounded-md px-6 py-2 text-sm font-semibold leading-none will-change-transform outline-none',
      colors.button,
      colors.textColor,
      colors.textShadow,
    ),
    buttonStyle: {
      transform: isPressed ? 'scale(0.97)' : 'scale(1)',
      transition: transitionStyle,
      transformOrigin: 'center center' as const,
      filter: isHovered && !isPressed && !isTouchDevice ? 'brightness(1.02)' : 'none',
    },
  };
};

const ShineEffect = ({ isPressed }: { isPressed: boolean }) => {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300',
        isPressed ? 'opacity-20' : 'opacity-0',
      )}
    >
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
    </div>
  );
};

const MetalButton = React.forwardRef<HTMLButtonElement, MetalButtonProps>(({ children, className, variant = 'default', asChild = false, ...props }, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const Comp = asChild ? Slot : 'button';

  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const buttonText = children || 'Button';
  const variants = metalButtonVariants(variant, isPressed, isHovered, isTouchDevice);

  return (
    <div className={variants.wrapper} style={variants.wrapperStyle}>
      <div className={variants.inner} style={variants.innerStyle} />
      <Comp
        ref={ref}
        className={cn(variants.button, className)}
        style={variants.buttonStyle}
        {...props}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => {
          setIsPressed(false);
          setIsHovered(false);
        }}
        onMouseEnter={() => {
          if (!isTouchDevice) setIsHovered(true);
        }}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
      >
        <ShineEffect isPressed={isPressed} />
        {buttonText}
        {isHovered && !isPressed && !isTouchDevice ? (
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/5" />
        ) : null}
      </Comp>
    </div>
  );
});

MetalButton.displayName = 'MetalButton';

function LinkButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function LiquidLink({
  href,
  className,
  children,
  variant,
  size,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  variant?: VariantProps<typeof liquidbuttonVariants>['variant'];
  size?: VariantProps<typeof liquidbuttonVariants>['size'];
}) {
  return (
    <Link href={href} className={cn('relative inline-flex active:scale-[0.98]', liquidbuttonVariants({ variant, size, className }))}>
      <div
        className="absolute left-0 top-0 z-0 h-full w-full rounded-full border border-white/15 bg-[linear-gradient(135deg,rgba(229,231,235,0.32),rgba(0,255,157,0.16)_45%,rgba(1,50,32,0.82))] shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.26),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.65),inset_0_0_16px_4px_rgba(0,255,157,0.12),0_0_18px_rgba(255,255,255,0.06)] transition-all"
      />
      <div
        className="absolute left-0 top-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
        style={{ backdropFilter: 'url("#container-glass")' }}
      />
      <div className="pointer-events-none z-10">{children}</div>
      <GlassFilter />
    </Link>
  );
}

function MetalLink({
  href,
  children,
  className,
  variant = 'default',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: ColorVariant;
}) {
  const colors = colorVariants[variant];

  return (
    <div className={cn('relative inline-flex transform-gpu rounded-md p-[1.25px] will-change-transform shadow-[0_3px_8px_rgba(0,0,0,0.08)]', colors.outer)}>
      <div className={cn('absolute inset-[1px] rounded-lg', colors.inner)} />
      <Link
        href={href}
        className={cn(
          'relative z-10 m-[1px] inline-flex h-11 items-center justify-center overflow-hidden rounded-md px-6 py-2 text-sm font-semibold leading-none outline-none transition duration-200 hover:brightness-105 active:scale-[0.98]',
          colors.button,
          colors.textColor,
          colors.textShadow,
          className,
        )}
      >
        {children}
      </Link>
    </div>
  );
}

export { Button, buttonVariants, liquidbuttonVariants, LiquidButton, LiquidLink, MetalButton, MetalLink, LinkButton };
