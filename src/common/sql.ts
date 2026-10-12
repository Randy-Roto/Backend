/**
 * Convierte `{ nombre: 'x', correo: undefined }` en
 * `{ sql: 'nombre = ?', params: ['x'] }`.
 * Los nombres de columna salen de nuestro código, nunca del usuario.
 */
export function buildSet(campos: Record<string, unknown>): { sql: string; params: unknown[] } {
  const entradas = Object.entries(campos).filter(([, valor]) => valor !== undefined);
  return {
    sql: entradas.map(([columna]) => `${columna} = ?`).join(', '),
    params: entradas.map(([, valor]) => valor),
  };
}