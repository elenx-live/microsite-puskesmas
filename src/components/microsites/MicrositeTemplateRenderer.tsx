import React from 'react';
import { MicrositeEntity, HomepageTemplateType, BackgroundAnimationType } from '../../types';
import { GrandMajesticMicrosite } from './templates/GrandMajesticMicrosite';
import { BioLuminescentMicrosite } from './templates/BioLuminescentMicrosite';
import { AvantGardeMicrosite } from './templates/AvantGardeMicrosite';
import { HarmoniNusantaraMicrosite } from './templates/HarmoniNusantaraMicrosite';
import { MinimalistGalleryMicrosite } from './templates/MinimalistGalleryMicrosite';
import { ClassicHubMicrosite } from './templates/ClassicHubMicrosite';

interface Props {
  microsite: MicrositeEntity;
  templateOverride?: HomepageTemplateType;
  animationOverride?: BackgroundAnimationType;
  isPreviewMode?: boolean;
  onOpenQR: () => void;
  onCopyLink: () => void;
  copied: boolean;
}

export const MicrositeTemplateRenderer: React.FC<Props> = ({
  microsite,
  templateOverride,
  animationOverride,
  isPreviewMode,
  onOpenQR,
  onCopyLink,
  copied
}) => {
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

  const commonProps = {
    microsite,
    isPreviewMode,
    onOpenQR,
    onCopyLink,
    copied,
    activeAnimation
  };

  switch (activeTemplate) {
    case 'modern_majestic':
      return <GrandMajesticMicrosite {...commonProps} />;
    case 'artistic_bio':
      return <BioLuminescentMicrosite {...commonProps} />;
    case 'avant_garde':
      return <AvantGardeMicrosite {...commonProps} />;
    case 'nusantara_art':
      return <HarmoniNusantaraMicrosite {...commonProps} />;
    case 'minimal_gallery':
      return <MinimalistGalleryMicrosite {...commonProps} />;
    case 'classic':
      return <ClassicHubMicrosite {...commonProps} />;
    default:
      return <GrandMajesticMicrosite {...commonProps} />;
  }
};
