/* ===== 小彌算命 · UI 層 — fortune-ui.js ===== */
/* 所有命理計算已移至 fortune-core.js (window.XiaomiFortune) */
/* Phase 2: 完整塔羅牌陣 UI 整合（依賴 fortune-tarot.js） */

document.addEventListener('DOMContentLoaded', function () {

  /* ===== 易經擲幣法（保留原有邏輯） ===== */
  function castYijing () {
    const lines = [];
    for (let i = 0; i < 6; i++) {
      const coin1 = Math.floor(Math.random() * 2) + 2;
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
      return '<div class="' + cls + '"></div>';
    }).join('');
    return '<div class="xf-hexagram">' + yaoChars + '</div>';
  }

  /**
   * Phase 3: 完整易經顯示（卦名、卦辭、解釋、變卦、互卦）
   */
  function renderFullYijing (yj) {
    if (!yj || !yj.primary) {
      return '<p style="text-align:center;color:#8b5e3c;">易經起卦中…</p>';
    }

    const p = yj.primary;
    const res = yj.resulting;
    const nuc = yj.nuclear;

    let html = '<div style="text-align:center;margin-bottom:0.4rem;">';

    // 本卦視覺 + 名稱
    html += renderYijing(yj.lines);
    html += `<div style="font-family:var(--xf-font-brush);font-size:1.45rem;color:#c23b22;margin:0.2rem 0;">${p.character} ${p.name}</div>`;
    html += `<div style="font-size:0.78rem;color:#8b5e3c;margin-bottom:0.15rem;">${p.nameEn}</div>`;
    html += `<div style="font-size:0.9rem;color:#5a3e30;margin:0.25rem 0 0.35rem;line-height:1.5;">${p.judgment}</div>`;

    // 白話解釋
    if (p.interpretation) {
      html += `<div style="font-size:0.82rem;color:#5a3e30;background:rgba(196,169,125,0.1);padding:0.4rem 0.55rem;border-radius:4px;margin:0.2rem 0 0.4rem;text-align:left;">${p.interpretation}</div>`;
    }

    // 變卦
    if (res && yj.hasChanging) {
      html += `<div style="margin:0.3rem 0 0.15rem;font-size:0.75rem;color:#8b5e3c;border-top:1px dotted #d8c9a8;padding-top:0.25rem;">變爻：第 ${yj.changingLines.join('、')} 爻</div>`;
      html += `<div style="font-size:0.95rem;color:#c23b22;margin:0.1rem 0;">變卦 → ${res.character} ${res.name}</div>`;
      if (res.judgment) {
        html += `<div style="font-size:0.8rem;color:#5a3e30;">${res.judgment}</div>`;
      }
    }

    // 互卦（簡要顯示）
    if (nuc && nuc.number !== p.number) {
      html += `<div style="margin-top:0.25rem;font-size:0.72rem;color:#b8a88a;">互卦：${nuc.character} ${nuc.name}</div>`;
    }

    html += '</div>';
    return html;
  }

  /* ===== 頁面切換 ===== */
  var pages = {
    home: document.getElementById('xf-page-home'),
    form: document.getElementById('xf-page-form'),
    loading: document.getElementById('xf-page-loading'),
    result: document.getElementById('xf-page-result')
  };

  function goTo (pageId) {
    for (var key in pages) {
      if (pages[key]) pages[key].classList.remove('active');
    }
    if (pages[pageId]) pages[pageId].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ===== 表單處理 ===== */
  var form = document.getElementById('xf-form');
  var surnameInput = document.getElementById('xf-surname');
  var givennameInput = document.getElementById('xf-givenname');
  var dateInput = document.getElementById('xf-birthday');
  var placeInput = document.getElementById('xf-place');
  var genderInputs = document.querySelectorAll('input[name="gender"]');

  // 新增：精確時間輸入 + 不確定時間 checkbox + 即時時辰顯示
  var timeUnknownChk = document.getElementById('xf-time-unknown');
  var hourNumInput = document.getElementById('xf-hour-num');
  var minNumInput = document.getElementById('xf-min-num');
  var shichenEl = document.getElementById('xf-shichen');
  var timeInputsWrap = document.getElementById('xf-time-inputs');
  var shichenDisplayWrap = document.getElementById('xf-shichen-display');

  /* 時辰計算（與 fortune-core 一致） */
  function getShichen (hour, minute) {
    var h = parseInt(hour, 10) || 0;
    var m = parseInt(minute, 10) || 0;
    var totalMin = h * 60 + m;
    if (totalMin >= 1380 || totalMin < 60) return '子時';
    if (totalMin < 180) return '丑時';
    if (totalMin < 300) return '寅時';
    if (totalMin < 420) return '卯時';
    if (totalMin < 540) return '辰時';
    if (totalMin < 660) return '巳時';
    if (totalMin < 780) return '午時';
    if (totalMin < 900) return '未時';
    if (totalMin < 1020) return '申時';
    if (totalMin < 1140) return '酉時';
    if (totalMin < 1260) return '戌時';
    return '亥時';
  }

  function updateLiveShichen () {
    if (!hourNumInput || !minNumInput || !shichenEl) return;
    var h = parseInt(hourNumInput.value, 10);
    if (isNaN(h)) h = 12;
    h = Math.max(0, Math.min(23, h));
    var m = parseInt(minNumInput.value, 10);
    if (isNaN(m)) m = 0;
    m = Math.max(0, Math.min(59, m));
    shichenEl.textContent = getShichen(h, m);
  }

  if (hourNumInput) {
    hourNumInput.addEventListener('input', updateLiveShichen);
    hourNumInput.addEventListener('change', updateLiveShichen);
  }
  if (minNumInput) {
    minNumInput.addEventListener('input', updateLiveShichen);
    minNumInput.addEventListener('change', updateLiveShichen);
  }

  if (timeUnknownChk) {
    timeUnknownChk.addEventListener('change', function () {
      var hide = this.checked;
      if (timeInputsWrap) timeInputsWrap.style.display = hide ? 'none' : 'flex';
      if (shichenDisplayWrap) shichenDisplayWrap.style.display = hide ? 'none' : 'inline-block';
    });
  }

  // 初始顯示目前時辰
  setTimeout(updateLiveShichen, 30);

  /* ============================================================
     Phase 2: 塔羅新核心邏輯（使用 fortune-tarot.js）
  ============================================================ */

  let currentSpreadId = 'single';
  let currentTarotDraw = null;

  // Phase 3 易經狀態
  let currentYijingResult = null;

  // Phase 4 意念模式狀態
  let intentionMode = false;

  function getTarotDB () {
    return window.FORTUNE_TAROT || null;
  }

  /**
   * 抽指定牌陣（無重複 + 50/50 正逆位）
   */
  function drawTarotSpread (spreadId) {
    const db = getTarotDB();
    if (!db || !db.cards || !db.spreads) {
      console.warn('[Tarot] FORTUNE_TAROT 尚未載入');
      return null;
    }
    const spread = db.spreads.find(s => s.id === spreadId) || db.spreads[0];
    if (!spread) return null;

    // 複製牌堆
    const deck = [...db.cards];
    const drawn = [];

    for (let i = 0; i < spread.cardCount; i++) {
      if (deck.length === 0) break;
      const idx = Math.floor(Math.random() * deck.length);
      const card = deck.splice(idx, 1)[0];
      const isReversed = Math.random() < 0.5;
      drawn.push({
        card: card,
        isReversed: isReversed,
        position: spread.positions[i] || { id: 'p' + (i + 1), name: '卡' + (i + 1), meaning: '' }
      });
    }

    return {
      spread: spread,
      drawn: drawn
    };
  }

  /**
   * 將塔羅抽牌結果格式化成給 LLM 的文字描述
   */
  function formatTarotForPrompt (draw) {
    if (!draw || !draw.drawn || !draw.drawn.length) {
      return '【塔羅】單張指引（抽牌中）';
    }
    const s = draw.spread;
    let txt = `【塔羅】牌陣：「${s.name}」\n`;
    draw.drawn.forEach((d, idx) => {
      const posName = (d.position && d.position.name) ? d.position.name : ('位置' + (idx + 1));
      const orient = d.isReversed ? '逆位' : '正位';
      const meaning = d.card[d.isReversed ? 'reversed' : 'upright'] || '';
      txt += `${idx + 1}. ${posName}：${d.card.name}（${orient}）— ${meaning}\n`;
    });
    return txt;
  }

  /**
   * 將易經結果格式化給 LLM
   */
  function formatYijingForPrompt (yj) {
    if (!yj || !yj.primary) return '【易經】擲幣起卦（資料準備中）';
    let txt = `【易經】本卦：「${yj.primary.name}」 ${yj.primary.judgment}\n`;
    if (yj.hasChanging && yj.resulting) {
      txt += `變爻位置：第 ${yj.changingLines.join('、')} 爻 → 變卦「${yj.resulting.name}」\n`;
    }
    if (yj.nuclear) {
      txt += `互卦參考：「${yj.nuclear.name}」\n`;
    }
    return txt;
  }

  /**
   * 將整合洞見格式化給 LLM
   */
  function formatIntegrationForPrompt (insights) {
    if (!insights || !insights.length) return '';
    return '【命理整合建議】\n' + insights.map((s, i) => `${i + 1}. ${s}`).join('\n') + '\n';
  }

  /**
   * 產生塔羅顯示區的 HTML（支援單張 / 三張 / 塞爾特十字）
   */
  function renderTarotDisplay (draw) {
    if (!draw || !draw.drawn || !draw.drawn.length) {
      return '<p style="text-align:center;color:#8b5e3c;">塔羅抽牌中…</p>';
    }

    const s = draw.spread;
    const cards = draw.drawn;

    if (s.id === 'single') {
      const d = cards[0];
      const orientText = d.isReversed ? '逆位' : '正位';
      const meaning = d.card[d.isReversed ? 'reversed' : 'upright'];
      return `
        <div class="xf-tarot-card" style="padding:1.25rem 0.75rem;">
          <div class="xf-tarot-card-name" style="font-size:1.85rem;line-height:1.1;">
            ${d.card.name}
            <span style="font-size:0.85rem;color:#8b5e3c;display:block;margin-top:0.15rem;">（${orientText}）</span>
          </div>
          <p class="xf-tarot-card-meaning" style="margin-top:0.6rem;font-size:0.95rem;">
            ${meaning}
          </p>
          <div style="margin-top:0.4rem;font-size:0.7rem;color:#b8a88a;">${d.card.nameEn} · ${s.name}</div>
        </div>
      `;
    }

    if (s.id === 'three') {
      // 三張橫排
      let html = '<div style="display:flex;gap:0.5rem;justify-content:space-between;margin:0.4rem 0;">';
      cards.forEach((d, i) => {
        const orient = d.isReversed ? '逆位' : '正位';
        const meaning = d.card[d.isReversed ? 'reversed' : 'upright'];
        html += `
          <div style="flex:1;min-width:0;border:1px solid #d8c9a8;border-radius:6px;padding:0.45rem 0.35rem;background:rgba(249,245,235,0.6);">
            <div style="font-size:0.7rem;color:#8b5e3c;font-weight:600;text-align:center;margin-bottom:0.15rem;">${d.position.name}</div>
            <div style="font-family:var(--xf-font-brush);font-size:1.05rem;color:#c23b22;text-align:center;line-height:1.15;">
              ${d.card.name}
              <span style="font-size:0.68rem;display:block;color:#5a3e30;">${orient}</span>
            </div>
            <div style="font-size:0.72rem;color:#5a3e30;line-height:1.35;margin-top:0.25rem;text-align:center;">${meaning}</div>
          </div>
        `;
      });
      html += '</div>';
      html += `<div style="text-align:center;font-size:0.68rem;color:#b8a88a;margin-top:0.2rem;">${s.name} · 正逆位隨機 · 無重複</div>`;
      return html;
    }

    // 塞爾特十字（10張）— 清晰列表
    let html = `<div style="font-size:0.82rem;line-height:1.55;">`;
    cards.forEach((d, i) => {
      const orient = d.isReversed ? '逆位' : '正位';
      const meaning = d.card[d.isReversed ? 'reversed' : 'upright'];
      html += `
        <div style="padding:0.35rem 0;border-bottom:1px dotted #d8c9a8;display:flex;gap:0.5rem;align-items:flex-start;">
          <div style="width:1.45rem;flex-shrink:0;font-weight:700;color:#8b5e3c;">${i + 1}.</div>
          <div style="flex:1;min-width:0;">
            <span style="font-weight:600;color:#5a3e30;">${d.position.name}</span>
            <span style="margin-left:0.4rem;color:#c23b22;">${d.card.name}</span>
            <span style="margin-left:0.25rem;font-size:0.72rem;color:#8b5e3c;">(${orient})</span>
            <div style="color:#5a3e30;margin-top:0.1rem;">${meaning}</div>
          </div>
        </div>
      `;
    });
    html += `</div><div style="text-align:center;font-size:0.68rem;color:#b8a88a;margin-top:0.35rem;">${s.name} · 10 張牌 · 正逆位隨機</div>`;
    return html;
  }

  function flashTarotSection () {
    const section = document.getElementById('xf-tarot-section');
    if (!section) return;
    section.style.transition = 'background 0.25s';
    section.style.background = 'rgba(194, 59, 34, 0.09)';
    setTimeout(function () {
      section.style.background = '';
    }, 620);
  }

  function updateTarotSubtitle (spreadName) {
    const sub = document.getElementById('xf-tarot-subtitle');
    if (sub) sub.textContent = spreadName || '塔羅占卜';
  }

  function syncSpreadSelector (spreadId) {
    const container = document.getElementById('xf-tarot-spread-selector');
    if (!container) return;
    const btns = container.querySelectorAll('.xf-spread-btn');
    btns.forEach(b => {
      if (b.dataset.spread === spreadId) {
        b.classList.add('active');
        b.style.background = '#d8c9a8';
        b.style.color = '#3f2a1f';
        b.style.borderColor = '#8b5e3c';
      } else {
        b.classList.remove('active');
        b.style.background = '#f9f5eb';
        b.style.color = '#5a3e30';
        b.style.borderColor = '#c4a97d';
      }
    });
  }

  function performTarotDraw (spreadId, withFlash = true) {
    const draw = drawTarotSpread(spreadId);
    if (!draw) return;

    currentSpreadId = spreadId;
    currentTarotDraw = draw;

    // 更新全域結果（若已存在）
    if (window.xfResult) {
      window.xfResult.tarotDraw = draw;
    }

    // 渲染顯示區
    const display = document.getElementById('xf-tarot-display');
    if (display) {
      display.innerHTML = renderTarotDisplay(draw);
    }

    updateTarotSubtitle(draw.spread.name);
    syncSpreadSelector(spreadId);

    if (withFlash) {
      flashTarotSection();
    }
  }

  /* ===== 表單送出（整合新塔羅） ===== */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var surname = surnameInput.value.trim();
    var givenname = givennameInput.value.trim();
    var fullName = surname + givenname;
    var dateVal = dateInput.value;
    var place = placeInput.value.trim();
    var gender = '';
    genderInputs.forEach(function (g) { if (g.checked) gender = g.value; });

    if (!surname) { alert('請輸入你的姓氏～'); return; }
    if (!givenname) { alert('請輸入你的名字～'); return; }
    if (!dateVal) { alert('請選擇出生日期～'); return; }

    var dateParts = dateVal.split('-').map(Number);
    var year = dateParts[0], month = dateParts[1], day = dateParts[2];
    var genderText = gender === 'male' ? '男' : '女';

    // 時間處理（省略重複）
    var useUnknown = !!(timeUnknownChk && timeUnknownChk.checked);
    var birthFloat, shichenName, hourText;
    if (useUnknown || !hourNumInput || !minNumInput) {
      birthFloat = 12.0;
      shichenName = '午時';
      hourText = '不確定（使用中午12:00）';
    } else {
      var hh = parseInt(hourNumInput.value, 10);
      if (isNaN(hh)) hh = 12;
      hh = Math.max(0, Math.min(23, hh));
      var mm = parseInt(minNumInput.value, 10);
      if (isNaN(mm)) mm = 0;
      mm = Math.max(0, Math.min(59, mm));
      birthFloat = hh + (mm / 60);
      shichenName = getShichen(hh, mm);
      var hhStr = (hh < 10 ? '0' : '') + hh;
      var mmStr = (mm < 10 ? '0' : '') + mm;
      hourText = shichenName + ' (' + hhStr + ':' + mmStr + ')';
    }
    var hourZhi = shichenName ? shichenName.replace('時', '') : '午';

    // 用 XiaomiFortune 計算
    var f = window.XiaomiFortune;
    var baziResult = f.calcBazi(year, month, day, hourZhi);
    var ziweiResult = f.calcZiwei(year, month, day, hourZhi, genderText);
    var renleituResult = f.calcRenleitu(year, month, day, birthFloat);

    var lat = null, lng = null;
    if (placeInput && placeInput.value.trim()) {
      place = placeInput.value.trim();
      var CITY_COORDS = {
        '台北': [25.0330, 121.5654], '臺北': [25.0330, 121.5654],
        '新北': [25.0170, 121.4620], '桃園': [24.9936, 121.3010],
        '新竹': [24.8138, 120.9675], '臺中': [24.1469, 120.6839],
        '台中': [24.1469, 120.6839], '臺南': [22.9997, 120.2270],
        '台南': [22.9997, 120.2270], '高雄': [22.6273, 120.3014],
        '基隆': [25.1276, 121.7392], '宜蘭': [24.6929, 121.7195],
        '花蓮': [23.9871, 121.6010], '臺東': [22.7563, 121.1418],
        '台東': [22.7563, 121.1418], '屏東': [22.6773, 120.4880],
        '嘉義': [23.4800, 120.4499], '雲林': [23.7092, 120.4313],
        '南投': [23.9600, 120.9760], '彰化': [24.0517, 120.5358],
        '苗栗': [24.5602, 120.8212], '澎湖': [23.5711, 119.5793],
        '金門': [24.4368, 118.3186], '連江': [26.1500, 119.9500],
        '香港': [22.3193, 114.1694], '澳門': [22.1987, 113.5439],
        '上海': [31.2304, 121.4737], '北京': [39.9042, 116.4074],
      };
      var coords = CITY_COORDS[place] || CITY_COORDS[place.replace(/[縣市]/g, '')];
      if (coords) { lat = coords[0]; lng = coords[1]; }
    }
    var astrologyResult = f.calcAstrology(year, month, day, birthFloat, lat, lng);
    var lifePathNum = f.calcLifePath(year, month, day);
    var nameScience = f.generateNameScience(surname, givenname);

    // ===== Phase 2：使用完整塔羅牌陣（預設單張給 LLM 參考） =====
    var tarotDraw = drawTarotSpread('single');   // 初始固定用單張（LLM 穩定）
    var yijingLines = castYijing();

    // Phase 3：完整易經結果（若模組存在）
    var yijingResult = (window.FORTUNE_YIJING && typeof window.FORTUNE_YIJING.cast === 'function')
      ? window.FORTUNE_YIJING.cast()
      : null;

    // 儲存全域
    window.xfResult = {
      name: fullName,
      surname: surname,
      givenname: givenname,
      birthDate: dateVal,
      hour: hourText,
      place: place || '未知',
      gender: genderText,
      year: year, month: month, day: day,
      lifePathNum: lifePathNum,
      tarotDraw: tarotDraw,          // 新結構
      yijingLines: yijingLines,
      yijingResult: yijingResult     // Phase 3 完整資料
    };

    window.xfComputed = {
      bazi: baziResult,
      ziwei: ziweiResult,
      renleitu: renleituResult,
      astrology: astrologyResult,
      lifePathNum: lifePathNum,
      nameScience: nameScience
    };

    currentSpreadId = 'single';
    currentTarotDraw = tarotDraw;

    goTo('loading');
    callXiaomiApi(fullName, dateVal, hourText, place || '未知', genderText,
      year, month, day, lifePathNum, baziResult, ziweiResult, renleituResult,
      astrologyResult, nameScience);
  });

  /* ===== 小彌 API 呼叫（已整合塔羅牌陣資訊） ===== */
  function callXiaomiApi (fullName, dateVal, hourText, place, gender,
    year, month, day, lifePathNum, baziResult, ziweiResult, renleituResult,
    astrologyResult, nameScience) {

    var loaderText = document.querySelector('.xf-loading-text');
    var loaderSub = document.querySelector('.xf-loading-sub');

    loaderText.textContent = '小彌正在為你推演天機⋯';
    loaderSub.textContent = '翻閱命盤，細察星辰⋯';

    // 讀取已抽好的塔羅 + 易經結果
    var tarotDraw = (window.xfResult && window.xfResult.tarotDraw) || null;
    var tarotInfo = formatTarotForPrompt(tarotDraw);

    var yijingRes = (window.xfResult && window.xfResult.yijingResult) || null;
    var yijingInfo = formatYijingForPrompt(yijingRes);

    // Phase 4：即時產生整合洞見給 LLM
    var integrationInsights = [];
    if (window.FORTUNE_INTEGRATION && typeof window.FORTUNE_INTEGRATION.generateInsights === 'function') {
      integrationInsights = window.FORTUNE_INTEGRATION.generateInsights({
        bazi: baziResult,
        ziwei: ziweiResult,
        astrology: astrologyResult,
        renleitu: renleituResult,
        tarotDraw: tarotDraw,
        yijingResult: yijingRes
      }) || [];
    }
    var integrationInfo = formatIntegrationForPrompt(integrationInsights);

    // prompt：帶入前端已算好的數據（含塔羅、易經、整合建議）
    var prompt = '你是一個精通東西方命理的算命師「小彌」。你的風格溫暖、具體、有洞察力，用繁體中文。以下是前端已計算好的命理數據，請根據這些數據為 ' + fullName + ' 解讀：\n\n' +
      '【出生資料】' + dateVal + ' ' + hourText + ' · ' + gender + ' · 出生地 ' + place + '\n\n' +
      '【八字四柱】' + baziResult.yearGanzhi + '年 ' + baziResult.monthGanzhi + '月 ' + baziResult.dayGanzhi + '日 ' + baziResult.hourGanzhi + '時\n' +
      '日主：' + baziResult.dayGan + '（' + baziResult.dayWuxing + '）· 生肖：' + baziResult.yearZodiac + '\n\n' +
      '【紫微斗數】主星：' + ziweiResult.mainStar + '坐' + ziweiResult.mainPosition + '，輔星：' + ziweiResult.supportStar + '\n\n' +
      '【人類圖】類型：' + renleituResult.type + ' · 通道：' + renleituResult.channel + ' · 策略：' + renleituResult.strategy + ' · 權威：' + renleituResult.authority + '\n\n' +
      '【西洋占星】太陽 ' + astrologyResult.sun + '座 · 月亮 ' + astrologyResult.moon + '座 · 上升 ' + astrologyResult.rising + '座\n\n' +
      '【生命靈數】' + lifePathNum + '\n\n' +
      '【姓名三才】' + (nameScience.sanCai || '未知') + '（' + (nameScience.sanCaiResult || '—') + '）\n\n' +
      tarotInfo + '\n' +
      yijingInfo + '\n' +
      integrationInfo + '\n' +
      '【要求】\n' +
      '1. 不要重新推算任何數值，全部基於以上數據解讀。\n' +
      '2. 每個領域要給出具體的命理分析，包含該命理系統的專有名詞，並結合多個系統互相印證。\n' +
      '3. 給出針對性的人生建議：事業方向、人際關係、財運、健康方面的提醒或建議。\n' +
      '4. 語氣溫暖真誠，像一個真正懂命理的朋友在聊天。\n' +
      '5. 用 ===XXX=== 格式輸出，每個區塊內容約100-150字。\n\n' +
      '格式範例：\n' +
      '===八字===\n內容\n\n===紫微斗數===\n內容\n\n===人類圖===\n內容\n\n===占星===\n內容\n\n===塔羅===\n內容\n\n===易經===\n內容\n\n===總結===\n以「' + fullName + '，」開頭的總結，約200字，整合多重命理系統的共通信息給予人生方向的指引。';

    var startTime = Date.now();
    var stepInterval = setInterval(function () {
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      var messages = [
        '小彌正在為你推演天機⋯',
        '翻閱命盤，細察星辰⋯',
        '八字符號漸漸浮現⋯',
        '紫微星曜正在排列⋯',
        '靈數共振⋯人類圖展開⋯',
        '占星盤已經定位⋯',
        '小彌正在書寫你的命理⋯'
      ];
      var idx = Math.min(elapsed, messages.length - 1);
      loaderText.textContent = messages[idx];
      var dots = '';
      for (var d = 0; d < (elapsed % 4); d++) dots += '.';
      loaderSub.textContent = '請稍候' + dots;
    }, 1000);

    fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-1374c7434a77473faceabd3698e6b23b'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是小彌，一個精通東西方命理的算命師。你的角色特質：\n1. 溫暖真誠，像一個懂命理的朋友，不是冷冰冰的分析機器。\n2. 解讀要具體——直接說「你的八字日主丙火生於酉月，正財格，財星當令，意味著⋯」，而不是籠統的「你很有才華」。\n3. 每個命理系統要給出針對性的建議：事業、財運、感情、健康至少涵蓋兩個面向。\n4. 當多個系統指向相同方向時，要點出來互相印證（例如「八字和人類圖都顯示⋯」）。\n5. 用繁體中文，語氣溫柔但不廢話。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.7
      })
    })
    .then(function (response) { return response.json(); })
    .then(function (data) {
      clearInterval(stepInterval);
      if (data.error) {
        loaderText.textContent = '⚠️ 小彌算不出來⋯';
        loaderSub.textContent = '錯誤：' + (data.error.message || 'API 錯誤');
        return;
      }
      var content = data.choices[0].message.content;
      loaderText.textContent = '✨ 命理推演完成 ✨';
      loaderSub.textContent = '讓小彌為你揭曉⋯';

      window.xfLLMResult = parseBlocks(content);

      setTimeout(function () {
        renderResults();
        goTo('result');
      }, 800);
    })
    .catch(function (err) {
      clearInterval(stepInterval);
      loaderText.textContent = '⚠️ 連不上小彌⋯';
      loaderSub.textContent = '錯誤：' + err.message;
    });
  }

  function parseBlocks (text) {
    var result = { bazi: '', ziwei: '', renleitu: '', astrology: '', tarot: '', yijing: '', summary: '' };
    var sections = text.split(/(?:^|\n)={3,}\s*/);
    var keyMap = {
      '八字': 'bazi', '紫微': 'ziwei', '人類圖': 'renleitu',
      '占星': 'astrology', '塔羅': 'tarot', '易經': 'yijing', '總結': 'summary'
    };
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i].trim();
      if (!sec) continue;
      for (var key in keyMap) {
        if (sec.indexOf(key) === 0 || sec.indexOf('===' + key) === 0) {
          var content = sec.substring(key.length).replace(/^[=\s]+/, '').trim();
          result[keyMap[key]] = content.replace(/\n/g, '</p><p>');
          break;
        }
      }
    }
    for (var k in result) {
      if (!result[k]) result[k] = '（小彌正在思考中⋯）';
    }
    return result;
  }

  /* ===== 結果渲染（Phase 2 塔羅視覺化） ===== */
  function renderResults () {
    var d = window.xfResult;
    var c = window.xfComputed;
    var llm = window.xfLLMResult;
    if (!d) return;

    document.getElementById('xf-result-name').textContent = d.name + ' · ' + d.gender + ' · ' + d.birthDate;

    // 生命靈數
    var lifePathEl = document.getElementById('xf-life-number');
    lifePathEl.textContent = d.lifePathNum;

    // 八字
    if (c && c.bazi) {
      var b = c.bazi;
      document.getElementById('xf-bazi-text').innerHTML =
        '<div class="xf-computed-summary">' +
        '<p><strong>八字四柱</strong>：' + b.yearGanzhi + '年 ' + b.monthGanzhi + '月 ' + b.dayGanzhi + '日 ' + b.hourGanzhi + '時</p>' +
        '<p>日主：<strong>' + b.dayGan + '</strong>（' + b.dayWuxing + '性）· 生肖：' + b.yearZodiac + '</p>' +
        '</div>' +
        (llm && llm.bazi ? '<div class="xf-llm-reading"><p>' + llm.bazi + '</p></div>' : '');
    } else if (llm && llm.bazi) {
      document.getElementById('xf-bazi-text').innerHTML = '<p>' + llm.bazi + '</p>';
    }

    // 紫微
    if (c && c.ziwei) {
      var z = c.ziwei;
      document.getElementById('xf-ziwei-text').innerHTML =
        '<div class="xf-computed-summary">' +
        '<p>命宮：<strong>' + (z.mingGong ? z.mingGong.ganzhi : '') + '</strong> · ' + (z.wuxingJu || '') + '</p>' +
        '<p><strong>' + z.mainStar + '</strong>坐命宮，輔星：' + z.supportStar + '</p>' +
        (z.ziweiPosition ? '<p style="font-size:0.85rem;color:var(--xf-ink-light)">紫微在<strong>' + z.ziweiPosition + '</strong>宮，天府在<strong>' + z.tianfuPosition + '</strong>宮</p>' : '') +
        '</div>' +
        (llm && llm.ziwei ? '<div class="xf-llm-reading"><p>' + llm.ziwei + '</p></div>' : '');
    } else if (llm && llm.ziwei) {
      document.getElementById('xf-ziwei-text').innerHTML = '<p>' + llm.ziwei + '</p>';
    }

    // 人類圖
    if (c && c.renleitu) {
      var r = c.renleitu;
      document.getElementById('xf-renleitu-text').innerHTML =
        '<div class="xf-computed-summary">' +
        '<p><strong>類型</strong>：' + r.type + '</p>' +
        '<p><strong>通道</strong>：' + r.channel + '</p>' +
        '<p><strong>策略</strong>：' + r.strategy + ' · <strong>權威</strong>：' + r.authority + '</p>' +
        '</div>' +
        (llm && llm.renleitu ? '<div class="xf-llm-reading"><p>' + llm.renleitu + '</p></div>' : '');
    } else if (llm && llm.renleitu) {
      document.getElementById('xf-renleitu-text').innerHTML = '<p>' + llm.renleitu + '</p>';
    }

    // 占星
    if (c && c.astrology) {
      var a = c.astrology;
      document.getElementById('xf-astrology-text').innerHTML =
        '<div class="xf-computed-summary">' +
        '<p>☀️ 太陽：<strong>' + a.sun + '座</strong></p>' +
        '<p>🌙 月亮：<strong>' + a.moon + '座</strong></p>' +
        '<p>⬆️ 上升：<strong>' + a.rising + '座</strong>' + (a.usingApproximateRising ? '<span style=\"font-size:0.7rem;color:#b8a88a;margin-left:0.4rem\">(近似值，輸入出生地後更準確)</span>' : '<span style=\"font-size:0.7rem;color:#6b8e6b;margin-left:0.4rem\">(經緯度計算)</span>') + '</p>' +
        '<p>🕐 時辰：<strong>' + (a.shichen || '—') + '</strong></p>' +
        '</div>' +
        (llm && llm.astrology ? '<div class="xf-llm-reading"><p>' + llm.astrology + '</p></div>' : '');
    } else if (llm && llm.astrology) {
      document.getElementById('xf-astrology-text').innerHTML = '<p>' + llm.astrology + '</p>';
    }

    // ===== Phase 2 塔羅視覺化渲染 =====
    var tarotDisplay = document.getElementById('xf-tarot-display');
    var usedDraw = d.tarotDraw || currentTarotDraw;

    if (tarotDisplay && usedDraw) {
      tarotDisplay.innerHTML = renderTarotDisplay(usedDraw);
      updateTarotSubtitle(usedDraw.spread ? usedDraw.spread.name : '塔羅');
      syncSpreadSelector(usedDraw.spread ? usedDraw.spread.id : currentSpreadId);
      currentTarotDraw = usedDraw;
      if (usedDraw.spread) currentSpreadId = usedDraw.spread.id;
    } else {
      if (tarotDisplay) tarotDisplay.innerHTML = '<p style="text-align:center;color:#8b5e3c;">（尚未抽取塔羅）</p>';
    }

    // 若有 LLM 的塔羅文字，附加在顯示區下方
    if (llm && llm.tarot && tarotDisplay) {
      var llmBox = document.createElement('div');
      llmBox.style.cssText = 'margin-top:0.85rem;padding:0.6rem 0.75rem;background:rgba(196,169,125,0.12);border-radius:4px;font-size:0.9rem;color:#5a3e30;';
      llmBox.innerHTML = '<div style="font-size:0.72rem;color:#8b5e3c;margin-bottom:0.25rem;">小彌塔羅洞見</div>' + llm.tarot;
      // 避免重複附加
      var old = tarotDisplay.querySelector('.xf-llm-tarot');
      if (old) old.remove();
      llmBox.className = 'xf-llm-tarot';
      tarotDisplay.appendChild(llmBox);
    }

    // 易經區塊（Phase 3 升級：豐富顯示，保留 LLM 文字作為補充）
    var yjDisplay = document.getElementById('xf-yijing-display');
    var usedYJ = d.yijingResult || (currentYijingResult || null);

    if (yjDisplay) {
      if (usedYJ && usedYJ.primary) {
        yjDisplay.innerHTML = renderFullYijing(usedYJ);
        currentYijingResult = usedYJ; // 同步給重抽按鈕
      } else {
        yjDisplay.innerHTML = renderYijing(d.yijingLines || []);
      }
      // 若有 LLM 的易經文字，附加在下方
      if (llm && llm.yijing) {
        var llmYJ = document.createElement('div');
        llmYJ.style.cssText = 'margin-top:0.5rem;padding:0.45rem 0.55rem;background:rgba(196,169,125,0.08);border-radius:4px;font-size:0.85rem;color:#5a3e30;';
        llmYJ.innerHTML = '<div style="font-size:0.7rem;color:#8b5e3c;margin-bottom:0.15rem;">小彌易經洞見</div>' + llm.yijing;
        yjDisplay.appendChild(llmYJ);
      }
    }

    // ===== Phase 4: 命理整合建議區塊 =====
    var intSection = document.getElementById('xf-integration-section');
    var intInsightsEl = document.getElementById('xf-integration-insights');
    var hasTarotOrYijing = !!(d.tarotDraw || d.yijingResult || currentTarotDraw || currentYijingResult);

    if (intSection && intInsightsEl) {
      if (hasTarotOrYijing && window.FORTUNE_INTEGRATION && typeof window.FORTUNE_INTEGRATION.generateInsights === 'function') {
        var intData = {
          bazi: c && c.bazi,
          ziwei: c && c.ziwei,
          astrology: c && c.astrology,
          renleitu: c && c.renleitu,
          tarotDraw: d.tarotDraw || currentTarotDraw,
          yijingResult: d.yijingResult || currentYijingResult
        };
        var insights = window.FORTUNE_INTEGRATION.generateInsights(intData) || [];
        if (insights.length > 0) {
          intInsightsEl.innerHTML = insights.map(function (txt, i) {
            return '<div style="margin-bottom:0.65rem;padding-bottom:0.5rem;border-bottom:1px dotted #d8c9a8;"><strong style="color:#c23b22;">' + (i + 1) + '.</strong> ' + txt + '</div>';
          }).join('');
          intSection.style.display = '';
        } else {
          intSection.style.display = 'none';
        }
      } else {
        intSection.style.display = 'none';
      }
    }

    // 總結
    if (llm && llm.summary) {
      document.getElementById('xf-summary-body').innerHTML = '<p>' + llm.summary + '</p>';
    } else {
      document.getElementById('xf-summary-body').innerHTML = '<p>親愛的 <strong>' + d.name + '</strong>，命理是地圖，不是目的地。</p>';
    }

    // 姓名學
    var nameHtml = renderNameScience(d.surname, d.givenname, c);
    document.getElementById('xf-name-text').innerHTML = nameHtml;

    setTimeout(function () {
      var cards = document.querySelectorAll('.xf-card');
      cards.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('visible'); }, i * 250);
      });
    }, 300);

    initTabs();
  }

  /* ===== 姓名學渲染（完全保留） ===== */
  function renderNameScience (surname, givenname, c) {
    if (!c || !c.nameScience) {
      return '<p>姓名學數據計算中⋯</p>';
    }
    var ns = c.nameScience;

    if (ns.missing && ns.missing.length > 0) {
      return '<p>姓名學筆畫查詢中，以下字不在此版本對照表中：<strong>' + ns.missing.join('、') + '</strong></p><p style="color:#b8a88a;font-size:0.85rem">（姓名學功能將在後續版本擴充字庫）</p>';
    }

    var s = ns.sanCaiResult;
    var color = (s === '吉' || s === '大吉') ? '#4a7c59' : '#c23b22';

    return '<p><strong>' + surname + givenname + '</strong> 三才五格分析：</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin:0.5rem 0">' +
      '<tr style="border-bottom:1px solid #c4a97d"><td style="padding:4px 8px;font-weight:600">格位</td><td style="padding:4px 8px">筆畫</td><td style="padding:4px 8px">五行</td><td style="padding:4px 8px">吉凶</td></tr>' +
      '<tr><td style="padding:4px 8px">天格</td><td style="padding:4px 8px">' + ns.tianGe.value + '</td><td style="padding:4px 8px;color:' + ns.tianGe.color + '">' + ns.tianGe.wuxing + '</td><td style="padding:4px 8px">' + ns.tianGe.grade + '</td></tr>' +
      '<tr><td style="padding:4px 8px">人格</td><td style="padding:4px 8px">' + ns.renGe.value + '</td><td style="padding:4px 8px;color:' + ns.renGe.color + '">' + ns.renGe.wuxing + '</td><td style="padding:4px 8px">' + ns.renGe.grade + '</td></tr>' +
      '<tr><td style="padding:4px 8px">地格</td><td style="padding:4px 8px">' + ns.diGe.value + '</td><td style="padding:4px 8px;color:' + ns.diGe.color + '">' + ns.diGe.wuxing + '</td><td style="padding:4px 8px">' + ns.diGe.grade + '</td></tr>' +
      '<tr><td style="padding:4px 8px">外格</td><td style="padding:4px 8px">' + ns.waiGe.value + '</td><td style="padding:4px 8px;color:' + ns.waiGe.color + '">' + ns.waiGe.wuxing + '</td><td style="padding:4px 8px">' + ns.waiGe.grade + '</td></tr>' +
      '<tr><td style="padding:4px 8px">總格</td><td style="padding:4px 8px">' + ns.zongGe.value + '</td><td style="padding:4px 8px;color:' + ns.zongGe.color + '">' + ns.zongGe.wuxing + '</td><td style="padding:4px 8px">' + ns.zongGe.grade + '</td></tr>' +
      '</table>' +
      '<p><strong>三才配置</strong>：天' + ns.tianGe.wuxing + '·人' + ns.renGe.wuxing + '·地' + ns.diGe.wuxing + ' — <span style="color:' + color + '">' + ns.sanCaiResult + '</span></p>' +
      '<p style="font-size:0.85rem;color:var(--xf-ink-light)">三才配置看天人地的五行生割關係，吉者主運勢順遂，平者需後天努力補足，凶者宜改名或以此警惕。</p>';
  }

  /* ===== Tabs（保留） ===== */
  function initTabs () {
    var tabContainer = document.getElementById('xf-tabs');
    if (!tabContainer) return;
    var tabs = tabContainer.querySelectorAll('.xf-tab');
    var contents = document.querySelectorAll('.xf-tab-content');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        contents.forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var target = document.getElementById(this.dataset.target);
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
      document.querySelectorAll('.xf-card').forEach(function (el) { el.classList.remove('visible'); });
      goTo('form');
    }
  });

  /* ===== Phase 2：塔羅重新抽牌 + 牌陣切換（Phase 4 支援意念模式） ===== */
  var drawTarotBtn = document.getElementById('xf-draw-tarot');
  if (drawTarotBtn) {
    drawTarotBtn.addEventListener('click', function () {
      if (intentionMode) {
        performTarotDrawWithIntention(currentSpreadId);
      } else {
        performTarotDraw(currentSpreadId, true);
      }
    });
  }

  /* 牌陣選擇器事件委派 */
  var selector = document.getElementById('xf-tarot-spread-selector');
  if (selector) {
    selector.addEventListener('click', function (e) {
      var btn = e.target.closest('.xf-spread-btn');
      if (!btn) return;
      var newId = btn.dataset.spread;
      if (newId && newId !== currentSpreadId) {
        if (intentionMode) {
          performTarotDrawWithIntention(newId);
        } else {
          performTarotDraw(newId, true);
        }
      }
    });
  }

  /* ===== Phase 4: 意念模式 checkbox 與倒數 ===== */
  var intentionChk = document.getElementById('xf-intention-mode');
  var intentionHint = document.getElementById('xf-intention-hint');
  if (intentionChk) {
    intentionChk.addEventListener('change', function () {
      intentionMode = this.checked;
      if (intentionHint) {
        intentionHint.style.display = intentionMode ? 'block' : 'none';
      }
    });
  }

  // 輔助：意念模式下的 3 秒倒數抽牌
  function performTarotDrawWithIntention (spreadId) {
    var display = document.getElementById('xf-tarot-display');
    var section = document.getElementById('xf-tarot-section');
    if (!display) {
      performTarotDraw(spreadId, true);
      return;
    }

    // 顯示倒數提示
    display.innerHTML = `
      <div style="text-align:center;padding:1.2rem 0.5rem;">
        <div style="font-size:1.1rem;color:#c23b22;margin-bottom:0.4rem;">閉上眼睛，想著你的問題...</div>
        <div id="xf-countdown" style="font-family:var(--xf-font-brush);font-size:2.8rem;color:#8b5e3c;line-height:1;">3</div>
        <div style="font-size:0.75rem;color:#b8a88a;margin-top:0.3rem;">那一瞬間，是我們兩個一起決定的。</div>
      </div>
    `;

    if (section) {
      section.style.transition = 'background 0.3s';
      section.style.background = 'rgba(194, 59, 34, 0.06)';
    }

    var cd = document.getElementById('xf-countdown');
    var count = 3;

    var timer = setInterval(function () {
      count--;
      if (cd) cd.textContent = count > 0 ? count : '✨';
      if (count <= 0) {
        clearInterval(timer);
        // 真正抽牌
        setTimeout(function () {
          performTarotDraw(spreadId, true);
          if (section) section.style.background = '';
        }, 180);
      }
    }, 950);
  }

  /* ===== 重抽易經（Phase 3 升級） ===== */
  var drawYijingBtn = document.getElementById('xf-draw-yijing');
  if (drawYijingBtn) {
    drawYijingBtn.addEventListener('click', function () {
      var yjDisplay = document.getElementById('xf-yijing-display');
      if (window.FORTUNE_YIJING && typeof window.FORTUNE_YIJING.cast === 'function') {
        currentYijingResult = window.FORTUNE_YIJING.cast();
        if (window.xfResult) window.xfResult.yijingResult = currentYijingResult;
        if (yjDisplay) yjDisplay.innerHTML = renderFullYijing(currentYijingResult);
      } else {
        var lines = castYijing();
        if (yjDisplay) yjDisplay.innerHTML = renderYijing(lines);
      }
    });
  }

  /* ===== 初始同步（若有預設抽牌） ===== */
  // 結果頁載入後若已有 tarotDraw，renderResults 會處理同步

});
