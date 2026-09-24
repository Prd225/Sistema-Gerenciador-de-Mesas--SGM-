import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';

describe('Ambiente de testes (Vitest + FakeIndexedDB)', () => {
  it('executa assercoes matematicas e logicas com sucesso', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBe(true);
  });

  it('permite transacoes IndexedDB em memoria usando Dexie e fake-indexeddb', async () => {
    const db = new Dexie('TestDb');
    db.version(1).stores({
      campaigns: 'id, name, round',
    });

    await db
      .table('campaigns')
      .put({ id: 'camp-1', name: 'Ordem Paranormal', round: 1 });
    const saved = await db.table('campaigns').get('camp-1');

    expect(saved).toBeDefined();
    expect(saved?.name).toBe('Ordem Paranormal');
    expect(saved?.round).toBe(1);
  });
});
