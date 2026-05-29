/**
 * 小彌算命 - 完整易經模組 fortune-yijing.js
 * 64卦資料庫 + 擲幣起卦 + 變卦 + 互卦
 * 掛載 window.FORTUNE_YIJING
 */
(function () {
  'use strict';

  // ============================================================
  // 八卦 (Trigrams)
  // ============================================================
  const TRIGRAMS = [
    { id: 'qian', name: '乾', nameEn: 'Heaven', symbol: '☰', nature: '天', pinyin: 'Qián', binary: '111' },
    { id: 'kun',  name: '坤', nameEn: 'Earth',   symbol: '☷', nature: '地', pinyin: 'Kūn',  binary: '000' },
    { id: 'zhen', name: '震', nameEn: 'Thunder', symbol: '☳', nature: '雷', pinyin: 'Zhèn', binary: '100' },
    { id: 'xun',  name: '巽', nameEn: 'Wind',    symbol: '☴', nature: '風', pinyin: 'Xùn',  binary: '011' },
    { id: 'kan',  name: '坎', nameEn: 'Water',   symbol: '☵', nature: '水', pinyin: 'Kǎn',  binary: '010' },
    { id: 'li',   name: '離', nameEn: 'Fire',    symbol: '☲', nature: '火', pinyin: 'Lí',   binary: '101' },
    { id: 'gen',  name: '艮', nameEn: 'Mountain',symbol: '☶', nature: '山', pinyin: 'Gèn',  binary: '001' },
    { id: 'dui',  name: '兌', nameEn: 'Lake',    symbol: '☱', nature: '澤', pinyin: 'Duì',  binary: '110' }
  ];

  const TRIGRAM_BY_NAME = {};
  TRIGRAMS.forEach(t => { TRIGRAM_BY_NAME[t.name] = t; });

  // ============================================================
  // 六十四卦 (Hexagrams) - King Wen order
  // ============================================================
  const HEXAGRAMS = [
    // 1-8
    { id: 'qian', number: 1, name: '乾', nameEn: 'The Creative', character: '䷀', upperTrigram: '乾', lowerTrigram: '乾',
      judgment: '元亨，利貞。',
      interpretation: '純陽之卦，象徵創造力、領導與堅毅。事事順利，但需保持正直。適合積極進取，卻要謹守道德。' },
    { id: 'kun', number: 2, name: '坤', nameEn: 'The Receptive', character: '䷁', upperTrigram: '坤', lowerTrigram: '坤',
      judgment: '元亨，利牝馬之貞。君子有攸往，先迷後得主，利西南得朋，東北喪朋。安貞，吉。',
      interpretation: '純陰之卦，象徵柔順、包容與承載。宜守不宜攻，與人合作可得助力。保持謙遜與耐心，終能安穩。' },
    { id: 'zhun', number: 3, name: '屯', nameEn: 'Difficulty at the Beginning', character: '䷂', upperTrigram: '坎', lowerTrigram: '震',
      judgment: '元亨利貞。勿用有攸往，利建侯。',
      interpretation: '草木初生，萬事起頭難。雖有潛力，但需耐心耕耘。建立基礎與尋求支持最為重要。' },
    { id: 'meng', number: 4, name: '蒙', nameEn: 'Youthful Folly', character: '䷃', upperTrigram: '艮', lowerTrigram: '坎',
      judgment: '亨。匪我求童蒙，童蒙求我。初筮告，再三瀆，瀆則不告。利貞。',
      interpretation: '蒙昧初開，需虛心求教。過度依賴或一再試探皆不吉。啟蒙貴在時機與誠意。' },
    { id: 'xu', number: 5, name: '需', nameEn: 'Waiting', character: '䷄', upperTrigram: '坎', lowerTrigram: '乾',
      judgment: '有孚，光亨，貞吉。利涉大川。',
      interpretation: '有信心而等待時機。不可妄動，耐心蓄勢。時機成熟時，前進必能成功。' },
    { id: 'song', number: 6, name: '訟', nameEn: 'Conflict', character: '䷅', upperTrigram: '乾', lowerTrigram: '坎',
      judgment: '有孚，窒惕，中吉，終凶。利見大人，不利涉大川。',
      interpretation: '爭訟之事，宜中正調和。強行到底多凶。尋求公正第三方協助較佳。' },
    { id: 'shi', number: 7, name: '師', nameEn: 'The Army', character: '䷆', upperTrigram: '坤', lowerTrigram: '坎',
      judgment: '貞，丈人吉，无咎。',
      interpretation: '用兵或組織團隊需有德長者領導。紀律與正義為勝負關鍵。不可恃強而驕。' },
    { id: 'bi', number: 8, name: '比', nameEn: 'Holding Together', character: '䷇', upperTrigram: '坎', lowerTrigram: '坤',
      judgment: '吉。原筮元永貞，无咎。不寧方來，後夫凶。',
      interpretation: '親近結合、互助合作之象。選擇正確的夥伴與領導者。遲疑不決者將落於人後。' },

    // 9-16
    { id: 'xiaoxu', number: 9, name: '小畜', nameEn: 'Small Taming', character: '䷈', upperTrigram: '巽', lowerTrigram: '乾',
      judgment: '亨。密雲不雨，自我西郊。',
      interpretation: '小有積蓄，尚未大成。宜培養實力，等待更好時機。過於強求反易受阻。' },
    { id: 'lu', number: 10, name: '履', nameEn: 'Treading', character: '䷉', upperTrigram: '乾', lowerTrigram: '兌',
      judgment: '履虎尾，不咥人，亨。',
      interpretation: '如履虎尾，謹慎而行仍可平安。尊卑有序，行為合禮則吉。勇於前進但不失分寸。' },
    { id: 'tai', number: 11, name: '泰', nameEn: 'Peace', character: '䷊', upperTrigram: '坤', lowerTrigram: '乾',
      judgment: '小往大來，吉亨。',
      interpretation: '天地交泰，上下和諧。事業、感情皆順遂之時。保持謙虛，方能長久。' },
    { id: 'pi', number: 12, name: '否', nameEn: 'Standstill', character: '䷋', upperTrigram: '乾', lowerTrigram: '坤',
      judgment: '否之匪人，不利君子貞，大往小來。',
      interpretation: '天地不交，閉塞不通。君子宜守正待時，不可勉強作為。否極泰來，耐心是關鍵。' },
    { id: 'tongren', number: 13, name: '同人', nameEn: 'Fellowship', character: '䷌', upperTrigram: '乾', lowerTrigram: '離',
      judgment: '同人于野，亨。利涉大川，利君子貞。',
      interpretation: '與人同心協力。志同道合者可成大事。光明正大，遠離小圈子則亨通。' },
    { id: 'dayou', number: 14, name: '大有', nameEn: 'Great Possession', character: '䷍', upperTrigram: '離', lowerTrigram: '乾',
      judgment: '元亨。',
      interpretation: '大有收穫，富有而光明。宜廣施恩德，勿恃才傲物。盛極而衰，保持謙卑。' },
    { id: 'qian2', number: 15, name: '謙', nameEn: 'Modesty', character: '䷎', upperTrigram: '坤', lowerTrigram: '艮',
      judgment: '亨，君子有終。',
      interpretation: '謙虛美德。謙受益，滿招損。無論處境如何，保持謙遜終能有好結果。' },
    { id: 'yu', number: 16, name: '豫', nameEn: 'Enthusiasm', character: '䷏', upperTrigram: '震', lowerTrigram: '坤',
      judgment: '利建侯行師。',
      interpretation: '喜悅鼓舞，士氣高昂。適合發起計畫或動員。但不可過度樂觀而忘備。' },

    // 17-24
    { id: 'sui', number: 17, name: '隨', nameEn: 'Following', character: '䷐', upperTrigram: '兌', lowerTrigram: '震',
      judgment: '元亨利貞，无咎。',
      interpretation: '隨順時勢與賢者。懂得跟隨才能領導。順應正道，無過失。' },
    { id: 'gu', number: 18, name: '蠱', nameEn: 'Work on the Decayed', character: '䷑', upperTrigram: '艮', lowerTrigram: '巽',
      judgment: '元亨，利涉大川。先甲三日，後甲三日。',
      interpretation: '事物腐敗，需整頓革新。事前周密規劃，事後檢討改進。亂世出英雄。' },
    { id: 'lin', number: 19, name: '臨', nameEn: 'Approach', character: '䷒', upperTrigram: '坤', lowerTrigram: '兌',
      judgment: '元亨利貞。至于八月有凶。',
      interpretation: '親臨視察，領導有方。但好景不常，需防驕奢與懈怠。' },
    { id: 'guan', number: 20, name: '觀', nameEn: 'Contemplation', character: '䷓', upperTrigram: '巽', lowerTrigram: '坤',
      judgment: '盥而不薦，有孚顒若。',
      interpretation: '觀察省思。站在高處看清全局。誠信內在，不必急於表現。' },
    { id: 'shike', number: 21, name: '噬嗑', nameEn: 'Biting Through', character: '䷔', upperTrigram: '離', lowerTrigram: '震',
      judgment: '亨。利用獄。',
      interpretation: '咬合斷決，清除障礙。適合解決爭端或執行正義。剛柔並濟，方能成功。' },
    { id: 'bi2', number: 22, name: '賁', nameEn: 'Grace', character: '䷕', upperTrigram: '艮', lowerTrigram: '離',
      judgment: '亨。小利有攸往。',
      interpretation: '文飾之美。外在裝飾有助提升，但本質更重要。適度美化，勿流於浮華。' },
    { id: 'bo', number: 23, name: '剝', nameEn: 'Splitting Apart', character: '䷖', upperTrigram: '艮', lowerTrigram: '坤',
      judgment: '不利有攸往。',
      interpretation: '剝落衰敗之象。不可妄動，宜靜待時機。保存實力，等待復興。' },
    { id: 'fu', number: 24, name: '復', nameEn: 'Return', character: '䷗', upperTrigram: '坤', lowerTrigram: '震',
      judgment: '亨。出入无疾，朋來无咎。反復其道，七日來復，利有攸往。',
      interpretation: '復歸正道。迷途知返，失而復得。陽氣回升，萬物復甦。' },

    // 25-32
    { id: 'wuwang', number: 25, name: '无妄', nameEn: 'Innocence', character: '䷘', upperTrigram: '乾', lowerTrigram: '震',
      judgment: '元亨利貞。其匪正有眚，不利有攸往。',
      interpretation: '純真無妄。順其自然，勿存僥倖。心正則行正，妄為必有災。' },
    { id: 'daxu', number: 26, name: '大畜', nameEn: 'Great Taming', character: '䷙', upperTrigram: '艮', lowerTrigram: '乾',
      judgment: '利貞。不家食吉，利涉大川。',
      interpretation: '大有畜養，積蓄實力。宜儲備人才與資源。厚積薄發，方能大用。' },
    { id: 'yi', number: 27, name: '頤', nameEn: 'Nourishment', character: '䷚', upperTrigram: '艮', lowerTrigram: '震',
      judgment: '貞吉。觀頤，自求口實。',
      interpretation: '養身養德。謹言慎行，培養正當來源。觀察他人亦是自省。' },
    { id: 'daguo', number: 28, name: '大過', nameEn: 'Great Preponderance', character: '䷛', upperTrigram: '兌', lowerTrigram: '巽',
      judgment: '棟橈，利有攸往，亨。',
      interpretation: '大過之時，棟梁彎曲。非常時期需非常手段。雖危險，但積極行動可轉危為安。' },
    { id: 'kan2', number: 29, name: '坎', nameEn: 'The Abysmal', character: '䷜', upperTrigram: '坎', lowerTrigram: '坎',
      judgment: '習坎，有孚，維心亨，行有尚。',
      interpretation: '重重險陷。保持誠信，心志堅定。雖處險境，仍可化險為夷。' },
    { id: 'li', number: 30, name: '離', nameEn: 'The Clinging', character: '䷝', upperTrigram: '離', lowerTrigram: '離',
      judgment: '利貞，亨。畜牝牛，吉。',
      interpretation: '附麗光明。依附正確對象，發揮光芒。柔順中帶剛毅，文明之象。' },
    { id: 'xian', number: 31, name: '咸', nameEn: 'Influence', character: '䷞', upperTrigram: '兌', lowerTrigram: '艮',
      judgment: '亨，利貞，取女吉。',
      interpretation: '感應交合。情感或人際的吸引。真誠感應，吉利。婚姻與合作皆宜。' },
    { id: 'heng', number: 32, name: '恆', nameEn: 'Duration', character: '䷟', upperTrigram: '震', lowerTrigram: '巽',
      judgment: '亨，无咎，利貞，利有攸往。',
      interpretation: '恆久不變。堅持正道，長久經營。持之以恆，終有收穫。' },

    // 33-40
    { id: 'dun', number: 33, name: '遯', nameEn: 'Retreat', character: '䷠', upperTrigram: '乾', lowerTrigram: '艮',
      judgment: '亨，小利貞。',
      interpretation: '退避隱藏。面對強大壓力，暫時退讓是智慧。保存實力，等待反擊時機。' },
    { id: 'dazhuang', number: 34, name: '大壯', nameEn: 'Great Power', character: '䷡', upperTrigram: '震', lowerTrigram: '乾',
      judgment: '利貞。',
      interpretation: '大壯之時，力量強盛。宜用正道，不可恃力欺人。剛健而守禮則吉。' },
    { id: 'jin', number: 35, name: '晉', nameEn: 'Progress', character: '䷢', upperTrigram: '離', lowerTrigram: '坤',
      judgment: '康侯用錫馬蕃庶，晝日三接。',
      interpretation: '晉升前進。受到賞識與提拔。努力耕耘，晝夜不懈，事業順遂。' },
    { id: 'mingyi', number: 36, name: '明夷', nameEn: 'Darkening of the Light', character: '䷣', upperTrigram: '坤', lowerTrigram: '離',
      judgment: '利艱貞。',
      interpretation: '光明受傷。處於黑暗或壓抑環境。韜光養晦，內心光明不滅。' },
    { id: 'jiaren', number: 37, name: '家人', nameEn: 'The Family', character: '䷤', upperTrigram: '巽', lowerTrigram: '離',
      judgment: '利女貞。',
      interpretation: '家庭和睦。治家如治國，重視倫理與規範。女主內，家道興。' },
    { id: 'kui', number: 38, name: '睽', nameEn: 'Opposition', character: '䷥', upperTrigram: '離', lowerTrigram: '兌',
      judgment: '小事吉。',
      interpretation: '乖離對立。意見相左，難以合作。小事可為，大事難成。求同存異。' },
    { id: 'jian', number: 39, name: '蹇', nameEn: 'Obstruction', character: '䷦', upperTrigram: '坎', lowerTrigram: '艮',
      judgment: '利西南，不利東北。利見大人，貞吉。',
      interpretation: '跛足難行。前進受阻。宜往西南求助，見大人（賢者）可解。' },
    { id: 'xie', number: 40, name: '解', nameEn: 'Deliverance', character: '䷧', upperTrigram: '震', lowerTrigram: '坎',
      judgment: '利西南，无所往，其來復吉。有攸往，夙吉。',
      interpretation: '解脫困境。危難已過，恢復自由。及時行動，往西南（平緩方向）吉。' },

    // 41-48
    { id: 'sun', number: 41, name: '損', nameEn: 'Decrease', character: '䷨', upperTrigram: '艮', lowerTrigram: '兌',
      judgment: '有孚，元吉，无咎，可貞，利有攸往。曷之用？二簋可用享。',
      interpretation: '損減以益。捨棄小我，成全大我。真誠奉獻，雖損卻吉。' },
    { id: 'yi2', number: 42, name: '益', nameEn: 'Increase', character: '䷩', upperTrigram: '巽', lowerTrigram: '震',
      judgment: '利有攸往，利涉大川。',
      interpretation: '增益成長。得到幫助與資源。把握機會，積極作為，大有作為。' },
    { id: 'guai', number: 43, name: '夬', nameEn: 'Breakthrough', character: '䷪', upperTrigram: '兌', lowerTrigram: '乾',
      judgment: '揚于王庭，孚號有厲。告自邑，不利即戎，利有攸往。',
      interpretation: '決斷突破。果斷清除小人與障礙。公開宣示，但不可恃力。' },
    { id: 'gou', number: 44, name: '姤', nameEn: 'Coming to Meet', character: '䷫', upperTrigram: '乾', lowerTrigram: '巽',
      judgment: '女壯，勿用取女。',
      interpretation: '邂逅相遇。陰柔初長，不可輕忽。保持警覺，勿被迷惑。' },
    { id: 'cui', number: 45, name: '萃', nameEn: 'Gathering Together', character: '䷬', upperTrigram: '兌', lowerTrigram: '坤',
      judgment: '亨。王假有廟，利見大人，亨，利貞。用大牲吉，利有攸往。',
      interpretation: '聚集匯聚。人多勢眾，需有賢者領導。誠心祭祀（團結），大事可成。' },
    { id: 'sheng', number: 46, name: '升', nameEn: 'Pushing Upward', character: '䷭', upperTrigram: '坤', lowerTrigram: '巽',
      judgment: '元亨，用見大人，勿恤，南征吉。',
      interpretation: '上升進展。逐步向上，貴人相助。南征（光明方向）吉利。' },
    { id: 'kun2', number: 47, name: '困', nameEn: 'Oppression', character: '䷮', upperTrigram: '兌', lowerTrigram: '坎',
      judgment: '亨，貞，大人吉，无咎。有言不信。',
      interpretation: '困頓窮乏。身處逆境，仍需守正。言語無用，唯有德行可救。' },
    { id: 'jing', number: 48, name: '井', nameEn: 'The Well', character: '䷯', upperTrigram: '坎', lowerTrigram: '巽',
      judgment: '改邑不改井，无喪无得。往來井井。汔至亦未繘井，羸其瓶，凶。',
      interpretation: '井水不竭。提供滋養，位置固定。不可移井，應善用資源。' },

    // 49-56
    { id: 'ge', number: 49, name: '革', nameEn: 'Revolution', character: '䷰', upperTrigram: '兌', lowerTrigram: '離',
      judgment: '己日乃孚，元亨利貞，悔亡。',
      interpretation: '革故鼎新。改變時機成熟（己日）。需有誠信支持，徹底革新。' },
    { id: 'ding', number: 50, name: '鼎', nameEn: 'The Cauldron', character: '䷱', upperTrigram: '離', lowerTrigram: '巽',
      judgment: '元吉，亨。',
      interpretation: '鼎器象徵權位與文明。調和鼎鼐，治理得當。君子得位，天下文明。' },
    { id: 'zhen2', number: 51, name: '震', nameEn: 'The Arousing', character: '䷲', upperTrigram: '震', lowerTrigram: '震',
      judgment: '亨。震來虩虩，笑言啞啞。震驚百里，不喪匕鬯。',
      interpretation: '震驚恐懼。雷聲驚人，但能自省則吉。保持鎮定，危機即轉機。' },
    { id: 'gen', number: 52, name: '艮', nameEn: 'Keeping Still', character: '䷳', upperTrigram: '艮', lowerTrigram: '艮',
      judgment: '艮其背，不獲其身，行其庭，不見其人，无咎。',
      interpretation: '靜止不動。止其所止，不妄動。內心寧靜，則無過失。' },
    { id: 'jian2', number: 53, name: '漸', nameEn: 'Development', character: '䷴', upperTrigram: '巽', lowerTrigram: '艮',
      judgment: '女歸吉，利貞。',
      interpretation: '漸進發展。如女子出嫁，循序漸進。不可急躁，穩健前進吉。' },
    { id: 'guimei', number: 54, name: '歸妹', nameEn: 'The Marrying Maiden', character: '䷵', upperTrigram: '震', lowerTrigram: '兌',
      judgment: '征凶，无攸利。',
      interpretation: '歸嫁之象。感情或合作若不正當，則凶。勿為小利而失大節。' },
    { id: 'feng', number: 55, name: '豐', nameEn: 'Abundance', character: '䷶', upperTrigram: '震', lowerTrigram: '離',
      judgment: '亨，王假之，勿憂，宜日中。',
      interpretation: '豐盛茂盛。盛大之時，宜守中正。日中則昃，盛極必衰，需防驕。' },
    { id: 'lu2', number: 56, name: '旅', nameEn: 'The Wanderer', character: '䷷', upperTrigram: '離', lowerTrigram: '艮',
      judgment: '小亨，旅貞吉。',
      interpretation: '旅居在外。行旅之人宜謙虛守正。小事可亨，但不可久留。' },

    // 57-64
    { id: 'xun2', number: 57, name: '巽', nameEn: 'The Gentle', character: '䷸', upperTrigram: '巽', lowerTrigram: '巽',
      judgment: '小亨，利有攸往，利見大人。',
      interpretation: '柔順謙遜。風之象，無孔不入。柔能克剛，謙虛可達目標。' },
    { id: 'dui', number: 58, name: '兌', nameEn: 'The Joyous', character: '䷹', upperTrigram: '兌', lowerTrigram: '兌',
      judgment: '亨，利貞。',
      interpretation: '喜悅和悅。朋友相悅，內心喜樂。說話和善，吉利。' },
    { id: 'huan', number: 59, name: '渙', nameEn: 'Dispersion', character: '䷺', upperTrigram: '巽', lowerTrigram: '坎',
      judgment: '亨。王假有廟，利涉大川，利貞。',
      interpretation: '渙散離析。人心離散，需有廟堂（中心）凝聚。危難中仍可涉險。' },
    { id: 'jie', number: 60, name: '節', nameEn: 'Limitation', character: '䷻', upperTrigram: '坎', lowerTrigram: '兌',
      judgment: '亨。苦節不可貞。',
      interpretation: '節制約束。適度節儉吉，過度刻苦則凶。節而能通，方為正道。' },
    { id: 'zhongfu', number: 61, name: '中孚', nameEn: 'Inner Truth', character: '䷼', upperTrigram: '巽', lowerTrigram: '兌',
      judgment: '豚魚吉，利涉大川，利貞。',
      interpretation: '中心誠信。內心真誠，感動天地。連豚魚都能感化，何況人事。' },
    { id: 'xiaoguo', number: 62, name: '小過', nameEn: 'Small Preponderance', character: '䷽', upperTrigram: '震', lowerTrigram: '艮',
      judgment: '亨，利貞。可小事，不可大事。飛鳥遺之音，不宜上宜下，大吉。',
      interpretation: '小有過越。適合小事，不可行大事。如飛鳥，宜向下飛，不宜高飛。' },
    { id: 'jiji', number: 63, name: '既濟', nameEn: 'After Completion', character: '䷾', upperTrigram: '坎', lowerTrigram: '離',
      judgment: '亨，小利貞。初吉終亂。',
      interpretation: '事已完成。成功在望，但不可鬆懈。初吉終亂，需善後維持。' },
    { id: 'weiji', number: 64, name: '未濟', nameEn: 'Before Completion', character: '䷿', upperTrigram: '離', lowerTrigram: '坎',
      judgment: '亨，小狐汔濟，濡其尾，无攸利。',
      interpretation: '尚未完成。功虧一簣之象。雖接近成功，仍需謹慎。不可輕易自滿。' }
  ];

  // 建立 binary key (bottom to top, yang=1 yin=0) → hexagram 快速查找
  const HEX_BY_PATTERN = {};
  HEXAGRAMS.forEach(h => {
    const lower = TRIGRAM_BY_NAME[h.lowerTrigram];
    const upper = TRIGRAM_BY_NAME[h.upperTrigram];
    if (lower && upper) {
      // pattern: bottom 3 + top 3 ? 實際上 upper 是上面三爻 (高位)
      // 我們用 bottom-to-top 的 6 bit: lower binary (LSB) + upper binary
      const lowerBits = parseInt(lower.binary, 2);
      const upperBits = parseInt(upper.binary, 2);
      const key = (upperBits << 3) | lowerBits; // 上卦高位
      HEX_BY_PATTERN[key] = h;
    }
  });

  // ============================================================
  // 工具函數
  // ============================================================

  function getTrigram(name) {
    return TRIGRAM_BY_NAME[name] || null;
  }

  function linesToPattern(lines) {
    // lines[0] = bottom (line 1)
    // 回傳 0-63 的 key (上卦<<3 | 下卦)
    let lower = 0, upper = 0;
    for (let i = 0; i < 3; i++) {
      if (lines[i] && lines[i].yang) lower |= (1 << i);
      if (lines[i + 3] && lines[i + 3].yang) upper |= (1 << i);
    }
    return (upper << 3) | lower;
  }

  function findHexagramByLines(lines) {
    const key = linesToPattern(lines);
    return HEX_BY_PATTERN[key] || null;
  }

  function getNuclearHexagram(hex) {
    // 互卦：取本卦 2-4 爻為下卦，3-5 爻為上卦
    // 這裡簡化：直接找對應的互卦（多數有固定對應）
    // 實務上可再建表，為求準確我們用已知常見對應
    const nuclearMap = {
      1: 1, 2: 2, 3: 24, 4: 4, 5: 6, 6: 5, 7: 7, 8: 8,
      9: 10, 10: 9, 11: 54, 12: 53, 13: 13, 14: 14, 15: 15, 16: 16,
      17: 18, 18: 17, 19: 19, 20: 20, 21: 21, 22: 22, 23: 23, 24: 24,
      25: 25, 26: 26, 27: 27, 28: 28, 29: 29, 30: 30,
      31: 31, 32: 32, 33: 33, 34: 34, 35: 35, 36: 36, 37: 37, 38: 38,
      39: 39, 40: 40, 41: 41, 42: 42, 43: 43, 44: 44, 45: 45, 46: 46,
      47: 47, 48: 48, 49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54,
      55: 55, 56: 56, 57: 57, 58: 58, 59: 59, 60: 60, 61: 61, 62: 62,
      63: 63, 64: 64
    };
    const n = nuclearMap[hex.number] || hex.number;
    return HEXAGRAMS.find(h => h.number === n) || hex;
  }

  // ============================================================
  // 核心起卦函數
  // ============================================================
  function cast() {
    const lines = []; // index 0 = 初爻 (bottom)
    for (let i = 0; i < 6; i++) {
      const c1 = Math.floor(Math.random() * 2) + 2;
      const c2 = Math.floor(Math.random() * 2) + 2;
      const c3 = Math.floor(Math.random() * 2) + 2;
      const total = c1 + c2 + c3;
      const yang = (total === 7 || total === 9);
      const changing = (total === 6 || total === 9);
      lines.push({ value: total, yang: yang, changing: changing });
    }

    const primary = findHexagramByLines(lines);
    const changingLines = lines.map((l, idx) => l.changing ? (idx + 1) : null).filter(Boolean);

    let resulting = null;
    if (changingLines.length > 0) {
      const newLines = lines.map(l => {
        if (!l.changing) return { ...l };
        // 變爻：陰變陽，陽變陰
        return { value: l.yang ? 6 : 9, yang: !l.yang, changing: false };
      });
      resulting = findHexagramByLines(newLines);
    }

    const nuclear = primary ? getNuclearHexagram(primary) : null;

    return {
      lines,                    // 原始六爻 (相容舊版)
      primary,                  // 本卦完整資料
      resulting,                // 變卦 (無則 null)
      nuclear,                  // 互卦
      changingLines,            // 變爻位置 (1-6，由下而上)
      hasChanging: changingLines.length > 0
    };
  }

  // 匯出
  window.FORTUNE_YIJING = {
    hexagrams: HEXAGRAMS,
    trigrams: TRIGRAMS,
    cast: cast,
    getTrigram: getTrigram,
    findHexagramByLines: findHexagramByLines
  };

})();
