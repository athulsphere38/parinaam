'use client';

import React from 'react';
import { ComingSoon } from '../../components/ui/ComingSoon';

export default function HospitalityPage() {
  return (
    <ComingSoon
      title="HOSPITALITY & ACCOMMODATION"
      subtitle="Hostel room bookings, shuttles from Vijayawada & Guntur railway stations, and campus dining info."
      category="ACCOMMODATION DESK"
      expectedDate="OCTOBER 08, 2026"
      features={['Hostel Rooms Inside Campus', 'Complimentary Breakfast', '24/7 Security & High-speed WiFi']}
    />
  );
}
