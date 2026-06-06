import { ProviderAdapter } from './types';
import { gptzeroAdapter } from './gptzero';
import { copyleaksAdapter } from './copyleaks';
import { saplingAdapter } from './sapling';
import { brandwellAdapter } from './brandwell';
import { originalityAdapter } from './originality';
import { winstonAdapter } from './winston';
import { wasitaigeneratedAdapter } from './wasitaigenerated';
import { writerAdapter, crossplagAdapter, zerogptAdapter } from './placeholders';

export * from './types';

export const adapters: Record<string, ProviderAdapter> = {
  gptzero: gptzeroAdapter,
  copyleaks: copyleaksAdapter,
  sapling: saplingAdapter,
  brandwell: brandwellAdapter,
  originality: originalityAdapter,
  winston: winstonAdapter,
  wasitaigenerated: wasitaigeneratedAdapter,
  writer: writerAdapter,
  crossplag: crossplagAdapter,
  zerogpt: zerogptAdapter,
};

export function getAdapter(key: string): ProviderAdapter | undefined {
  return adapters[key];
}
