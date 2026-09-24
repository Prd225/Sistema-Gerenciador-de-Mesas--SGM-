import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import RootErrorFallback from '@/components/layout/RootErrorFallback';

function BrokenComponent(): never {
  throw new Error('Erro simulado de renderizacao');
}

describe('RootErrorFallback e ErrorBoundary', () => {
  it('captura excecoes de renderizacao e exibe mensagem amigavel', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary FallbackComponent={RootErrorFallback}>
        <BrokenComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Falha Inesperada na Interface')).toBeDefined();
    expect(screen.getByText('Erro simulado de renderizacao')).toBeDefined();
    expect(screen.getByText('Tentar Novamente')).toBeDefined();

    spy.mockRestore();
  });
});
