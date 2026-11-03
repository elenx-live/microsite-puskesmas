import React from 'react';
import {
  Globe,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Shield,
  HelpCircle,
  Video,
  Download,
  Share2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Send,
  MessageCircle,
  FileCheck,
  Building2,
  BookOpen,
  Folder,
  Tag,
  Link2,
  Activity,
  Award,
  Flame,
  CheckCircle,
  Compass,
  ArrowRight,
  Headphones,
  Info
} from 'lucide-react';

interface Props {
  iconName?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const MicrositeIcon: React.FC<Props> = ({ iconName, className = 'w-4 h-4', fallback }) => {
  if (!iconName) {
    return <>{fallback || <Globe className={className} />}</>;
  }

  const normalized = iconName.toLowerCase().replace(/[^a-z0-9]/g, '');

  switch (normalized) {
    case 'stethoscope':
    case 'dokter':
    case 'medis':
      return <Stethoscope className={className} />;
    case 'heartpulse':
    case 'kesehatan':
    case 'jantung':
      return <HeartPulse className={className} />;
    case 'phone':
    case 'telepon':
    case 'call':
    case 'hotline':
      return <Phone className={className} />;
    case 'mail':
    case 'email':
    case 'surat':
      return <Mail className={className} />;
    case 'whatsapp':
    case 'wa':
      return <Send className={className} />;
    case 'messagecircle':
    case 'chat':
    case 'pesan':
      return <MessageCircle className={className} />;
    case 'calendar':
    case 'jadwal':
    case 'agenda':
      return <Calendar className={className} />;
    case 'filetext':
    case 'dokumen':
    case 'artikel':
    case 'berita':
      return <FileText className={className} />;
    case 'filecheck':
    case 'persyaratan':
    case 'spp':
      return <FileCheck className={className} />;
    case 'mappin':
    case 'lokasi':
    case 'alamat':
    case 'peta':
      return <MapPin className={className} />;
    case 'video':
    case 'youtube':
    case 'tutorial':
      return <Video className={className} />;
    case 'download':
    case 'unduh':
    case 'pdf':
      return <Download className={className} />;
    case 'shield':
    case 'keamanan':
    case 'bpjs':
      return <Shield className={className} />;
    case 'helpcircle':
    case 'faq':
    case 'bantuan':
    case 'tanya':
      return <HelpCircle className={className} />;
    case 'building2':
    case 'puskesmas':
    case 'posko':
      return <Building2 className={className} />;
    case 'bookopen':
    case 'panduan':
    case 'edukasi':
      return <BookOpen className={className} />;
    case 'flame':
    case 'hot':
    case 'populer':
      return <Flame className={className} />;
    case 'sparkles':
    case 'baru':
    case 'unggulan':
      return <Sparkles className={className} />;
    case 'headphones':
    case 'audio':
    case 'podcast':
      return <Headphones className={className} />;
    case 'info':
    case 'informasi':
      return <Info className={className} />;
    case 'externallink':
    case 'link':
      return <ExternalLink className={className} />;
    default:
      return <>{fallback || <Globe className={className} />}</>;
  }
};
