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

  // 紫微斗數主星列表
  const ZIWEI_MAIN_STARS = [
    '紫微', '天機', '太陽', '武曲', '天同', '廉貞',
    '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
  ];
  const ZIWEI_SUPPORT_STARS = [
    '文昌', '文曲', '左輔', '右弼', '天魁', '天鉞',
    '擎羊', '陀羅', '火星', '鈴星', '地空', '地劫',
  ];
  const ZIWEI_PALACES = [
    '命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮',
    '遷移宮', '交友宮', '事業宮', '田宅宮', '福德宮', '父母宮',
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
    var yearGanIdx = ((year % 10) + 10) % 10;
    var yearZhiIdx = ((year % 12) + 12) % 12;
    // 生肖用 yearZhiIdx 直接對應：0=子=鼠, 1=丑=牛, ...
    // 但 SHENG_XIAO 的 key 是 0=猴（因為農曆生肖以立春為界，此處簡化用年地支）
    var zodiacIdx = yearZhiIdx; // 子0=鼠，直接對應

    var yearGan  = TIAN_GAN[yearGanIdx];
    var yearZhi  = DI_ZHI[yearZhiIdx];
    var yearGanzhi = yearGan + yearZhi;

    // --- 月柱 ---
    var monthZhiIdx = MONTH_ZHI_INDEX[month];
    var monthZhi = DI_ZHI[monthZhiIdx];
    var monthGanIdx = WU_HU_DUN[yearGanIdx][month - 1];
    var monthGan = TIAN_GAN[monthGanIdx];
    var monthGanzhi = monthGan + monthZhi;

    // --- 日柱（基準日偏移法）---
    // 基準：2000年1月1日 = 甲戌日
    // 甲 = 天干索引 0，戌 = 地支索引 10
    var baseDate = new Date(2000, 0, 1); // Jan 1, 2000
    var targetDate = new Date(year, month - 1, day);

    // 計算天數差
    var diff = Math.round((targetDate - baseDate) / 86400000);

    // 日天干 = (diff % 10 + 10) % 10，但要加基準偏移（基準日甲=0）
    var dayGanIdx = ((diff % 10) + 10) % 10;
    // 日地支 = ((diff + 10) % 12 + 12) % 12，基準日戌=10
    var dayZhiIdx = ((diff + 10) % 12 + 12) % 12;

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

    // 日柱五行
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
  // 2. 紫微斗數（簡化版）
  // ============================================================

  /**
   * 紫微斗數計算（簡化版 — 用 seed 產生固定結果）
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @param {string|number} hour - 時辰名稱或索引
   * @param {string} gender - '男' 或 '女'
   * @returns {object}
   */
  function calcZiwei(year, month, day, hour, gender) {
    var rng = seededRandom(year, month, day);

    // 選主星
    var mainIdx = Math.floor(rng() * ZIWEI_MAIN_STARS.length);
    var mainStar = ZIWEI_MAIN_STARS[mainIdx];

    // 選輔星
    var supportIdx = Math.floor(rng() * ZIWEI_SUPPORT_STARS.length);
    var supportStar = ZIWEI_SUPPORT_STARS[supportIdx];

    // 主星所在宮位
    var mainPosIdx = Math.floor(rng() * ZIWEI_PALACES.length);
    var mainPosition = ZIWEI_PALACES[mainPosIdx];

    // 產生各宮位主星分佈
    var starPositions = {};
    var usedPalaces = {};
    usedPalaces[mainPosIdx] = true;

    for (var i = 0; i < ZIWEI_PALACES.length; i++) {
      if (i === mainPosIdx) {
        starPositions[ZIWEI_PALACES[i]] = {
          mainStar: mainStar,
          supportStar: supportStar,
          position: ZIWEI_PALACES[i],
        };
      } else {
        var starIdx = Math.floor(rng() * ZIWEI_MAIN_STARS.length);
        var supIdx = Math.floor(rng() * ZIWEI_SUPPORT_STARS.length);
        starPositions[ZIWEI_PALACES[i]] = {
          mainStar: ZIWEI_MAIN_STARS[starIdx],
          supportStar: ZIWEI_SUPPORT_STARS[supIdx],
          position: ZIWEI_PALACES[i],
        };
      }
    }

    // 描述
    var descs = [
      '今生福祿深厚，貴人運強。',
      '事業發展順利，財運亨通。',
      '感情豐富，人際關係和諧。',
      '智慧過人，學業事業有成。',
      '個性堅毅，能克服困難。',
      '運勢平穩，適合穩健發展。',
      '才華洋溢，有藝術天賦。',
      '家庭美滿，生活安樂。',
    ];
    var descIdx = Math.floor(rng() * descs.length);
    var description = descs[descIdx];

    return {
      mainStar: mainStar,
      supportStar: supportStar,
      mainPosition: mainPosition,
      starPositions: starPositions,
      description: description,
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
