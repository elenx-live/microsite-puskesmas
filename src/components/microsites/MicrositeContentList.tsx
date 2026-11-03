import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Layers, Sparkles } from 'lucide-react';
import { MicrositeEntity, MicrositeBlock } from '../../types';
import { MicrositeBlockRenderer } from './MicrositeBlockRenderer';
import { MicrositeLinkButton } from './MicrositeLinkButton';

interface Props {
  microsite: MicrositeEntity;
  themeStyle?: string;
  accentColor?: string;
}

export const MicrositeContentList: React.FC<Props> = ({
  microsite,
  themeStyle = 'emerald',
  accentColor = '#10b981'
}) => {
  const hasBlocks = microsite.blocks && microsite.blocks.length > 0;
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // If using modern modular blocks
  if (hasBlocks) {
    const blocks = (microsite.blocks || []).slice().sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const groups = microsite.groups || [];

    if (blocks.length === 0) {
      return (
        <div className="p-8 text-center rounded-3xl bg-[var(--color-card)]/60 border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] text-xs">
          Belum ada blok konten yang disematkan di portal ini.
        </div>
      );
    }

    // Check if groups are used
    if (groups.length > 0) {
      const validGroupIds = new Set(groups.map(g => g.id));
      const ungroupedBlocks = blocks.filter(b => !b.groupId || !validGroupIds.has(b.groupId));
      return (
        <div className="space-y-4">
          {/* Ungrouped blocks first */}
          {ungroupedBlocks.length > 0 && (
            <div className="space-y-3">
              {ungroupedBlocks.map((block, idx) => (
                <MicrositeBlockRenderer
                  key={block.id}
                  block={block}
                  index={idx}
                  micrositeId={microsite.id}
                  themeStyle={themeStyle}
                  accentColor={accentColor}
                />
              ))}
            </div>
          )}

          {/* Grouped blocks */}
          {groups.map(group => {
            const groupBlocks = blocks.filter(b => b.groupId === group.id);
            if (groupBlocks.length === 0) return null;
            const isCollapsed = group.collapsible && !!collapsedGroups[group.id];

            return (
              <div
                key={group.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/70 backdrop-blur-md p-4 space-y-3 shadow-md overflow-hidden"
              >
                <div
                  onClick={() => group.collapsible && toggleGroup(group.id)}
                  className={`flex items-center justify-between select-none ${group.collapsible ? 'cursor-pointer hover:opacity-80' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center">
                      <Folder className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                        {group.name}
                      </h4>
                      {group.description && (
                        <p className="text-[10px] text-[var(--color-muted-foreground)]">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {group.collapsible && (
                    <div className="w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)]">
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="space-y-3 pt-1">
                    {groupBlocks.map((block, idx) => (
                      <MicrositeBlockRenderer
                        key={block.id}
                        block={block}
                        index={idx}
                        micrositeId={microsite.id}
                        themeStyle={themeStyle}
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Flat list of blocks
    return (
      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <MicrositeBlockRenderer
            key={block.id}
            block={block}
            index={idx}
            micrositeId={microsite.id}
            themeStyle={themeStyle}
            accentColor={accentColor}
          />
        ))}
      </div>
    );
  }

  // Fallback to legacy links
  const links = (microsite.links || []).slice().sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (links.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[var(--color-card)]/60 border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] text-xs">
        Belum ada tautan yang disematkan di portal ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link, idx) => (
        <MicrositeLinkButton
          key={link.id}
          link={link}
          index={idx}
          micrositeId={microsite.id}
          themeStyle={themeStyle as any}
        />
      ))}
    </div>
  );
};
