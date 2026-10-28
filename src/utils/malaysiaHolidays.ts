/**
 * Malaysian Public Holidays & Observances Calendar (English)
 *
 * Supports official federal/state public holidays and observances,
 * calibrated for 2025–2028+ with automatic year-by-year calculation.
 */

export interface MalaysiaHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Thu, Fri, etc.
  name: string; // Deepavali, Hari Raya Aidilfitri, etc.
  type: 'public_holiday' | 'islamic' | 'cultural' | 'national' | 'international' | 'exam';
  isPublicHoliday: boolean;
  description?: string;
  icon?: string;
}

const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getDayName(date: Date): string {
  return EN_DAYS[date.getDay()];
}

interface VariableHolidaysData {
  israkMikraj: string;
  nisfuSyaaban: string;
  tahunBaruCina: string;
  tahunBaruCina2: string;
  awalRamadan: string;
  nuzulQuran: string;
  hariRayaPuasa: string;
  hariRayaPuasa2: string;
  awalZulhijjah: string;
  hariArafah: string;
  hariRayaHaji: string;
  hariRayaHaji2: string;
  hariWesak: string;
  awalMuharram: string;
  hariAsyura: string;
  maulidurRasul: string;
  deepavali: string;
}

const VERIFIED_YEARS: Record<number, VariableHolidaysData> = {
  2025: {
    israkMikraj: '2025-01-27',
    nisfuSyaaban: '2025-02-14',
    tahunBaruCina: '2025-01-29',
    tahunBaruCina2: '2025-01-30',
    awalRamadan: '2025-03-01',
    nuzulQuran: '2025-03-17',
    hariRayaPuasa: '2025-03-31',
    hariRayaPuasa2: '2025-04-01',
    awalZulhijjah: '2025-05-28',
    hariArafah: '2025-06-05',
    hariRayaHaji: '2025-06-06',
    hariRayaHaji2: '2025-06-07',
    hariWesak: '2025-05-12',
    awalMuharram: '2025-06-27',
    hariAsyura: '2025-07-06',
    maulidurRasul: '2025-09-05',
    deepavali: '2025-10-20',
  },
  2026: {
    israkMikraj: '2026-01-17',
    nisfuSyaaban: '2026-02-02',
    tahunBaruCina: '2026-02-17',
    tahunBaruCina2: '2026-02-18',
    awalRamadan: '2026-02-19',
    nuzulQuran: '2026-03-07',
    hariRayaPuasa: '2026-03-21',
    hariRayaPuasa2: '2026-03-22',
    awalZulhijjah: '2026-05-18',
    hariArafah: '2026-05-26',
    hariRayaHaji: '2026-05-27',
    hariRayaHaji2: '2026-05-28',
    hariWesak: '2026-05-31',
    awalMuharram: '2026-06-17',
    hariAsyura: '2026-06-26',
    maulidurRasul: '2026-08-25',
    deepavali: '2026-11-08',
  },
  2027: {
    israkMikraj: '2027-01-06',
    nisfuSyaaban: '2027-01-23',
    tahunBaruCina: '2027-02-06',
    tahunBaruCina2: '2027-02-07',
    awalRamadan: '2027-02-09',
    nuzulQuran: '2027-02-25',
    hariRayaPuasa: '2027-03-10',
    hariRayaPuasa2: '2027-03-11',
    awalZulhijjah: '2027-05-08',
    hariArafah: '2027-05-16',
    hariRayaHaji: '2027-05-17',
    hariRayaHaji2: '2027-05-18',
    hariWesak: '2027-05-20',
    awalMuharram: '2027-06-06',
    hariAsyura: '2027-06-15',
    maulidurRasul: '2027-08-15',
    deepavali: '2027-10-29',
  },
  2028: {
    israkMikraj: '2027-12-26',
    nisfuSyaaban: '2028-01-12',
    tahunBaruCina: '2028-01-26',
    tahunBaruCina2: '2028-01-27',
    awalRamadan: '2028-01-28',
    nuzulQuran: '2028-02-14',
    hariRayaPuasa: '2028-02-27',
    hariRayaPuasa2: '2028-02-28',
    awalZulhijjah: '2028-04-26',
    hariArafah: '2028-05-04',
    hariRayaHaji: '2028-05-05',
    hariRayaHaji2: '2028-05-06',
    hariWesak: '2028-05-08',
    awalMuharram: '2028-05-26',
    hariAsyura: '2028-06-04',
    maulidurRasul: '2028-08-03',
    deepavali: '2028-10-17',
  },
};

