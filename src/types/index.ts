export type EventCategory = 
  | 'Technical'
  | 'Cultural'
  | 'Coding & Hackathon'
  | 'Robotics'
  | 'Gaming'
  | 'Workshops'
  | 'Quiz & Literary'
  | 'Arts & Media'
  | 'Management';

export interface Coordinator {
  name: string;
  role: string;
  phone: string;
  email?: string;
}

export interface FestEvent {
  id: string;
  eventCode: string;
  name: string;
  category: EventCategory;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  venue: string;
  date: string; // e.g. "Oct 16, 2026"
  startTime: string; // e.g. "10:00 AM"
  endTime: string; // e.g. "04:00 PM"
  day: 1 | 2 | 3;
  teamSize: string; // e.g. "1-4 Members"
  minTeamSize: number;
  maxTeamSize: number;
  fee: number; // in INR
  prizePool: string; // e.g. "₹50,000"
  rules: string[];
  eligibility: string;
  coordinators: Coordinator[];
  image: string;
  rulebookUrl?: string;
  unstopUrl?: string;
  registrationUrl?: string;
  isPopular?: boolean;
  registrationOpen: boolean;
  clubName?: string;
  clubColor?: string;
}

export interface Participant {
  id: string;
  participantId: string; // e.g. PARINAAM26-8K3N91
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  rollNumber?: string;
  city: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  participantId: string;
  eventId: string;
  eventName: string;
  eventCategory: EventCategory;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  registeredAt: string;
  amountPaid: number;
}

export interface ParticipantPass {
  id: string;
  participantId: string;
  token: string; // Opaque hash/secure string e.g. "9f8a2c1e7b4d"
  passType: 'DELEGATE PASS' | 'VIP PASS' | 'WORKSHOP PASS' | 'CREW PASS';
  status: 'ACTIVE' | 'SUSPENDED' | 'CHECKED_IN';
  createdAt: string;
  validDates: string;
  qrPayload: string;
}

export interface CheckInRecord {
  id: string;
  participantId: string;
  participantName: string;
  college: string;
  eventId: string;
  eventName: string;
  checkedInAt: string;
  checkedInBy: string; // Organizer ID or Desk Name
  venue: string;
  status: 'SUCCESS' | 'DUPLICATE_ATTEMPT';
  firstCheckInTime?: string;
}

export interface FestConfig {
  name: string;
  edition: string;
  tagline: string;
  subtitle: string;
  dates: string;
  venue: string;
  collegeName: string;
  locationCity: string;
  totalPrizePool: string;
  expectedParticipants: string;
  participatingColleges: string;
  totalEvents: string;
  contactEmail: string;
  helplinePhone: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    linkedin: string;
    x: string;
  };
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'Title Sponsor' | 'Powered By' | 'Co-Sponsor' | 'Category Partner' | 'Media Partner';
  website: string;
}
