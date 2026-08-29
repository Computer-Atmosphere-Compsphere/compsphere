import type { LucideIcon } from "lucide-react";
import { Code2, Mic2, Music4, Rocket } from "lucide-react";

export interface Activity {
  time: string;
  title: string;
  desc: string;
}

export interface Speaker {
  name: string;
  role: string;
  org: string;
  avatar?: string; // optional photo path
}

export interface PartnerPerk {
  title: string;
  desc: string;
  stat?: string;
}

export interface Benefit {
  title: string;
  desc: string;
  icon: string; // emoji or symbol
}

export interface GlobalStat {
  label: string;
  value: string;
}

export interface SubEvent {
  id: string;
  block: string;
  name: string;
  tagline: string;
  description: string;
  date: string;
  venue: string;
  tag: string;
  accent: string; // tailwind text color
  chip: string; // tailwind border/bg for accent
  iconSrc: string; // web3-styled event icon image
  icon: LucideIcon; // fallback lucide icon
  activities: Activity[];
  sponsorNames: string[];
  // Per-event special block data
  speakers?: Speaker[];
  partnerPerks?: PartnerPerk[];
  globalStats?: GlobalStat[];
  benefits: Benefit[];
}

export const subEvents: SubEvent[] = [
  {
    id: "exposphere",
    block: "BLOCK #01",
    name: "Exposphere",
    tagline: "Innovation & Startup Expo",
    description:
      "Exposphere is the largest innovation and startup expo in the Compsphere series. Held at two strategic locations, AEON Deltamas Cikarang and Lobby A President University, this expo serves as the ultimate platform for innovators, founders, and tech builders to showcase their best work to the public.",
    date: "Sep 29 - Oct 6, 2026",
    venue: "AEON Deltamas Cikarang & Lobby A President University",
    tag: "GENESIS EXPO",
    accent: "text-status-submitted",
    chip: "border-status-submitted/30 bg-status-submitted/10",
    iconSrc: "/exposphere-icon.png",
    icon: Rocket,
    activities: [
      {
        time: "Sep 29",
        title: "Booth Setup",
        desc: "Exhibitors deploy booths at AEON Deltamas & President University.",
      },
      {
        time: "Sep 30",
        title: "Opening Ceremony",
        desc: "Official opening and exhibition walk-through.",
      },
      {
        time: "Oct 2",
        title: "Showcase Day",
        desc: "Public day to explore all projects and startups.",
      },
      {
        time: "Oct 4",
        title: "Founders Meetup",
        desc: "Direct interaction with the founders behind the tech.",
      },
      {
        time: "Oct 6",
        title: "Closing & Awards",
        desc: "Best-booth awards and official expo closing.",
      },
    ],
    sponsorNames: ["Sponsor 1", "Sponsor 2"],
    partnerPerks: [
      {
        title: "High-Traffic Location",
        desc: "AEON Deltamas Cikarang is one of the busiest shopping centers in the Bekasi-Cikarang area with millions of visitors per month.",
        stat: "50K+ Visitors",
      },
      {
        title: "Brand Visibility",
        desc: "Direct exposure to mall visitors, local media, and the Cikarang-Bekasi tech community.",
        stat: "Direct Exposure",
      },
      {
        title: "Strategic Network",
        desc: "Partnership with AEON Deltamas Cikarang opens doors to a wider business and innovation ecosystem.",
        stat: "Premium Network",
      },
      {
        title: "Dual Venue Impact",
        desc: "Present at two locations simultaneously, President University campus and a commercial center, maximizing audience reach.",
        stat: "2 Venues",
      },
    ],
    benefits: [
      { icon: "🚀", title: "Showcase Your Innovation", desc: "Present your project or startup to thousands of real-world visitors." },
      { icon: "🤝", title: "Build Connections", desc: "Find business partners, investors, and fellow builders all in one place." },
      { icon: "🏆", title: "Win Best Booth", desc: "Compete for the best booth award with prestigious prizes and recognition." },
      { icon: "🌐", title: "Public Exposure", desc: "Media coverage and social amplification from the Compsphere network." },
    ],
  },
  {
    id: "talksphere",
    block: "BLOCK #02",
    name: "Talksphere",
    tagline: "Expert Ledger: Panel & Talks",
    description:
      "Talksphere brings technology, Web3, and digital career industry leaders to the stage to share firsthand insights with attendees. Panel sessions, keynotes, and open discussions make Talksphere the most energetic space in the Compsphere chain.",
    date: "Oct 7, 2026",
    venue: "Auditorium Charles Hirmawan, President University, Cikarang",
    tag: "EXPERT LEDGER",
    accent: "text-status-pending",
    chip: "border-status-pending/30 bg-status-pending/10",
    iconSrc: "/talksphere-icon.png",
    icon: Mic2,
    activities: [
      {
        time: "08:00 WIB",
        title: "Registration",
        desc: "Check-in and receive access passes.",
      },
      {
        time: "09:00 WIB",
        title: "Opening & Keynote",
        desc: "Future of decentralized careers and tech.",
      },
      {
        time: "10:00 WIB",
        title: "Panel: Web3 & Decentralized Tech",
        desc: "How Web3 reshapes the digital landscape.",
      },
      {
        time: "13:00 WIB",
        title: "Panel: Digital Careers",
        desc: "Building careers in the decentralized web.",
      },
      {
        time: "15:30 WIB",
        title: "Q&A & Networking",
        desc: "Open session and networking with speakers.",
      },
    ],
    sponsorNames: ["Sponsor 3", "Sponsor 4"],
    speakers: [
      {
        name: "Avip Syaifulloh",
        role: "CEO",
        org: "WPU Course",
        avatar: "/speaker-image.png",
      },
      {
        name: "Sandhika Galih",
        role: "Tech Creator & Educator",
        org: "WPU Course, YouTube",
        avatar: "/speaker-image.png",
      },
      {
        name: "M. Agung Rizkyana",
        role: "CTO",
        org: "WPU Course",
        avatar: "/speaker-image.png",
      },
    ],
    benefits: [
      { icon: "🎤", title: "Learn from Experts", desc: "Hear firsthand insights from technology industry practitioners and leaders." },
      { icon: "💡", title: "Industry Insights", desc: "Understand the latest trends in Web3, blockchain, and future digital careers." },
      { icon: "🌐", title: "Premium Networking", desc: "Connect with speakers, fellow attendees, and the national tech community." },
      { icon: "📜", title: "Participant Certificate", desc: "Receive a recognized attendance certificate for your portfolio and career." },
    ],
  },
  {
    id: "hacksphere",
    block: "BLOCK #03",
    name: "Hacksphere",
    tagline: "24-Hour Build Mainnet",
    description:
      "Hacksphere adalah hackathon internasional 24 jam yang mempertemukan tim-tim terbaik dari berbagai negara untuk membangun solusi inovatif berbasis teknologi dalam satu sesi kompetitif yang penuh adrenalin. Kompetisi ini terdiri dari dua fase: Babak Penyisihan Online (25 Agustus – 30 September 2026) di mana tim mengumpulkan Proposal Idea berbasis PDF, dan Babak Offline (10–11 Oktober 2026) di President University, Cikarang, di mana 30 tim terbaik coding selama 24 jam nonstop dan mempresentasikan produk mereka secara langsung di hadapan juri profesional.",
    date: "Oct 10-11, 2026",
    venue: "Auditorium Charles Hirmawan, President University, Cikarang",
    tag: "24H BUILD",
    accent: "text-brand-primary",
    chip: "border-brand-primary/30 bg-brand-dim",
    iconSrc: "/hacksphere-icon.png",
    icon: Code2,
    activities: [
      {
        time: "25 Ags – 8 Sept",
        title: "Early Registration & Team Building",
        desc: "Registrasi akun individu, pembentukan tim, payment Rp75.000/tim, unduh Guidebook & Template Proposal.",
      },
      {
        time: "9 Sept – 18 Sept",
        title: "Submission Window",
        desc: "Penyusunan & pengumpulan Proposal Idea (PDF) ke dashboard tim sebelum deadline 18 Sept 23:59 WIB.",
      },
      {
        time: "19 Sept – 25 Sept",
        title: "Judging Window",
        desc: "5 juri IT profesional menilai proposal menggunakan Two-Judge Overlap System (setiap proposal dinilai 2 juri berbeda).",
      },
      {
        time: "26 Sept",
        title: "Announcement Day",
        desc: "Pengumuman Top 30 (Main List), Waiting List (Rank 31–40), dan peserta gagal yang mendapat tiket gratis Talksphere.",
      },
      {
        time: "26–29 Sept",
        title: "Confirmation & Waiting List",
        desc: "Tim Top 30 konfirmasi kehadiran offline. Slot kosong diisi dari Waiting List secara urutan.",
      },
      {
        time: "30 Sept",
        title: "Technical Meeting Online",
        desc: "Briefing aturan Babak Offline via Zoom/GMeet: jam kedatangan, barang bawaan, dan peraturan coding 24 jam.",
      },
      {
        time: "Oct 10 · 07:40",
        title: "Check-In Babak Offline",
        desc: "Registrasi ulang di Auditorium, scan QR kehadiran, dan penempatan meja sesuai nomor urut.",
      },
      {
        time: "Oct 10 · 10:00",
        title: "Hacking Period Starts",
        desc: "24 jam coding dimulai. Tim mengelola sendiri waktu istirahat dan makan mereka secara mandiri.",
      },
      {
        time: "Oct 11 · 10:00",
        title: "Code Freeze & Submission",
        desc: "Penghentian coding. Wajib submit: Repo GitHub, Slide PDF, dan link deployment/akses live.",
      },
      {
        time: "Oct 11 · 10:30",
        title: "Live Pitching",
        desc: "Presentasi 10 menit per tim: 3 menit narasi bisnis, 3 menit live demo, 4 menit Q&A dengan juri.",
      },
      {
        time: "Oct 11 · Akhir",
        title: "Winners & Closing",
        desc: "Pengumuman pemenang, penyerahan hadiah, dan penutupan resmi Hacksphere 2026.",
      },
    ],
    sponsorNames: ["Sponsor 2", "Sponsor 4", "Sponsor 5"],
    globalStats: [
      { label: "Countries", value: "15+" },
      { label: "Registered Teams", value: "100+" },
      { label: "Total Prize Pool", value: "IDR 20JT" },
      { label: "Build Hours", value: "24H" },
    ],
    benefits: [
      { icon: "🌍", title: "Kompetisi Internasional", desc: "Bersaing dengan tim dari 15+ negara dalam satu arena hackathon." },
      { icon: "💰", title: "Total Hadiah 20 Juta IDR", desc: "Prize pool kompetitif untuk 3 tim terbaik babak offline." },
      { icon: "🧠", title: "Live Mentorship 24 Jam", desc: "Akses ke mentor berpengalaman sepanjang sesi coding 24 jam." },
      { icon: "📦", title: "Bangun Produk Nyata", desc: "Pulang dengan produk jadi yang siap masuk portofolio dan dipresentasikan ke dunia." },
    ],
  },
  {
    id: "festsphere",
    block: "BLOCK #04",
    name: "Festsphere",
    tagline: "Creative Block: Art & Culture",
    description:
      "Festsphere is the grand finale celebration of the Compsphere chain, bringing together art, culture, community, and technology in one night full of expression. From art walks and community performances to the awarding ceremony that closes the entire Compsphere series.",
    date: "Oct 11, 2026",
    venue: "Auditorium Charles Hirmawan, President University, Cikarang",
    tag: "CREATIVE BLOCK",
    accent: "text-status-waitlist",
    chip: "border-status-waitlist/30 bg-status-waitlist/10",
    iconSrc: "/festsphere-icon.png",
    icon: Music4,
    activities: [
      {
        time: "14:00 WIB",
        title: "Booths & Art Walk",
        desc: "Community booths open, art walk begins.",
      },
      {
        time: "16:00 WIB",
        title: "Opening Ceremony",
        desc: "Main stage celebration kicks off.",
      },
      {
        time: "18:00 WIB",
        title: "Main Performances",
        desc: "Live shows by communities and artists.",
      },
      {
        time: "20:00 WIB",
        title: "Closing & Awards",
        desc: "Final awards and closing show.",
      },
    ],
    sponsorNames: ["Sponsor 4", "Sponsor 5", "Sponsor 6"],
    benefits: [
      { icon: "🎨", title: "Creative Expression", desc: "A real platform to showcase art, culture, and community creations." },
      { icon: "🎵", title: "Live Performances", desc: "Enjoy live performances from selected artists and communities." },
      { icon: "🏅", title: "Closing Awards", desc: "Witness the best awards for the entire Compsphere series." },
      { icon: "🤩", title: "Unforgettable Vibe", desc: "A closing night to remember with the Indonesian tech community." },
    ],
  },
];

export const sponsors = [
  { name: "Sponsor 1", monogram: "S1", style: "font-extrabold tracking-widest", image: "/sponsor1-nordvpn.png" },
  { name: "Sponsor 2", monogram: "S2", style: "font-black uppercase", image: "/sponsor2-nordpass.png" },
  { name: "Sponsor 3", monogram: "S3", style: "font-bold italic tracking-tight", image: "/sponsor3-incogni.png" },
  { name: "Sponsor 4", monogram: "S4", style: "font-mono font-bold", image: "/sponsor4-saily.png" },
  { name: "Sponsor 5", monogram: "S5", style: "font-black tracking-tighter", image: "/sponsor5-cloura.png" },
  { name: "Sponsor 6", monogram: "S6", style: "font-extralight tracking-[0.25em]", image: "/sponsor6-featherless.png" },
];

export const partners = [
  "Partner 1",
  "Partner 2",
  "Partner 3",
  "Partner 4",
  "Partner 5",
  "Partner 6",
  "Partner 7",
  "Partner 8",
];