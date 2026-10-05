import React from 'react';
import { Hero } from '../components/home/Hero';
import { FestIdentity } from '../components/home/FestIdentity';
import { FeaturedEvents } from '../components/home/FeaturedEvents';
import { SponsorsSection } from '../components/home/SponsorsSection';
import { GallerySection } from '../components/home/GallerySection';

export default function HomePage() {
  return (
    <div className="space-y-0">
      <Hero />
      <FestIdentity />
      <FeaturedEvents />
      <GallerySection />
      <SponsorsSection />
    </div>
  );
}
