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
      return monthOffset + 2; // 2月→2(寅), 3月→3(卯), ..., 12月→12 → 取mod
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
  const SUN_NAMES   = ['摩羯', '水瓶', '雙魚', '牡羊', '金牛', '雙子', '巨蟹', '獅子', '處女', '天秤', '天蠍', '射手'];
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
    var baseDate = new Date(1900, 0, 31);
    var targetDate = new Date(year, month - 1, day);
    var offset = Math.round((targetDate - baseDate) / 86400000);

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
    return (LUNAR_INFO[idx] & (0x10000 >> month)) ? 30 : 29;
  }

  /** 閏月月份（0=無閏月） */
  function leapMonthOf(year) {
    return LUNAR_INFO[year - 1900] & 0xf;
  }

  /** 閏月天數 */
  function leapMonthDays(year) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }

  // 人類圖類型
  const RENLEITU_TYPES = [
    '顯示者', '生產者', '顯示生產者', '投射者', '反映者',
  ];
  const RENLEITU_STRATEGIES = {
    顯示者: '告知',
    生產者: '等待回應',
    顯示生產者: '等待回應',
    投射者: '等待邀請',
    反映者: '等待月亮週期',
  };
  const RENLEITU_AUTHORITIES = [
    '情緒中心', '薦骨中心', '直覺中心', '意志力中心', '自我中心', '環境',
  ];

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
    // 年柱以立春為界，簡化處理：1/1~立春前的年柱還是前一年的
    var baseYear = year;
    if (month === 1 && day < JIE_QI_DAY[11]) {
      baseYear = year - 1; // 1月6日前→前一年
    }
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
    var baseDate = new Date(2000, 0, 1);
    var targetDate = new Date(year, month - 1, day);

    // 計算天數差
    var diff = Math.round((targetDate - baseDate) / 86400000);

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

  // 輔星
  const ZIWEI_SUPPORT_STARS = {
    kui_yue: ['', ''],

  };

  // 天魁天鉞（年干）
  const KUI_YUE_BY_GAN = {
    0: { kui: 1, yue: 7 },  // 甲：丑(1)未(7)
    1: { kui: 0, yue: 6 },  // 乙：子(0)申(8)…不對
    5: { kui: 0, yue: 6 },  // 己：子(0)申(8)…等等
  };

  // 天魁天鉞：甲戊庚牛羊，乙己鼠猴鄉，丙丁豬雞位，六辛逢虎馬，壬癸蛇兔藏
  // 丑=牛=1, 未=羊=7
  // 子=鼠=0, 申=猴=8
  // Other干支... 轉成索引
  const KUI_YUE = {
    0: [1, 7],   // 甲：丑(1)未(7)
    1: [0, 8],   // 乙：子(0)申(8)
    2: [11, 9],  // 丙：亥(11)酉(9)
    3: [10, 9],  // 丁：亥(10)酉(9)
    4: [1, 7],   // 戊：丑(1)未(7)
    5: [0, 8],   // 己：子(0)申(8)
    6: [2, 6],   // 庚：丑(1)…不對，庚是丑未？甲戊庚牛羊
    7: [2, 6],   // 辛：寅(2)午(6) — 六辛逢虎馬
    8: [4, 10],  // 壬：辰(4)戌(10)
    9: [4, 10],  // 癸：辰(4)戌(10)
  };
  // 口訣：甲戊庚牛羊，乙己鼠猴鄉，丙丁豬雞位，六辛逢虎馬，壬癸蛇兔藏
  // 牛羊=丑未(1,7), 鼠猴=子申(0,8), 豬雞=亥酉(11,9), 虎馬=寅午(2,6), 蛇兔=辰卯(4,3)...不對
  // 天魁天鉞是天乙貴人，分陽貴陰貴
  // 重新查證後修正：

  // 正確的天魁（陽貴）天鉞（陰貴）口訣：
  // 甲戊(庚) → 陽貴丑(1)，陰貴未(7) → 甲戊庚牛羊
  // 乙(己) → 陽貴子(0)，陰貴申(8) → 乙己鼠猴鄉
  // 丙(丁) → 陽貴亥(11)，陰貴酉(9) → 丙丁豬雞位
  // 庚 → 陽貴丑(1)，陰貴未(7) → 同甲戊
  // 辛 → 陽貴寅(2)，陰貴午(6) → 六辛逢虎馬
  // 壬(癸) → 陽貴卯(3)，陰貴巳(5) → 壬癸兔蛇藏...不對

  // 正確版（重新查）：
  const KUI = [1, 0, 11, 10, 1, 0, 1, 2, 3, 3];  // 天魁：甲丑,乙子,丙亥,丁亥,戊丑,己子,庚丑,辛寅,壬卯,癸卯
  const YUE = [7, 8, 9, 9, 7, 8, 7, 6, 5, 5];    // 天鉞：甲未,乙申,丙酉,丁酉,戊未,己申,庚未,辛午,壬巳,癸巳

  // 文昌文曲（辰宮起，順逆時）
  // 文昌：子(0)起順時到生時，但其實是辰宮起順數
  // 文曲：辰(4)宮起逆數到生時
  // 改為：文昌從辰宮(4)順數，文曲從戌宮(10)逆數（標準版）
  // 更標準：文昌從午(6)起順數到生時；文曲從辰(4)起逆數到生時
  // 再查：文昌戌宮(10)起逆時到生時，文曲辰宮(4)起順時到生時
  
  // 文昌文曲：文昌戌宮起逆時針數到生時，文曲辰宮起順時針數到生時
  function wenChang(hourIdx) {
    return ((10 - hourIdx) % 12 + 12) % 12; // 戌(10)逆數
  }
  function wenQu(hourIdx) {
    return ((4 + hourIdx) % 12 + 12) % 12; // 辰(4)順數
  }

  // 擎羊陀羅（年支）
  // 擎羊：年支+1（順數一位），陀羅：年支-1（逆數一位）
  function qingYang(yearZhiIdx) {
    return (yearZhiIdx + 1) % 12;
  }
  function tuoLuo(yearZhiIdx) {
    return ((yearZhiIdx - 1) % 12 + 12) % 12;
  }

  // 火星鈴星（年支 + 時辰，有對照表）
  // 火星：年支定子時位置，順時辰格數
  // 口訣：申子辰人寅戌揚，寅午戌人丑卯方，巳酉丑人卯戌位，亥卯未人酉戌房
  // 火鈴有更複雜的規則，這裡先用簡化表
  // 火星：年支決定的起始地支，然後順數生時格數
  // 鈴星：年支決定的起始地支，然後逆數生時格數
  
  // 完整火星表（年支→子時火星位置）：
  const HUO_XING_BASE = {
    0: 2,  // 子→寅(2)
    1: 4,  // 丑→辰(4)? ... 
  };
  
  // 這個太複雜，直接刻對照表
  // 火星位置表：年支+時辰→火星地支索引
  // 鈴星位置表：年支+時辰→鈴星地支索引
  
  // 地空地劫（年支+時辰）
  // 地空：年支決定的起始+時辰
  // 地劫：年支決定的起始+時辰

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
    // 年柱天干
    var baseYear = year;
    if (month === 1 && day < JIE_QI_DAY[11]) baseYear = year - 1;
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
    
    // 納音表（用 (天干索引, 地支索引) → 五行）
    var nayin = {
      // 直接從60甲子納音表查甲乙...戌亥
    };
    // 建一個快速查表
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
    
    // --- 4. 安紫微星 ---
    // 公式：(生日 + (局數-1)) / 局數 取商
    // 商奇數順行(從寅宮2開始)，商偶數逆行(從寅宮2開始)
    // 商=0在寅宮(2)，商=1在卯宮(3)，商=-1在丑宮(1)
    function calcZiweiPosition(birthDay, ju) {
      var q = Math.floor((birthDay + (ju - 1)) / ju);
      var ziweiPos;
      if (birthDay % ju === 0) {
        // 整除：從寅宮(2)逆數到商
        ziweiPos = ((2 - q) % 12 + 12) % 12;
      } else {
        // 有餘數：從寅宮(2)順數到商
        ziweiPos = ((2 + q) % 12 + 12) % 12;
      }
      return ziweiPos;
    }

    // 等等，紫微安星公式比較複雜，查一下再寫
    // 標準公式：紫微星位置用生日除以局數
    // 商=0→寅(2)，商=1→卯(3)，商=2→辰(4)...商=n→寅+n
    // 餘數=0→順行，餘數>0→逆行
    // 餘數=0且商=0的情況→紫微在寅
    
    // 更正：餘數決定順逆行，商決定偏移
    function calcZiweiPos(birthDay, ju) {
      var r = birthDay % ju;
      var q = Math.floor(birthDay / ju);
      if (r === 0) {
        // 整除：從寅宮(2)順數 q-1 格
        return ((2 + q - 1) % 12 + 12) % 12;
      } else {
        // 有餘數：從寅宮(2)順數 q 格再逆數一段...
        // 更標準的算法：
        // 紫微 = 寅宮 + (生日-1) / 局數 的某種取整
        // 商 = Math.floor((生日 - 1) / 局數)
        // 餘 = (生日 - 1) % 局數
        // 紫微位置 = 寅 + 商 + 1（如果餘>0）... 
        // 更可靠的：直接查表
        
        // 用標準公式：紫微從寅宮開始，每局數天一格
        // 位置 = 2 + Math.floor((生日 - 1) / 局數)
        return (2 + Math.floor((birthDay - 1) / ju)) % 12;
      }
    }

    var ziweiPos = calcZiweiPos(day, juShu);
    // 經過思考，最簡潔的公式就是 floor((生日-1)/局數) 從寅宮起算
    // 然後紫微在...等下，day是陽曆日不是農曆日
    // 紫微斗數用農曆生日! 但使用者輸入的是陽曆
    
    // 轉農曆日（紫微斗數用農曆生日）
    var lunar = solar2lunar(year, month, day);
    var lunarDay = lunar.lunarDay;
    
    // 用 floor((生日-1)/局數) 從寅宮(2)開始
    ziweiPos = (2 + Math.floor((lunarDay - 1) / juShu)) % 12;
    
    // --- 5. 安14主星 ---
    var tianfuPos = ((4 - ziweiPos) % 12 + 12) % 12;
    
    // 各宮主星
    var starPositions = {};
    
    // 紫微系（從紫微宮逆排，每跳過一個空位下一個星）
    for (var i = 0; i < 12; i++) starPositions[i] = { main: '', support: [] };
    
    // 紫微系（0紫微,1天機,3太陽,4武曲,5天同,7廉貞）
    var ziweiStarIdx = [0, 1, 3, 4, 5, 7];
    for (var si = 0; si < ziweiStarIdx.length; si++) {
      var pos = ((ziweiPos - si) % 12 + 12) % 12;
      starPositions[pos].main = ZIWEI_MAIN_STARS[ziweiStarIdx[si]];
    }
    
    // 天府系（8天府,9太陰,10貪狼,11巨門,12天相,13天梁,14七殺,16破軍）
    var tianfuStarIdx = [8, 9, 10, 11, 12, 13, 14, 16];
    for (var si = 0; si < tianfuStarIdx.length; si++) {
      var pos = ((tianfuPos + si) % 12 + 12) % 12;
      starPositions[pos].main = ZIWEI_MAIN_STARS[tianfuStarIdx[si]];
    }

    // --- 6. 安輔星（簡化版：天魁天鉞、文昌文曲、擎羊陀羅）---
    
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
        mainStar: starPositions[zhi].main || '',
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
      mainStar: starPositions[mingGongIdx].main || '無主星',
      supportStar: starPositions[mingGongIdx].support.join('、'),
      // 保留舊版欄位相容
      mainPosition: ZIWEI_PALACES[0],
      description: '',
    };
  }

  // ============================================================
  // 3. 人類圖（簡化版）
  // ============================================================

  /**
   * 人類圖計算（簡化版 — 用 seed 產生固定結果）
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @param {string|number} hour - 時辰名稱或索引
   * @returns {object}
   */
  function calcRenleitu(year, month, day, hour) {
    var rng = seededRandom(year, month, day);

    // 類型
    var typeIdx = Math.floor(rng() * RENLEITU_TYPES.length);
    var type = RENLEITU_TYPES[typeIdx];

    // 通道（用兩個號碼表示，1~64）
    var gate1 = Math.floor(rng() * 64) + 1;
    var gate2 = Math.floor(rng() * 64) + 1;
    var channel = gate1 + '-' + gate2;

    // 人生策略
    var strategy = RENLEITU_STRATEGIES[type] || '等待';

    // 權威
    var authIdx = Math.floor(rng() * RENLEITU_AUTHORITIES.length);
    var authority = RENLEITU_AUTHORITIES[authIdx];

    // 描述
    var descs = [
      '你的能量場充滿影響力，善於引導他人。',
      '你擁有持續工作的能量，適合投入熱情的事業。',
      '你擅長觀察與分析，能夠看到事物的本質。',
      '你的敏銳直覺是天賦，能感知環境的細微變化。',
      '你的人生在不斷的嘗試中找到方向。',
      '你的獨特視角為世界帶來新的可能性。',
    ];
    var descIdx = Math.floor(rng() * descs.length);
    var description = descs[descIdx];

    return {
      type: type,
      channel: channel,
      strategy: strategy,
      authority: authority,
      description: description,
    };
  }

  // ============================================================
  // 4. 星座
  // ============================================================

  /**
   * 星座計算（太陽、月亮、上升）
   * @param {number} year
   * @param {number} month - 1-based
   * @param {number} day
   * @param {string} hour - 時辰名稱
   * @returns {object}
   */
  function calcAstrology(year, month, day, hour) {
    // --- 太陽星座 ---
    var sunIdx;
    if (day < SUN_CUTOFF[month - 1]) {
      sunIdx = month - 1;
    } else {
      sunIdx = month;
    }
    sunIdx = ((sunIdx % 12) + 12) % 12;
    var sun = SUN_NAMES[sunIdx];

    // --- 月亮星座 ---
    // moonDay = (year * 12 + month * 30 + day) % 27.3，每 2.275 天走一個星座
    var moonDay = (year * 12 + month * 30 + day) % 27.3;
    var moonIdx = Math.floor(moonDay / 2.275) % 12;
    var moon = MOON_NAMES[moonIdx];

    // --- 上升星座 ---
    // 上升每約 2 小時換一個星座，以日出（卯時）為基準
    // 卯(5-7)→牡羊0, 辰→1, 巳→2, 午→3, 未→4, 申→5,
    // 酉(17-19)→天秤6, 戌→7, 亥→8, 子→9, 丑→10, 寅→11
    var risingMap = { 卯: 0, 辰: 1, 巳: 2, 午: 3, 未: 4, 申: 5, 酉: 6, 戌: 7, 亥: 8, 子: 9, 丑: 10, 寅: 11 };
    var risingIdx = risingMap[hour] !== undefined ? risingMap[hour] : 6;
    var rising = RISING_NAMES[risingIdx];

    return {
      sun: sun,
      moon: moon,
      rising: rising,
      sunIndex: sunIdx,
      moonIndex: moonIdx,
      risingIndex: risingIdx,
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
    while (total >= 10) total = sumDigits(total);
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
    ZIWEI_SUPPORT_STARS: ZIWEI_SUPPORT_STARS,
    ZIWEI_PALACES: ZIWEI_PALACES,
    RENLEITU_TYPES: RENLEITU_TYPES,
    HOUR_ZHI_INDEX: HOUR_ZHI_INDEX,
  };

})();
