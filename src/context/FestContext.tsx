'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Participant, ParticipantPass, Registration, CheckInRecord, FestEvent } from '../types';
import { MOCK_EVENTS } from '../data/eventsData';
import { generateParticipantId, generateOpaqueQRToken } from '../lib/utils';

interface FestContextType {
  participant: Participant | null;
  pass: ParticipantPass | null;
  registrations: Registration[];
  checkInHistory: CheckInRecord[];
  allEvents: FestEvent[];
  registerParticipant: (
    basicInfo: Omit<Participant, 'id' | 'participantId' | 'createdAt'>,
    selectedEventIds: string[]
  ) => { participant: Participant; pass: ParticipantPass };
  loginWithParticipantId: (idOrEmail: string) => boolean;
  logout: () => void;
  performCheckIn: (
    tokenOrParticipantId: string,
    eventId: string,
    organizerDesk?: string
  ) => { success: boolean; message: string; record?: CheckInRecord };
  getRegistrationByToken: (token: string) => {
    participant: Participant;
    pass: ParticipantPass;
    registrations: Registration[];
    checkIns: CheckInRecord[];
  } | null;
  isEventRegistered: (eventId: string) => boolean;
}

const FestContext = createContext<FestContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PARTICIPANT: 'parinaam_current_participant',
  PASS: 'parinaam_current_pass',
  REGISTRATIONS: 'parinaam_current_registrations',
  ALL_RECORDS: 'parinaam_all_pass_db',
  CHECK_INS: 'parinaam_check_ins',
};

// Initial Mock Seed Participant for demo testing
const INITIAL_DEMO_PARTICIPANT: Participant = {
  id: 'demo-part-1',
  participantId: 'PARINAAM26-8K3N91',
  name: 'Deepak E',
  email: 'parinaam@av.amrita.edu',
  phone: '+91 98765 43210',
  college: 'Amrita Vishwa Vidyapeetham',
  department: 'Computer Science & Engineering',
  year: '3rd Year',
  rollNumber: 'CB.EN.U4CSE22015',
  city: 'Coimbatore',
  createdAt: '2026-10-01T10:00:00Z',
};

const INITIAL_DEMO_PASS: ParticipantPass = {
  id: 'pass-demo-1',
  participantId: 'PARINAAM26-8K3N91',
  token: 'parinaam268k3n91-a8f9c72e1d04',
  passType: 'DELEGATE PASS',
  status: 'ACTIVE',
  createdAt: '2026-10-01T10:00:00Z',
  validDates: 'October 11–12, 2026',
  qrPayload: 'https://parinaamfest.org/verify/parinaam268k3n91-a8f9c72e1d04',
};

const INITIAL_DEMO_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-01',
    participantId: 'PARINAAM26-8K3N91',
    eventId: 'evt-01',
    eventName: 'HackArena 3.0',
    eventCategory: 'Coding & Hackathon',
    status: 'CONFIRMED',
    registeredAt: '2026-10-01T10:05:00Z',
    amountPaid: 400,
  },
  {
    id: 'reg-02',
    participantId: 'PARINAAM26-8K3N91',
    eventId: 'evt-02',
    eventName: 'RoboWars 2026',
    eventCategory: 'Robotics',
    status: 'CONFIRMED',
    registeredAt: '2026-10-01T10:05:00Z',
    amountPaid: 600,
  },
];

