<!-- @component Pemeta nama ikon → komponen lucide-svelte untuk blok/tautan microsite. -->
<script lang="ts">
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
    FileCheck,
    Building2,
    BookOpen,
    Flame,
    Headphones,
    Info,
    MessageCircle,
    Send
  } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  let {
    iconName,
    className = 'w-4 h-4',
    fallback
  }: { iconName?: string; className?: string; fallback?: Snippet } = $props();

  const normalized = $derived((iconName || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
</script>

{#if normalized === 'stethoscope' || normalized === 'dokter' || normalized === 'medis'}
  <Stethoscope class={className} />
{:else if normalized === 'heartpulse' || normalized === 'kesehatan' || normalized === 'jantung'}
  <HeartPulse class={className} />
{:else if normalized === 'phone' || normalized === 'telepon' || normalized === 'call' || normalized === 'hotline'}
  <Phone class={className} />
{:else if normalized === 'mail' || normalized === 'email' || normalized === 'surat'}
  <Mail class={className} />
{:else if normalized === 'whatsapp' || normalized === 'wa'}
  <Send class={className} />
{:else if normalized === 'messagecircle' || normalized === 'chat' || normalized === 'pesan'}
  <MessageCircle class={className} />
{:else if normalized === 'calendar' || normalized === 'jadwal' || normalized === 'agenda'}
  <Calendar class={className} />
{:else if normalized === 'filetext' || normalized === 'dokumen' || normalized === 'artikel' || normalized === 'berita'}
  <FileText class={className} />
{:else if normalized === 'filecheck' || normalized === 'persyaratan' || normalized === 'spp'}
  <FileCheck class={className} />
{:else if normalized === 'mappin' || normalized === 'lokasi' || normalized === 'alamat' || normalized === 'peta'}
  <MapPin class={className} />
{:else if normalized === 'video' || normalized === 'youtube' || normalized === 'tutorial'}
  <Video class={className} />
{:else if normalized === 'download' || normalized === 'unduh' || normalized === 'pdf'}
  <Download class={className} />
{:else if normalized === 'shield' || normalized === 'keamanan' || normalized === 'bpjs'}
  <Shield class={className} />
{:else if normalized === 'helpcircle' || normalized === 'faq' || normalized === 'bantuan' || normalized === 'tanya'}
  <HelpCircle class={className} />
{:else if normalized === 'building2' || normalized === 'puskesmas' || normalized === 'posko'}
  <Building2 class={className} />
{:else if normalized === 'bookopen' || normalized === 'panduan' || normalized === 'edukasi'}
  <BookOpen class={className} />
{:else if normalized === 'flame' || normalized === 'hot' || normalized === 'populer'}
  <Flame class={className} />
{:else if normalized === 'sparkles' || normalized === 'baru' || normalized === 'unggulan'}
  <Sparkles class={className} />
{:else if normalized === 'headphones' || normalized === 'audio' || normalized === 'podcast'}
  <Headphones class={className} />
{:else if normalized === 'info' || normalized === 'informasi'}
  <Info class={className} />
{:else if normalized === 'externallink' || normalized === 'link'}
  <ExternalLink class={className} />
{:else if fallback}
  {@render fallback()}
{:else}
  <Globe class={className} />
{/if}
