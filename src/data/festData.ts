import { FestConfig } from '../types';

export const FEST_CONFIG: FestConfig = {
  name: 'PARINAAM',
  edition: '2026',
  tagline: 'The Techno-Cultural Fest',
  subtitle: 'The Annual National Techno-Cultural Festival of Amrita Vishwa Vidyapeetham, Amaravati',
  dates: 'October 11 – 12, 2026',
  venue: 'Main Campus & Innovation Complex',
  collegeName: 'Amrita Vishwa Vidyapeetham',
  locationCity: 'Amaravati, Andhra Pradesh',
  totalPrizePool: '₹15L+',
  expectedParticipants: '12,000+',
  participatingColleges: '150+',
  totalEvents: '35+',
  contactEmail: 'parinaam@av.amrita.edu',
  helplinePhone: '+91 98765 43210',
  socialLinks: {
    instagram: 'https://instagram.com/parinaam_fest',
    youtube: 'https://youtube.com/c/parinaamfest',
    linkedin: 'https://linkedin.com/company/parinaamfest',
    x: 'https://x.com/parinaamfest',
  },
};

export interface ClubPhotoItem {
  url: string;
  title: string;
  caption?: string;
}

export interface GalleryClubItem {
  id: string;
  name: string;
  title: string;
  cluster: 'Tech & Innovation' | 'Arts & Culture' | 'Media & Play';
  category: string;
  imageUrl: string;
  logoUrl?: string;
  cardUrl?: string;
  photos?: ClubPhotoItem[];
  caption: string;
  description: string;
  eventsConducted: string[];
}