export const FestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [pass, setPass] = useState<ParticipantPass | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [checkInHistory, setCheckInHistory] = useState<CheckInRecord[]>([]);

  // Initialize from LocalStorage or seed data
  useEffect(() => {
    try {
      const storedParticipant = localStorage.getItem(STORAGE_KEYS.PARTICIPANT);
      const storedPass = localStorage.getItem(STORAGE_KEYS.PASS);
      const storedRegs = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      const storedCheckIns = localStorage.getItem(STORAGE_KEYS.CHECK_INS);

      if (storedParticipant && storedPass) {
        setParticipant(JSON.parse(storedParticipant));
        setPass(JSON.parse(storedPass));
        setRegistrations(storedRegs ? JSON.parse(storedRegs) : []);
      } else {
        setParticipant(null);
        setPass(null);
        setRegistrations([]);
      }

      if (storedCheckIns) {
        setCheckInHistory(JSON.parse(storedCheckIns));
      }
    } catch (err) {
      console.error('Error loading fest context from storage:', err);
    }
  }, []);

  const seedRecordInDatabase = (p: Participant, passItem: ParticipantPass, regs: Registration[]) => {
    try {
      const dbStr = localStorage.getItem(STORAGE_KEYS.ALL_RECORDS);
      let db: Record<string, { participant: Participant; pass: ParticipantPass; registrations: Registration[] }> = dbStr ? JSON.parse(dbStr) : {};
      
      db[passItem.token] = { participant: p, pass: passItem, registrations: regs };
      db[p.participantId] = { participant: p, pass: passItem, registrations: regs };
      
      localStorage.setItem(STORAGE_KEYS.ALL_RECORDS, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to seed DB:', e);
    }
  };

  const registerParticipant = (
    basicInfo: Omit<Participant, 'id' | 'participantId' | 'createdAt'>,
    selectedEventIds: string[]
  ) => {
    const newParticipantId = generateParticipantId();
    const token = generateOpaqueQRToken(newParticipantId);

    const newParticipant: Participant = {
      ...basicInfo,
      id: `part-${Date.now()}`,
      participantId: newParticipantId,
      createdAt: new Date().toISOString(),
    };

    const newPass: ParticipantPass = {
      id: `pass-${Date.now()}`,
      participantId: newParticipantId,
      token: token,
      passType: 'DELEGATE PASS',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      validDates: 'October 11–12, 2026',
      qrPayload: `https://parinaamfest.org/verify/${token}`,
    };

    const newRegistrations: Registration[] = selectedEventIds.map((evtId) => {
      const evt = MOCK_EVENTS.find((e) => e.id === evtId);
      return {
        id: `reg-${Date.now()}-${evtId}`,
        participantId: newParticipantId,
        eventId: evtId,
        eventName: evt?.name || 'Event Registration',
        eventCategory: evt?.category || 'Technical',
        status: 'CONFIRMED',
        registeredAt: new Date().toISOString(),
        amountPaid: evt?.fee || 0,
      };
    });

    // Save active user state
    setParticipant(newParticipant);
    setPass(newPass);
    setRegistrations(newRegistrations);

    try {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANT, JSON.stringify(newParticipant));
      localStorage.setItem(STORAGE_KEYS.PASS, JSON.stringify(newPass));
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(newRegistrations));
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }

    // Save in authoritative lookup DB
    seedRecordInDatabase(newParticipant, newPass, newRegistrations);

    return { participant: newParticipant, pass: newPass };
  };

  const loginWithParticipantId = (idOrEmail: string): boolean => {
    try {
      const dbStr = localStorage.getItem(STORAGE_KEYS.ALL_RECORDS);
      if (!dbStr) return false;
      const db = JSON.parse(dbStr);

      const target = idOrEmail.trim().toUpperCase();
      let record = db[target];

      if (!record) {
        // Search by email
        const entry = Object.values(db).find(
          (item: any) => item.participant.email.toLowerCase() === idOrEmail.trim().toLowerCase()
        ) as any;
        if (entry) record = entry;
      }

      if (record) {
        setParticipant(record.participant);
        setPass(record.pass);
        setRegistrations(record.registrations);

        try {
          localStorage.setItem(STORAGE_KEYS.PARTICIPANT, JSON.stringify(record.participant));
          localStorage.setItem(STORAGE_KEYS.PASS, JSON.stringify(record.pass));
          localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(record.registrations));
        } catch {
          // ignore
        }
        return true;
      }
    } catch (e) {
      console.error('Login lookup error:', e);
    }
    return false;
  };

  const logout = () => {
    setParticipant(null);
    setPass(null);
    setRegistrations([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.PARTICIPANT);
      localStorage.removeItem(STORAGE_KEYS.PASS);
      localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
    } catch {
      // ignore
    }
  };

  const getRegistrationByToken = (token: string) => {
    try {
      const dbStr = localStorage.getItem(STORAGE_KEYS.ALL_RECORDS);
      if (!dbStr) return null;
      const db = JSON.parse(dbStr);

      const key = token.trim();
      const record = db[key] || db[key.toUpperCase()];
      if (record) {
        // Filter checkins for this participant
        const checkIns = checkInHistory.filter((c) => c.participantId === record.participant.participantId);
        return { ...record, checkIns };
      }
    } catch (e) {
      console.error('Token lookup error:', e);
    }
    return null;
  };

  const performCheckIn = (
    tokenOrParticipantId: string,
    eventId: string,
    organizerDesk: string = 'Desk 1 Main Gate'
  ) => {
    const record = getRegistrationByToken(tokenOrParticipantId);
    if (!record) {
      return { success: false, message: 'Invalid or unknown QR pass / Participant ID.' };
    }

    const { participant: p } = record;
    const evt = MOCK_EVENTS.find((e) => e.id === eventId) || MOCK_EVENTS[0];

    // Check duplicate checkin
    const existingCheckIn = checkInHistory.find(
      (c) => c.participantId === p.participantId && c.eventId === eventId && c.status === 'SUCCESS'
    );

    if (existingCheckIn) {
      const duplicateRecord: CheckInRecord = {
        id: `chk-${Date.now()}`,
        participantId: p.participantId,
        participantName: p.name,
        college: p.college,
        eventId: evt.id,
        eventName: evt.name,
        checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkedInBy: organizerDesk,
        venue: evt.venue,
        status: 'DUPLICATE_ATTEMPT',
        firstCheckInTime: existingCheckIn.checkedInAt,
      };
      
      const updatedHistory = [duplicateRecord, ...checkInHistory];
      setCheckInHistory(updatedHistory);
      try {
        localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updatedHistory));
      } catch {
        // ignore
      }

      return {
        success: false,
        message: `PARTICIPANT ALREADY CHECKED IN AT ${existingCheckIn.checkedInAt}`,
        record: duplicateRecord,
      };
    }

    // Success checkin
    const newCheckIn: CheckInRecord = {
      id: `chk-${Date.now()}`,
      participantId: p.participantId,
      participantName: p.name,
      college: p.college,
      eventId: evt.id,
      eventName: evt.name,
      checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkedInBy: organizerDesk,
      venue: evt.venue,
      status: 'SUCCESS',
    };

    const updatedHistory = [newCheckIn, ...checkInHistory];
    setCheckInHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(updatedHistory));
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `Verified: ${p.name} checked in for ${evt.name}`,
      record: newCheckIn,
    };
  };

  const isEventRegistered = (eventId: string): boolean => {
    return registrations.some((r) => r.eventId === eventId && r.status === 'CONFIRMED');
  };

  return (
    <FestContext.Provider
      value={{
        participant,
        pass,
        registrations,
        checkInHistory,
        allEvents: MOCK_EVENTS,
        registerParticipant,
        loginWithParticipantId,
        logout,
        performCheckIn,
        getRegistrationByToken,
        isEventRegistered,
      }}
    >
      {children}
    </FestContext.Provider>
  );
};

export const useFest = () => {
  const context = useContext(FestContext);
  if (!context) {
    throw new Error('useFest must be used within a FestProvider');
  }
  return context;
};
