const Time = {
  lunarInfo: [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ],

  solarMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],

  tianGan: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  diZhi: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'],
  animals: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
  lunarMonthName: ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'],
  lunarDayName: ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                 '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                 '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'],

  weekDays: ['日', '一', '二', '三', '四', '五', '六'],

  solarFestivals: {
    '01-01': '元旦',
    '02-14': '情人节',
    '03-08': '妇女节',
    '03-12': '植树节',
    '04-01': '愚人节',
    '05-01': '劳动节',
    '05-04': '青年节',
    '06-01': '儿童节',
    '07-01': '建党节',
    '08-01': '建军节',
    '09-10': '教师节',
    '10-01': '国庆节',
    '12-25': '圣诞节'
  },

  lunarFestivals: {
    '01-01': '春节',
    '01-15': '元宵节',
    '05-05': '端午节',
    '07-07': '七夕节',
    '07-15': '中元节',
    '08-15': '中秋节',
    '09-09': '重阳节',
    '12-08': '腊八节',
    '12-23': '小年',
    '12-30': '除夕'
  },

  solarTerms: [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
    '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
    '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
    '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
  ],

  solarTermInfo: [
    0, 21208, 42467, 63836, 85337, 107014,
    128867, 150921, 173149, 195551, 218072, 240693,
    263343, 285989, 308563, 331033, 353350, 375494,
    397447, 419210, 440795, 462224, 483532, 504758
  ],

  lYearDays(y) {
    let i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) {
      sum += (this.lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + this.leapDays(y);
  },

  leapMonth(y) {
    return this.lunarInfo[y - 1900] & 0xf;
  },

  leapDays(y) {
    if (this.leapMonth(y)) {
      return (this.lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  },

  monthDays(y, m) {
    return (this.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  },

  solarDays(y, m) {
    if (m === 2) {
      return (((y % 4 === 0) && (y % 100 !== 0)) || (y % 400 === 0)) ? 29 : 28;
    }
    return this.solarMonth[m - 1];
  },

  solar2lunar(y, m, d) {
    if (y < 1900 || y > 2100) {
      return null;
    }
    if (y === 1900 && m === 1 && d < 31) {
      return null;
    }

    let offset = 0;
    for (let i = 1900; i < y; i++) {
      offset += this.lYearDays(i);
    }
    for (let i = 1; i < m; i++) {
      offset += this.solarDays(y, i);
    }
    offset += d - 31;

    let temp = 0;
    let i;
    for (i = 1900; i < 2101 && offset > 0; i++) {
      temp = this.lYearDays(i);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      i--;
    }

    const year = i;
    const leap = this.leapMonth(i);
    let isLeap = false;

    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && !isLeap) {
        --i;
        isLeap = true;
        temp = this.leapDays(year);
      } else {
        temp = this.monthDays(year, i);
      }

      if (isLeap && i === (leap + 1)) {
        isLeap = false;
      }

      offset -= temp;
    }

    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --i;
      }
    }

    if (offset < 0) {
      offset += temp;
      --i;
    }

    const month = i;
    const day = offset + 1;

    return {
      year,
      month,
      day,
      isLeap,
      monthDays: temp,
      yearCn: this.getYearCn(year),
      monthCn: (isLeap ? '闰' : '') + this.lunarMonthName[month - 1] + '月',
      dayCn: this.lunarDayName[day - 1],
      animal: this.animals[(year - 4) % 12]
    };
  },

  getYearCn(year) {
    const gan = (year - 4) % 10;
    const zhi = (year - 4) % 12;
    return this.tianGan[gan] + this.diZhi[zhi];
  },

  getSolarTerm(y, m, d) {
    const baseDate = new Date(1900, 0, 6, 2, 5, 0);
    let tmp1, tmp2;

    for (let i = (m - 1) * 2; i < m * 2; i++) {
      tmp1 = new Date(baseDate.getTime() + this.solarTermInfo[i] * 60000);
      tmp2 = tmp1.getUTCDate();
      if (tmp2 === d) {
        return this.solarTerms[i];
      }
    }
    return null;
  },

  getFestival(y, m, d, lunarMonth, lunarDay) {
    const solarKey = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const solarFestival = this.solarFestivals[solarKey];

    const lunarKey = `${String(lunarMonth).padStart(2, '0')}-${String(lunarDay).padStart(2, '0')}`;
    const lunarFestival = this.lunarFestivals[lunarKey];

    const solarTerm = this.getSolarTerm(y, m, d);

    const festivals = [];
    if (solarFestival) festivals.push(solarFestival);
    if (lunarFestival) festivals.push(lunarFestival);
    if (solarTerm) festivals.push(solarTerm);

    return festivals.length > 0 ? festivals.join('、') : null;
  },

  getCurrentTimeInfo() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const weekDay = now.getDay();

      const lunar = this.solar2lunar(year, month, day);
      if (!lunar) {
        return `今天的日期：${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日星期${this.weekDays[weekDay]}`;
      }

      const festival = this.getFestival(year, month, day, lunar.month, lunar.day);
      const festivalStr = festival ? `，今日节日/节气：${festival}` : '，今日节日/节气：无';

      return `今天的日期：${year}年${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日星期${this.weekDays[weekDay]}，农历：${lunar.yearCn}年${lunar.monthCn}${lunar.dayCn}(${lunar.animal}年)${festivalStr}`;
    } catch (error) {
      console.error('Time calculation error:', error);
      const now = new Date();
      return `今天的日期：${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
    }
  }
};
