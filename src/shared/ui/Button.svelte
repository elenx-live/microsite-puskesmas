<!--
  @component Tombol utama aplikasi dengan varian gaya dan ukuran.
-->
<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  interface Props extends HTMLButtonAttributes {
    /** Varian visual tombol. */
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    /** Ukuran tombol. */
    size?: 'sm' | 'md' | 'lg';
    /** Tampilkan spinner loading dan nonaktifkan tombol. */
    isLoading?: boolean;
    /** Konten tombol. */
    children?: Snippet;
  }

  const {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    children,
    class: className,
    ...rest
  }: Props = $props();

  const baseStyle =
    'inline-flex items-center justify-center font-semibold tracking-wider uppercase theme-button-radius transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles: Record<string, string> = {
    sm: 'text-[10px] px-3 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2.5 gap-2',
    lg: 'text-sm px-6 py-3.5 gap-2.5',
  };

  const variantStyles: Record<string, string> = {
    primary:
      'bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-text)] shadow-lg active:scale-[0.98]',
    secondary:
      'bg-[var(--color-card)] hover:opacity-80 text-[var(--color-text)] border border-[var(--color-border)]',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30',
    ghost:
      'bg-transparent hover:bg-[var(--color-bg)] text-[var(--color-text)] opacity-80 hover:opacity-100',
    outline:
      'bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:bg-opacity-10',
  };
</script>

<button
  class="{baseStyle} {sizeStyles[size]} {variantStyles[variant]} {className ?? ''}"
  disabled={disabled || isLoading}
  {...rest}
>
  {#if isLoading}
    <div class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    <span>Memuat...</span>
  {:else}
    {@render children?.()}
  {/if}
</button>
