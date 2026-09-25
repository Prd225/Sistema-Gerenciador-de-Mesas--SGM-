import type { PingPayload } from '@sgm/shared';

/**
 * `ping` não altera a mesa nem a versão: apenas ecoa a posição enviada
 * como evento. Existe como função própria para manter o padrão dos
 * demais grupos de comando.
 */
export function ping(payload: PingPayload): PingPayload {
  return payload;
}
