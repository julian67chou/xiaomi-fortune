/* ===== 小彌算命 · UI 層 — fortune-ui.js ===== */
/* 所有命理計算已移至 fortune-core.js (window.XiaomiFortune) */

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
  var hourSelect = document.getElementById('xf-hour');
  var placeInput = document.getElementById('xf-place');
  var genderInputs = document.querySelectorAll('input[name="gender"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var surname = surnameInput.value.trim();
    var givenname = givennameInput.value.trim();
    var fullName = surname + givenname;
    var dateVal = dateInput.value;
    var hour = hourSelect.value;
    var place = placeInput.value.trim();
    var gender = '';
    genderInputs.forEach(function (g) { if (g.checked) gender = g.value; });

    if (!surname) { alert('請輸入你的姓氏～'); return; }
    if (!givenname) { alert('請輸入你的名字～'); return; }
    if (!dateVal) { alert('請選擇出生日期～'); return; }

    var dateParts = dateVal.split('-').map(Number);
    var year = dateParts[0], month = dateParts[1], day = dateParts[2];
    var genderText = gender === 'male' ? '男' : '女';

    // 用 XiaomiFortune 計算所有命理數據
    var f = window.XiaomiFortune;
    var baziResult = f.calcBazi(year, month, day, hour || '子');
    var ziweiResult = f.calcZiwei(year, month, day, hour || '子', genderText);
    var renleituResult = f.calcRenleitu(year, month, day, hour || '子');
    var astrologyResult = f.calcAstrology(year, month, day, hour || '子');
    var lifePathNum = f.calcLifePath(year, month, day);
    var nameScience = f.generateNameScience(surname, givenname);

    // 塔羅 & 易經（隨機，每次不同）
    var tarotCard = TAROT_MAJOR[Math.floor(Math.random() * TAROT_MAJOR.length)];
    var yijingLines = castYijing();

    var hourText = '不確定';
    if (hour) {
      var hourOpt = document.getElementById('xf-hour');
      hourText = hourOpt.options[hourOpt.selectedIndex].text;
    }

    // 儲存全域供渲染用
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
      tarotCard: tarotCard,
      yijingLines: yijingLines
    };

    window.xfComputed = {
      bazi: baziResult,
      ziwei: ziweiResult,
      renleitu: renleituResult,
      astrology: astrologyResult,
      lifePathNum: lifePathNum,
      nameScience: nameScience
    };

    goTo('loading');
    callXiaomiApi(fullName, dateVal, hourText, place || '未知', genderText,
      year, month, day, lifePathNum, baziResult, ziweiResult, renleituResult,
      astrologyResult, nameScience);
  });

  /* ===== 小彌 API 呼叫 ===== */
  function callXiaomiApi (fullName, dateVal, hourText, place, gender,
    year, month, day, lifePathNum, baziResult, ziweiResult, renleituResult,
    astrologyResult, nameScience) {

    var loaderText = document.querySelector('.xf-loading-text');
    var loaderSub = document.querySelector('.xf-loading-sub');

    loaderText.textContent = '小彌正在為你推演天機⋯';
    loaderSub.textContent = '翻閱命盤，細察星辰⋯';

    // prompt：帶入前端已算好的數據
    var prompt = '你是一個精通東西方命理的算命師「小彌」。你的風格溫暖、具體、有洞察力，用繁體中文。以下是前端已計算好的命理數據，請根據這些數據為 ' + fullName + ' 解讀：\n\n' +
      '【出生資料】' + dateVal + ' ' + hourText + ' · ' + gender + ' · 出生地 ' + place + '\n\n' +
      '【八字四柱】' + baziResult.yearGanzhi + '年 ' + baziResult.monthGanzhi + '月 ' + baziResult.dayGanzhi + '日 ' + baziResult.hourGanzhi + '時\n' +
      '日主：' + baziResult.dayGan + '（' + baziResult.dayWuxing + '）· 生肖：' + baziResult.yearZodiac + '\n\n' +
      '【紫微斗數】主星：' + ziweiResult.mainStar + '坐' + ziweiResult.mainPosition + '，輔星：' + ziweiResult.supportStar + '\n\n' +
      '【人類圖】類型：' + renleituResult.type + ' · 通道：' + renleituResult.channel + ' · 策略：' + renleituResult.strategy + ' · 權威：' + renleituResult.authority + '\n\n' +
      '【西洋占星】太陽 ' + astrologyResult.sun + '座 · 月亮 ' + astrologyResult.moon + '座 · 上升 ' + astrologyResult.rising + '座\n\n' +
      '【生命靈數】' + lifePathNum + '\n\n' +
      '【姓名三才】' + (nameScience.sanCai || '未知') + '（' + (nameScience.sanCaiResult || '—') + '）\n\n' +
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

  /* ===== 結果渲染 ===== */
  function renderResults () {
    var d = window.xfResult;
    var c = window.xfComputed;
    var llm = window.xfLLMResult;
    if (!d) return;

    document.getElementById('xf-result-name').textContent = d.name + ' · ' + d.gender + ' · ' + d.birthDate;

    // 生命靈數
    var lifePathEl = document.getElementById('xf-life-number');
    lifePathEl.textContent = d.lifePathNum;

    // 八字分頁
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

    // 紫微分頁
    if (c && c.ziwei) {
      var z = c.ziwei;
      document.getElementById('xf-ziwei-text').innerHTML =
        '<div class="xf-computed-summary">' +
        '<p><strong>主星</strong>：' + z.mainStar + ' 坐 ' + z.mainPosition + '</p>' +
        '<p><strong>輔星</strong>：' + z.supportStar + '</p>' +
        '</div>' +
        (llm && llm.ziwei ? '<div class="xf-llm-reading"><p>' + llm.ziwei + '</p></div>' : '');
    } else if (llm && llm.ziwei) {
      document.getElementById('xf-ziwei-text').innerHTML = '<p>' + llm.ziwei + '</p>';
    }

    // 人類圖分頁
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

    // 占星分頁
    if (c && c.astrology) {
      var a = c.astrology;
      document.getElementById('xf-astrology-text').innerHTML =
        '<div class="xf-computed-summary">' +
        '<p>☀️ 太陽：<strong>' + a.sun + '座</strong></p>' +
        '<p>🌙 月亮：<strong>' + a.moon + '座</strong></p>' +
        '<p>⬆️ 上升：<strong>' + a.rising + '座</strong></p>' +
        '</div>' +
        (llm && llm.astrology ? '<div class="xf-llm-reading"><p>' + llm.astrology + '</p></div>' : '');
    } else if (llm && llm.astrology) {
      document.getElementById('xf-astrology-text').innerHTML = '<p>' + llm.astrology + '</p>';
    }

    // 塔羅區塊
    if (llm && llm.tarot) {
      document.getElementById('xf-tarot-name').textContent = '🔮';
      document.getElementById('xf-tarot-meaning').textContent = llm.tarot;
    } else {
      document.getElementById('xf-tarot-name').textContent = d.tarotCard.name;
      document.getElementById('xf-tarot-meaning').textContent = d.tarotCard.meaning;
    }

    // 易經區塊
    if (llm && llm.yijing) {
      document.getElementById('xf-yijing-display').innerHTML = '<p style="text-align:center;padding:1rem">' + llm.yijing + '</p>';
    } else {
      document.getElementById('xf-yijing-display').innerHTML = renderYijing(d.yijingLines);
    }

    // 總結
    if (llm && llm.summary) {
      document.getElementById('xf-summary-body').innerHTML = '<p>' + llm.summary + '</p>';
    } else {
      document.getElementById('xf-summary-body').innerHTML = '<p>親愛的 <strong>' + d.name + '</strong>，命理是地圖，不是目的地。</p>';
    }

    // 姓名學（純前端計算）
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

  /* ===== 姓名學渲染 ===== */
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
      '<p style="font-size:0.85rem;color:var(--xf-ink-light)">三才配置看天人地的五行生剋關係，吉者主運勢順遂，平者需後天努力補足，凶者宜改名或以此警惕。</p>';
  }

  /* ===== Tabs ===== */
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

  /* ===== 抽牌按鈕 ===== */
  var drawTarotBtn = document.getElementById('xf-draw-tarot');
  if (drawTarotBtn) {
    drawTarotBtn.addEventListener('click', function () {
      var card = TAROT_MAJOR[Math.floor(Math.random() * TAROT_MAJOR.length)];
      document.getElementById('xf-tarot-name').textContent = card.name;
      document.getElementById('xf-tarot-meaning').textContent = card.meaning;
      var tarotSection = document.getElementById('xf-tarot-section');
      if (tarotSection) {
        tarotSection.style.transition = 'background 0.3s';
        tarotSection.style.background = 'rgba(194, 59, 34, 0.08)';
        setTimeout(function () { tarotSection.style.background = ''; }, 600);
      }
    });
  }

  /* ===== 重抽易經 ===== */
  var drawYijingBtn = document.getElementById('xf-draw-yijing');
  if (drawYijingBtn) {
    drawYijingBtn.addEventListener('click', function () {
      var lines = castYijing();
      document.getElementById('xf-yijing-display').innerHTML = renderYijing(lines);
    });
  }

});
