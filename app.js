/* ===== 小彌算命 · JavaScript ===== */

document.addEventListener('DOMContentLoaded', function () {

  /* ===== 塔羅牌資料 ===== */
  const TAROT_MAJOR = [
    { num: 0, name: '愚者', meaning: '新的開始、冒險、純真。你正站在未知的起點，放下顧慮向前走吧。' },
    { num: 1, name: '魔術師', meaning: '創造力、技能、自信。你擁有達成目標所需的一切工具。' },
    { num: 2, name: '女祭司', meaning: '直覺、內在智慧、神秘。答案在你心中，靜下來聆聽。' },
    { num: 3, name: '皇后', meaning: '豐收、滋養、大自然。享受生命的豐盛，允許自己被照顧。' },
    { num: 4, name: '皇帝', meaning: '權威、結構、穩定。建立秩序，負起領導的責任。' },
    { num: 5, name: '教皇', meaning: '傳統、指引、信仰。向智者學習，或成為他人的導師。' },
    { num: 6, name: '戀人', meaning: '選擇、連結、價值觀。跟隨你的心做出重要的選擇。' },
    { num: 7, name: '戰車', meaning: '意志力、決心、勝利。用紀律和專注克服障礙。' },
    { num: 8, name: '力量', meaning: '內在力量、勇氣、溫柔。真正的力量來自溫柔與耐心。' },
    { num: 9, name: '隱士', meaning: '內省、 solitude、尋求真理。獨處不是孤獨，是尋找光的必要路程。' },
    { num: 10, name: '命運之輪', meaning: '轉變、循環、契機。命運正在轉動，迎接變化。' },
    { num: 11, name: '正義', meaning: '公平、真理、因果。種什麼因得什麼果，真相終將顯現。' },
    { num: 12, name: '吊人', meaning: '暫停、犧牲、新視角。有時停滯是為了讓你看見不同的世界。' },
    { num: 13, name: '死神', meaning: '結束、轉變、放下。結束不是終點，是重生的前奏。' },
    { num: 14, name: '節制', meaning: '平衡、調和、中庸。找到你的節奏，不急不徐。' },
    { num: 15, name: '惡魔', meaning: '束縛、執著、物質主義。認清什麼在困住你，你就有力量掙脫。' },
    { num: 16, name: '高塔', meaning: '崩壞、覺醒、劇變。舊結構倒塌，為新的你騰出空間。' },
    { num: 17, name: '星星', meaning: '希望、靈感、平靜。在黑暗中看見星光，保持信心。' },
    { num: 18, name: '月亮', meaning: '幻象、恐懼、潛意識。面對陰影，才能看見真相。' },
    { num: 19, name: '太陽', meaning: '喜悅、成功、活力。陰霾散去，你值得快樂。' },
    { num: 20, name: '審判', meaning: '重生、召喚、覺醒。聽見內心的呼喚，回應它。' },
    { num: 21, name: '世界', meaning: '完成、整合、圓滿。一個循環的完成，慶祝你的旅程。' }
  ];

  /* ===== 易經擲幣法 ===== */
  function castYijing () {
    const lines = [];
    for (let i = 0; i < 6; i++) {
      const coin1 = Math.floor(Math.random() * 2) + 2; // 2 or 3
      const coin2 = Math.floor(Math.random() * 2) + 2;
      const coin3 = Math.floor(Math.random() * 2) + 2;
      const total = coin1 + coin2 + coin3;
      const isYang = (total === 7 || total === 9);
      const isChanging = (total === 6 || total === 9);
      lines.push({ yang: isYang, changing: isChanging, value: total });
    }
    return lines;
  }

  function renderYijing (lines) {
    const yaoChars = lines.map(l => {
      let cls = l.yang ? 'xf-yao xf-yao-yang' : 'xf-yao xf-yao-yin';
      if (l.changing) cls += ' xf-yao-changing';
      return `<div class="${cls}"></div>`;
    }).join('');
    return `<div class="xf-hexagram">${yaoChars}</div>`;
  }

  /* ===== 生命靈數計算 ===== */
  function calcLifePath (year, month, day) {
    const sumDigits = (n) => String(n).split('').reduce((a, c) => a + parseInt(c), 0);
    let total = sumDigits(year) + sumDigits(month) + sumDigits(day);
    while (total >= 10) total = sumDigits(total);
    return total;
  }

  /* ===== 頁面切換 ===== */
  const pages = {
    home: document.getElementById('xf-page-home'),
    form: document.getElementById('xf-page-form'),
    loading: document.getElementById('xf-page-loading'),
    result: document.getElementById('xf-page-result')
  };

  function goTo (pageId) {
    Object.values(pages).forEach(p => { if (p) p.classList.remove('active'); });
    if (pages[pageId]) pages[pageId].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ===== 表單處理 ===== */
  const form = document.getElementById('xf-form');
  const nameInput = document.getElementById('xf-name');
  const dateInput = document.getElementById('xf-birthday');
  const hourSelect = document.getElementById('xf-hour');
  const placeInput = document.getElementById('xf-place');
  const genderInputs = document.querySelectorAll('input[name="gender"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const dateVal = dateInput.value;
    const hour = hourSelect.value;
    const place = placeInput.value.trim();
    let gender = '';
    genderInputs.forEach(g => { if (g.checked) gender = g.value; });

    if (!name) { alert('請輸入你的姓名～'); return; }
    if (!dateVal) { alert('請選擇出生日期～'); return; }

    const [year, month, day] = dateVal.split('-').map(Number);
    const lifePathNum = calcLifePath(year, month, day);
    const tarotCard = TAROT_MAJOR[Math.floor(Math.random() * TAROT_MAJOR.length)];
    const yijingLines = castYijing();

    // 存結果資料
    window.xfResult = {
      name,
      birthDate: dateVal,
      hour: hour ? document.getElementById('xf-hour').options[document.getElementById('xf-hour').selectedIndex].text : '不確定',
      place: place || '未知',
      gender: gender === 'male' ? '男' : '女',
      year, month, day,
      lifePathNum,
      tarotCard,
      yijingLines
    };

    goTo('loading');
    runLoadingSequence();
  });

  /* ===== Loading 動畫 ===== */
  function runLoadingSequence () {
    const loaderText = document.querySelector('.xf-loading-text');
    const loaderSub = document.querySelector('.xf-loading-sub');
    const steps = [
      '小彌正在為你推演天機⋯',
      '翻閱命盤，細察星辰⋯',
      '八字符號漸漸浮現⋯',
      '紫微星曜正在排列⋯',
      '靈數共振⋯人類圖展開⋯',
      '占星盤已經定位⋯'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        loaderText.textContent = steps[i];
        loaderSub.textContent = '⋯⋯';
      } else {
        clearInterval(interval);
        loaderText.textContent = '✨ 命理推演完成 ✨';
        loaderSub.textContent = '讓小彌為你揭曉⋯';
        setTimeout(() => {
          renderResults();
          goTo('result');
        }, 800);
      }
    }, 900);
  }

  /* ===== 結果渲染 ===== */
  function renderResults () {
    const d = window.xfResult;
    if (!d) return;

    // 設定姓名
    document.getElementById('xf-result-name').textContent = `${d.name} · ${d.gender} · ${d.birthDate}`;

    // 生命靈數
    const lifePathEl = document.getElementById('xf-life-number');
    lifePathEl.textContent = d.lifePathNum;

    // 塔羅抽牌結果
    document.getElementById('xf-tarot-name').textContent = d.tarotCard.name;
    document.getElementById('xf-tarot-meaning').textContent = d.tarotCard.meaning;

    // 易經卦象
    document.getElementById('xf-yijing-display').innerHTML = renderYijing(d.yijingLines);

    // 八字文案（模擬 — 之後給LLM生成）
    const baziText = document.getElementById('xf-bazi-text');
    baziText.innerHTML = generateBaziReading(d);

    // 紫微文案
    const ziweiText = document.getElementById('xf-ziwei-text');
    ziweiText.innerHTML = generateZiweiReading(d);

    // 人類圖文案
    const renleituText = document.getElementById('xf-renleitu-text');
    renleituText.innerHTML = generateRenleituReading(d);

    // 占星文案
    const astrologyText = document.getElementById('xf-astrology-text');
    astrologyText.innerHTML = generateAstrologyReading(d);

    // 小彌總結
    const summaryBody = document.getElementById('xf-summary-body');
    summaryBody.innerHTML = generateSummary(d);

    // 觸發逐項淡入動畫
    setTimeout(() => {
      document.querySelectorAll('.xf-card').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 250);
      });
    }, 300);

    // 初始化 tab
    initTabs();
  }

  /* ===== 命理解讀產生器（模擬 — 之後給LLM） ===== */
  function generateBaziReading (d) {
    const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const stem = heavenlyStems[d.year % 10];
    const branch = earthlyBranches[d.year % 12];
    const dayStem = heavenlyStems[(d.year + d.month + d.day) % 10];
    const dayBranch = earthlyBranches[(d.month + d.day) % 12];

    const stemMonth = heavenlyStems[d.month % 10];
    const branchMonth = earthlyBranches[d.month % 12];
    const wuxing = ['木','木','火','火','土','土','金','金','水','水'];
    const seasons = ['春','夏','秋','冬'];
    const seasonPower = ['木旺','火旺','金旺','水旺'];
    const zodiac = ['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬'];
    const nature = d.lifePathNum % 2 === 0 ? '偏柔，以柔克剛，善於調和' : '偏剛，意志堅定，適合開創';

    return `
      <p><strong>八字四柱</strong>：${stem}${branch}年 · ${stemMonth}${branchMonth}月 · ${dayStem}${dayBranch}日 · ${d.hour}時</p>
      <p>你的日主為<strong>${dayStem}</strong>，屬${wuxing[heavenlyStems.indexOf(dayStem)]}性。生於${seasons[Math.floor(d.month / 3) % 4]}月，${seasonPower[Math.floor(d.month / 3) % 4]}當令。</p>
      <p>年柱${stem}${branch}，${zodiac[earthlyBranches.indexOf(branch)]}年生人。整體命格${nature}，五行流通尚可，晚年運勢漸入佳境。</p>
    `;
  }

  function generateZiweiReading (d) {
    const stars = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];
    const shuffled = [...stars].sort(() => Math.random() - 0.5);
    const mainStar = shuffled[0];
    const supportStar = shuffled[1];
    const starPositions = ['命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮', '遷移宮', '交友宮', '官祿宮', '田宅宮', '福德宮', '父母宮'];
    const mainPos = starPositions[d.lifePathNum % 12];

    return `
      <p>命宮在<strong>${mainPos}</strong>，主星<strong>${mainStar}</strong>，輔星<strong>${supportStar}</strong>同宮。</p>
      <p>${mainStar}坐命之人，${['紫微','天機','太陽','武曲','天同','廉貞','天府','太陰','貪狼','巨門','天相','天梁','七殺','破軍'].indexOf(mainStar) < 4 ? '格局高貴，具有領袖氣質' : mainStar === '貪狼' || mainStar === '破軍' || mainStar === '七殺' ? '殺破狼格局，一生多變動，但每次變動都是向上躍升' : '穩重踏實，福澤深厚'}。</p>
      <p>${supportStar}在遷移宮，外出發展${['有利','平順','需防小人','貴人相助','先苦後甘','遠行機遇多'][d.lifePathNum % 6]}。財帛宮無煞沖破，財運平穩，中年後有積蓄。</p>
    `;
  }

  function generateRenleituReading (d) {
    const types = ['顯示者', '生產者', '顯示生產者', '投射者', '反映者'];
    const type = types[d.lifePathNum % 5];
    const channels = ['1-8 啟發的通道', '2-14 煉金術的通道', '3-60 突變的通道', '5-15 韻律的通道',
      '7-31 領導的通道', '10-20 覺醒的通道', '13-33 足跡的通道', '34-57 力量的通道',
      '37-40 社群的通道', '39-55 情緒的通道', '41-30 體驗的通道', '42-53 成熟的通道'];
    const channel = channels[d.lifePathNum % channels.length];

    return `
      <p>你的類型：<strong>${type}</strong></p>
      <p>${type === '顯示者' ? '你天生就是來發起行動的，不需要等待他人的允許。' :
        type === '生產者' ? '你的能量來自回應——對生命中的事物做出反應，而不是主動發起。' :
        type === '顯示生產者' ? '你結合了發起與回應兩種能量，快速而強大。' :
        type === '投射者' ? '你的天賦是看穿他人，等待被邀請才發揮最大影響力。' :
        '你是罕見的反映者，像一面鏡子反映周圍的能量，你的智慧來自適應力。'}</p>
      <p>定義通道：<strong>${channel}</strong>。${'這條通道賦予你與眾不同的天賦，是你與生俱來的能量流動方式。'}</p>
      <p>人生策略：${['等待回應','等待邀請','發起行動','先感受再決定'][d.lifePathNum % 4]}。${d.lifePathNum % 2 === 0 ? '你的內在權威是情緒中心，需要時間讓情緒清明再做決定。' : '你的內在權威是薦骨中心，用身體的「嗯」或「嗯？」來判斷。'}</p>
    `;
  }

  function generateAstrologyReading (d) {
    const sunSigns = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
    const moonSigns = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
    const risingSigns = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];

    // 簡單計算：用年月日產生太陽/月亮/上升
    const sunIdx = (d.month - 1 + Math.floor(d.day / 20)) % 12;
    const moonIdx = (d.year + d.month) % 12;
    const risingIdx = (d.day + d.lifePathNum) % 12;

    const houses = ['一宮（自我）', '二宮（財帛）', '三宮（溝通）', '四宮（家庭）',
      '五宮（愛情）', '六宮（健康）', '七宮（伴侶）', '八宮（轉化）',
      '九宮（遠行）', '十宮（事業）', '十一宮（人際）', '十二宮（潛意識）'];

    return `
      <p><strong>太陽</strong>：${sunSigns[sunIdx]} — 你的核心自我。${['熱情奔放','踏實穩固','靈活多變','溫柔敏感','自信耀眼','細膩完美','平衡和諧','深沉強烈','樂觀自由','務實堅毅','前衛獨立','浪漫包容'][sunIdx]}</p>
      <p><strong>月亮</strong>：${moonSigns[moonIdx]} — 你的內在情緒。${['直率','穩定','好奇','細膩','驕傲','自律','理性','深刻','奔放','沉穩','疏離','同理'][moonIdx]}而需要安全感。</p>
      <p><strong>上升</strong>：${risingSigns[risingIdx]} — 你給人的第一印象。${['直接','可靠','聰明','溫暖','耀眼','精準','優雅','神秘','隨性','嚴肅','獨特','柔和'][risingIdx]}</p>
      <p>重要行星分布：${d.lifePathNum % 3 === 0 ? '多星聚集在' + houses[sunIdx % 12] + '，該領域是你此生的重點。' : '行星分布均勻，各方面發展平衡。'}木星在${houses[(d.year + d.lifePathNum) % 12]}，${d.lifePathNum % 2 === 0 ? '帶來好運與擴張' : '需要努力才能獲得回報'}。</p>
    `;
  }

  function generateSummary (d) {
    return `
      <p>親愛的 <strong>${d.name}</strong>，綜合你提供的生辰資訊，小彌為你梳理了以下幾點：</p>
      <p>你的<strong>生命靈數 ${d.lifePathNum}</strong> 與八字日主呼應，顯示你是一個${d.lifePathNum % 2 === 0 ? '善於整合、富有同理心' : '具有開創精神、行動力強'}的人。占星盤中太陽${['牡羊','金牛','雙子','巨蟹','獅子','處女','天秤','天蠍','射手','摩羯','水瓶','雙魚'][(d.month - 1 + Math.floor(d.day / 20)) % 12]}座賦予你${['行動力','穩定性','適應力','情感深度','創造力','分析力','公正感','洞察力','探索欲','耐力','獨立性','直覺力'][d.lifePathNum % 12]}的天賦。</p>
      <p>人類圖中你屬於${['顯示者','生產者','顯示生產者','投射者','反映者'][d.lifePathNum % 5]}類型，這與紫微${['紫微','天機','太陽','武曲','天同','廉貞','天府','太陰','貪狼','巨門','天相','天梁','七殺','破軍'][d.lifePathNum % 14]}坐命的格局互相印證——你不是偶然來到這個世界的。</p>
      <p>這次為你抽到的塔羅牌是<strong>「${d.tarotCard.name}」</strong>：${d.tarotCard.meaning}</p>
      <p>🔮 <strong>小彌的話</strong>：命理是地圖，不是目的地。這些符號只是幫你看見自己本來就有的樣子。你比你以為的更完整。</p>
    `;
  }

  /* ===== Tabs ===== */
  function initTabs () {
    const tabContainer = document.getElementById('xf-tabs');
    if (!tabContainer) return;
    const tabs = tabContainer.querySelectorAll('.xf-tab');
    const contents = document.querySelectorAll('.xf-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const target = document.getElementById(this.dataset.target);
        if (target) target.classList.add('active');
      });
    });
  }

  /* ===== 開始算命按鈕 ===== */
  document.addEventListener('click', function (e) {
    if (e.target.id === 'xf-start-btn') {
      goTo('form');
    }
  });

  /* ===== 再算一次 ===== */
  document.addEventListener('click', function (e) {
    if (e.target.id === 'xf-restart') {
      document.querySelectorAll('.xf-card').forEach(el => el.classList.remove('visible'));
      goTo('form');
    }
  });

  /* ===== 抽牌按鈕 ===== */
  document.getElementById('xf-draw-tarot')?.addEventListener('click', function () {
    const card = TAROT_MAJOR[Math.floor(Math.random() * TAROT_MAJOR.length)];
    document.getElementById('xf-tarot-name').textContent = card.name;
    document.getElementById('xf-tarot-meaning').textContent = card.meaning;
    // 高亮特效
    const tarotSection = document.getElementById('xf-tarot-section');
    if (tarotSection) {
      tarotSection.style.transition = 'background 0.3s';
      tarotSection.style.background = 'rgba(194, 59, 34, 0.08)';
      setTimeout(() => { tarotSection.style.background = ''; }, 600);
    }
  });

  /* ===== 重抽易經 ===== */
  document.getElementById('xf-draw-yijing')?.addEventListener('click', function () {
    const lines = castYijing();
    document.getElementById('xf-yijing-display').innerHTML = renderYijing(lines);
  });

});
