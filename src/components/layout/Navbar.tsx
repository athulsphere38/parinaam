'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LayoutDashboard, Shield, LogOut, ChevronDown, ShoppingBag, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { isStudentProfileComplete } from '@/lib/institutionPolicy';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { cartCount, isCartOpen, openCart, closeCart } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const close = () => setUserMenuOpen(false);
    if (userMenuOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);

  // Completely hide Navbar on registration pages
  if (pathname === '/auth/register' || pathname === '/register' || pathname?.startsWith('/auth/register')) {
    return null;
  }

  const isProfileComplete = isStudentProfileComplete(user);

  const handleCartClick = () => {
    if (user && user.role === 'student' && !isProfileComplete) {
      alert('Please complete your platform registration profile before accessing the event cart.');
      router.push('/dashboard/profile');
      return;
    }
    openCart();
  };

  const navLinks = user
    ? user.role === 'student'
      ? [
          { name: 'DASHBOARD', href: '/dashboard' },
          { name: 'MY PASS', href: '/dashboard/pass' },
          { name: 'EVENTS', href: '/events' },
          { name: 'SCHEDULE', href: '/schedule' },
          { name: 'GALLERY', href: '/#gallery' },
          { name: 'SPONSORS', href: '/#sponsors' },
        ]
      : user.role === 'super_admin'
      ? [
          { name: 'HQ DASHBOARD', href: '/superadmin' },
          { name: 'ALL USERS', href: '/superadmin/users' },
          { name: 'EVENTS', href: '/events' },
          { name: 'SCHEDULE', href: '/schedule' },
        ]
      : user.role === 'club_admin'
      ? [
          { name: 'CLUB PORTAL', href: `/admin/${user.club_slug || 'chakravyuha'}` },
          { name: 'QR SCANNER', href: `/admin/${user.club_slug || 'chakravyuha'}/scan` },
          { name: 'EVENTS', href: '/events' },
          { name: 'SCHEDULE', href: '/schedule' },
        ]
      : [
          { name: 'EVENTS', href: '/events' },
          { name: 'SCHEDULE', href: '/schedule' },
          { name: 'GALLERY', href: '/#gallery' },
          { name: 'SPONSORS', href: '/#sponsors' },
        ]
    : [
        { name: 'EVENTS', href: '/events' },
        { name: 'SCHEDULE', href: '/schedule' },
        { name: 'GALLERY', href: '/#gallery' },
        { name: 'SPONSORS', href: '/#sponsors' },
      ];

  const dashboardHref =
    user?.role === 'super_admin' ? '/superadmin' :
    user?.role === 'club_admin'  ? (user.club_slug ? `/admin/${user.club_slug}` : '/admin') :
    '/dashboard';

  const dashboardLabel =
    user?.role === 'super_admin' ? 'Superadmin HQ' :
    user?.role === 'club_admin'  ? `${user.club_name || 'Club'} Admin` :
    'My Dashboard';

  const DashIcon =
    user?.role === 'super_admin' ? Shield :
    user?.role === 'club_admin'  ? LayoutDashboard :
    User;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#05030a]/95 backdrop-blur-xl border-b border-purple-900/50 py-3 shadow-2xl'
          : 'bg-gradient-to-b from-[#05030a]/95 via-[#05030a]/70 to-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center group shrink-0">
              <img
                src="/images/amrita-logo.png"
                alt="Amrita Vishwa Vidyapeetham"
                className="h-10 sm:h-12 w-auto object-contain brightness-105 group-hover:scale-105 transition-transform drop-shadow-[0_0_12px_rgba(236,72,153,0.35)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/parinaam-navbar-logo.png';
                }}
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center justify-center gap-7 xl:gap-8 font-medium text-sm">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.name} href={link.href}
                    className={`transition-all duration-200 py-1 ${
                      isActive
                        ? 'text-[#ff00ff] font-bold drop-shadow-[0_0_12px_rgba(255,0,255,0.9)]'
                        : 'text-slate-300 hover:text-white'
                    }`}>
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right — Auth & Cart area */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {/* Cart Button: Rendered ONLY for logged-in students */}
              {!loading && user && user.role === 'student' && (
                <button
                  onClick={handleCartClick}
                  className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all flex items-center justify-center"
                  title={!isProfileComplete ? "Complete profile to unlock cart" : "Registration Cart"}
                >
                  {!isProfileComplete ? (
                    <Lock size={18} className="text-amber-400" />
                  ) : (
                    <ShoppingBag size={18} />
                  )}
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#05030a] shadow-fest-brand">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {loading ? (
                <div className="w-24 h-9 bg-white/5 rounded-xl animate-pulse" />
              ) : user ? (
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 text-white text-sm font-medium transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {((user.full_name || user.email || 'U').charAt(0)).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{(user.full_name || user.email || 'User').split(' ')[0]}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#0e0b1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5">
                      <div className="px-4 py-3">
                        <p className="text-white text-sm font-semibold truncate">{user.full_name || user.email}</p>
                        <p className="text-slate-500 text-xs truncate">{user.email}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1.5 inline-block font-medium ${
                          user.role === 'super_admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          user.role === 'club_admin' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin HQ' : user.role === 'club_admin' ? `${user.club_name || 'Club'} Admin` : (user.is_amrita_student ? 'Amrita Student' : 'External Student')}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link href={dashboardHref} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                          <DashIcon size={15} className="text-purple-400" /> {dashboardLabel}
                        </Link>

                        {user.role === 'super_admin' && (
                          <>
                            <Link href="/superadmin/scan" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <span className="text-cyan-400 text-xs font-bold">QR</span> Universal Gate Scanner
                            </Link>
                            <Link href="/superadmin/users" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <User size={15} className="text-purple-400" /> User Management & KYC
                            </Link>
                            <Link href="/superadmin/settings" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <Shield size={15} className="text-slate-400" /> Platform Settings
                            </Link>
                          </>
                        )}

                        {user.role === 'club_admin' && (
                          <>
                            <Link href={`/admin/${user.club_slug || 'chakravyuha'}/scan`} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <span className="text-cyan-400 text-xs font-bold">QR</span> Attendance Scanner
                            </Link>
                            <Link href={`/admin/${user.club_slug || 'chakravyuha'}/events/new`} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <span className="text-purple-400 text-xs font-bold">+</span> Create New Event
                            </Link>
                          </>
                        )}

                        {user.role === 'student' && (
                          <>
                            <Link href="/dashboard/pass" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <span className="text-emerald-400 text-xs font-bold">QR</span> My Fest Pass
                            </Link>
                            <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors">
                              <User size={15} className="text-slate-400" /> Profile Settings
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="py-1">
                        <button onClick={() => { setUserMenuOpen(false); logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm transition-colors">
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/auth/login"
                    className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/30 text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all">
                    Login
                  </Link>
                  <Link href="/auth/register"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-purple-glow active:scale-95 border border-fuchsia-400/40">
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <div className="flex lg:hidden items-center gap-2">
              {!loading && user && user.role === 'student' && (
                <button
                  onClick={handleCartClick}
                  className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
                  title={!isProfileComplete ? "Complete profile to unlock cart" : "Registration Cart"}
                >
                  {!isProfileComplete ? (
                    <Lock size={18} className="text-amber-400" />
                  ) : (
                    <ShoppingBag size={18} />
                  )}
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              {!loading && !user && (
                <Link href="/auth/register"
                  className="px-3.5 py-1.5 rounded-lg bg-fuchsia-600 text-white text-xs font-bold uppercase tracking-wider">
                  Register
                </Link>
              )}
              {!loading && user && (
                <Link href={dashboardHref}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-700/50 border border-purple-600/50 text-white text-xs font-bold">
                  {((user.full_name || user.email || 'U').charAt(0)).toUpperCase()}
                </Link>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-purple-950/60 text-purple-200 border border-purple-800" aria-label="Toggle navigation menu">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[65px] bg-[#05030a] border-b border-purple-900/50 px-4 py-6 shadow-2xl space-y-4 max-h-[calc(100vh-70px)] overflow-y-auto">
            <div className="flex flex-col space-y-2 font-pixel font-bold text-center tracking-widest text-base">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 rounded-xl transition-all ${
                    pathname === link.href
                      ? 'bg-purple-950/80 text-[#ff00ff] border border-fuchsia-800/80'
                      : 'text-slate-200 hover:text-[#ff00ff]'
                  }`}>
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 border-t border-purple-950 space-y-2">
              {user ? (
                <>
                  <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-700/30 border border-purple-600/40 text-white font-bold text-sm">
                    <DashIcon size={15} /> {dashboardLabel}
                  </Link>
                  <button onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                    className="w-full block py-3 rounded-xl border border-white/10 text-white font-pixel font-bold text-center">
                    LOGIN
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                    className="w-full block py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-pixel font-bold text-center shadow-purple-glow">
                    REGISTER FOR PASS
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {!loading && user && user.role === 'student' && (
        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      )}
    </>
  );
};


