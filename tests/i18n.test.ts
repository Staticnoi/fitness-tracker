import { describe, it, expect } from 'vitest';
import { tr } from '@/utils/i18n';

describe('tr', () => {
  it('returns English text for en language', () => {
    expect(tr('en', 'home.system')).toBe('SYSTEM // COMMAND CENTER');
  });

  it('returns Indonesian text for id language', () => {
    expect(tr('id', 'home.system')).toBe('SISTEM // PUSAT KOMANDO');
  });

  it('returns the key if not found in English', () => {
    expect(tr('en', 'nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns the key if not found in Indonesian', () => {
    expect(tr('id', 'nonexistent.key')).toBe('nonexistent.key');
  });

  it('interpolates values in English', () => {
    expect(tr('en', 'home.verifySets', { count: 12 })).toBe('VERIFY ALL 12 PRESCRIBED SETS');
  });

  it('interpolates values in Indonesian', () => {
    expect(tr('id', 'home.verifySets', { count: 12 })).toBe('SELESAIKAN SEMUA 12 SET WAJIB');
  });

  it('interpolates exercise count', () => {
    expect(tr('en', 'exercise.count', { count: 5 })).toBe('5 exercises');
    expect(tr('id', 'exercise.count', { count: 5 })).toBe('5 latihan');
  });

  it('returns unmodified text when no values provided', () => {
    expect(tr('en', 'tabs.system')).toBe('System');
    expect(tr('id', 'tabs.system')).toBe('Sistem');
  });

  it('handles all tab keys', () => {
    const tabs = ['tabs.system', 'tabs.quests', 'tabs.status', 'tabs.records', 'tabs.player'];
    for (const key of tabs) {
      expect(tr('en', key)).not.toBe(key);
      expect(tr('id', key)).not.toBe(key);
    }
  });

  it('handles settings keys', () => {
    expect(tr('en', 'settings.title')).toBe('Player Dossier');
    expect(tr('id', 'settings.title')).toBe('Berkas Pemain');
  });

  it('handles active workout keys', () => {
    expect(tr('en', 'active.quest')).toBe('ACTIVE QUEST');
    expect(tr('id', 'active.quest')).toBe('MISI AKTIF');
  });

  it('handles exercise guide keys', () => {
    expect(tr('en', 'exercise.title')).toBe('Exercise Guide');
    expect(tr('id', 'exercise.title')).toBe('Panduan Latihan');
  });

  it('does not fail with empty values object', () => {
    expect(tr('en', 'home.system', {})).toBe('SYSTEM // COMMAND CENTER');
  });
});
