/**
 * 小彌算命 - 核心計算引擎 fortune-core.js
 * 
 * 包含八字四柱、紫微斗數、人類圖、星座的確定性計算引擎。
 * 全部掛載在 window.XiaomiFortune 下。
 */
(function () {
  'use strict';

  // ============================================================
  // 常數表
  // ============================================================

  const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DI_ZHI  = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  const WU_XING_GAN = {
    甲: '木', 乙: '木',
    丙: '火', 丁: '火',
    戊: '土', 己: '土',
    庚: '金', 辛: '金',
    壬: '水', 癸: '水',
  };

  // 生肖對應地支索引：子0=鼠, 丑1=牛, 寅2=虎, 卯3=兔, 辰4=龍, 巳5=蛇,
  // 午6=馬, 未7=羊, 申8=猴, 酉9=雞, 戌10=狗, 亥11=豬
  const SHENG_XIAO = {
    0: '鼠', 1: '牛', 2: '虎', 3: '兔', 4: '龍', 5: '蛇',
    6: '馬', 7: '羊', 8: '猴', 9: '雞', 10: '狗', 11: '豬',
  };

  // 時辰地支對應（hour 參數為地支名稱 -> 索引）
  const HOUR_ZHI_INDEX = {
    子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5,
    午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11,
  };

  // 月地支對應（month 1-based -> 地支索引）
  const MONTH_ZHI_INDEX = [null, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
  // month 1=寅(2), 2=卯(3), ..., 11=子(0), 12=丑(1)

  // 節氣日期（近似值，用於八字月柱計算）
  // 每個節氣在該月的近似日：立春、驚蟄、清明、立夏、芒種、小暑、
  // 立秋、白露、寒露、立冬、大雪、小寒
  const JIE_QI_DAY = [4, 6, 5, 6, 6, 7, 7, 7, 8, 7, 7, 6];
  // 對應月份: 2月立春(4), 3月驚蟄(6), 4月清明(5), 5月立夏(6),
  //           6月芒種(6), 7月小暑(7), 8月立秋(7), 9月白露(7),
  //           10月寒露(8), 11月立冬(7), 12月大雪(7), 1月小寒(6)

  // 立春精確日期（1900-2100，格式：[month, day]）
  // 立春通常在2月3-5日，每年略有不同
  // 1900-1909: 2月5日, 1910-1929: 2月5-4日, 1930-1959: 2月4-5日,
  // 1960-1991: 2月4-5日, 1992-2024: 2月3-5日, 2025-2100: 2月3-4日
  // 這裡用標準近似值：1900-1919 2/5, 1920-1991 2/4 or 2/5, 1992-2024 2/4偏3, 2025+ 2/3
  function getLichunDate(year) {
    if (year < 1920) return { month: 2, day: 5 };
    if (year < 1992) return { month: 2, day: 4 };
    if (year < 2025) return { month: 2, day: 4 };
    return { month: 2, day: 3 };
  }

  /**
   * 計算八字年柱用的基準年份（以立春為界）
   */
  function getBaziBaseYear(year, month, day) {
    var lichun = getLichunDate(year);
    if (month < lichun.month || (month === lichun.month && day < lichun.day)) {
      // 立春前：還是前一年
      return year - 1;
    }
    return year;
  }

  /**
   * 根據節氣決定月地支
   * @param {number} year
   * @param {number} month - 1-based
   * @param {number} day
   * @returns {number} 地支索引（寅=2, 卯=3, ..., 丑=1）
   */
  function getMonthZhiByJieQi(year, month, day) {
    // 以立春（寅月=索引2）為正月起點
    // 月份順序：寅(2)卯(3)辰(4)巳(5)午(6)未(7)申(8)酉(9)戌(10)亥(11)子(0)丑(1)
    // 節氣對應：立春(2月)→驚蟄(3月)→清明(4月)→立夏(5月)→芒種(6月)→...
    // 但白露(9月)→寒露(10月)→立冬(11月)→大雪(12月)→小寒(1月)→立春(2月)

    // JIE_QI_DAY 索引 0=2月立春, 1=3月驚蟄, ..., 10=12月大雪, 11=1月小寒
    // 月地支從立春(2月)開始為寅(2)

    // 如果是1月：先看是否在小寒之後(農曆十二月=丑)
    if (month === 1) {
      if (day >= JIE_QI_DAY[11]) { // 1月6日後 = 丑月(索引1)
        return 1;
      } else { // 1月6日前 = 還是前一年的子月(索引0)
        return 0;
      }
    }

    // 其他月份：看是否到了該月的節氣
    // 2月立春(索引0) → 寅(2)
    // 3月驚蟄(索引1) → 卯(3)
    // ...
    // 12月大雪(索引10) → 子(0)
    var monthOffset = month - 2; // 2月=0, 3月=1, ..., 12月=10
    // 2月4日後 = 寅(2)，之前 = 丑(1)
    if (day >= JIE_QI_DAY[monthOffset]) {
      return (monthOffset + 2) % 12; // 2月→2(寅), 3月→3(卯), ..., 12月→12%12=0(子)
    } else {
      // 還沒到節氣 → 上個月的月地支
      return monthOffset + 1; // 2月→1(丑), 3月→2(寅), ..., 12月→11(亥)
    }
  }

  // 五虎遁（年上起月法）：年天干索引 -> [正月天干, 二月天干, ...]
  const WU_HU_DUN = {
    // 甲己之年丙作首
    0: [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3],  // 甲
    5: [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3],  // 己
    // 乙庚之歲戊為頭
    1: [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5],  // 乙
    6: [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5],  // 庚
    // 丙辛之年尋庚上
    2: [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7],  // 丙
    7: [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7],  // 辛
    // 丁壬壬寅順水流
    3: [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // 丁
    8: [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // 壬
    // 戊癸何方發，甲寅之上好追求
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1],  // 戊
    9: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1],  // 癸
  };

  // 五鼠遁（日上起時法）：日天干索引 -> [子時天干, 丑時天干, ...]
  const WU_SHU_DUN = {
    // 甲己還加甲
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1],  // 甲
    5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1],  // 己
    // 乙庚丙作初
    1: [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3],  // 乙
    6: [2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3],  // 庚
    // 丙辛從戊起
    2: [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5],  // 丙
    7: [4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5],  // 辛
    // 丁壬庚子居
    3: [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7],  // 丁
    8: [6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7],  // 壬
    // 戊癸何方發，壬子是真途
    4: [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // 戊
    9: [8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  // 癸
  };

  // 星座相關
  const SUN_CUTOFF  = [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 20];
  const SUN_NAMES   = ['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'];
  const MOON_NAMES  = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];
  const RISING_NAMES = ['牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手', '摩羯', '水瓶', '雙魚'];

  // 時辰->小時偏移（用於上升星座）
  const HOUR_OFFSET = {
    子: 0, 丑: 1, 寅: 2, 卯: 3, 辰: 4, 巳: 5,
    午: 6, 未: 7, 申: 8, 酉: 9, 戌: 10, 亥: 11,
  };

  // ============================================================
  // 農曆轉換（1900-2100）
  // ============================================================

  // 農曆1900-2100的閏大小信息表
  // 編碼：bit0-3=閏月月份(0=無), bit4=閏月大小(0=29,1=30), bit5-16=12個月大小(1=30天,0=29天)
  var LUNAR_INFO = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06aa0,0x1a6c4,0x0aae0,
    0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
    0x0d520,
  ];

  /**
   * 陽曆轉農曆（1900-2100）
   * @param {number} year - 西元年
   * @param {number} month - 1-based
   * @param {number} day - 日期
   * @returns {{lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean}}
   */
  function solar2lunar(year, month, day) {
    // 基準：1900/1/31 = 農曆正月初一
    var baseMs = Date.UTC(1900, 0, 31);
    var targetMs = Date.UTC(year, month - 1, day);
    var offset = Math.round((targetMs - baseMs) / 86400000);

    if (offset < 0 || offset > 73327) {
      return { lunarYear: year, lunarMonth: month, lunarDay: day, isLeap: false };
    }

    var lunarYear, lunarMonth, lunarDay, isLeap = false;
    var days = offset;

    // 逐年找到所在的農曆年
    for (lunarYear = 1900; lunarYear < 2101; lunarYear++) {
      var yearDays = lunarYearDays(lunarYear);
      if (days < yearDays) break;
      days -= yearDays;
    }
    if (lunarYear > 2100) {
      return { lunarYear: year, lunarMonth: month, lunarDay: day, isLeap: false };
    }

    // 逐月找所在的農曆月
    var leapM = leapMonthOf(lunarYear);
    var monthList = [];
    for (var i = 1; i <= 12; i++) {
      monthList.push({ m: i, isLeap: false });
      if (leapM === i) {
        monthList.push({ m: i, isLeap: true });
      }
    }

    for (var mi = 0; mi < monthList.length; mi++) {
      var cur = monthList[mi];
      var mDays = cur.isLeap ? (leapMonthDays(lunarYear)) : lunarMonthDays(lunarYear, cur.m);
      if (days < mDays) {
        lunarMonth = cur.m;
        isLeap = cur.isLeap;
        lunarDay = days + 1;
        return { lunarYear: lunarYear, lunarMonth: lunarMonth, lunarDay: lunarDay, isLeap: isLeap };
      }
      days -= mDays;
    }

    // 不該到這裡
    return { lunarYear: lunarYear, lunarMonth: 12, lunarDay: days + 1, isLeap: false };
  }

  /** 該年農曆總天數 */
  function lunarYearDays(year) {
    var idx = year - 1900;
    var total = 0;
    for (var i = 1; i <= 12; i++) {
      total += lunarMonthDays(year, i);
    }
    var leap = leapMonthDays(year);
    if (leap > 0) total += leap;
    return total;
  }

  /** 該月天數（1-based） */
  function lunarMonthDays(year, month) {
    var idx = year - 1900;
    return (LUNAR_INFO[idx] & (1 << (4 + month))) ? 30 : 29;
  }

  /** 閏月月份（0=無閏月） */
  function leapMonthOf(year) {
    return LUNAR_INFO[year - 1900] & 0xf;
  }

  /** 閏月天數 */
  function leapMonthDays(year) {
    return (LUNAR_INFO[year - 1900] & 0x10) ? 30 : 29;
  }

  // 人類圖類型（已有實作常數保留供參考）

  // ============================================================
  // 偽隨機函數 mulberry32
  // ============================================================

  /**
   * Mulberry32 偽隨機數生成器
   * @param {number} a - 種子整數
   * @returns {function(): number} 返回 0~1 的偽隨機數
   */
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * 由年月日產生種子，返回 mulberry32 隨機函數
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @returns {function(): number}
   */
  function seededRandom(year, month, day) {
    var seed = year * 10000 + month * 100 + day;
    return mulberry32(seed);
  }

  // ============================================================
  // 1. 八字四柱
  // ============================================================

  /**
   * 計算八字四柱
   * @param {number} year  - 西元年份
   * @param {number} month - 月份（1-based）
   * @param {number} day   - 日期
   * @param {string} hour  - 時辰地支名稱（子丑寅卯辰巳午未申酉戌亥）
   * @returns {object}
   */
  function calcBazi(year, month, day, hour) {
    // --- 年柱 ---
    // 年柱以立春為界
    var baseYear = getBaziBaseYear(year, month, day);
    var yearGanIdx = ((baseYear - 4) % 10 + 10) % 10;
    var yearZhiIdx = ((baseYear - 4) % 12 + 12) % 12;
    var zodiacIdx = yearZhiIdx; // 子0=鼠，直接對應
    var yearGan  = TIAN_GAN[yearGanIdx];
    var yearZhi  = DI_ZHI[yearZhiIdx];
    var yearGanzhi = yearGan + yearZhi;

    // --- 月柱（用節氣決定）---
    var monthZhiIdx = getMonthZhiByJieQi(year, month, day);
    var monthZhi = DI_ZHI[monthZhiIdx];
    // 五虎遁：以寅月(索引2)為正月(=0)，所以要轉換
    var lunarMonthIdx = ((monthZhiIdx - 2) % 12 + 12) % 12; // 寅=0, 卯=1, ..., 丑=11
    var monthGanIdx = WU_HU_DUN[yearGanIdx][lunarMonthIdx];
    var monthGan = TIAN_GAN[monthGanIdx];
    var monthGanzhi = monthGan + monthZhi;

    // --- 日柱（基準日偏移法）---
    // 基準：2000年1月1日 = 戊午日（天干4=戊，地支6=午）
    var baseMs = Date.UTC(2000, 0, 1);
    var targetMs = Date.UTC(year, month - 1, day);

    // 計算天數差
    var diff = Math.round((targetMs - baseMs) / 86400000);

    // 日天干 = ((基準天干 + diff) % 10 + 10) % 10
    var dayGanIdx = ((4 + diff) % 10 + 10) % 10;
    // 日地支 = ((基準地支 + diff) % 12 + 12) % 12
    var dayZhiIdx = ((6 + diff) % 12 + 12) % 12;

    var dayGan  = TIAN_GAN[dayGanIdx];
    var dayZhi  = DI_ZHI[dayZhiIdx];
    var dayGanzhi = dayGan + dayZhi;

    // --- 時柱（五鼠遁）---
    var hourZhiIdx = HOUR_ZHI_INDEX[hour];
    if (hourZhiIdx === undefined) {
      throw new Error('無效的時辰：' + hour + '，應為子丑寅卯辰巳午未申酉戌亥之一');
    }
    var hourGanIdx = WU_SHU_DUN[dayGanIdx][hourZhiIdx];
    var hourGan = TIAN_GAN[hourGanIdx];
    var hourZhi = DI_ZHI[hourZhiIdx];
    var hourGanzhi = hourGan + hourZhi;

    // 時柱五鼠遁一致性驗證（防呆）
    // 子時天干應該 = WU_SHU_DUN[dayGanIdx][0]
    var expectedZiGan = WU_SHU_DUN[dayGanIdx][0];
    var actualZiGan = WU_SHU_DUN[dayGanIdx][hourZhiIdx];
    // 如果日干和時干不合五鼠遁規則（理論上不該發生），但保留做測試點
    var hourVerified = true;

    // 日主五行
    var dayWuxing = WU_XING_GAN[dayGan];

    // 年柱生肖
    var yearZodiac = SHENG_XIAO[zodiacIdx];

    return {
      yearGan: yearGan,
      yearZhi: yearZhi,
      monthGan: monthGan,
      monthZhi: monthZhi,
      dayGan: dayGan,
      dayZhi: dayZhi,
      hourGan: hourGan,
      hourZhi: hourZhi,
      yearGanzhi: yearGanzhi,
      monthGanzhi: monthGanzhi,
      dayGanzhi: dayGanzhi,
      hourGanzhi: hourGanzhi,
      dayWuxing: dayWuxing,
      yearZodiac: yearZodiac,
    };
  }

  // ============================================================
  // 2. 紫微斗數（完整排盤）
  // ============================================================

  // 十二宮名稱（從命宮逆排）
  const ZIWEI_PALACES = [
    '命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮',
    '遷移宮', '交友宮', '事業宮', '田宅宮', '福德宮', '父母宮',
  ];

  // 14主星
  const ZIWEI_MAIN_STARS = [
    '紫微', '天機', '空', '太陽', '武曲', '天同', '空', '廉貞',
    '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '空', '破軍',
  ];
  // 索引映射: 0紫微,1天機,3太陽,4武曲,5天同,7廉貞,8天府,9太陰,10貪狼,11巨門,12天相,13天梁,14七殺,16破軍

  // 紫微系（逆行）：紫微→天機→空→太陽→武曲→天同→空→廉貞
  // 天府系（順行）：天府→太陰→貪狼→巨門→天相→天梁→七殺→空→破軍
  // 紫微和天府永遠在紫微系和天府系的對應位置

  // 紫微對天府表：紫微在X宮，天府就在(12-X)宮
  // 紫微在子(0)→天府在辰(4)，紫微在丑(1)→天府在卯(3)，...
  // 公式：天府位置 = (12 - 紫微位置 + 4) % 12 → (4 - 紫微位置 + 12) % 12
  function tianfuPosition(ziweiIdx) {
    return ((4 - ziweiIdx) % 12 + 12) % 12;
  }

  // 紫微系主星位置（從紫微宮開始逆排，跳過空位）
  const ZIWEI_XI = [0, 1, -1, 3, 4, 5, -1, 7]; // 索引→主星索引,-1=空
  // 天府系主星位置（從天府宮開始順排，跳過空位）
  const TIANFU_XI = [8, 9, 10, 11, 12, 13, 14, -1, 16]; // 索引→主星索引,-1=空

  // 輔星（動態計算，不預設常數表）

  // 天魁天鉞（年干決定）：甲戊庚牛羊，乙己鼠猴鄉，丙丁豬雞位，六辛逢虎馬，壬癸蛇兔藏
  const KUI = [1, 0, 11, 10, 1, 0, 1, 2, 3, 3];  // 天魁
  const YUE = [7, 8, 9, 9, 7, 8, 7, 6, 5, 5];    // 天鉞

  // 文昌文曲（時辰決定）
  // 文昌從戌(10)起逆數到生時，文曲從辰(4)起順數到生時
  function wenChang(hourIdx) { return ((10 - hourIdx) % 12 + 12) % 12; }
  function wenQu(hourIdx) { return ((4 + hourIdx) % 12 + 12) % 12; }

  // 擎羊陀羅（年支決定）：擎羊=年支+1，陀羅=年支-1
  function qingYang(yearZhiIdx) { return (yearZhiIdx + 1) % 12; }
  function tuoLuo(yearZhiIdx) { return ((yearZhiIdx - 1) % 12 + 12) % 12; }

  // 火星鈴星（年支+時辰決定）
  // 火星：年支三合局決定起點，順數生時格數
  // 口訣：申子辰人寅戌揚，寅午戌人丑卯方，巳酉丑人卯戌位，亥卯未人酉戌房
  // 鈴星：年支三合局決定起點，逆數生時格數（或另有口訣）
  var HUO_BASE = { 0:2, 4:2, 8:2, 2:1, 6:1, 10:1, 3:3, 7:3, 11:3, 1:9, 5:9, 9:9 };
  var LING_BASE = { 0:0, 4:0, 8:0, 2:4, 6:4, 10:4, 3:8, 7:8, 11:8, 1:6, 5:6, 9:6 };
  function huoXing(yearZhiIdx, hourIdx) {
    var base = HUO_BASE[yearZhiIdx] !== undefined ? HUO_BASE[yearZhiIdx] : 2;
    return ((base + hourIdx) % 12 + 12) % 12;
  }
  function lingXing(yearZhiIdx, hourIdx) {
    var base = LING_BASE[yearZhiIdx] !== undefined ? LING_BASE[yearZhiIdx] : 0;
    return ((base - hourIdx) % 12 + 12) % 12;
  }

  // 祿存（年干決定）：甲祿到寅，乙祿到卯，丙戊祿在巳，丁己祿在午，庚祿居中，辛祿到酉，壬祿到亥，癸祿到子
  const LU_CUN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];

  // 地空地劫（年支決定）
  // 地空：亥卯未人申(8)，巳酉丑人午(6)，申子辰人寅(2)，寅午戌人戌(10)
  // 地劫：亥卯未人巳(5)，巳酉丑人酉(9)，申子辰人亥(11)，寅午戌人辰(4)
  function diKong(yearZhiIdx) {
    var map = {0:2,4:2,8:2, 2:10,6:10,10:10, 3:6,7:6,11:6, 1:8,5:8,9:8};
    return map[yearZhiIdx] !== undefined ? map[yearZhiIdx] : 2;
  }
  function diJie(yearZhiIdx) {
    var map = {0:11,4:11,8:11, 2:4,6:4,10:4, 3:9,7:9,11:9, 1:5,5:5,9:5};
    return map[yearZhiIdx] !== undefined ? map[yearZhiIdx] : 11;
  }

  // 左輔右弼（月支/時辰決定）
  // 左輔：辰(4)宮起順數到生月
  // 右弼：戌(10)宮起逆數到生月
  function zuoFu(month) { return ((4 + (month - 1)) % 12 + 12) % 12; }
  function youBi(month) { return ((10 - (month - 1)) % 12 + 12) % 12; }

  // 四化（年干決定）[化祿, 化權, 化科, 化忌]
  // 依 ZIWEI_MAIN_STARS 索引：0紫微,1天機,3太陽,4武曲,5天同,7廉貞,8天府,9太陰,10貪狼,11巨門,12天相,13天梁,14七殺,16破軍
  // -1表示輔星（文昌文曲左輔右弼會另外處理）
  var SIHUA_BY_GAN = [
    [7, 16, 4, 3],     // 甲：廉貞,破軍,武曲,太陽
    [1, 13, 0, 9],     // 乙：天機,天梁,紫微,太陰
    [5, 1, -2, 7],     // 丙：天同,天機,文昌(輔),廉貞
    [9, 5, 1, 11],     // 丁：太陰,天同,天機,巨門
    [10, 9, -3, 1],    // 戊：貪狼,太陰,右弼(輔),天機
    [4, 10, 13, -4],   // 己：武曲,貪狼,天梁,文曲(輔)
    [3, 4, 9, 5],      // 庚：太陽,武曲,太陰,天同
    [11, 3, -4, -2],   // 辛：巨門,太陽,文曲(輔),文昌(輔)
    [13, 0, -5, 4],    // 壬：天梁,紫微,左輔(輔),武曲
    [16, 11, 9, 10],   // 癸：破軍,巨門,太陰,貪狼
  ];
  // 輔星四化名稱對應：-2=文昌, -3=右弼, -4=文曲, -5=左輔

  // === 暫且簡化輔星（只放天魁天鉞、文昌文曲、擎羊陀羅）===
  // 火星鈴星、地空地劫需要更繁複的對照表，後續再補

  /**
   * 紫微斗數真實排盤
   * @param {number} year
   * @param {number} month - 1-based
   * @param {number} day
   * @param {string|number} hour - 時辰名稱
   * @param {string} gender - '男' 或 '女'
   * @returns {object}
   */
  function calcZiwei(year, month, day, hour, gender) {
    // --- 1. 定命宮 ---
    // 寅宮(2)起正月，順數生月，逆數生時
    var hourIdx = HOUR_ZHI_INDEX[hour];
    if (hourIdx === undefined) hourIdx = 0; // 預設子時
    
    var mingGongIdx = ((2 + (month - 1) - hourIdx) % 12 + 12) % 12;
    
    // 逆排十二宮
    var palIndex = {};
    for (var i = 0; i < 12; i++) {
      var idx = ((mingGongIdx - i) % 12 + 12) % 12;
      palIndex[ZIWEI_PALACES[i]] = idx;
    }

    // --- 2. 定命宮天干（五虎遁）---
    // 年柱天干（用立春判斷）
    var baseYear = getBaziBaseYear(year, month, day);
    var yearGanIdx = ((baseYear - 4) % 10 + 10) % 10;
    var yearZhiIdx = ((baseYear - 4) % 12 + 12) % 12;

    // 寅宮天干 = 五虎遁第一月
    var yinGanIdx = WU_HU_DUN[yearGanIdx][0];
    
    // 各宮天干（從寅宮起順排）
    var palGan = {};
    for (var i = 0; i < 12; i++) {
      var zhiIdx = i; // 地支索引0-11
      var ganIdx = ((yinGanIdx + (i - 2)) % 10 + 10) % 10; // 寅=2對應yinGanIdx
      palGan[zhiIdx] = ganIdx;
    }

    // --- 3. 定五行局 ---
    var mingGongZhi = mingGongIdx; // 命宮地支
    var mingGongGan = palGan[mingGongZhi]; // 命宮天干
    
    // 納音五行表（六十甲子→五行）
    var nayinMap = [
      '金','金','火','火','木','木','土','土','金','金',  // 0-9: 甲子~癸酉
      '火','火','水','水','土','土','金','金','木','木',  // 10-19: 甲戌~癸未
      '水','水','土','土','火','火','木','木','水','水',  // 20-29: 甲申~癸巳
      '金','金','火','火','木','木','土','土','金','金',  // 30-39: 甲午~癸卯
      '火','火','水','水','土','土','金','金','木','木',  // 40-49: 甲辰~癸丑
      '水','水','土','土','火','火','木','木','水','水',  // 50-59: 甲寅~癸亥
    ];

    // 六十甲子索引 = (天干 % 10) 但需要正確公式
    function getNayinIndex(ganIdx, zhiIdx) {
      // 六十甲子排序：天干和地支各自循環
      // 可以從已知點推算：甲子(0,0)=0, 乙丑(1,1)=1, ...
      // 但公式是：從甲子開始配，甲子(0%10,0%12) = 索引0
      // 索引 = (ganIdx - zhiIdx % 10 + 10) % 10 之類的...不對
      // 用最簡單方式：六十甲子從甲子開始配對
      // 甲子0, 乙丑1, ..., 癸酉9, 甲戌10, ..., 癸未19, ...
      // 索引公式：(天干 - 地支 + 12) %... 也不對
      // 最簡單：遍歷60次找匹配
      for (var i = 0; i < 60; i++) {
        if (i % 10 === ganIdx && i % 12 === zhiIdx) return i;
      }
      return -1;
    }

    var nayinIdx = getNayinIndex(mingGongGan, mingGongZhi);
    var wuxing = nayinMap[nayinIdx];
    var wuxingToJu = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };
    var juShu = wuxingToJu[wuxing];
    
    // --- 4. 安紫微星（標準公式）---
    // 公式：紫微從寅宮(2)開始，每局數天一格
    // quotient = floor((lunarDay - 1) / juShu)
    // 整除：紫微 = 寅(2) + quotient - 1（商0在寅，商1在卯...）
    // 不整除：紫微 = 寅(2) + quotient
    function calcZiweiPos(lunarDay, juShu) {
      var quotient = Math.floor((lunarDay - 1) / juShu);
      if (lunarDay % juShu === 0) {
        return ((2 + quotient - 1) % 12 + 12) % 12;
      } else {
        return ((2 + quotient) % 12 + 12) % 12;
      }
    }

    // 紫微斗數用農曆生日
    var lunar = solar2lunar(year, month, day);
    var lunarDay = lunar.lunarDay;
    
    var ziweiPos = calcZiweiPos(lunarDay, juShu);
    
    // --- 5. 安14主星 ---
    var tianfuPos = ((4 - ziweiPos) % 12 + 12) % 12;
    
    // 各宮主星（支援雙星同宮）
    var starPositions = {};
    for (var i = 0; i < 12; i++) starPositions[i] = { main: [], support: [] };

    // 紫微系（0紫微,1天機,3太陽,4武曲,5天同,7廉貞）
    var ziweiOffsets = [0, -1, -3, -4, -5, -8];
    var ziweiStarIdx = [0, 1, 3, 4, 5, 7];
    for (var si = 0; si < ziweiStarIdx.length; si++) {
      var pos = ((ziweiPos + ziweiOffsets[si]) % 12 + 12) % 12;
      starPositions[pos].main.push(ZIWEI_MAIN_STARS[ziweiStarIdx[si]]);
    }

    // 天府系（8天府,9太陰,10貪狼,11巨門,12天相,13天梁,14七殺,16破軍）
    var tianfuOffsets = [0, 1, 2, 3, 4, 5, 6, 10];
    var tianfuStarIdx = [8, 9, 10, 11, 12, 13, 14, 16];
    for (var si = 0; si < tianfuStarIdx.length; si++) {
      var pos = ((tianfuPos + tianfuOffsets[si]) % 12 + 12) % 12;
      starPositions[pos].main.push(ZIWEI_MAIN_STARS[tianfuStarIdx[si]]);
    }

    // --- 6. 安輔星 ---

    // 天魁天鉞
    var kuiPos = KUI[yearGanIdx];
    var yuePos = YUE[yearGanIdx];
    starPositions[kuiPos].support.push('天魁');
    starPositions[yuePos].support.push('天鉞');

    // 文昌文曲
    var wcPos = wenChang(hourIdx);
    var wqPos = wenQu(hourIdx);
    starPositions[wcPos].support.push('文昌');
    starPositions[wqPos].support.push('文曲');

    // 擎羊陀羅
    var qyPos = qingYang(yearZhiIdx);
    var tlPos = tuoLuo(yearZhiIdx);
    starPositions[qyPos].support.push('擎羊');
    starPositions[tlPos].support.push('陀羅');

    // 火星鈴星
    var hxPos = huoXing(yearZhiIdx, hourIdx);
    var lxPos = lingXing(yearZhiIdx, hourIdx);
    starPositions[hxPos].support.push('火星');
    starPositions[lxPos].support.push('鈴星');

    // 祿存
    var lcPos = LU_CUN[yearGanIdx];
    starPositions[lcPos].support.push('祿存');

    // 地空地劫
    var dkPos = diKong(yearZhiIdx);
    var djPos = diJie(yearZhiIdx);
    starPositions[dkPos].support.push('地空');
    starPositions[djPos].support.push('地劫');

    // 左輔右弼
    var zfPos = zuoFu(month);
    var ybPos = youBi(month);
    starPositions[zfPos].support.push('左輔');
    starPositions[ybPos].support.push('右弼');

    // --- 7. 四化 ---
    var sihua = SIHUA_BY_GAN[yearGanIdx];
    var sihuaData = []; // {star: '廉貞', hua: '化祿', pos: 地支索引}
    var huaNames = ['化祿', '化權', '化科', '化忌'];
    var huaToSupport = ['祿', '權', '科', '忌'];
    for (var hi = 0; hi < 4; hi++) {
      var starIdx = sihua[hi];
      if (starIdx >= 0) {
        // 主星四化
        var starName = ZIWEI_MAIN_STARS[starIdx];
        // 找到這顆星在哪一宮（main 現在是陣列）
        for (var si = 0; si < 12; si++) {
          if (starPositions[si].main.indexOf(starName) !== -1) {
            starPositions[si].support.push(huaToSupport[hi]);
            sihuaData.push({star: starName, hua: huaNames[hi], pos: si});
            break;
          }
        }
      } else {
        // 輔星四化：-2=文昌, -3=右弼, -4=文曲, -5=左輔
        var fuStarName = '';
        if (starIdx === -2) fuStarName = '文昌';
        else if (starIdx === -3) fuStarName = '右弼';
        else if (starIdx === -4) fuStarName = '文曲';
        else if (starIdx === -5) fuStarName = '左輔';
        if (fuStarName) {
          for (var si = 0; si < 12; si++) {
            if (starPositions[si].support.indexOf(fuStarName) !== -1) {
              starPositions[si].support.push(huaToSupport[hi]);
              sihuaData.push({star: fuStarName, hua: huaNames[hi], pos: si});
              break;
            }
          }
        }
      }
    }

    // --- 建構輸出 ---
    var palData = {};
    for (var i = 0; i < 12; i++) {
      var palName = ZIWEI_PALACES[i];
      var zhi = palIndex[palName];
      palData[palName] = {
        zhi: DI_ZHI[zhi],
        zhiIdx: zhi,
        gan: TIAN_GAN[palGan[zhi]],
        ganIdx: palGan[zhi],
        mainStar: starPositions[zhi].main.join(' '),
        supportStars: starPositions[zhi].support,
        isMingGong: zhi === mingGongIdx,
      };
    }

    return {
      mingGong: {
        name: '命宮',
        zhi: DI_ZHI[mingGongIdx],
        gan: TIAN_GAN[mingGongGan],
        ganzhi: TIAN_GAN[mingGongGan] + DI_ZHI[mingGongIdx],
      },
      wuxingJu: wuxing + juShu + '局',
      juShu: juShu,
      ziweiPosition: DI_ZHI[ziweiPos],
      tianfuPosition: DI_ZHI[tianfuPos],
      starPositions: starPositions,
      palaces: palData,
      sihua: sihuaData,
      mainStar: starPositions[mingGongIdx].main.join(' ') || '無主星',
      supportStar: starPositions[mingGongIdx].support.join('、'),
      // 保留舊版欄位相容
      mainPosition: ZIWEI_PALACES[0],
      description: '',
    };
  }

  // ============================================================
  // 3. 人類圖（太陽位置計算，基於天文演算法）
  // ============================================================

  var PI = Math.PI;

  function mod(a, b) {
    return ((a % b) + b) % b;
  }

  function calcSunEclipticLongitude(year, month, day, hour) {
    var y = year;
    var m = month;
    var d = day;
    var h = (hour || 0);
    var JD = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + 1721013.5 + h / 24;
    var n = JD - 2451545.0;
    var L = mod(280.460 + 0.98564736 * n, 360);
    var g = mod(357.528 + 0.98560028 * n, 360);
    var C = 1.915 * Math.sin(g * PI / 180) + 0.020 * Math.sin(2 * g * PI / 180);
    var lambda = mod(L + C, 360);
    return lambda;
  }

  function calcSunGate(lambda) {
    var gate = Math.floor(lambda / 5.625) + 1;
    if (gate < 1) gate = 1;
    if (gate > 64) gate = 64;
    return gate;
  }

  var HUMAN_DESIGN_CENTERS = {
    Head: [61, 63, 64],
    Ajna: [8, 11, 16, 17, 24, 43, 47],
    Throat: [12, 20, 23, 31, 33, 35, 45, 56, 62],
    G: [1, 2, 4, 7, 10, 13, 15, 25, 46],
    Heart: [21, 26, 40, 51],
    Sacral: [3, 5, 9, 14, 27, 29, 34, 42, 59],
    Spleen: [18, 20, 28, 32, 44, 48, 50, 57],
    SolarPlexus: [6, 22, 30, 36, 37, 49, 55],
    Root: [19, 38, 39, 41, 52, 53, 54, 58, 60]
  };

  function getCentersForGate(gate) {
    var res = [];
    var names = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'Spleen', 'SolarPlexus', 'Root'];
    for (var i = 0; i < names.length; i++) {
      var c = names[i];
      var gates = HUMAN_DESIGN_CENTERS[c];
      for (var j = 0; j < gates.length; j++) {
        if (gates[j] === gate) {
          res.push(c);
          break;
        }
      }
    }
    return res;
  }

  var RENLEITU_TYPES = ['顯示者', '生產者', '顯示生產者', '投射者', '反映者'];

  /**
   * 人類圖計算（基於太陽位置）
   * 註：實際人類圖需要太陽+地球+其他天體位置，本實作為太陽位置簡化版
   * @param {number} year
   * @param {number} month - 1-based
   * @param {number} day
   * @param {number} hour - 數值小時（0-23）
   * @returns {object}
   */
  function calcRenleitu(year, month, day, hour) {
    var lambda = calcSunEclipticLongitude(year, month, day, hour);
    var sunGate = calcSunGate(lambda);
    var earthGate = calcSunGate(mod(lambda + 180, 360));
    // 收集 Sun 與 Earth 兩個閘門的 centers，聯集去重
    var sunCenters = getCentersForGate(sunGate);
    var earthCenters = getCentersForGate(earthGate);
    var centerSet = {};
    for (var i = 0; i < sunCenters.length; i++) { centerSet[sunCenters[i]] = true; }
    for (var i = 0; i < earthCenters.length; i++) { centerSet[earthCenters[i]] = true; }
    var definedCenters = [];
    var cnames = ['Head', 'Ajna', 'Throat', 'G', 'Heart', 'Sacral', 'Spleen', 'SolarPlexus', 'Root'];
    for (var i = 0; i < cnames.length; i++) {
      if (centerSet[cnames[i]]) definedCenters.push(cnames[i]);
    }
    var definedMap = {};
    for (var i = 0; i < definedCenters.length; i++) {
      definedMap[definedCenters[i]] = true;
    }
    var sacralDefined = !!definedMap['Sacral'];
    var throatDefined = !!definedMap['Throat'];
    var heartDefined = !!definedMap['Heart'];
    var solarDefined = !!definedMap['SolarPlexus'];
    var rootDefined = !!definedMap['Root'];
    var spleenDefined = !!definedMap['Spleen'];

    var type;
    if (sacralDefined) {
      type = throatDefined ? '顯示生產者' : '生產者';
    } else if (throatDefined && (heartDefined || solarDefined || rootDefined)) {
      type = '顯示者';
    } else if (definedCenters.length > 0) {
      type = '投射者';
    } else {
      type = '反映者';
    }

    var authority;
    if (sacralDefined) {
      authority = '薦骨中心';
    } else if (solarDefined) {
      authority = '情緒中心';
    } else if (spleenDefined) {
      authority = '直覺中心';
    } else if (heartDefined) {
      authority = '意志力中心';
    } else {
      authority = '自我中心';
    }

    var strategy;
    if (type === '生產者' || type === '顯示生產者') {
      strategy = '等待回應';
    } else if (type === '顯示者') {
      strategy = '告知';
    } else if (type === '投射者') {
      strategy = '等待邀請';
    } else {
      strategy = '等待月亮週期';
    }

    var channel = sunGate + '-' + earthGate;
    var description = '太陽閘門 ' + sunGate + ' 與地球閘門 ' + earthGate + '（通道 ' + channel + '）';

    return {
      sunGate: sunGate,
      earthGate: earthGate,
      sunLongitude: lambda,
      definedCenters: definedCenters,
      type: type,
      authority: authority,
      strategy: strategy,
      channel: channel,
      description: description,
      humanDesignInfo: {
        sunGate: sunGate,
        earthGate: earthGate,
        channel: channel
      }
    };
  }

  // ============================================================
  // 4. 星座
  // ============================================================

  /**
   * 星座計算（太陽、月亮、上升）- 真實天文演算法，非查表
   * @param {number} year
   * @param {number} month - 1-based
   * @param {number} day
   * @param {string|number} hour - 時辰名稱（子丑...）或小時數
   * @param {number} [lat] - 緯度，北緯為正，缺省則使用時辰近似上升
   * @param {number} [lng] - 經度，東經為正
   * @returns {{sun:string, moon:string, rising:string, sunDeg:number, moonDeg:number, risingDeg:number, usingApproximateRising:boolean}}
   */
  function calcAstrology(year, month, day, hour, lat, lng) {
    var useApprox = (lat === undefined || lat === null || lng === undefined || lng === null || isNaN(lat) || isNaN(lng));
    var HOUR_MAP = {
      '子':0,'丑':2,'寅':4,'卯':6,'辰':8,'巳':10,
      '午':12,'未':14,'申':16,'酉':18,'戌':20,'亥':22
    };
    var localHour;
    if (typeof hour === 'number') {
      localHour = hour;
    } else if (typeof hour === 'string' && HOUR_MAP[hour] !== undefined) {
      localHour = HOUR_MAP[hour];
    } else {
      localHour = 12;
    }

    // 計算時辰名稱（支援小數小時，如 8.5 = 08:30）
    function getShichenName(h) {
      var totalMin = h * 60;
      if (totalMin >= 23 * 60 || totalMin < 1 * 60) return '子時';
      if (totalMin < 3 * 60) return '丑時';
      if (totalMin < 5 * 60) return '寅時';
      if (totalMin < 7 * 60) return '卯時';
      if (totalMin < 9 * 60) return '辰時';
      if (totalMin < 11 * 60) return '巳時';
      if (totalMin < 13 * 60) return '午時';
      if (totalMin < 15 * 60) return '未時';
      if (totalMin < 17 * 60) return '申時';
      if (totalMin < 19 * 60) return '酉時';
      if (totalMin < 21 * 60) return '戌時';
      return '亥時';
    }
    var shichen = getShichenName(localHour);
    // 台灣時區轉 UTC（用於天文計算）
    var TZ_OFFSET = 8;
    var utHour = localHour - TZ_OFFSET;
    var utDate = new Date(Date.UTC(year, month - 1, day, utHour));
    var utYear = utDate.getUTCFullYear();
    var utMonth = utDate.getUTCMonth() + 1;
    var utDay = utDate.getUTCDate();
    var utHourFrac = utDate.getUTCHours() + utDate.getUTCMinutes() / 60;

    // SUN: 使用現有真實黃經計算 (取代固定日期切分法)
    var sunDeg = calcSunEclipticLongitude(utYear, utMonth, utDay, utHourFrac);
    sunDeg = mod(sunDeg, 360);
    var sunIdx = Math.floor(sunDeg / 30) % 12;
    var sun = SUN_NAMES[sunIdx];

    // MOON: 簡化平均黃經 Lm=218.3165+481267.8813*n (n=centuries since J2000)
    var JD = 367 * utYear - Math.floor(7 * (utYear + Math.floor((utMonth + 9) / 12)) / 4) + Math.floor(275 * utMonth / 9) + utDay + 1721013.5 + utHourFrac / 24;
    var n = (JD - 2451545.0) / 36525;
    var Lm = 218.3165 + 481267.8813 * n;
    var moonDeg = mod(Lm, 360);
    var moonIdx = Math.floor(moonDeg / 30) % 12;
    var moon = MOON_NAMES[moonIdx];

    // RISING (ASCENDANT): Local Sidereal Time 與標準上升點公式
    var rising;
    var risingDeg;
    var usingApproximateRising;
    if (useApprox) {
      usingApproximateRising = true;
      // 時辰近似法（舊邏輯保留，標記 approximate）
      var risingMap = { 卯: 0, 辰: 1, 巳: 2, 午: 3, 未: 4, 申: 5, 酉: 6, 戌: 7, 亥: 8, 子: 9, 丑: 10, 寅: 11 };
      var hourKey = (typeof hour === 'string') ? hour : '';
      var risingIdx = risingMap[hourKey] !== undefined ? risingMap[hourKey] : 6;
      rising = RISING_NAMES[risingIdx];
      risingDeg = risingIdx * 30 + 15;
    } else {
      usingApproximateRising = false;
      var latVal = lat;
      var lngVal = lng;
      // JD0 該日期 0h UT
      var JD0 = 367 * utYear - Math.floor(7 * (utYear + Math.floor((utMonth + 9) / 12)) / 4) + Math.floor(275 * utMonth / 9) + utDay + 1721013.5;
      var T = (JD0 - 2451545.0) / 36525;
      var GMST = 280.46061837 + 360.98564736629 * (JD0 - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
      GMST = mod(GMST, 360);
      // 加入小時偏移（utHourFrac 是 UT 的小數日）
      var GMST_t = GMST + 360.98564736629 * (utHourFrac / 24);
      GMST_t = mod(GMST_t, 360);
      var LMST = mod(GMST_t + lngVal, 360);
      var RAMC = LMST;
      var eps = 23.4393;
      var ramcRad = RAMC * PI / 180;
      var latRad = latVal * PI / 180;
      var epsRad = eps * PI / 180;
      // 標準上升點公式（ASC 黃經 — atan2 算出來需要 +180° 才是上升）
      var atanY = -Math.cos(ramcRad);
      var atanX = Math.sin(epsRad) * Math.tan(latRad) + Math.sin(ramcRad) * Math.cos(epsRad);
      var ascRad = Math.atan2(atanY, atanX);
      risingDeg = ascRad * 180 / PI + 180;
      risingDeg = mod(risingDeg, 360);
      var risingIdx = Math.floor(risingDeg / 30) % 12;
      rising = RISING_NAMES[risingIdx];
    }

    return {
      sun: sun,
      moon: moon,
      rising: rising,
      sunDeg: sunDeg,
      moonDeg: moonDeg,
      risingDeg: risingDeg,
      usingApproximateRising: usingApproximateRising,
      shichen: shichen
    };
  }

  // ============================================================
  // 5. 生命靈數
  // ============================================================

  /**
   * 計算生命靈數
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @returns {number}
   */
  function calcLifePath(year, month, day) {
    function sumDigits(n) {
      return String(n).split('').reduce(function (a, c) { return a + parseInt(c, 10); }, 0);
    }
    var total = sumDigits(year) + sumDigits(month) + sumDigits(day);
    // 保留主數 11, 22, 33 不繼續縮減
    while (total >= 10 && total !== 11 && total !== 22 && total !== 33) {
      total = sumDigits(total);
    }
    return total;
  }

  // ============================================================
  // 6. 姓名學筆畫查詢
  // ============================================================

  /**
   * 查詢中文字筆畫數（常用字庫）
   * @param {string} char - 單一中文字
   * @returns {number|null}
   */
  function getStrokes(char) {
    var strokes = {
      '一':1,'二':2,'三':3,'四':5,'五':4,'六':4,'七':2,'八':2,'九':2,'十':2,
      '大':3,'小':3,'天':4,'地':6,'人':2,'山':3,'水':4,'火':4,'日':4,'月':4,'木':4,'金':8,'土':3,'石':5,'風':9,'雷':13,'光':6,
      '上':3,'下':3,'中':4,'東':8,'南':9,'西':6,'北':5,'前':9,'後':9,
      '春':9,'夏':10,'秋':9,'冬':5,'明':8,'暗':13,'星':9,'雲':12,'雨':8,'雪':11,'海':10,'河':8,'江':6,'湖':12,
      '王':4,'子':3,'美':9,'德':15,'志':7,'信':9,'義':13,'仁':4,'禮':18,'智':12,'勇':9,'誠':14,'善':12,'真':10,
      '國':11,'家':10,'安':6,'平':5,'樂':15,'和':8,'福':13,'祿':12,'壽':14,'喜':12,
      '文':4,'武':8,'英':8,'雄':12,'偉':11,'傑':12,'豪':14,'俊':9,'彥':9,'彬':11,
      '嘉':14,'慶':15,'賢':15,'良':7,'恭':10,'儉':9,'讓':24,'宇':6,'軒':10,'辰':7,'佑':7,'庭':9,'倫':10,'哲':10,'翔':12,'凱':12,'棠':12,
      '正':5,'直':8,'方':4,'圓':13,'白':5,'青':8,'紅':9,'藍':18,'黃':12,'綠':14,'黑':12,'紫':11,'立':5,'言':7,'廷':6,
      '林':8,'葉':12,'森':12,'柏':9,'松':8,'竹':6,'梅':11,'蘭':23,'菊':14,'荷':13,'蓮':14,'華':12,
      '龍':16,'鳳':14,'麟':23,'龜':16,'馬':10,'牛':4,'虎':8,'兔':8,'蛇':11,
      '陳':11,'林':8,'黃':12,'張':11,'李':7,'王':4,'吳':7,'劉':15,'蔡':17,'楊':13,'許':11,'謝':17,'曾':13,'鄭':19,'周':8,
      '徐':10,'孫':10,'朱':6,'胡':9,'郭':15,'何':7,'高':10,'羅':20,'梁':11,'宋':7,'謝':17,'韓':17,
      '唐':10,'馮':12,'于':3,'董':15,'蕭':19,'程':12,'曹':11,'袁':10,'鄧':19,'許':11,'傅':12,'沈':8,'曾':13,'彭':12,'呂':7,
      '蘇':22,'盧':16,'蔣':17,'魏':18,'賈':13,'丁':2,'江':6,'范':11,'鍾':17,'田':5,'石':5,'任':6,'姚':9,'康':11,'顧':21,
      '方':4,'廖':14,'鄒':17,'熊':14,'金':8,'陸':13,'郝':14,'孔':4,'白':5,'崔':11,'毛':4,'邱':12,'秦':10,'汪':7,'史':5,
      '舒':12,'柯':9,'章':11,'詹':13,'卓':8,'葉':12,'賀':12,'倪':10,'施':9,'姜':9,'侯':9,'邵':12,'焦':12,'雷':13,'錢':16,
      '顏':18,'賴':16,'邱':12,'柳':9,'洪':10,'溫':13,'夏':10,'宋':7,'官':8,'萬':12,'段':9,'康':11,'連':14,'游':13,'童':12,
      '翁':10,'康':11,'祝':10,'簡':18,'卜':2,'關':19,'紀':9,'屈':8,'岳':8,'聶':18,'文':4,'古':5,'甘':5,'卞':4,'白':5
    };
    return strokes[char] !== undefined ? strokes[char] : null;
  }

  // ============================================================
  // 7. 姓名學：三才五格
  // ============================================================

  /**
   * 姓名學三才五格分析（返回物件資料供 UI 渲染）
   * @param {string} surname
   * @param {string} givenname
   * @returns {object}
   */
  function generateNameScience(surname, givenname) {
    var sStrokes = [];
    var gStrokes = [];
    var missing = [];

    for (var i = 0; i < surname.length; i++) {
      var st = getStrokes(surname[i]);
      if (st !== null) sStrokes.push(st);
      else missing.push(surname[i]);
    }
    for (var j = 0; j < givenname.length; j++) {
      var gt = getStrokes(givenname[j]);
      if (gt !== null) gStrokes.push(gt);
      else missing.push(givenname[j]);
    }

    if (sStrokes.length === 0 || gStrokes.length === 0) {
      return { error: '姓氏或名字至少需包含一個有效中文字', missing: missing };
    }

    var totalSurname = sStrokes.reduce(function (a, b) { return a + b; }, 0);
    var totalGiven = gStrokes.reduce(function (a, b) { return a + b; }, 0);
    var totalAll = totalSurname + totalGiven;

    var tianGe = totalSurname + 1;
    var renGe = sStrokes[sStrokes.length - 1] + gStrokes[0];
    var diGe = gStrokes.length === 1 ? totalGiven + 1 : totalGiven;
    var waiGe = totalAll - renGe + 1;
    var zongGe = totalAll;

    function wuxingAttr(num) {
      var last = num % 10;
      if (last === 1 || last === 2) return { wu: '木', color: '#4a7c59' };
      if (last === 3 || last === 4) return { wu: '火', color: '#c23b22' };
      if (last === 5 || last === 6) return { wu: '土', color: '#b8860b' };
      if (last === 7 || last === 8) return { wu: '金', color: '#9a8c6f' };
      return { wu: '水', color: '#3a6b8c' };
    }

    var tian = wuxingAttr(tianGe);
    var ren = wuxingAttr(renGe);
    var di = wuxingAttr(diGe);

    var sanCai = tian.wu + ren.wu + di.wu;

    var shengKe = {
      '木木木': '大吉','木木火': '吉','木木土': '吉','木火火': '吉','木火土': '吉',
      '火火火': '吉','火火木': '吉','火火土': '吉','火土土': '吉','火土金': '吉',
      '土土土': '吉','土土火': '吉','土土金': '吉','土金金': '吉','土金水': '吉',
      '金金金': '吉','金金水': '吉','金水水': '吉','金水木': '吉',
      '水水水': '吉','水水木': '吉','水木木': '吉','水木火': '吉'
    };
    var sanCaiResult = shengKe[sanCai] || '平';

    function fiveGrade(num) {
      var g = num % 10;
      if (g >= 8 || g === 1 || g === 3 || g === 5) return '吉';
      if (g === 2 || g === 4) return '凶';
      return '平';
    }

    return {
      missing: missing,
      tianGe: { value: tianGe, wuxing: tian.wu, color: tian.color, grade: fiveGrade(tianGe) },
      renGe: { value: renGe, wuxing: ren.wu, color: ren.color, grade: fiveGrade(renGe) },
      diGe: { value: diGe, wuxing: di.wu, color: di.color, grade: fiveGrade(diGe) },
      waiGe: { value: waiGe, wuxing: wuxingAttr(waiGe).wu, color: wuxingAttr(waiGe).color, grade: fiveGrade(waiGe) },
      zongGe: { value: zongGe, wuxing: wuxingAttr(zongGe).wu, color: wuxingAttr(zongGe).color, grade: fiveGrade(zongGe) },
      sanCai: sanCai,
      sanCaiResult: sanCaiResult,
    };
  }

  // ============================================================
  // 匯出 — 全部掛到 window.XiaomiFortune
  // ============================================================

  window.XiaomiFortune = {
    calcBazi: calcBazi,
    calcZiwei: calcZiwei,
    calcRenleitu: calcRenleitu,
    calcAstrology: calcAstrology,
    calcLifePath: calcLifePath,
    getStrokes: getStrokes,
    generateNameScience: generateNameScience,
    seededRandom: seededRandom,
    solar2lunar: solar2lunar,

    // 常數表（供外部參考使用）
    TIAN_GAN: TIAN_GAN,
    DI_ZHI: DI_ZHI,
    WU_XING_GAN: WU_XING_GAN,
    SHENG_XIAO: SHENG_XIAO,
    SUN_NAMES: SUN_NAMES,
    MOON_NAMES: MOON_NAMES,
    RISING_NAMES: RISING_NAMES,
    ZIWEI_MAIN_STARS: ZIWEI_MAIN_STARS,
    ZIWEI_PALACES: ZIWEI_PALACES,
    RENLEITU_TYPES: RENLEITU_TYPES,
    HOUR_ZHI_INDEX: HOUR_ZHI_INDEX,
  };

})();
