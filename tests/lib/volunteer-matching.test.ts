/**
 * FEAT-IMECE-MATCH: volunteer matching scorer + ranker unit tests.
 *
 * Pure function — no Firestore, no I/O. Deterministic.
 */
import { describe, expect, it } from 'vitest';
import {
  rankOpportunities,
  scoreMatch,
  type MatchingOpportunity,
  type MatchingUserProfile,
} from '@/lib/volunteer-matching';

const baseUser: MatchingUserProfile = {
  volunteerInfo: {
    skills: ['Eğitim', 'Mentorluk'],
    dailySkills: ['Yemek pişirme'],
    interests: ['Çocuklar', 'Eğitim'],
    languages: ['Türkçe', 'İngilizce'],
    availabilityDays: ['Cumartesi', 'Pazar'],
    availabilityTimes: ['Sabah', 'Öğleden sonra'],
    workModes: ['Yüz Yüze'],
    motivations: ['Toplumsal fayda'],
  },
  personalInfo: { address: { city: 'İstanbul' } },
};

const baseOpp = (over: Partial<MatchingOpportunity> = {}): MatchingOpportunity => ({
  id: 'o1',
  skills: [],
  interests: [],
  languages: [],
  location: { city: 'İstanbul', type: 'Saha' },
  availabilityDays: [],
  availabilityTimes: [],
  ...over,
});

describe('scoreMatch', () => {
  it('high match: skills + city + availability all overlap → score > 70', () => {
    const opp = baseOpp({
      skills: ['Eğitim', 'Mentorluk'],
      interests: ['Çocuklar', 'Eğitim'],
      languages: ['Türkçe'],
      location: { city: 'İstanbul', type: 'Saha' },
      availabilityDays: ['Cumartesi', 'Pazar'],
      availabilityTimes: ['Sabah'],
    });
    const { score, reasons } = scoreMatch(opp, baseUser);
    expect(score).toBeGreaterThan(70);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.length).toBeLessThanOrEqual(3);
  });

  it('no match: zero overlap → score 0', () => {
    const opp = baseOpp({
      skills: ['Hukuk', 'Muhasebe'],
      interests: ['Yaşlılar'],
      languages: ['Almanca'],
      location: { city: 'Ankara', type: 'Online' },
      availabilityDays: ['Pazartesi'],
      availabilityTimes: ['Akşam'],
    });
    const emptyUser: MatchingUserProfile = {
      volunteerInfo: {
        skills: ['Eğitim'],
        interests: ['Çocuklar'],
        languages: ['İngilizce'],
        availabilityDays: ['Cumartesi'],
        availabilityTimes: ['Sabah'],
        workModes: ['Yüz Yüze'],
      },
      personalInfo: { address: { city: 'İstanbul' } },
    };
    const { score, reasons } = scoreMatch(opp, emptyUser);
    expect(score).toBe(0);
    expect(reasons).toEqual([]);
  });

  it('partial match: skills only → score 30', () => {
    const opp = baseOpp({
      skills: ['Eğitim', 'Mentorluk'], // user has both → 2/2 * 30 = 30
      interests: [],
      languages: [],
      location: { city: 'Ankara', type: 'Online' }, // different city, online (user wants yüz yüze)
      availabilityDays: [],
      availabilityTimes: [],
    });
    const { score } = scoreMatch(opp, baseUser);
    expect(score).toBe(30);
  });

  it('case-insensitive and Turkish-locale-safe matching', () => {
    const opp = baseOpp({
      skills: ['EĞİTİM'],
      location: { city: 'istanbul', type: 'Saha' },
    });
    const { score } = scoreMatch(opp, baseUser);
    // skills 1/1 * 30 = 30 + city 20 + workMode 10 = 60
    expect(score).toBeGreaterThanOrEqual(60);
  });

  it('city contribution adds 20 binary points', () => {
    const oppSame = baseOpp({ location: { city: 'İstanbul' } });
    const oppDiff = baseOpp({ location: { city: 'Bursa' } });
    const same = scoreMatch(oppSame, baseUser).score;
    const diff = scoreMatch(oppDiff, baseUser).score;
    expect(same - diff).toBe(20);
  });

  it('returns at most 3 reasons', () => {
    const opp = baseOpp({
      skills: ['Eğitim'],
      interests: ['Çocuklar'],
      languages: ['Türkçe'],
      location: { city: 'İstanbul', type: 'Saha' },
      availabilityDays: ['Cumartesi'],
      availabilityTimes: ['Sabah'],
    });
    const { reasons } = scoreMatch(opp, baseUser);
    expect(reasons.length).toBeLessThanOrEqual(3);
  });

  it('handles missing / null user profile fields safely', () => {
    const sparseUser: MatchingUserProfile = {};
    const opp = baseOpp({ skills: ['x'], location: { city: 'İstanbul' } });
    const { score, reasons } = scoreMatch(opp, sparseUser);
    expect(score).toBe(0);
    expect(reasons).toEqual([]);
  });
});

describe('rankOpportunities', () => {
  it('sorts descending by score and caps at topN', () => {
    const opps: MatchingOpportunity[] = [
      baseOpp({ id: 'low', skills: ['Almanca'], location: { city: 'Ankara' } }),
      baseOpp({
        id: 'high',
        skills: ['Eğitim', 'Mentorluk'],
        interests: ['Çocuklar'],
        location: { city: 'İstanbul', type: 'Saha' },
      }),
      baseOpp({ id: 'mid', skills: ['Eğitim'], location: { city: 'Bursa' } }),
    ];
    const ranked = rankOpportunities(opps, baseUser, 10);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].opportunity.id).toBe('high');
    expect(ranked[ranked.length - 1].opportunity.id).toBe('low');
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });

  it('respects topN cap and global RANK_CAP=20', () => {
    const opps: MatchingOpportunity[] = Array.from({ length: 30 }, (_, i) =>
      baseOpp({ id: `o${i}`, skills: ['Eğitim'] }),
    );
    expect(rankOpportunities(opps, baseUser, 6)).toHaveLength(6);
    expect(rankOpportunities(opps, baseUser, 100)).toHaveLength(20);
  });

  it('returns [] for empty input', () => {
    expect(rankOpportunities([], baseUser)).toEqual([]);
  });
});