function getVariableHolidaysForYear(year: number): VariableHolidaysData {
  if (VERIFIED_YEARS[year]) {
    return VERIFIED_YEARS[year];
  }

  const diffYears = year - 2026;
  const shiftDays = Math.round(diffYears * -10.875);
  const base2026 = VERIFIED_YEARS[2026];

  const shiftDate = (dateStr: string, daysToAdd: number): string => {
    const d = new Date(`${dateStr}T12:00:00`);
    d.setFullYear(d.getFullYear() + diffYears);
    d.setDate(d.getDate() + daysToAdd);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const cnyShift = (diffYears * 11) % 30;
  const cnyEst = new Date(year, 0, 21 + ((30 - cnyShift) % 30));
  const cnyStr = cnyEst.toISOString().slice(0, 10);
  const cnyNext = new Date(cnyEst);
  cnyNext.setDate(cnyNext.getDate() + 1);

  return {
    israkMikraj: shiftDate(base2026.israkMikraj, shiftDays),
    nisfuSyaaban: shiftDate(base2026.nisfuSyaaban, shiftDays),
    tahunBaruCina: cnyStr,
    tahunBaruCina2: cnyNext.toISOString().slice(0, 10),
    awalRamadan: shiftDate(base2026.awalRamadan, shiftDays),
    nuzulQuran: shiftDate(base2026.nuzulQuran, shiftDays),
    hariRayaPuasa: shiftDate(base2026.hariRayaPuasa, shiftDays),
    hariRayaPuasa2: shiftDate(base2026.hariRayaPuasa2, shiftDays),
    awalZulhijjah: shiftDate(base2026.awalZulhijjah, shiftDays),
    hariArafah: shiftDate(base2026.hariArafah, shiftDays),
    hariRayaHaji: shiftDate(base2026.hariRayaHaji, shiftDays),
    hariRayaHaji2: shiftDate(base2026.hariRayaHaji2, shiftDays),
    hariWesak: `${year}-05-15`,
    awalMuharram: shiftDate(base2026.awalMuharram, shiftDays),
    hariAsyura: shiftDate(base2026.hariAsyura, shiftDays),
    maulidurRasul: shiftDate(base2026.maulidurRasul, shiftDays),
    deepavali: shiftDate(base2026.deepavali, shiftDays),
  };
}

function getNthWeekdayOfMonth(year: number, monthIndex: number, targetWeekday: number, n: number): string {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, monthIndex, day);
    if (d.getMonth() !== monthIndex) break;
    if (d.getDay() === targetWeekday) {
      count++;
      if (count === n) {
        const m = String(monthIndex + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${year}-${m}-${dayStr}`;
      }
    }
  }
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
}

export function getMalaysianHolidays(year: number): MalaysiaHoliday[] {
  const vars = getVariableHolidaysForYear(year);

  const mothersDay = getNthWeekdayOfMonth(year, 4, 0, 2);
  const fathersDay = getNthWeekdayOfMonth(year, 5, 0, 3);
  const agongBirthday = getNthWeekdayOfMonth(year, 5, 1, 1);
  const nationalSportsDay = getNthWeekdayOfMonth(year, 9, 6, 2);

  const rawEvents: Array<{
    date: string;
    name: string;
    type: MalaysiaHoliday['type'];
    isPublicHoliday: boolean;
    description?: string;
  }> = [
    {
      date: `${year}-01-01`,
      name: `New Year's Day ${year}`,
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'New Year public holiday',
    },
    {
      date: vars.israkMikraj,
      name: 'Israk & Mikraj',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Islamic observance of Isra and Miraj',
    },
    {
      date: vars.tahunBaruCina,
      name: 'Chinese New Year',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Lunar New Year public holiday (Day 1)',
    },
    {
      date: vars.tahunBaruCina2,
      name: 'Chinese New Year (Day 2)',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Lunar New Year public holiday (Day 2)',
    },
    {
      date: vars.awalRamadan,
      name: 'Start of Ramadan',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'First day of Ramadan fasting month',
    },
    {
      date: vars.nuzulQuran,
      name: 'Nuzul Al-Quran',
      type: 'islamic',
      isPublicHoliday: true,
      description: '17th day of Ramadan public holiday',
    },
    {
      date: vars.hariRayaPuasa,
      name: 'Hari Raya Aidilfitri',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Eid al-Fitr public holiday (Day 1)',
    },
    {
      date: vars.hariRayaPuasa2,
      name: 'Hari Raya Aidilfitri (Day 2)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Eid al-Fitr public holiday (Day 2)',
    },
    {
      date: `${year}-05-01`,
      name: 'Labour Day',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'International Workers Day public holiday',
    },
    {
      date: mothersDay,
      name: "Mother's Day",
      type: 'cultural',
      isPublicHoliday: false,
      description: 'Second Sunday of May',
    },
    {
      date: vars.hariRayaHaji,
      name: 'Hari Raya Haji (Eid al-Adha)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Eid al-Adha public holiday',
    },
    {
      date: vars.hariRayaHaji2,
      name: 'Hari Raya Haji (Day 2)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Eid al-Adha Day 2 holiday',
    },
    {
      date: vars.hariWesak,
      name: 'Wesak Day',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Wesak Day public holiday',
    },
    {
      date: agongBirthday,
      name: "Yang di-Pertuan Agong's Birthday",
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Official federal birthday of the King of Malaysia',
    },
    {
      date: vars.awalMuharram,
      name: 'Awal Muharram (Islamic New Year)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'First day of Muharram public holiday',
    },
    {
      date: fathersDay,
      name: "Father's Day",
      type: 'cultural',
      isPublicHoliday: false,
      description: 'Third Sunday of June',
    },
    {
      date: vars.maulidurRasul,
      name: 'Maulidur Rasul',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: "Prophet Muhammad's Birthday public holiday",
    },
    {
      date: `${year}-08-31`,
      name: 'Merdeka Day (National Day)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Malaysia Independence Day public holiday',
    },
    {
      date: `${year}-09-16`,
      name: 'Malaysia Day',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Malaysia Federation Day public holiday',
    },
    {
      date: nationalSportsDay,
      name: 'National Sports Day',
      type: 'national',
      isPublicHoliday: false,
      description: 'Second Saturday of October',
    },
    {
      date: vars.deepavali,
      name: 'Deepavali',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Festival of Lights public holiday',
    },
    {
      date: `${year}-12-25`,
      name: 'Christmas Day',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Christmas Day public holiday',
    },
  ];

  // Replacement holiday when a public holiday falls on Sunday
  const replacementHolidays: typeof rawEvents = [];
  for (const ev of rawEvents) {
    if (ev.isPublicHoliday) {
      const d = new Date(`${ev.date}T12:00:00`);
      if (d.getDay() === 0) {
        const monday = new Date(d);
        monday.setDate(monday.getDate() + 1);
        const mondayStr = monday.toISOString().slice(0, 10);
        replacementHolidays.push({
          date: mondayStr,
          name: `${ev.name} (Replacement Holiday)`,
          type: 'public_holiday',
          isPublicHoliday: true,
          description: `Monday replacement holiday for ${ev.name}`,
        });
      }
    }
  }

  const allHolidays = [...rawEvents, ...replacementHolidays].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return allHolidays.map((item, index) => {
    const d = new Date(`${item.date}T12:00:00`);
    return {
      id: `my_holiday_${year}_${index}_${item.date}`,
      date: item.date,
      dayName: getDayName(d),
      name: item.name,
      type: item.type,
      isPublicHoliday: item.isPublicHoliday,
      description: item.description,
    };
  });
}
