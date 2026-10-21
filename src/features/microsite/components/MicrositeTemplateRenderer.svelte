<!-- @component Router template microsite — memilih komponen template visual aktif berdasar override, konfigurasi microsite, atau default. -->
<script lang="ts">
  import type { MicrositeEntity, HomepageTemplateType, BackgroundAnimationType } from '../../../shared/types/index.js';
  import GrandMajesticMicrosite from '../templates/GrandMajesticMicrosite.svelte';
  import BioLuminescentMicrosite from '../templates/BioLuminescentMicrosite.svelte';
  import AvantGardeMicrosite from '../templates/AvantGardeMicrosite.svelte';
  import HarmoniNusantaraMicrosite from '../templates/HarmoniNusantaraMicrosite.svelte';
  import MinimalistGalleryMicrosite from '../templates/MinimalistGalleryMicrosite.svelte';
  import ClassicHubMicrosite from '../templates/ClassicHubMicrosite.svelte';

  let {
    microsite,
    templateOverride,
    animationOverride,
    isPreviewMode,
    onOpenQR,
    onCopyLink,
    copied
  }: {
    microsite: MicrositeEntity;
    templateOverride?: HomepageTemplateType;
    animationOverride?: BackgroundAnimationType;
    isPreviewMode?: boolean;
    onOpenQR: () => void;
    onCopyLink: () => void;
    copied: boolean;
  } = $props();

  // Determine template: Override > Microsite Theme Config > Default 'modern_majestic'
  const activeTemplate: HomepageTemplateType =
    templateOverride ||
    microsite.themeCustomization?.template ||
    'modern_majestic';

  // Determine animation: Override > Microsite Animation Config > Default based on template
  const defaultAnimationForTemplate: Record<HomepageTemplateType, BackgroundAnimationType> = {
    modern_majestic: 'aurora_flow',
    artistic_bio: 'bioluminescent',
    avant_garde: 'geometric_waves',
    nusantara_art: 'golden_radiance',
    minimal_gallery: 'subtle_glow',
    classic: 'none'
  };

  const activeAnimation: BackgroundAnimationType =
    animationOverride ||
    microsite.themeCustomization?.backgroundAnimation ||
    defaultAnimationForTemplate[activeTemplate] ||
    'aurora_flow';
</script>

{#if activeTemplate === 'modern_majestic'}
  <GrandMajesticMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{:else if activeTemplate === 'artistic_bio'}
  <BioLuminescentMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{:else if activeTemplate === 'avant_garde'}
  <AvantGardeMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{:else if activeTemplate === 'nusantara_art'}
  <HarmoniNusantaraMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{:else if activeTemplate === 'minimal_gallery'}
  <MinimalistGalleryMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{:else if activeTemplate === 'classic'}
  <ClassicHubMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{:else}
  <GrandMajesticMicrosite {microsite} {isPreviewMode} {onOpenQR} {onCopyLink} {copied} activeAnimation={activeAnimation} />
{/if}
