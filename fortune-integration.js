/**
 * 小彌算命 - 命理整合模組 fortune-integration.js
 * 連接八字、紫微、占星、人類圖 + 塔羅 + 易經
 * 產生跨系統洞見
 */
(function () {
  'use strict';

  /**
   * 產生整合洞見
   * @param {object} data - 包含 bazi, ziwei, astrology, renleitu, tarotDraw, yijingResult
   * @returns {string[]} 2-3 條洞見文字
   */
  function generateInsights (data) {
    if (!data) return [];

    const insights = [];
    const bazi = data.bazi || {};
    const ziwei = data.ziwei || {};
    const astrology = data.astrology || {};
    const tarotDraw = data.tarotDraw || null;
    const yijing = data.yijingResult || null;

    // 1. 八字五行 + 塔羅（火 + 節制 / 平衡主題）
    const dayWuxing = bazi.dayWuxing || '';
    if (tarotDraw && tarotDraw.drawn) {
      const hasTemperance = tarotDraw.drawn.some(d => d.card && (d.card.name === '節制' || d.card.nameEn === 'Temperance'));
      const hasDevil = tarotDraw.drawn.some(d => d.card && (d.card.name === '惡魔' || d.card.nameEn === 'The Devil'));
      const hasTower = tarotDraw.drawn.some(d => d.card && (d.card.name === '高塔' || d.card.nameEn === 'The Tower'));

      if (dayWuxing === '火' && hasTemperance) {
        insights.push('你的八字日主帶強烈火能量，容易急躁或燃燒過度。這次抽到「節制」，正是提醒你這段時間要刻意放慢腳步、調和情緒與行動。火需要容器才能發揮最大光熱。');
      }
      if (dayWuxing === '火' && hasDevil) {
        insights.push('火旺之命常有強烈慾望與執著。這次「惡魔」出現，提醒你正被某種物質或情感的枷鎖綁住。誠實面對內在的「過度」，才能重新拿回自由。');
      }
      if (hasTower && (dayWuxing === '火' || dayWuxing === '木')) {
        insights.push('你的命盤帶有明顯的「破」與「立」能量。這次「高塔」直接呼應你天生的轉變力。舊結構倒塌雖然痛苦，卻是為更適合你的新秩序騰出空間。');
      }
    }

    // 2. 紫微宮位 + 塔羅（事業 / 官祿相關）
    if (tarotDraw && tarotDraw.drawn && ziwei.palaces) {
      const hasWandsKnight = tarotDraw.drawn.some(d => d.card && d.card.name === '權杖騎士');
      const hasChariot = tarotDraw.drawn.some(d => d.card && d.card.name === '戰車');
      const hasSun = tarotDraw.drawn.some(d => d.card && d.card.name === '太陽');

      const careerPalace = ziwei.palaces['事業宮'] || ziwei.palaces['官祿宮'] || {};
      const hasStrongCareer = careerPalace.mainStar && (careerPalace.mainStar.includes('武曲') || careerPalace.mainStar.includes('天府') || careerPalace.mainStar.includes('紫微'));

      if (hasStrongCareer && hasWandsKnight) {
        insights.push('你的紫微事業宮（或官祿宮）主星能量強勁。這次抽到「權杖騎士」，顯示近期有明確的行動機會或重要決策要果斷出擊。火元素行動力與你的宮位能量高度共振，適合積極推進。');
      }
      if (hasStrongCareer && hasChariot) {
        insights.push('事業宮位本就帶有領導與前進的意志力。這次「戰車」強化了這股能量——你正處於需要紀律與專注才能勝利的階段。不要讓情緒干擾方向。');
      }
      if (hasSun && hasStrongCareer) {
        insights.push('太陽牌與強事業宮的組合極為正面。你的光輝與公眾形象正被看見，這是展現才華、獲得認可的好時機。');
      }
    }

    // 3. 易經變爻 + 整體能量（轉化主題）
    if (yijing && yijing.hasChanging) {
      const changeCount = yijing.changingLines ? yijing.changingLines.length : 0;
      if (changeCount >= 3) {
        insights.push(`本卦出現 ${changeCount} 個變爻，顯示你目前正處於「劇烈轉化」的生命階段。變卦「${yijing.resulting ? yijing.resulting.name : ''}」正是新方向的提示。不要抗拒改變，這是天時。`);
      } else if (changeCount > 0) {
        insights.push(`本卦有變爻（第 ${yijing.changingLines.join('、')} 爻），代表「局部調整」正在發生。重點關注這些爻位對應的人生面向（感情、事業、自我），它們正是突破口。`);
      }
      if (yijing.nuclear && yijing.nuclear.name !== yijing.primary.name) {
        insights.push(`互卦「${yijing.nuclear.name}」揭示了事情的「內在核心」與隱藏趨勢。表面（本卦）與內裡（互卦）同時參照，能看到更完整的畫面。`);
      }
    }

    // 4. 占星 + 塔羅簡單連結（輔助）
    if (tarotDraw && tarotDraw.drawn && astrology.sun) {
      const hasMoonCard = tarotDraw.drawn.some(d => d.card && (d.card.name === '月亮' || d.card.nameEn === 'The Moon'));
      if (hasMoonCard && astrology.moon) {
        insights.push(`你的占星月亮落在${astrology.moon}，這次又抽到「月亮」牌。情緒與潛意識層面的議題正在被放大——誠實面對內在恐懼與直覺訊息，這是重要的療癒時機。`);
      }
    }

    // 保底：至少給 2 條通用連結（若規則沒觸發）
    if (insights.length < 2 && tarotDraw && yijing) {
      insights.push('塔羅與易經同時出現，代表「當下能量」與「長期趨勢」正在對話。塔羅給你即時指引，易經則顯示更深的轉化脈絡。兩者結合，能讓你同時看見「現在該怎麼做」與「未來會往哪裡去」。');
      if (bazi.dayWuxing) {
        insights.push(`你的日主五行屬${dayWuxing}，這次塔羅與易經的組合，正好提供${dayWuxing}性過強或不足時的平衡建議。把命盤當作「先天結構」，把塔羅易經當作「當下風向」，兩者一起看才能做出最適合的選擇。`);
      }
    }

    // 最多回傳 3 條，避免過長
    return insights.slice(0, 3);
  }

  // 匯出
  window.FORTUNE_INTEGRATION = {
    generateInsights: generateInsights
  };

})();
