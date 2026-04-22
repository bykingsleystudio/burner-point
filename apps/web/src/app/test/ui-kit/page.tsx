'use client';

import React from 'react';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { SplineScene } from '@/components/ui/splite';
import { LiquidButton, MetalButton } from '@/components/ui/liquid-glass-button';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: 'https://randomuser.me/api/portraits/women/57.jpg',
    name: 'Sarah Chen',
    handle: '@sarahdigital',
    text: 'Amazing platform! The user experience is seamless and the features are exactly what I needed.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/men/64.jpg',
    name: 'Marcus Johnson',
    handle: '@marcustech',
    text: 'This service has transformed how I work. Clean design, powerful features, and excellent support.',
  },
  {
    avatarSrc: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'David Martinez',
    handle: '@davidcreates',
    text: "I've tried many platforms, but this one stands out. Intuitive, reliable, and genuinely helpful for productivity.",
  },
];

export default function UiKitPage() {
  return (
    <div className="space-y-10 bg-background p-6 text-foreground">
      <div className="relative h-[220px] w-full">
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <LiquidButton>Liquid Glass</LiquidButton>
        </div>
        <div className="absolute left-1/2 top-[70%] -translate-x-1/2">
          <MetalButton variant="primary">Metal CTA</MetalButton>
        </div>
      </div>

      <Card className="relative h-[500px] overflow-hidden bg-black/[0.96]">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
        <div className="flex h-full">
          <div className="relative z-10 flex flex-1 flex-col justify-center p-8">
            <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Interactive 3D
            </h1>
            <p className="mt-4 max-w-lg text-neutral-300">
              Bring your UI to life with beautiful 3D scenes. Create immersive experiences that capture attention and enhance your design.
            </p>
          </div>
          <div className="relative flex-1">
            <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="h-full w-full" />
          </div>
        </div>
      </Card>

      <div className="h-[90dvh] overflow-hidden rounded-2xl border border-white/10">
        <SignInPage
          heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
          testimonials={sampleTestimonials}
          onSignIn={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const data = Object.fromEntries(formData.entries());
            // Demo behavior only.
            console.log('Sign In submitted:', data);
          }}
          onGoogleSignIn={() => console.log('Continue with Google clicked')}
          onResetPassword={() => console.log('Reset Password clicked')}
          onCreateAccount={() => console.log('Create Account clicked')}
        />
      </div>
    </div>
  );
}
