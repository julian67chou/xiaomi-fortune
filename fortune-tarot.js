/**
 * 小彌算命 - 塔羅完整資料庫 fortune-tarot.js
 * 78張牌（22大阿爾克那 + 56小阿爾克那）+ 多種牌陣定義
 * 每張牌含正逆位中文解釋（15-30字）
 * 掛載 window.FORTUNE_TAROT
 */
(function () {
  'use strict';

  const CARDS = [
    // ============================================================
    // 22 Major Arcana 大阿爾克那（正位拷貝自 fortune-ui.js，補逆位）
    // ============================================================
    {
      id: 'major-00',
      name: '愚者',
      nameEn: 'The Fool',
      suit: 'major',
      number: 0,
      rank: 'major',
      upright: '新的開始、冒險、純真。勇敢踏出未知一步。',
      reversed: '魯莽、猶豫、機會從指縫溜走。'
    },
    {
      id: 'major-01',
      name: '魔術師',
      nameEn: 'The Magician',
      suit: 'major',
      number: 1,
      rank: 'major',
      upright: '創造力、技能、自信。擁有實現目標的工具。',
      reversed: '操縱、技能不足、機會被浪費。'
    },
    {
      id: 'major-02',
      name: '女祭司',
      nameEn: 'The High Priestess',
      suit: 'major',
      number: 2,
      rank: 'major',
      upright: '直覺、內在智慧、神秘。靜心聆聽內在聲音。',
      reversed: '隱藏秘密、壓抑直覺、表面知識。'
    },
    {
      id: 'major-03',
      name: '皇后',
      nameEn: 'The Empress',
      suit: 'major',
      number: 3,
      rank: 'major',
      upright: '豐收、滋養、自然。享受生命豐盛與被照顧。',
      reversed: '創造力受阻、依賴、豐盛流失。'
    },
    {
      id: 'major-04',
      name: '皇帝',
      nameEn: 'The Emperor',
      suit: 'major',
      number: 4,
      rank: 'major',
      upright: '權威、結構、穩定。建立秩序並負起責任。',
      reversed: '專制、失控、缺乏紀律。'
    },
    {
      id: 'major-05',
      name: '教皇',
      nameEn: 'The Hierophant',
      suit: 'major',
      number: 5,
      rank: 'major',
      upright: '傳統、指引、信仰。尋求智者教導或成為導師。',
      reversed: '叛逆、教條、誤導。'
    },
    {
      id: 'major-06',
      name: '戀人',
      nameEn: 'The Lovers',
      suit: 'major',
      number: 6,
      rank: 'major',
      upright: '選擇、連結、價值觀。跟隨內心做重要決定。',
      reversed: '關係失衡、錯誤選擇、價值衝突。'
    },
    {
      id: 'major-07',
      name: '戰車',
      nameEn: 'The Chariot',
      suit: 'major',
      number: 7,
      rank: 'major',
      upright: '意志力、決心、勝利。以紀律克服障礙。',
      reversed: '失控、方向不明、侵略性。'
    },
    {
      id: 'major-08',
      name: '力量',
      nameEn: 'Strength',
      suit: 'major',
      number: 8,
      rank: 'major',
      upright: '內在力量、勇氣、溫柔。以耐心馴服野性。',
      reversed: '軟弱、恐懼、控制過度。'
    },
    {
      id: 'major-09',
      name: '隱士',
      nameEn: 'The Hermit',
      suit: 'major',
      number: 9,
      rank: 'major',
      upright: '內省、獨處、尋求真理。孤獨是必要旅程。',
      reversed: '孤立、退縮、拒絕幫助。'
    },
    {
      id: 'major-10',
      name: '命運之輪',
      nameEn: 'Wheel of Fortune',
      suit: 'major',
      number: 10,
      rank: 'major',
      upright: '轉變、循環、契機。命運轉動，迎接變化。',
      reversed: '停滯、抗拒變化、壞運循環。'
    },
    {
      id: 'major-11',
      name: '正義',
      nameEn: 'Justice',
      suit: 'major',
      number: 11,
      rank: 'major',
      upright: '公平、真理、因果。種因得果，真相顯現。',
      reversed: '不公、偏見、逃避責任。'
    },
    {
      id: 'major-12',
      name: '吊人',
      nameEn: 'The Hanged Man',
      suit: 'major',
      number: 12,
      rank: 'major',
      upright: '暫停、犧牲、新視角。停滯為看見新世界。',
      reversed: '固執、犧牲無意義、拖延。'
    },
    {
      id: 'major-13',
      name: '死神',
      nameEn: 'Death',
      suit: 'major',
      number: 13,
      rank: 'major',
      upright: '結束、轉變、放下。結束是重生前奏。',
      reversed: '抗拒改變、停滯不前、無法釋懷。'
    },
    {
      id: 'major-14',
      name: '節制',
      nameEn: 'Temperance',
      suit: 'major',
      number: 14,
      rank: 'major',
      upright: '平衡、調和、中庸。找到不急不徐的節奏。',
      reversed: '失衡、過度、缺乏調節。'
    },
    {
      id: 'major-15',
      name: '惡魔',
      nameEn: 'The Devil',
      suit: 'major',
      number: 15,
      rank: 'major',
      upright: '束縛、執著、物質。認清枷鎖才能掙脫。',
      reversed: '釋放、覺醒、掙脫枷鎖。'
    },
    {
      id: 'major-16',
      name: '高塔',
      nameEn: 'The Tower',
      suit: 'major',
      number: 16,
      rank: 'major',
      upright: '崩壞、覺醒、劇變。舊結構倒塌，騰出空間。',
      reversed: '避免災難、漸進改變、恐懼改變。'
    },
    {
      id: 'major-17',
      name: '星星',
      nameEn: 'The Star',
      suit: 'major',
      number: 17,
      rank: 'major',
      upright: '希望、靈感、平靜。黑暗中見星光，保持信心。',
      reversed: '絕望、失落、信心動搖。'
    },
    {
      id: 'major-18',
      name: '月亮',
      nameEn: 'The Moon',
      suit: 'major',
      number: 18,
      rank: 'major',
      upright: '幻象、恐懼、潛意識。面對陰影才能見真相。',
      reversed: '真相浮現、恐懼消散、混亂結束。'
    },
    {
      id: 'major-19',
      name: '太陽',
      nameEn: 'The Sun',
      suit: 'major',
      number: 19,
      rank: 'major',
      upright: '喜悅、成功、活力。陰霾散去，值得快樂。',
      reversed: '暫時挫折、過度樂觀、快樂受阻。'
    },
    {
      id: 'major-20',
      name: '審判',
      nameEn: 'Judgement',
      suit: 'major',
      number: 20,
      rank: 'major',
      upright: '重生、召喚、覺醒。回應內心呼喚。',
      reversed: '拒絕呼喚、停滯、審判延遲。'
    },
    {
      id: 'major-21',
      name: '世界',
      nameEn: 'The World',
      suit: 'major',
      number: 21,
      rank: 'major',
      upright: '完成、整合、圓滿。一個循環結束，慶祝旅程。',
      reversed: '未完成、停滯、無法圓滿。'
    },

    // ============================================================
    // 56 Minor Arcana 小阿爾克那
    // ============================================================

    // ---------------- Wands 權杖 (火元素：行動、熱情、創意) ----------------
    { id: 'wands-01', name: '權杖一', nameEn: 'Ace of Wands', suit: 'wands', number: 1, rank: 'ace', upright: '創意火花、新的機會、熱情燃起。', reversed: '延遲啟動、創意枯竭、熱情消退。' },
    { id: 'wands-02', name: '權杖二', nameEn: 'Two of Wands', suit: 'wands', number: 2, rank: '2', upright: '計劃、選擇、遠見。站在十字路口做決定。', reversed: '猶豫不決、計劃受阻、缺乏遠見。' },
    { id: 'wands-03', name: '權杖三', nameEn: 'Three of Wands', suit: 'wands', number: 3, rank: '3', upright: '擴展、遠航、初步成功。努力開始見成果。', reversed: '延遲、挫折、計劃延後。' },
    { id: 'wands-04', name: '權杖四', nameEn: 'Four of Wands', suit: 'wands', number: 4, rank: '4', upright: '穩定、慶祝、和諧。家庭或事業基礎穩固。', reversed: '不穩定、衝突、缺乏支持。' },
    { id: 'wands-05', name: '權杖五', nameEn: 'Five of Wands', suit: 'wands', number: 5, rank: '5', upright: '競爭、衝突、挑戰。為理想而戰。', reversed: '避免衝突、內耗、失敗。' },
    { id: 'wands-06', name: '權杖六', nameEn: 'Six of Wands', suit: 'wands', number: 6, rank: '6', upright: '勝利、公開認可、進展。獲得成功與掌聲。', reversed: '失敗、驕傲自滿、延遲勝利。' },
    { id: 'wands-07', name: '權杖七', nameEn: 'Seven of Wands', suit: 'wands', number: 7, rank: '7', upright: '防衛、堅持、勇氣。守住立場。', reversed: '放棄、防守過度、信心不足。' },
    { id: 'wands-08', name: '權杖八', nameEn: 'Eight of Wands', suit: 'wands', number: 8, rank: '8', upright: '快速行動、進展、消息。事情快速發展。', reversed: '延遲、混亂、阻礙。' },
    { id: 'wands-09', name: '權杖九', nameEn: 'Nine of Wands', suit: 'wands', number: 9, rank: '9', upright: '防備、堅持、警覺。準備好面對挑戰。', reversed: '偏執、疲憊、放鬆防備。' },
    { id: 'wands-10', name: '權杖十', nameEn: 'Ten of Wands', suit: 'wands', number: 10, rank: '10', upright: '負擔、責任、壓力。承擔過多需委託。', reversed: '釋放負擔、拒絕過度責任。' },
    { id: 'wands-page', name: '權杖侍者', nameEn: 'Page of Wands', suit: 'wands', number: 11, rank: 'page', upright: '熱情使者、好消息、冒險精神。', reversed: '壞消息、延遲、缺乏熱情。' },
    { id: 'wands-knight', name: '權杖騎士', nameEn: 'Knight of Wands', suit: 'wands', number: 12, rank: 'knight', upright: '行動派、衝勁、冒險旅行。', reversed: '魯莽、延遲行動、挫折。' },
    { id: 'wands-queen', name: '權杖皇后', nameEn: 'Queen of Wands', suit: 'wands', number: 13, rank: 'queen', upright: '熱情、自信、獨立女性。充滿活力與魅力。', reversed: '嫉妒、情緒化、缺乏自信。' },
    { id: 'wands-king', name: '權杖國王', nameEn: 'King of Wands', suit: 'wands', number: 14, rank: 'king', upright: '領導力、遠見、企業家精神。', reversed: '專制、衝動、領導力不足。' },

    // ---------------- Cups 聖杯 (水元素：感情、關係、直覺) ----------------
    { id: 'cups-01', name: '聖杯一', nameEn: 'Ace of Cups', suit: 'cups', number: 1, rank: 'ace', upright: '情感滿溢、新戀情、靈感泉源。', reversed: '情感空虛、關係受阻、壓抑感受。' },
    { id: 'cups-02', name: '聖杯二', nameEn: 'Two of Cups', suit: 'cups', number: 2, rank: '2', upright: '連結、夥伴、和諧關係。', reversed: '關係失衡、分離、誤解。' },
    { id: 'cups-03', name: '聖杯三', nameEn: 'Three of Cups', suit: 'cups', number: 3, rank: '3', upright: '慶祝、友誼、社群支持。', reversed: '孤立、過度放縱、友誼破裂。' },
    { id: 'cups-04', name: '聖杯四', nameEn: 'Four of Cups', suit: 'cups', number: 4, rank: '4', upright: '沉思、不滿、尋找新意。', reversed: '醒悟、行動、新機會。' },
    { id: 'cups-05', name: '聖杯五', nameEn: 'Five of Cups', suit: 'cups', number: 5, rank: '5', upright: '失落、悲傷、接受現實。', reversed: '復原、寬恕、向前看。' },
    { id: 'cups-06', name: '聖杯六', nameEn: 'Six of Cups', suit: 'cups', number: 6, rank: '6', upright: '懷舊、純真、童年記憶。', reversed: '無法釋懷、活在過去。' },
    { id: 'cups-07', name: '聖杯七', nameEn: 'Seven of Cups', suit: 'cups', number: 7, rank: '7', upright: '幻想、選擇多、理想主義。', reversed: '幻滅、逃避現實、混亂。' },
    { id: 'cups-08', name: '聖杯八', nameEn: 'Eight of Cups', suit: 'cups', number: 8, rank: '8', upright: '離開、尋找更深意義、轉變。', reversed: '猶豫、恐懼改變、停滯。' },
    { id: 'cups-09', name: '聖杯九', nameEn: 'Nine of Cups', suit: 'cups', number: 9, rank: '9', upright: '滿足、幸福、願望實現。', reversed: '不滿足、貪婪、內在空虛。' },
    { id: 'cups-10', name: '聖杯十', nameEn: 'Ten of Cups', suit: 'cups', number: 10, rank: '10', upright: '圓滿幸福、家庭和諧、情感滿足。', reversed: '不和諧、破碎、家庭問題。' },
    { id: 'cups-page', name: '聖杯侍者', nameEn: 'Page of Cups', suit: 'cups', number: 11, rank: 'page', upright: '情感訊息、創意靈感、溫柔青年。', reversed: '情感不成熟、壞消息、敏感過度。' },
    { id: 'cups-knight', name: '聖杯騎士', nameEn: 'Knight of Cups', suit: 'cups', number: 12, rank: 'knight', upright: '浪漫、優雅、情感邀請。', reversed: '情緒化、欺騙、優柔寡斷。' },
    { id: 'cups-queen', name: '聖杯皇后', nameEn: 'Queen of Cups', suit: 'cups', number: 13, rank: 'queen', upright: '慈愛、直覺、情感豐盛。', reversed: '情緒操縱、依賴、冷淡。' },
    { id: 'cups-king', name: '聖杯國王', nameEn: 'King of Cups', suit: 'cups', number: 14, rank: 'king', upright: '情感成熟、慈悲領導、同理心。', reversed: '情緒操控、冷漠、情感封閉。' },

    // ---------------- Swords 寶劍 (風元素：思想、衝突、真理) ----------------
    { id: 'swords-01', name: '寶劍一', nameEn: 'Ace of Swords', suit: 'swords', number: 1, rank: 'ace', upright: '突破、真相、清晰思維。', reversed: '混亂、欺騙、思維受阻。' },
    { id: 'swords-02', name: '寶劍二', nameEn: 'Two of Swords', suit: 'swords', number: 2, rank: '2', upright: '僵局、猶豫、避免衝突。', reversed: '決斷、解除僵局、面對真相。' },
    { id: 'swords-03', name: '寶劍三', nameEn: 'Three of Swords', suit: 'swords', number: 3, rank: '3', upright: '心痛、背叛、傷害。', reversed: '療癒、寬恕、釋懷。' },
    { id: 'swords-04', name: '寶劍四', nameEn: 'Four of Swords', suit: 'swords', number: 4, rank: '4', upright: '休息、恢復、靜養。', reversed: '不安、焦慮、無法休息。' },
    { id: 'swords-05', name: '寶劍五', nameEn: 'Five of Swords', suit: 'swords', number: 5, rank: '5', upright: '失敗、羞辱、接受打擊。', reversed: '復原、反擊、學習教訓。' },
    { id: 'swords-06', name: '寶劍六', nameEn: 'Six of Swords', suit: 'swords', number: 6, rank: '6', upright: '過渡、離開困境、旅行。', reversed: '卡住、無法前進、拖延。' },
    { id: 'swords-07', name: '寶劍七', nameEn: 'Seven of Swords', suit: 'swords', number: 7, rank: '7', upright: '策略、偷襲、謀略。', reversed: '欺騙被揭穿、愧疚、計畫失敗。' },
    { id: 'swords-08', name: '寶劍八', nameEn: 'Eight of Swords', suit: 'swords', number: 8, rank: '8', upright: '束縛、受害者心態、限制。', reversed: '釋放、突破、自由。' },
    { id: 'swords-09', name: '寶劍九', nameEn: 'Nine of Swords', suit: 'swords', number: 9, rank: '9', upright: '焦慮、噩夢、擔憂。', reversed: '釋放恐懼、恢復平靜。' },
    { id: 'swords-10', name: '寶劍十', nameEn: 'Ten of Swords', suit: 'swords', number: 10, rank: '10', upright: '結束、背水一戰、徹底釋放。', reversed: '復原、倖存、痛苦緩解。' },
    { id: 'swords-page', name: '寶劍侍者', nameEn: 'Page of Swords', suit: 'swords', number: 11, rank: 'page', upright: '警覺、好奇、訊息傳遞者。', reversed: '八卦、謊言、幼稚。' },
    { id: 'swords-knight', name: '寶劍騎士', nameEn: 'Knight of Swords', suit: 'swords', number: 12, rank: 'knight', upright: '果斷行動、追求真理、戰士。', reversed: '魯莽、攻擊性、殘酷。' },
    { id: 'swords-queen', name: '寶劍皇后', nameEn: 'Queen of Swords', suit: 'swords', number: 13, rank: 'queen', upright: '理性、誠實、清晰界限。', reversed: '冷酷、尖酸、批判過度。' },
    { id: 'swords-king', name: '寶劍國王', nameEn: 'King of Swords', suit: 'swords', number: 14, rank: 'king', upright: '智慧判斷、權威、真理。', reversed: '專制、濫用權力、殘酷。' },

    // ---------------- Pentacles 錢幣 (土元素：物質、財富、工作) ----------------
    { id: 'pentacles-01', name: '錢幣一', nameEn: 'Ace of Pentacles', suit: 'pentacles', number: 1, rank: 'ace', upright: '新機會、繁榮、物質禮物。', reversed: '延遲機會、財務不穩、浪費。' },
    { id: 'pentacles-02', name: '錢幣二', nameEn: 'Two of Pentacles', suit: 'pentacles', number: 2, rank: '2', upright: '平衡、適應、時間管理。', reversed: '失衡、優先順序錯、壓力。' },
    { id: 'pentacles-03', name: '錢幣三', nameEn: 'Three of Pentacles', suit: 'pentacles', number: 3, rank: '3', upright: '團隊合作、技藝、品質。', reversed: '缺乏合作、粗製濫造、延遲。' },
    { id: 'pentacles-04', name: '錢幣四', nameEn: 'Four of Pentacles', suit: 'pentacles', number: 4, rank: '4', upright: '守財、穩定、安全感。', reversed: '吝嗇、貪婪、恐懼失去。' },
    { id: 'pentacles-05', name: '錢幣五', nameEn: 'Five of Pentacles', suit: 'pentacles', number: 5, rank: '5', upright: '貧困、孤立、物質困境。', reversed: '援助到來、恢復、尋求幫助。' },
    { id: 'pentacles-06', name: '錢幣六', nameEn: 'Six of Pentacles', suit: 'pentacles', number: 6, rank: '6', upright: '慷慨、分享、財務平衡。', reversed: '自私、債務、吝嗇。' },
    { id: 'pentacles-07', name: '錢幣七', nameEn: 'Seven of Pentacles', suit: 'pentacles', number: 7, rank: '7', upright: '耐心、投資、長期規劃。', reversed: '急躁、投資失敗、缺乏遠見。' },
    { id: 'pentacles-08', name: '錢幣八', nameEn: 'Eight of Pentacles', suit: 'pentacles', number: 8, rank: '8', upright: '專注工作、精進技藝、勤勞。', reversed: '缺乏熱情、工作倦怠、完美主義。' },
    { id: 'pentacles-09', name: '錢幣九', nameEn: 'Nine of Pentacles', suit: 'pentacles', number: 9, rank: '9', upright: '獨立、豐盛、享受成果。', reversed: '孤獨、過度依賴、財務不穩。' },
    { id: 'pentacles-10', name: '錢幣十', nameEn: 'Ten of Pentacles', suit: 'pentacles', number: 10, rank: '10', upright: '財富、家庭、傳承、穩定。', reversed: '財務損失、家庭紛爭、不安全感。' },
    { id: 'pentacles-page', name: '錢幣侍者', nameEn: 'Page of Pentacles', suit: 'pentacles', number: 11, rank: 'page', upright: '學習、機會、務實青年。', reversed: '缺乏專注、壞投資、拖延。' },
    { id: 'pentacles-knight', name: '錢幣騎士', nameEn: 'Knight of Pentacles', suit: 'pentacles', number: 12, rank: 'knight', upright: '可靠、勤奮、緩慢進展。', reversed: '懶惰、停滯、財務不負責。' },
    { id: 'pentacles-queen', name: '錢幣皇后', nameEn: 'Queen of Pentacles', suit: 'pentacles', number: 13, rank: 'queen', upright: '豐盛、務實、照顧者。', reversed: '依賴、物質主義、缺乏安全。' },
    { id: 'pentacles-king', name: '錢幣國王', nameEn: 'King of Pentacles', suit: 'pentacles', number: 14, rank: 'king', upright: '成功、可靠、財務智慧。', reversed: '固執、貪腐、財務失誤。' }
  ];

  const SPREADS = [
    {
      id: 'single',
      name: '單張指引',
      cardCount: 1,
      positions: [
        { id: 'guidance', name: '當前指引', meaning: '此刻最需要關注的能量或建議' }
      ]
    },
    {
      id: 'three',
      name: '三張牌陣',
      cardCount: 3,
      positions: [
        { id: 'past', name: '過去', meaning: '過去的影響與經驗' },
        { id: 'present', name: '現在', meaning: '當前的狀況與挑戰' },
        { id: 'future', name: '未來', meaning: '可能的發展方向' }
      ]
    },
    {
      id: 'celtic-cross',
      name: '塞爾特十字',
      cardCount: 10,
      positions: [
        { id: 'present', name: '現況', meaning: '你目前的處境' },
        { id: 'challenge', name: '障礙', meaning: '阻礙你的因素' },
        { id: 'foundation', name: '根基', meaning: '事情的根源與過去基礎' },
        { id: 'past', name: '近期過去', meaning: '剛剛發生的事' },
        { id: 'crown', name: '潛在可能', meaning: '最高的潛力或目標' },
        { id: 'near-future', name: '即將發生', meaning: '短期內的發展' },
        { id: 'self', name: '你的態度', meaning: '你對此事的看法與做法' },
        { id: 'environment', name: '外在環境', meaning: '他人影響或周遭情況' },
        { id: 'hopes-fears', name: '希望與恐懼', meaning: '內心的期待與擔憂' },
        { id: 'outcome', name: '最終結果', meaning: '事情可能的結局' }
      ]
    }
  ];

  // 匯出
  window.FORTUNE_TAROT = {
    cards: CARDS,
    spreads: SPREADS
  };

})();
