'use client';

import React, { useState, useEffect } from 'react';
import { GALLERY_ITEMS, GalleryClubItem } from '../../data/festData';
import {
  Camera,
  X,
  Maximize2,
  Cpu,
  Palette,
  Film,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// Sub-component for individual club card media presentation
interface ClubCardMediaProps {
  item: GalleryClubItem;
  styling: {
    badgeBg: string;
    border: string;
    glow: string;
    pill: string;
  };
}

const ClubCardMedia: React.FC<ClubCardMediaProps> = ({ item, styling }) => {
  const hasPhotos = item.photos && item.photos.length > 0;
  const photoList = hasPhotos ? item.photos! : [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance slideshow on card if photos exist and user isn't hovering
  useEffect(() => {
    if (!hasPhotos || photoList.length <= 1) return;
    if (isHovered) return;

    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % photoList.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [hasPhotos, photoList.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % photoList.length);
  };

  return (
    <div
      className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#0b0718]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasPhotos ? (
        // Multi-image photo slideshow
        <div className="relative w-full h-full">
          {photoList.map((photo, i) => (
            <img
              key={photo.url}
              src={photo.url}
              alt={`${item.name} - ${photo.title}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                i === currentIdx
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
            />
          ))}

          {/* Micro Next / Prev controls on hover */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 transition-all pointer-events-auto shadow-md"
              aria-label="Previous Photo"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 transition-all pointer-events-auto shadow-md"
              aria-label="Next Photo"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Slide dots at bottom center */}
          <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
            {photoList.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIdx
                    ? 'w-4 bg-white shadow-sm'
                    : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      ) : (
        // Official Logo Banner
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}

      {/* Subtle bottom gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c081a] via-[#0c081a]/30 to-transparent pointer-events-none z-10" />

      {/* Cluster Tag */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        <span
          className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border backdrop-blur-md ${styling.badgeBg}`}
        >
          {item.cluster}
        </span>
      </div>

      {/* Official Logo Tag (only on default logo banner cards) */}
      {!hasPhotos && (
        <div className="absolute top-3 right-3 z-20">
          <span className="text-[10px] font-mono bg-emerald-950/85 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1 font-bold">
            <CheckCircle2 size={10} />
            Official Logo
          </span>
        </div>
      )}

      {/* Club Title & Discipline on Image */}
      <div className="absolute bottom-3 left-4 right-4 space-y-0.5 z-20">
        <h3 className="text-xl font-extrabold text-white font-display tracking-wide group-hover:text-purple-300 transition-colors">
          {item.name}
        </h3>
        <p className="text-[11px] font-mono text-purple-200 font-semibold truncate">
          {item.category}
        </p>
      </div>

      {/* Expand icon on hover */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-2 rounded-full text-purple-300 border border-purple-700/60 z-20">
        <Maximize2 size={13} />
      </div>
    </div>
  );
};

export const GallerySection = () => {
  const [activeItem, setActiveItem] = useState<GalleryClubItem | null>(null);
  const [modalSlideIdx, setModalSlideIdx] = useState<number>(0);
  const [selectedCluster, setSelectedCluster] = useState<string>('All');

  const clusters = [
    { id: 'All', name: `All Clubs (${GALLERY_ITEMS.length})`, icon: Sparkles },
    { id: 'Tech & Innovation', name: 'Tech & Innovation', icon: Cpu },
    { id: 'Arts & Culture', name: 'Arts & Culture', icon: Palette },
    { id: 'Media & Play', name: 'Media & Play', icon: Film },
  ];

  const filteredItems =
    selectedCluster === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.cluster === selectedCluster);

  // Lock body scroll and listen for ESC key when club modal is open
  useEffect(() => {
    if (activeItem) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveItem(null);
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeItem]);

  // When opening a club modal, reset slide index
  const handleOpenClub = (item: GalleryClubItem) => {
    setActiveItem(item);
    setModalSlideIdx(0);
  };

  // Close modal on Escape key press
  useEffect(() => {
    if (!activeItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem]);

  const getClusterColor = (cluster: string) => {
    switch (cluster) {
      case 'Tech & Innovation':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          border: 'hover:border-amber-500/60',
          glow: 'hover:shadow-amber-500/10',
          pill: 'bg-amber-500',
        };
      case 'Arts & Culture':
        return {
          badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
          border: 'hover:border-fuchsia-500/60',
          glow: 'hover:shadow-fuchsia-500/10',
          pill: 'bg-fuchsia-500',
        };
      case 'Media & Play':
        return {
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          border: 'hover:border-cyan-500/60',
          glow: 'hover:shadow-cyan-500/10',
          pill: 'bg-cyan-500',
        };
      default:
        return {
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          border: 'hover:border-purple-500/60',
          glow: 'hover:shadow-purple-500/10',
          pill: 'bg-purple-500',
        };
    }
  };

  const currentPhotos = activeItem?.photos || [];
  const currentPhoto = currentPhotos[modalSlideIdx];

  return (
    <section id="gallery" className="py-24 bg-[#070410] border-b border-purple-900/30 relative overflow-hidden w-full max-w-full">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 sm:w-96 lg:w-[700px] h-64 sm:h-96 lg:h-[350px] bg-purple-900/10 blur-[100px] sm:blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/80 text-purple-300 text-xs font-mono font-bold uppercase tracking-widest">
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span>PREVIOUS EVENT HOSTING CLUBS &amp; ARCHIVES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight">
              Life at Amrita — Our Clubs
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl font-sans leading-relaxed">
              Meet the {GALLERY_ITEMS.length} university clubs across <strong className="text-slate-200">Tech &amp; Innovation</strong>,{' '}
              <strong className="text-slate-200">Arts &amp; Culture</strong>, and{' '}
              <strong className="text-slate-200">Media &amp; Play</strong> that organized flagship events, hackathons, and concerts.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-slate-400 hidden sm:block shrink-0">
            <span className="block text-[10px] uppercase text-purple-400">Festival Hub</span>
            <span className="text-white font-bold">3 Clusters • {GALLERY_ITEMS.length} Leading Clubs</span>
          </div>
        </div>

        {/* Cluster Filter Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {clusters.map((tab) => {
            const Icon = tab.icon;
            const active = selectedCluster === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCluster(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-lg shadow-purple-900/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Clubs Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const styling = getClusterColor(item.cluster);
            return (
              <div
                key={item.id}
                onClick={() => handleOpenClub(item)}
                className={`group relative rounded-2xl overflow-hidden bg-[#0c081a] border border-purple-950/80 ${styling.border} transition-all duration-300 cursor-pointer shadow-xl ${styling.glow}`}
              >
                {/* Image Banner / Slideshow Component */}
                <ClubCardMedia item={item} styling={styling} />
              </div>
            );
          })}
        </div>

        {/* Modal Lightbox Preview with Full Interactive Slideshow */}
        {activeItem && (
          <div
            onClick={() => setActiveItem(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#030108]/95 backdrop-blur-2xl animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-[#0d091a] border-2 border-purple-500/40 rounded-3xl overflow-hidden shadow-[0_0_90px_rgba(0,0,0,0.95)] flex flex-col max-h-[90vh] overscroll-contain my-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/85 text-slate-300 hover:text-white border border-white/20 flex items-center justify-center transition-colors shadow-lg"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {/* Main Media Viewer Area */}
              <div className="relative bg-[#070410] border-b border-purple-950 flex flex-col shrink-0">
                <div className="h-64 sm:h-96 w-full relative flex items-center justify-center overflow-hidden bg-black">
                  {currentPhoto ? (
                    // Display Current Photo in Slideshow
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <img
                        key={currentPhoto.url}
                        src={currentPhoto.url}
                        alt={currentPhoto.title}
                        className="w-full h-full object-contain"
                      />

                      {/* Previous / Next Slideshow Chevrons */}
                      {currentPhotos.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setModalSlideIdx((prev) =>
                                prev === 0 ? currentPhotos.length - 1 : prev - 1
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/80 hover:bg-purple-600 text-white border border-white/20 transition-all shadow-2xl z-20"
                            aria-label="Previous Slide"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={() =>
                              setModalSlideIdx((prev) =>
                                (prev + 1) % currentPhotos.length
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/80 hover:bg-purple-600 text-white border border-white/20 transition-all shadow-2xl z-20"
                            aria-label="Next Slide"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}

                      {/* Photo Caption Overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 pointer-events-none z-10 flex flex-col justify-end">
                        <p className="text-xs font-mono font-bold text-white tracking-wide">
                          {currentPhoto.title}
                        </p>
                        {currentPhoto.caption && (
                          <p className="text-[11px] text-slate-300 line-clamp-2 font-sans">
                            {currentPhoto.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Display Official Logo Banner
                    <div className="relative w-full h-full flex items-center justify-center bg-[#070410]">
                      <img
                        src={activeItem.imageUrl}
                        alt={activeItem.name}
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d091a] via-transparent to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-purple-600 text-white shadow-md">
                      {activeItem.cluster}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 bg-black/90 px-2 py-0.5 rounded-md border border-white/15 shadow">
                      {activeItem.category}
                    </span>
                  </div>
                </div>

                {/* Thumbnail Strip for Slideshow */}
                {currentPhotos.length > 1 && (
                  <div className="flex items-center gap-2 p-3 bg-black/90 overflow-x-auto border-t border-purple-950/80 scrollbar-none">
                    {currentPhotos.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => setModalSlideIdx(idx)}
                        className={`relative h-14 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                          idx === modalSlideIdx
                            ? 'border-purple-500 scale-105 shadow-md shadow-purple-900/50 ring-2 ring-purple-400/30'
                            : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Description & Events Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans overscroll-contain bg-[#0d091a]">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                      {activeItem.name}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1 font-bold">
                      <CheckCircle2 size={10} />
                      Verified Club
                    </span>
                  </div>
                  <p className="text-xs font-mono text-purple-300 font-semibold">
                    {activeItem.category} • {activeItem.cluster}
                  </p>
                </div>

                {/* About Club */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-purple-400 tracking-wider">
                    About the Club
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {activeItem.description}
                  </p>
                </div>

                {/* Highlight Caption */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block">
                    Highlight:
                  </span>
                  <p className="text-xs text-slate-300 italic font-sans leading-relaxed">
                    "{activeItem.caption}"
                  </p>
                </div>

                {/* Events List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-purple-400 tracking-wider">
                    Key Events &amp; Competitions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeItem.eventsConducted.map((evt, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-mono text-slate-200"
                      >
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span className="font-semibold">{evt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verified Insignia Notice */}
                <div className="pt-2 text-[11px] font-mono text-emerald-400/90 border-t border-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>
                    Photos and event archives from campus sessions.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#080512] border-t border-purple-950 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors"
                >
                  Close
                </button>

                <Link
                  href="/events"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 flex items-center gap-1.5"
                >
                  <span>Browse Club Events →</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
