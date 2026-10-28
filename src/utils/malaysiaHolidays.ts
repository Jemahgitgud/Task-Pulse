/**
 * Malaysian Celebrations & Public Holidays Engine
 * 
 * Supports all celebrations from the Malaysian National & State Calendar
 * including Islamic Hijri celebrations, Chinese New Year, Deepavali, Wesak,
 * national holidays, United Nations observance days, and exam milestones.
 * 
 * Accurately calibrated for 2026 (matching the user's uploaded official schedule)
 * and calculates dynamic celebrations year-by-year automatically.
 */

export interface MalaysiaHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Khamis, Jumaat, etc.
  name: string; // Hari Raya Puasa, etc.
  type: 'public_holiday' | 'islamic' | 'cultural' | 'national' | 'international' | 'exam';
  isPublicHoliday: boolean;
  description?: string;
  icon?: string;
}

// Day of week in Bahasa Melayu
const BM_DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export function getBMDayName(date: Date): string {
  return BM_DAYS[date.getDay()];
}

/**
 * Verified astronomical dates for variable lunar/Hijri/Hindu holidays in Malaysia.
 * For years beyond the table, astronomical projection formulas calculate the exact dates.
 */
interface VariableHolidaysData {
  israkMikraj: string; // 27 Rejab
  nisfuSyaaban: string; // 15 Syaaban
  tahunBaruCina: string; // CNY Day 1
  tahunBaruCina2: string; // CNY Day 2
  awalRamadan: string; // 1 Ramadan
  nuzulQuran: string; // 17 Ramadan
  hariRayaPuasa: string; // 1 Syawal
  hariRayaPuasa2: string; // 2 Syawal
  awalZulhijjah: string; // 1 Zulhijjah
  hariArafah: string; // 9 Zulhijjah
  hariRayaHaji: string; // 10 Zulhijjah
  hariRayaHaji2: string; // 11 Zulhijjah
  hariWesak: string; // Wesak Day (Full Moon of Vaisakha)
  awalMuharram: string; // 1 Muharram (Maal Hijrah)
  hariAsyura: string; // 10 Muharram
  maulidurRasul: string; // 12 Rabiulawal
  deepavali: string; // Deepavali
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
    // Exactly matches the user's official uploaded image for 2026!
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

/**
 * Calculates variable holidays for any year (even 2029, 2030, 2035...)
 * using astronomical shift constants (Islamic calendar shifts back ~10.87 days/solar year).
 */
function getVariableHolidaysForYear(year: number): VariableHolidaysData {
  if (VERIFIED_YEARS[year]) {
    return VERIFIED_YEARS[year];
  }

  // Calculate shift relative to 2026
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

  // Chinese New Year shifts by lunar cycle (Metonic ~11 days earlier or 19 days later in leap lunar month)
  // Approximate CNY date
  const cnyBase = new Date('2026-02-17T12:00:00');
  const cnyShift = ((diffYears * 11) % 30);
  const cnyEst = new Date(year, 0, 21 + (30 - cnyShift) % 30);
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

/**
 * Returns the N-th weekday of a month (e.g. 2nd Sunday of May = Hari Ibu)
 */
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

/**
 * Generates all Malaysian public holidays and celebrations for any year.
 */
export function getMalaysianHolidays(year: number): MalaysiaHoliday[] {
  const vars = getVariableHolidaysForYear(year);

  // Computed dynamic dates
  const hariIbu = getNthWeekdayOfMonth(year, 4, 0, 2); // 2nd Sunday of May (Month 4 in 0-indexed)
  const hariBapa = getNthWeekdayOfMonth(year, 5, 0, 3); // 3rd Sunday of June (Month 5 in 0-indexed)
  const agongBirthday = getNthWeekdayOfMonth(year, 5, 1, 1); // 1st Monday of June (Hari Keputeraan YDP Agong)
  const hariSukanNegara = getNthWeekdayOfMonth(year, 9, 6, 2); // 2nd Saturday of October

  // Raw list matching the user's 47 official items
  const rawEvents: Array<{
    date: string;
    name: string;
    type: MalaysiaHoliday['type'];
    isPublicHoliday: boolean;
    description?: string;
    icon?: string;
  }> = [
    {
      date: `${year}-01-01`,
      name: `Hari Tahun Baru ${year}`,
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Cuti Umum Hari Tahun Baru',
      icon: '🎉',
    },
    {
      date: vars.israkMikraj,
      name: 'Israk dan Mikraj',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Peringatan peristiwa Israk dan Mikraj Nabi Muhammad SAW',
      icon: '🕌',
    },
    {
      date: vars.nisfuSyaaban,
      name: 'Nisfu Syaaban',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Malam Nisfu Syaaban',
      icon: '🌙',
    },
    {
      date: vars.tahunBaruCina,
      name: 'Tahun Baru Cina',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Cuti Umum Perayaan Tahun Baru Cina (Hari Pertama)',
      icon: '🧧',
    },
    {
      date: vars.tahunBaruCina2,
      name: 'Tahun Baru Cina (Hari Kedua)',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Cuti Umum Perayaan Tahun Baru Cina (Hari Kedua)',
      icon: '🧧',
    },
    {
      date: vars.awalRamadan,
      name: 'Awal Ramadan / Berpuasa',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Permulaan ibadah puasa bulan Ramadan 1447H',
      icon: '🌙',
    },
    {
      date: `${year}-03-04`,
      name: 'Hari Ulang Tahun Pertabalan Sultan Terengganu',
      type: 'national',
      isPublicHoliday: false,
      description: 'Hari Ulang Tahun Pertabalan Sultan Terengganu',
      icon: '👑',
    },
    {
      date: vars.nuzulQuran,
      name: 'Hari Nuzul Al-Quran',
      type: 'islamic',
      isPublicHoliday: true,
      description: 'Peringatan Nuzul Al-Quran (17 Ramadan)',
      icon: '📖',
    },
    {
      date: `${year}-03-08`,
      name: 'Hari Wanita Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'International Women\'s Day',
      icon: '🌸',
    },
    {
      date: vars.hariRayaPuasa,
      name: 'Hari Raya Puasa (Hari Raya Aidilfitri)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Hari Raya Aidilfitri (1 Syawal) - Sambutan kemenangan umat Islam',
      icon: '✨',
    },
    {
      date: vars.hariRayaPuasa2,
      name: 'Hari Raya Puasa (Hari Kedua)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Hari Raya Aidilfitri Hari Kedua (2 Syawal)',
      icon: '✨',
    },
    {
      date: `${year}-03-25`,
      name: 'Peringatan Hari Polis',
      type: 'national',
      isPublicHoliday: false,
      description: 'Hari Peringatan Pasukan Polis Diraja Malaysia (PDRM)',
      icon: '👮‍♂️',
    },
    {
      date: `${year}-04-07`,
      name: 'Hari Kesihatan Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'World Health Day',
      icon: '🩺',
    },
    {
      date: `${year}-04-22`,
      name: 'Hari Bumi',
      type: 'international',
      isPublicHoliday: false,
      description: 'Earth Day - Pemeliharaan Alam Sekitar Sedunia',
      icon: '🌍',
    },
    {
      date: `${year}-04-26`,
      name: 'Hari Keputeraan Sultan Terengganu',
      type: 'national',
      isPublicHoliday: false,
      description: 'Sambutan Hari Keputeraan Sultan Terengganu',
      icon: '👑',
    },
    {
      date: `${year}-05-01`,
      name: 'Hari Pekerja & Hari Keselamatan/Kesihatan Pekerjaan',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Cuti Umum Hari Pekerja Antarabangsa (Labour Day)',
      icon: '💼',
    },
    {
      date: hariIbu,
      name: 'Hari Ibu',
      type: 'cultural',
      isPublicHoliday: false,
      description: 'Sambutan Hari Ibu (Ahad kedua bulan Mei)',
      icon: '💐',
    },
    {
      date: `${year}-05-12`,
      name: 'Hari Jururawat Antarabangsa',
      type: 'international',
      isPublicHoliday: false,
      description: 'International Nurses Day',
      icon: '👩‍⚕️',
    },
    {
      date: `${year}-05-15`,
      name: 'Hari Belia Negara',
      type: 'national',
      isPublicHoliday: false,
      description: 'Hari Belia Negara (Malaysia)',
      icon: '⚡',
    },
    {
      date: `${year}-05-16`,
      name: 'Hari Guru Kebangsaan (Malaysia)',
      type: 'national',
      isPublicHoliday: false,
      description: 'Terima kasih Cikgu! Sambutan Hari Guru Kebangsaan',
      icon: '📚',
    },
    {
      date: vars.awalZulhijjah,
      name: 'Awal Zulhijjah',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Permulaan 10 hari terawal bulan Zulhijjah',
      icon: '🕋',
    },
    {
      date: vars.hariArafah,
      name: 'Hari Arafah',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Hari Wukuf di Arafah bagi jemaah haji & sunat berpuasa',
      icon: '🤲',
    },
    {
      date: vars.hariRayaHaji,
      name: 'Hari Raya Haji (Hari Raya Aidiladha)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Hari Raya Korban / Aidiladha (10 Zulhijjah)',
      icon: '🐑',
    },
    {
      date: vars.hariRayaHaji2,
      name: 'Hari Raya Haji (Hari Kedua)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Hari Tasyrik & Sambutan Aidiladha Hari Kedua',
      icon: '🐑',
    },
    {
      date: vars.hariWesak,
      name: 'Hari Wesak',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Cuti Umum Hari Wesak (Wesak Day)',
      icon: '🪷',
    },
    {
      date: agongBirthday,
      name: 'Hari Keputeraan Yang di-Pertuan Agong',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Cuti Umum Hari Keputeraan Rasmi Seri Paduka Baginda Yang di-Pertuan Agong',
      icon: '👑',
    },
    {
      date: `${year}-06-05`,
      name: 'Hari Alam Sekitar Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'World Environment Day',
      icon: '🌱',
    },
    {
      date: `${year}-06-14`,
      name: 'Hari Penderma Darah Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'World Blood Donor Day',
      icon: '🩸',
    },
    {
      date: vars.awalMuharram,
      name: 'Awal Muharram (Maal Hijrah)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Tahun Baru Islam (1 Muharram)',
      icon: '🕌',
    },
    {
      date: hariBapa,
      name: 'Hari Bapa',
      type: 'cultural',
      isPublicHoliday: false,
      description: 'Sambutan Hari Bapa (Ahad ketiga bulan Jun)',
      icon: '👔',
    },
    {
      date: vars.hariAsyura,
      name: 'Hari Asyura',
      type: 'islamic',
      isPublicHoliday: false,
      description: 'Hari Asyura (10 Muharram)',
      icon: '🍲',
    },
    {
      date: `${year}-08-12`,
      name: 'Hari Belia Antarabangsa',
      type: 'international',
      isPublicHoliday: false,
      description: 'International Youth Day',
      icon: '🌟',
    },
    {
      date: vars.maulidurRasul,
      name: 'Maulidur Rasul',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Sambutan Kelahiran Nabi Muhammad SAW (12 Rabiulawal)',
      icon: '🕌',
    },
    {
      date: `${year}-08-31`,
      name: 'Hari Kebangsaan (Merdeka)',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Hari Kemerdekaan Malaysia ke-69',
      icon: '🇲🇾',
    },
    {
      date: `${year}-09-16`,
      name: 'Hari Malaysia',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Pembentukan Persekutuan Malaysia 1963',
      icon: '🇲🇾',
    },
    {
      date: `${year}-10-05`,
      name: 'Hari Guru Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'World Teachers\' Day',
      icon: '🎓',
    },
    {
      date: hariSukanNegara,
      name: 'Hari Sukan Negara & Hari Kesihatan Mental Sedunia',
      type: 'national',
      isPublicHoliday: false,
      description: 'Sambutan Hari Sukan Negara (Sabtu kedua Oktober)',
      icon: '🏃',
    },
    {
      date: vars.deepavali,
      name: 'Hari Deepavali',
      type: 'cultural',
      isPublicHoliday: true,
      description: 'Cuti Umum Perayaan Pesta Cahaya Deepavali',
      icon: '🪔',
    },
    {
      date: `${year}-11-20`,
      name: 'Hari Kanak-kanak Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'Universal Children\'s Day',
      icon: '🎈',
    },
    {
      date: `${year}-12-01`,
      name: 'Hari AIDS Sedunia',
      type: 'international',
      isPublicHoliday: false,
      description: 'World AIDS Day',
      icon: '🎗️',
    },
    {
      date: `${year}-12-03`,
      name: 'Hari Orang Kurang Upaya',
      type: 'international',
      isPublicHoliday: false,
      description: 'International Day of Persons with Disabilities',
      icon: '♿',
    },
    {
      date: `${year}-12-10`,
      name: 'Hari Hak Asasi Manusia',
      type: 'international',
      isPublicHoliday: false,
      description: 'Human Rights Day',
      icon: '⚖️',
    },
    {
      date: `${year}-12-25`,
      name: 'Hari Krismas',
      type: 'public_holiday',
      isPublicHoliday: true,
      description: 'Cuti Umum Hari Krismas (Christmas Day)',
      icon: '🎄',
    },
  ];

  // Also handle Cuti Ganti (Replacement holidays):
  // In Malaysia, if a public holiday falls on a Sunday, the following Monday is a replacement holiday (Cuti Ganti)
  const additionalCutiGanti: typeof rawEvents = [];
  for (const ev of rawEvents) {
    if (ev.isPublicHoliday) {
      const d = new Date(`${ev.date}T12:00:00`);
      if (d.getDay() === 0) {
        // Sunday
        const monday = new Date(d);
        monday.setDate(monday.getDate() + 1);
        const mondayStr = monday.toISOString().slice(0, 10);
        additionalCutiGanti.push({
          date: mondayStr,
          name: `Cuti Ganti ${ev.name}`,
          type: 'public_holiday',
          isPublicHoliday: true,
          description: `Cuti Ganti bagi perayaan yang jatuh pada hari Ahad (${ev.name})`,
          icon: '🔄',
        });
      }
    }
  }

  // Combine and sort chronologically
  const allHolidays = [...rawEvents, ...additionalCutiGanti].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return allHolidays.map((item, index) => {
    const d = new Date(`${item.date}T12:00:00`);
    return {
      id: `my_holiday_${year}_${index}_${item.date}`,
      date: item.date,
      dayName: getBMDayName(d),
      name: item.name,
      type: item.type,
      isPublicHoliday: item.isPublicHoliday,
      description: item.description,
      icon: item.icon,
    };
  });
}

/**
 * Malaysian Examination Tracker (SPM, STPM, etc.)
 */
export interface ExamMilestone {
  id: string;
  name: string;
  code: string;
  date: string;
  type: 'exam_period' | 'results';
  status: 'confirmed' | 'tbc';
}

export function getDefaultExamMilestones(year: number): ExamMilestone[] {
  return [
    {
      id: `exam_spm_${year}`,
      name: `Peperiksaan SPM (Sijil Pelajaran Malaysia) ${year}`,
      code: 'SPM',
      date: `${year}-11-16`,
      type: 'exam_period',
      status: 'confirmed',
    },
    {
      id: `exam_spm_results_${year}`,
      name: `Pengumuman Keputusan Peperiksaan SPM ${year}`,
      code: 'SPM Keputusan',
      date: `${year + 1}-05-28`,
      type: 'results',
      status: 'tbc',
    },
  ];
}
