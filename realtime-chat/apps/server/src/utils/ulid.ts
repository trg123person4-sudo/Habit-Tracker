import { monotonicFactory } from 'ulidx';

const ulid = monotonicFactory();

export function generateId(): string {
  return ulid();
}