export const GALLERY_ITEMS: GalleryClubItem[] = [
  // ─── CLUSTER 1: TECH & INNOVATION ────────────────────────────
  {
    id: 'club-avinya',
    name: 'Avinya',
    title: 'Avinya',
    cluster: 'Tech & Innovation',
    category: 'Innovation & Entrepreneurship',
    imageUrl: '/images/clubs/avinya.png',
    logoUrl: '/images/clubs/avinya-emblem.png',
    cardUrl: '/images/clubs/avinya-card.png',
    photos: [
      {
        url: '/images/clubs/avinya/avinya-photo-1.jpg',
        title: 'Venture Pitch Summit',
        caption: 'Student innovator presenting deeptech and startup prototypes to campus evaluators.'
      },
      {
        url: '/images/clubs/avinya/avinya-photo-2.jpg',
        title: 'Keynote & Podium Address',
        caption: 'Founders sharing insights and event kickoff at the university auditorium podium.'
      },
      {
        url: '/images/clubs/avinya/avinya-photo-3.jpg',
        title: 'Stage Opening Ceremony',
        caption: 'Emcee and organizers leading the stage lighting and event inaugural session.'
      },
      {
        url: '/images/clubs/avinya/avinya-photo-4.jpg',
        title: 'Live Event Moderation',
        caption: 'Interactive student moderation and crowd engagement during the competition rounds.'
      },
      {
        url: '/images/clubs/avinya/avinya-photo-5.jpg',
        title: 'Ideation Roundtable Conference',
        caption: 'Core team conducting brainstorming and venture planning sessions with the Avinya brand.'
      },
    ],
    caption: 'Student founders pitching deeptech prototypes to angel investors and venture capitalists at Shark Tank Parinaam.',
    description: 'Avinya is the innovation and entrepreneurship incubator of Parinaam. Spearheading student ventures, startup hackathons, and angel pitch summits, Avinya transforms bold student ideas into viable tech enterprises.',
    eventsConducted: ['Shark Tank Parinaam', 'Venture Pitch Sprint', 'Disruptive Ideathon']
  },
  {
    id: 'club-robotics',
    name: 'Robotics',
    title: 'Robotics',
    cluster: 'Tech & Innovation',
    category: 'Robotics & Automation',
    imageUrl: '/images/clubs/robotics.png',
    logoUrl: '/images/clubs/robotics-emblem.png',
    cardUrl: '/images/clubs/robotics-card.png',
    photos: [
      {
        url: '/images/clubs/robotics/robotics-photo-1.jpg',
        title: 'Quadcopter Assembly & Testing',
        caption: 'Students fine-tuning flight controllers, rotors, and telemetry on custom racing drone builds in the workshop.'
      },
      {
        url: '/images/clubs/robotics/robotics-photo-2.jpg',
        title: 'Hardware & Drone Prototyping',
        caption: 'Hands-on calibration of ESCs, brushless motors, and carbon fiber airframes in the robotics makerspace.'
      },
      {
        url: '/images/clubs/robotics/robotics-photo-3.jpg',
        title: 'Electronics & Circuitry Lab',
        caption: 'Engineering teams testing telemetry sensors, power distribution boards, and microcontrollers.'
      },
      {
        url: '/images/clubs/robotics/robotics-photo-4.jpg',
        title: 'Combat Arena & RoboWars',
        caption: 'Full-metal combat bots clashing at 10,000 RPM inside the fortified polycarbonate battle arena.'
      },
      {
        url: '/images/clubs/robotics/robotics-photo-5.jpg',
        title: 'Technical Exhibition & Demos',
        caption: 'Robotics leads demonstrating autonomous rovers and combat bot capabilities to festival attendees.'
      },
    ],
    caption: 'Full-metal 15kg & 30kg combat bots clashing at 10,000 RPM in the armored hexagonal arena before a roaring crowd.',
    description: 'The premier engineering robotics guild known for high-octane RoboWars, line-following autonomous rovers, and acrobatic FPV drone races inside fortified polycarbonate arenas.',
    eventsConducted: ['RoboWars Steel Carnage', 'Drone Grand Prix', 'Autonomous Rover Sprint']
  },
  {
    id: 'club-chakravyuha',
    name: 'Chakravyuha',
    title: 'Chakravyuha',
    cluster: 'Tech & Innovation',
    category: 'Coding & Cyber Hackathons',
    imageUrl: '/images/clubs/chakravyuha.png',
    logoUrl: '/images/clubs/chakravyuha-emblem.png',
    cardUrl: '/images/clubs/chakravyuha-card.png',
    photos: [
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-1.jpg',
        title: 'Auditorium Tech Keynote',
        caption: 'Chakravyuha leads inaugurating technical symposiums and competitive coding hackathons in the university auditorium.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-2.jpg',
        title: 'Smart India Hackathon Winners',
        caption: 'Team Chakravyuha receiving the championship award cheque for breakthrough engineering solutions at SIH.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-3.jpg',
        title: 'Competitive Coding & Labs',
        caption: 'Developers immersed in 24-hour algorithmic problem solving and cyber security capture-the-flag sprints.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-4.jpg',
        title: 'Hackathon Prototyping & Collaboration',
        caption: 'Teams collaborating on architectural design, code review, and full-stack software development.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-5.jpg',
        title: 'Grand Hackathon Stage Showcase',
        caption: 'Chakravyuha members and participants gathered on the main auditorium stage for celebration.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-6.jpg',
        title: 'Championship Trophy & Prize Ceremony',
        caption: 'Winning teams receiving certificates, medals, and national cash prize accolades.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-7.jpg',
        title: 'Team Problem-Solving Sprint',
        caption: 'Engineers debugging algorithmic edge cases and stress-testing backends under tight deadlines.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-8.jpg',
        title: 'Hackathon Project Defense',
        caption: 'Participants pitching live software and hardware solutions to academic and industry juries.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-9.jpg',
        title: 'Technical Presentation & Talks',
        caption: 'Student engineers presenting research architectures and software systems to fellow participants.'
      },
      {
        url: '/images/clubs/chakravyuha/chakravyuha-photo-10.jpg',
        title: 'Innovation Defense & Demo',
        caption: 'Finalists presenting breakthrough models and algorithmic pipelines to evaluation panels.'
      },
    ],
    caption: '150+ teams decoding cryptographic ciphers and investigating cyber crime logs in the flagship murder mystery hackathon.',
    description: 'The flagship computing club of Amrita Vishwa Vidyapeetham. Chakravyuha designs intense 24-hour hackathons, algorithmic coding battles, cyber forensic mysteries, and tactical LAN gaming tourneys.',
    eventsConducted: ['Code Red Hackathon', 'Cyber Forensic Mystery', 'Valorant LAN Showdown']
  },
  {
    id: 'club-ieee',
    name: 'IEEE',
    title: 'IEEE Student Branch',
    cluster: 'Tech & Innovation',
    category: 'Electrical, Computing & Research',
    imageUrl: '/images/clubs/ieee.png',
    logoUrl: '/images/clubs/ieee-emblem.png',
    cardUrl: '/images/clubs/ieee-card.png',
    photos: [
      {
        url: '/images/clubs/ieee/ieee-photo-1.jpg',
        title: 'HACKxAMRITA 2.0 Project Presentation',
        caption: 'Finalists pitching cutting-edge software architectures and prototype systems during the HACKxAMRITA 2.0 hackathon.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-2.jpg',
        title: 'University Keynote & Inaugural Session',
        caption: 'IEEE student branch coordinators welcoming faculty dignitaries and delegates at the inaugural symposium podium.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-3.jpg',
        title: 'Research Paper Defense & Keynote',
        caption: 'Student engineers defending peer-reviewed technical research papers and algorithmic solutions before academic panels.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-4.jpg',
        title: 'Quantum Horizons 2026 Award Ceremony',
        caption: 'Faculty leadership presenting cash prizes, trophies, and certificates of distinction to triumphant engineering teams.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-5.jpg',
        title: 'Packed Auditorium Technical Lecture',
        caption: 'Over 300 engineering delegates gathered for an advanced IEEE technical masterclass and industry symposium.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-6.jpg',
        title: 'Hands-On Coding & Systems Workshop',
        caption: 'Engineers collaborating intensely in the laboratory on microcontrollers, hardware interfacing, and software pipelines.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-7.jpg',
        title: 'IEEE Student Branch Executive Committee',
        caption: 'The core student branch leadership and volunteer teams proudly wearing IEEE credentials after hosting successful summits.'
      },
      {
        url: '/images/clubs/ieee/ieee-photo-8.jpg',
        title: 'Circuit Architecture & Schematics Showcase',
        caption: 'Projecting electronic circuit diagrams, VLSI logic schematics, and embedded system telemetry to attendees.'
      },
    ],
    caption: 'Quantum computing symposiums, SIH-style innovation marathons, and research paper defenses powering the IEEE student branch.',
    description: 'The Institute of Electrical and Electronics Engineers (IEEE) Student Branch at Amrita Vishwa Vidyapeetham is an internationally affiliated technical collective driving deeptech research, hardware-software hackathons, and high-impact electronics symposiums. IEEE unites engineering innovators through signature summits like Quantum Horizons, hands-on microelectronics bootcamps, and HACKxAMRITA.',
    eventsConducted: ['Quantum Horizons Tech Summit', 'HACKxAMRITA 2.0 Hackathon', 'Circuit Wars & Paper Defense', 'Hands-On Microelectronics Workshop']
  },

  // ─── CLUSTER 2: ARTS & CULTURE ───────────────────────────────
  {
    id: 'club-prachurya',
    name: 'Prachurya',
    title: 'Prachurya',
    cluster: 'Arts & Culture',
    category: 'Literary & Quizzing',
    imageUrl: '/images/clubs/prachurya.png',
    logoUrl: '/images/clubs/prachurya-emblem.png',
    cardUrl: '/images/clubs/prachurya-card.png',
    photos: [
      {
        url: '/images/clubs/prachurya/prachurya-photo-1.jpg',
        title: 'Packed Auditorium & Debating Floor',
        caption: 'Delegates and students packed in the university seminar hall following intense parliamentary debate rounds and quiz heats.'
      },
      {
        url: '/images/clubs/prachurya/prachurya-photo-2.jpg',
        title: 'Grand Prize Felicitation Ceremony',
        caption: 'Winning teams celebrating on stage with official merit certificates and national championship cash prize cheques.'
      },
      {
        url: '/images/clubs/prachurya/prachurya-photo-3.jpg',
        title: 'Jury Evaluation & Pitch Defense',
        caption: 'Student teams defending their case analyses, creative concepts, and technical solutions before distinguished faculty and judges.'
      },
      {
        url: '/images/clubs/prachurya/prachurya-photo-4.jpg',
        title: 'Nightfall Fest Stage & Marquee Installation',
        caption: 'Luminous 3D typography and open-air festival stage under evening campus spotlights for the 30-hour summit.'
      },
      {
        url: '/images/clubs/prachurya/prachurya-photo-5.jpg',
        title: 'Core Organizing & Student Leadership Crew',
        caption: 'The student convenors, organizers, and logistics leads assembled at the central campus atrium stage.'
      },
      {
        url: '/images/clubs/prachurya/prachurya-photo-6.jpg',
        title: 'Faculty Mentorship & Lead Convenors',
        caption: 'Club leadership with faculty coordinators at the celebration stage following successful event execution.'
      }
    ],
    caption: 'Fiercely contested Parliamentary debates and national trivia rounds igniting student minds across the seminar halls.',
    description: 'Dedicated to igniting curiosity and inspiring expression ("Ignite, Inspire"), Prachurya hosts the festival\'s parliamentary debates, national general quizzes, creative writing summits, and fine arts exhibitions.',
    eventsConducted: ['Parliamentary Debate Summit', 'Mega General Quiz', 'Canvas & Calligraphy Gala']
  },
  {
    id: 'club-nrityasparsh',
    name: 'NrityaSparsh',
    title: 'NrityaSparsh',
    cluster: 'Arts & Culture',
    category: 'Dance & Choreography',
    imageUrl: '/images/clubs/nrityasparsh.png',
    logoUrl: '/images/clubs/nrityasparsh-emblem.png',
    cardUrl: '/images/clubs/nrityasparsh-card.png',
    photos: [
      {
        url: '/images/clubs/nrityasparsh/nrityasparsh-photo-1.jpg',
        title: 'Mainstage Choreography',
        caption: 'Inter-collegiate dance troupes synchronizing intricate hip-hop formations under stadium spotlights.'
      },
      {
        url: '/images/clubs/nrityasparsh/nrityasparsh-photo-2.jpg',
        title: 'Classical & Contemporary Fusion',
        caption: 'Graceful classical storytelling blended with modern contemporary expression.'
      },
      {
        url: '/images/clubs/nrityasparsh/nrityasparsh-photo-3.jpg',
        title: '1v1 Street Cypher Battles',
        caption: 'Solo dancers showing explosive breaking and popping skills in circle cyphers.'
      },
      {
        url: '/images/clubs/nrityasparsh/nrityasparsh-photo-4.jpg',
        title: 'Costume & Thematic Spectacle',
        caption: 'Thematic narrative dance performances captivating the packed amphitheatre crowd.'
      },
      {
        url: '/images/clubs/nrityasparsh/nrityasparsh-photo-5.jpg',
        title: 'Grand Finale Showcase',
        caption: 'The complete NrityaSparsh crew uniting for the exhilarating fest closing showcase.'
      },
    ],
    caption: 'Inter-college choreography crews and street dance battles competing for the national championship under stage lights.',
    description: 'The beating pulse of rhythm on campus. NrityaSparsh orchestrates mega inter-collegiate dance battles, hip-hop crew cyphers, and graceful classical and contemporary choreography showcases.',
    eventsConducted: ['Nritya Sangram Dance Clash', 'Western Crew Choreography', '1v1 Street Cyphers']
  },
  {
    id: 'club-saptaswara',
    name: 'Saptaswara',
    title: 'Saptaswara',
    cluster: 'Arts & Culture',
    category: 'Music & Symphony',
    imageUrl: '/images/clubs/saptaswara.png',
    logoUrl: '/images/clubs/saptaswara-emblem.png',
    cardUrl: '/images/clubs/saptaswara-card.png',
    photos: [
      {
        url: '/images/clubs/saptaswara/saptaswara-photo-1.jpg',
        title: 'Open Air Amphitheatre Concert',
        caption: 'Live collegiate band delivering electrifying fusion guitar solos and drum rhythms under stage floodlights.'
      },
      {
        url: '/images/clubs/saptaswara/saptaswara-photo-2.jpg',
        title: 'Battle of the Bands Mainstage',
        caption: 'Lead vocalists and instrumentalists captivating a roaring crowd of festival attendees.'
      },
      {
        url: '/images/clubs/saptaswara/saptaswara-photo-3.jpg',
        title: 'Acoustic & Unplugged Sessions',
        caption: 'Intimate acoustic guitar sets, melodious vocals, and keyboard harmonies.'
      },
      {
        url: '/images/clubs/saptaswara/saptaswara-photo-4.jpg',
        title: 'Carnatic-Western Raga Fusion',
        caption: 'Mesmerizing musical jugalbandis blending classical ragas with contemporary rock cadence.'
      },
      {
        url: '/images/clubs/saptaswara/saptaswara-photo-5.jpg',
        title: 'Orchestra & Vocal Ensemble',
        caption: 'The full musical ensemble performing soul-stirring festive choral anthems.'
      },
    ],
    caption: 'Top collegiate rock, metal, and fusion bands headlining an electric evening on the Main Open Air Amphitheatre.',
    description: 'Bringing soulful harmony and roaring decibels to the techfest. Saptaswara curates electric Battle of the Bands clashes, Carnatic-Western jugalbandis, and acoustic vocal open mics.',
    eventsConducted: ['Battle of the Bands', 'Raga Symphony Fusion', 'Acoustic Unplugged Night']
  },
  {
    id: 'club-avisruta',
    name: 'Avisruta',
    title: 'Avisruta',
    cluster: 'Arts & Culture',
    category: 'Music, Acoustics & Cultural Vibrance',
    imageUrl: '/images/clubs/avisruta.png',
    logoUrl: '/images/clubs/avisruta-emblem.png',
    cardUrl: '/images/clubs/avisruta-card.png',
    photos: [
      {
        url: '/images/clubs/avisruta/avisruta-photo-1.jpg',
        title: 'Neon Glow Sports & Cultural Arena',
        caption: 'Students competing in the high-energy glow-in-the-dark campus tournament under vivid ultraviolet lighting.'
      },
      {
        url: '/images/clubs/avisruta/avisruta-photo-2.jpg',
        title: 'Festive Gathering & Team Spirit',
        caption: 'Avisruta organizers and participants cheering on tournament finalists in the stadium complex.'
      },
      {
        url: '/images/clubs/avisruta/avisruta-photo-3.jpg',
        title: 'High-Decibel Campus Clashes',
        caption: 'Spirited collegiate squads rallying under stadium floodlights during the festival tournament.'
      },
      {
        url: '/images/clubs/avisruta/avisruta-photo-4.jpg',
        title: 'Championship Matchpoint Rally',
        caption: 'Athletes and performers demonstrating precision, agility, and team camaraderie before an enthusiastic crowd.'
      },
      {
        url: '/images/clubs/avisruta/avisruta-photo-5.jpg',
        title: 'Celebration & Victory Honors',
        caption: 'Teams celebrating victorious championship runs and festive unity on the university grounds.'
      },
    ],
    caption: 'High-decibel Battle of the Bands, soul-stirring unplugged acoustics, and electrifying neon arena experiences.',
    description: 'The powerhouse of musical expression and vibrant campus experiences at Amrita. Avisruta curates high-energy Battle of the Bands clashes, vocal harmony showcases, acoustic open-mic jams, and signature campus spectacles like the Neon Badminton glow-in-the-dark tournament. Fostering artistic flair and spirited campus engagement, Avisruta electrifies the festival atmosphere.',
    eventsConducted: ['Battle of the Bands', 'Avisruta Vocal Euphoria', 'Neon Badminton Showdown', 'Acoustic Unplugged Jam']
  },

  // ─── CLUSTER 3: MEDIA & PLAY ─────────────────────────────────
  {
    id: 'club-drsya',
    name: 'Drsya',
    title: 'Drsya',
    cluster: 'Media & Play',
    category: 'Cinematography & Visual Media',
    imageUrl: '/images/clubs/drsya.png',
    logoUrl: '/images/clubs/drsya-emblem.png',
    cardUrl: '/images/clubs/drsya-card.png',
    photos: [
      {
        url: '/images/clubs/drsya/drsya-photo-1.jpg',
        title: 'Core Cinematography Leads',
        caption: 'Drsya club leads and student coordinators in official insignia jerseys ready for fest media production.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-2.jpg',
        title: 'Organizing Committee & Mentors',
        caption: 'Drsya filmmaking crew and workshop participants celebrating successful creative screening sessions.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-3.jpg',
        title: 'Hands-On Camera & Lens Setup',
        caption: 'Student cinematographers configuring focal length, aperture, and sensor exposure on Canon DSLR rigs.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-4.jpg',
        title: 'Auditorium Interactive Workshop',
        caption: 'Filmmaking enthusiasts discussing screenplays, creative direction, and cinematic storytelling.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-5.jpg',
        title: 'Direction & Masterclass Keynote',
        caption: 'Lead presenter breaking down scene composition, visual pacing, and camera movements.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-6.jpg',
        title: 'Q&A & Creative Reel Review',
        caption: 'Audience and participants interacting with judges and mentors on film editing techniques.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-7.jpg',
        title: 'Short Film Screening & Trivia',
        caption: 'Packed seminar hall enthusiastically participating in short film analysis and visual media quizzes.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-8.jpg',
        title: 'Post-Production & Editing Suite',
        caption: 'Student filmmakers reviewing rough cuts, transitions, color grading, and sound mixing.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-9.jpg',
        title: 'Live Event Cinematography',
        caption: 'Camera operator capturing crisp live stage performances and audience reactions during fest events.'
      },
      {
        url: '/images/clubs/drsya/drsya-photo-10.jpg',
        title: 'Grand Auditorium Premiere',
        caption: 'Control console screening short film competition entries to a packed amphitheatre audience.'
      },
    ],
    caption: 'Filmmakers, cinematographers, and editors scripting, shooting, and premiering short films within 48 tight hours.',
    description: 'The visual storytelling powerhouse of Parinaam. Drsya challenges creative directors with 48-hour short film making sprints, campus photography marathons, and cinematic visual media challenges.',
    eventsConducted: ['Kala Drishti 48h Film Making', 'Campus Photo Walk Marathon', 'Cinematic Reel Craft']
  },
  {
    id: 'club-relu',
    name: 'Relu',
    title: 'Relu',
    cluster: 'Media & Play',
    category: 'AI / Machine Learning',
    imageUrl: '/images/clubs/relu.png',
    logoUrl: '/images/clubs/relu-emblem.png',
    cardUrl: '/images/clubs/relu-card.png',
    photos: [
      {
        url: '/images/clubs/relu/relu-photo-1.jpg',
        title: 'Deep Learning Sprint',
        caption: 'Developers fine-tuning neural network weights and deploying AI models in real time.'
      },
      {
        url: '/images/clubs/relu/relu-photo-2.jpg',
        title: 'Autonomous Agents Lab',
        caption: 'Teams architecting multi-agent reasoning systems and tool-using LLM pipelines.'
      },
      {
        url: '/images/clubs/relu/relu-photo-3.jpg',
        title: 'AI Architecture Workshop',
        caption: 'Mentors breaking down transformer attention mechanisms and neural representations.'
      },
      {
        url: '/images/clubs/relu/relu-photo-4.jpg',
        title: 'Predictive Analytics Sprint',
        caption: 'Data scientists presenting algorithmic evaluation metrics to industry judges.'
      },
      {
        url: '/images/clubs/relu/relu-photo-5.jpg',
        title: 'Hackathon Award Presentation',
        caption: 'Relu champions receiving certificates and awards for machine learning innovation.'
      },
    ],
    caption: 'Developers engineering autonomous AI agent swarms and deep learning pipelines solving complex industry challenges.',
    description: 'Named after the foundational activation function in neural networks, ReLU spearheads artificial intelligence, deep learning hackathons, autonomous agent architectures, and data science sprints at Parinaam.',
    eventsConducted: ['AgentForge AI Agents Challenge', 'Deep Learning Sprint', 'Predictive Analytics Hack']
  },
  {
    id: 'club-advika',
    name: 'Advika',
    title: 'Advika',
    cluster: 'Media & Play',
    category: 'Fine Arts, Crafts & Design',
    imageUrl: '/images/clubs/advika.png',
    logoUrl: '/images/clubs/advika-emblem.png',
    cardUrl: '/images/clubs/advika-card.png',
    photos: [
      {
        url: '/images/clubs/advika/advika-photo-1.jpg',
        title: 'Origami Masterpieces',
        caption: 'Students proudly presenting their paper birds, cranes, and geometric origami art pieces.'
      },
      {
        url: '/images/clubs/advika/advika-photo-2.jpg',
        title: 'Paper Craft Workshop',
        caption: 'Hands-on live demonstration of origami paper folding and action toys during the workshop.'
      },
      {
        url: '/images/clubs/advika/advika-photo-3.jpg',
        title: 'Clay Sculpting Guild',
        caption: 'Students sculpting clay figurines and artistic pottery in hands-on tactile craft sessions.'
      },
      {
        url: '/images/clubs/advika/advika-photo-4.jpg',
        title: 'Social Poster Painting',
        caption: 'Creating impactful hand-drawn awareness art and health education canvas posters.'
      },
      {
        url: '/images/clubs/advika/advika-photo-5.jpg',
        title: 'Canvas & Marker Design',
        caption: 'Fine art illustration teams collaborating on large-format campaign banners.'
      },
    ],
    caption: 'Students mastering paper origami creations, clay sculpting, and social awareness poster painting in creative craft workshops.',
    description: 'The creative arts, fine crafts, and design guild of campus. Advika brings imagination into tangible reality through intricate paper origami workshops, fine clay pottery sculpting, canvas painting marathons, and impactful socio-cultural awareness poster exhibitions.',
    eventsConducted: ['Origami Craft Masterclass', 'Clay Sculpting Guild', 'Social Awareness Poster Art', 'Canvas Illustration Gala']
  },
];

