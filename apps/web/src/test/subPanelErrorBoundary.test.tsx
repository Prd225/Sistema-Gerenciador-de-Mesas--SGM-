import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubPanelErrorFallback from '@/components/master-panel/SubPanelErrorFallback';

describe('SubPanelErrorFallback', () => {
  it('exibe nome do subpainel e mensagem de erro isolada', () => {
    const error = new Error('Falha simulada no soundpad');
    const onClose = vi.fn();
    const reset = vi.fn();

    render(
      <SubPanelErrorFallback
        error={error}
        resetErrorBoundary={reset}
        panelId="soundpad"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Falha no painel: Soundpad')).toBeDefined();
    expect(screen.getByText('Falha simulada no soundpad')).toBeDefined();
    expect(screen.getByText('Fechar')).toBeDefined();
  });
});
