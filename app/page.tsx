'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---- 类型定义 ----
type Word = { w: string; k: string; cn: string };
type CardType = 'easy' | 'jp' | 'kana' | 'cn';
type Card = {
  uid: number; w: string; k: string; cn: string;
  type: CardType; layers: number; used: boolean; inTray: boolean;
};
type ClueInfo = { mode: string; ci: number; num: string; title: string; text: string };
type FinalInfo = { answer: string; epilogue: string };
type ChapterMeta = { index: number; title: string; sub: string; wordCount: number };
type Screen = 'title' | 'select' | 'game' | 'end' | 'final';
type Diff = 'easy' | 'hard';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmtTime(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export default function GamePage() {
  const [screen, setScreen] = useState<Screen>('title');
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [clueModal, setClueModal] = useState<ClueInfo | null>(null);
  const [unlockedClues, setUnlockedClues] = useState<ClueInfo[]>([]);
  const [finalData, setFinalData] = useState<FinalInfo | null>(null);

  // 游戏状态
  const [curCI, setCurCI] = useState(0);
  const [curDiff, setCurDiff] = useState<Diff>('easy');
  const [pile, setPile] = useState<Card[]>([]);
  const [tray, setTray] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [matched, setMatched] = useState(0);
  const [wordCount, setWordCount] = useState(8);
  const [timerSec, setTimerSec] = useState(0);
  const [infoMsg, setInfoMsg] = useState('');
  const [infoClass, setInfoClass] = useState('');
  const [winResult, setWinResult] = useState(false);
  const [endScore, setEndScore] = useState(0);
  const [endTime, setEndTime] = useState('');

  // Refs，用于在事件处理器中读取最新状态（避免闭包陷阱）
  const pileRef = useRef<Card[]>([]);
  const trayRef = useRef<Card[]>([]);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const matchedRef = useRef(0);
  const wordCountRef = useRef(8);
  const curCIRef = useRef(0);
  const curDiffRef = useRef<Diff>('easy');
  const timerSecRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenRef = useRef<Screen>('title');

  const isDone = useCallback((ci: number, mode: string, prog = progress) =>
    !!prog[`${ci}_${mode}`], [progress]);

  const isChapterUnlocked = useCallback((ci: number, prog = progress) =>
    ci === 0 || !!prog[`${ci - 1}_easy`], [progress]);

  const allDone = useCallback((prog = progress) =>
    chapters.length > 0 && chapters.every((_, i) => prog[`${i}_easy`] && prog[`${i}_hard`]),
    [chapters, progress]);

  // 加载关卡列表
  useEffect(() => {
    fetch('/api/game?type=chapters').then(r => r.json()).then(setChapters);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ---- 开始游戏 ----
  const startGame = async (ci: number, diff: Diff) => {
    stopTimer();
    curCIRef.current = ci; curDiffRef.current = diff;
    scoreRef.current = 0; comboRef.current = 0;
    matchedRef.current = 0; timerSecRef.current = 0;

    setCurCI(ci); setCurDiff(diff);
    setScore(0); setCombo(0); setMatched(0); setTimerSec(0);
    setTray([]); trayRef.current = [];
    setInfoMsg(diff === 'easy' ? '收集3张相同单词即可消除！' : '收集同一单词的汉字・假名・中文各1张消除！');
    setInfoClass(''); setWinResult(false);

    const res = await fetch(`/api/game?type=words&ci=${ci}`);
    const { words } = await res.json() as { words: Word[] };

    wordCountRef.current = words.length;
    setWordCount(words.length);

    const newPile = buildPile(words, diff);
    pileRef.current = newPile;
    setPile([...newPile]);
    screenRef.current = 'game';
    setScreen('game');

    if (diff === 'hard') {
      timerRef.current = setInterval(() => {
        timerSecRef.current += 1;
        setTimerSec(t => t + 1);
      }, 1000);
    }
  };

  function buildPile(words: Word[], diff: Diff): Card[] {
    let uid = 0;
    const cards: Card[] = [];
    if (diff === 'easy') {
      words.forEach(w => {
        for (let i = 0; i < 3; i++)
          cards.push({ uid: uid++, w: w.w, k: w.k, cn: w.cn, type: 'easy', layers: Math.floor(Math.random() * 2), used: false, inTray: false });
      });
    } else {
      words.forEach(w => {
        (['jp', 'kana', 'cn'] as const).forEach(t =>
          cards.push({ uid: uid++, w: w.w, k: w.k, cn: w.cn, type: t, layers: Math.floor(Math.random() * 2), used: false, inTray: false })
        );
      });
    }
    return shuffle(cards);
  }

  // ---- 消除逻辑 ----
  const doElim = useCallback((wordKey: string, cards: Card[]) => {
    comboRef.current += 1;
    scoreRef.current += 10 * comboRef.current;
    matchedRef.current += 1;

    const elimUids = new Set(cards.map(c => c.uid));
    pileRef.current = pileRef.current.map(c =>
      elimUids.has(c.uid) ? { ...c, used: true, inTray: false } : c
    );
    trayRef.current = trayRef.current.filter(c => c.w !== wordKey);

    const s = cards[0];
    setInfoMsg(`消除！${s.w}（${s.k}）= ${s.cn}　×${comboRef.current}连击`);
    setInfoClass('ok');
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setMatched(matchedRef.current);
    setPile([...pileRef.current]);
    setTray([...trayRef.current]);

    if (matchedRef.current >= wordCountRef.current) {
      setTimeout(() => showEnd(true), 400);
    }
  }, []); // eslint-disable-line

  const checkTray = useCallback(() => {
    const t = trayRef.current;
    const diff = curDiffRef.current;
    if (diff === 'easy') {
      const groups: Record<string, Card[]> = {};
      t.forEach(c => { if (!groups[c.w]) groups[c.w] = []; groups[c.w].push(c); });
      Object.entries(groups).forEach(([w, cards]) => { if (cards.length >= 3) doElim(w, cards.slice(0, 3)); });
    } else {
      const groups: Record<string, Record<string, Card>> = {};
      t.forEach(c => { if (!groups[c.w]) groups[c.w] = {}; groups[c.w][c.type] = c; });
      Object.entries(groups).forEach(([w, g]) => { if (g.jp && g.kana && g.cn) doElim(w, [g.jp, g.kana, g.cn]); });
    }
  }, [doElim]);

  // ---- 点击卡片 ----
  const clickCard = useCallback((idx: number) => {
    const card = pileRef.current[idx];
    if (!card || card.used || card.inTray || card.layers > 0) return;

    if (trayRef.current.length >= 7) {
      setInfoMsg('收集槽已满！'); setInfoClass('bad');
      showEnd(false);
      return;
    }

    const newCard = { ...card, inTray: true };
    pileRef.current = pileRef.current.map((c, i) => {
      if (c.uid === card.uid) return newCard;
      if (!c.used && !c.inTray && c.layers > 0 && Math.random() > 0.5)
        return { ...c, layers: Math.max(0, c.layers - 1) };
      return c;
    });
    trayRef.current = [...trayRef.current, newCard];

    checkTray();
    setPile([...pileRef.current]);
    setTray([...trayRef.current]);
  }, [checkTray]); // eslint-disable-line

  // ---- 结束游戏 ----
  const showEnd = useCallback((win: boolean) => {
    stopTimer();
    const timeStr = curDiffRef.current === 'hard' ? fmtTime(timerSecRef.current) : '';
    setEndScore(scoreRef.current);
    setEndTime(timeStr);
    setWinResult(win);
    screenRef.current = 'end';
    setScreen('end');

    if (win) {
      const ci = curCIRef.current;
      const mode = curDiffRef.current;
      setProgress(prev => {
        const newProg = { ...prev, [`${ci}_${mode}`]: true };
        return newProg;
      });
      // 从服务端获取线索（核心内容受保护）
      fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clue', ci, mode })
      }).then(r => r.json()).then((clue: ClueInfo) => {
        if (clue) {
          setClueModal(clue);
          setUnlockedClues(prev => {
            if (prev.find(c => c.ci === ci && c.mode === mode)) return prev;
            return [...prev, clue];
          });
        }
      });
    }
  }, [stopTimer]);

  // ---- 最终揭晓 ----
  const showFinal = useCallback(async () => {
    if (!finalData) {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'final' })
      });
      const fd = await res.json();
      setFinalData(fd);
    }
    screenRef.current = 'final';
    setScreen('final');
  }, [finalData]);

  // ---- 提示 ----
  const getHint = useCallback(() => {
    const avail = pileRef.current.filter(c => !c.used && !c.inTray && c.layers === 0);
    if (curDiffRef.current === 'easy') {
      const gr: Record<string, Card[]> = {};
      avail.forEach(c => { if (!gr[c.w]) gr[c.w] = []; gr[c.w].push(c); });
      const best = Object.values(gr).sort((a, b) => b.length - a.length)[0];
      if (best) { setInfoMsg(`提示："${best[0].k}"（${best[0].w}），场上还有 ${best.length} 张`); setInfoClass('hint'); }
    } else {
      const gr: Record<string, Set<string>> = {};
      avail.forEach(c => { if (!gr[c.w]) gr[c.w] = new Set(); gr[c.w].add(c.type); });
      const tg: Record<string, Set<string>> = {};
      trayRef.current.forEach(c => { if (!tg[c.w]) tg[c.w] = new Set(); tg[c.w].add(c.type); });
      let best: { w: string; types: string[]; have: number } | null = null, bs = -1;
      Object.entries(gr).forEach(([w, types]) => {
        const s = (tg[w]?.size || 0) + types.size;
        if (s > bs) { bs = s; best = { w, types: [...types], have: tg[w]?.size || 0 }; }
      });
      if (best) {
        const tn: Record<string, string> = { jp: '汉字', kana: '假名', cn: '中文' };
        setInfoMsg(`提示："${(best as { w: string }).w}" 场上还有 ${(best as { types: string[] }).types.map(t => tn[t]).join('/')}，槽内已有${(best as { have: number }).have}种`);
        setInfoClass('hint');
      }
    }
  }, []);

  const progressFillPct = wordCount > 0 ? ((matched / wordCount) * 100).toFixed(0) + '%' : '0%';

  // ========================================================
  // 渲染
  // ========================================================

  if (screen === 'title') {
    return (
      <div id="app">
        <div className="screen-title">
          {[{t:'15%',l:'12%',d:'0s'},{t:'25%',r:'10%',d:'2s'},{b:'20%',l:'20%',d:'4s'},{b:'30%',r:'18%',d:'1.5s'}].map((p, i) => (
            <div key={i} className="title-petal" style={{ top: (p as {t?:string}).t, left: (p as {l?:string}).l, right: (p as {r?:string}).r, bottom: (p as {b?:string}).b, animationDelay: p.d }}>
              {i % 2 === 0 ? '🌸' : '✦'}
            </div>
          ))}
          <div className="title-en">Idol Festival Mystery</div>
          <div className="title-jp">偶像校园祭<br />失踪事件</div>
          <div className="title-sub">— 五つの謎 —</div>
          <button className="title-start-btn" onClick={() => setScreen('select')}>开始调查</button>
        </div>
      </div>
    );
  }

  if (screen === 'select') {
    const gotClues = unlockedClues.length;
    const done = allDone();
    return (
      <div id="app">
        <div className="screen-select">
          <div className="select-header">
            <div style={{ fontSize: 20 }}>🌸</div>
            <h1>调查档案</h1>
          </div>
          <div className="mystery-hint">
            {done ? (
              <>🎉 所有线索已收集！<span style={{ color: '#d4a843', textDecoration: 'underline' }} onClick={showFinal}>点此揭晓真相 →</span></>
            ) : (
              `🔍 已解锁 ${gotClues}/10 条线索 — 完成关卡继续追查`
            )}
          </div>

          {chapters.map((ch, ci) => {
            const unlocked = isChapterUnlocked(ci);
            const doneEasy = isDone(ci, 'easy');
            const doneHard = isDone(ci, 'hard');
            const clueCount = [doneEasy, doneHard].filter(Boolean).length;
            if (!unlocked) {
              return (
                <div key={ci} className="chapter-row chapter-locked">
                  <div className="ch-title-row">
                    <div><div className="ch-name">{ch.title}</div><div className="ch-sub">{ch.sub}</div></div>
                    <div className="ch-clue-badge locked">🔒 未解锁</div>
                  </div>
                  <div className="chapter-lock-overlay">🔒 完成「{chapters[ci - 1]?.title}」简易模式后解锁</div>
                </div>
              );
            }
            return (
              <div key={ci} className="chapter-row">
                <div className="ch-title-row">
                  <div><div className="ch-name">{ch.title}</div><div className="ch-sub">{ch.sub}</div></div>
                  <div className={`ch-clue-badge ${clueCount === 0 ? 'locked' : ''}`}>
                    {clueCount === 0 ? '🔒 未解锁线索' : `🔍 ${clueCount}/2 条线索`}
                  </div>
                </div>
                <div className="diff-row">
                  <button className={`diff-btn easy ${doneEasy ? 'done-easy' : ''}`} onClick={() => startGame(ci, 'easy')}>
                    📖 简易模式{doneEasy && <span className="done-mark">✓</span>}
                  </button>
                  <button className={`diff-btn hard ${doneHard ? 'done-hard' : ''}`} onClick={() => startGame(ci, 'hard')}>
                    ⚔ 挑战模式{doneHard && <span className="done-mark">✓</span>}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="story-panel">
            <div className="story-panel-title">✦ 已解锁的线索</div>
            {unlockedClues.length === 0 ? (
              <div className="clue-locked">完成关卡后，线索将在此处显示……</div>
            ) : (
              unlockedClues.map((c, i) => (
                <div key={i} className="clue-item">
                  <div className="clue-num">{c.num}</div>
                  <div className="clue-text"><b style={{ color: 'var(--gold-light)' }}>{c.title}</b><br />{c.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'game') {
    return (
      <div id="app">
        <div className="screen-game">
          <div className="game-topbar">
            <button className="back-btn" onClick={() => { stopTimer(); setScreen('select'); }}>← 返回</button>
            <span className="game-ch-title">{chapters[curCI]?.title}</span>
            <span className={`mode-badge ${curDiff}`}>{curDiff === 'easy' ? '简易模式' : '挑战模式'}</span>
          </div>

          <div className="stats-row">
            <div className="stat-chip">得分 <b>{score}</b></div>
            <div className="stat-chip">连击 <b>{combo}</b></div>
            <div className="stat-chip">剩余 <b>{wordCount - matched}</b></div>
            {curDiff === 'hard' && (
              <div className={`timer-wrap ${timerSec > 120 ? 'urgent' : ''}`}>⏱ {fmtTime(timerSec)}</div>
            )}
            <button className="hint-btn-small" onClick={getHint}>💡 提示</button>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: progressFillPct }} />
          </div>

          <div className={`info-bar ${infoClass}`}>{infoMsg}</div>

          <div className="tray">
            <div className="tray-label">收集槽 ({tray.length}/7)</div>
            {curDiff === 'easy' ? (() => {
              const groups: Record<string, Card[]> = {};
              tray.forEach(c => { if (!groups[c.w]) groups[c.w] = []; groups[c.w].push(c); });
              const seen = new Set<string>();
              return tray.filter(c => { if (seen.has(c.w)) return false; seen.add(c.w); return true; }).map((c, i) => (
                <div key={i} className="tray-card easy-card">{c.k}{groups[c.w].length > 1 ? ` ×${groups[c.w].length}` : ''}</div>
              ));
            })() : tray.map((c, i) => (
              <div key={i} className={`tray-card ${c.type}`}>
                {c.type === 'jp' ? c.w : c.type === 'kana' ? c.k : c.cn}
              </div>
            ))}
          </div>

          <div className="grid">
            {pile.map((card, idx) => {
              if (card.used) return null;
              let cls = 'card';
              if (card.inTray) cls += ' card-in-tray';
              if (card.layers > 0) cls += ' card-locked';
              if (card.type !== 'easy') cls += ` type-${card.type}`;
              return (
                <div key={card.uid} className={cls} onClick={() => clickCard(idx)}>
                  {card.layers > 0 ? (
                    <div className="lock-icon">🔒</div>
                  ) : card.type === 'easy' ? (
                    <>
                      <div className="card-kana-big">{card.k}</div>
                      <div className="card-jp-small">{card.w}</div>
                      <div className="card-cn-small">{card.cn}</div>
                    </>
                  ) : (
                    <div className="card-hard-text">
                      {card.type === 'jp' ? card.w : card.type === 'kana' ? card.k : card.cn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 线索弹窗 */}
        {clueModal && (
          <div className="clue-modal-overlay show">
            <div className="clue-modal-box">
              <div className="clue-modal-label">🔍 新线索解锁</div>
              <div className="clue-modal-num">{clueModal.num}</div>
              <div className="clue-modal-title">{clueModal.title}</div>
              <div className="clue-modal-text">{clueModal.text}</div>
              <button className="clue-modal-continue" onClick={() => setClueModal(null)}>继续调查 →</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'end') {
    return (
      <div id="app">
        <div className="screen-end">
          <div className="end-icon">{winResult ? '🌸' : '💔'}</div>
          <div className="end-title">{winResult ? '消除成功！' : '调查中断'}</div>
          <div className="end-sub">
            {winResult
              ? `得分 ${endScore} 分${endTime ? `　用时 ${endTime}` : ''}\n线索已解锁，继续调查！`
              : '收集槽已满，无法继续。重振旗鼓再试一次！'}
          </div>
          <div className="end-btns">
            <button className="end-btn" onClick={() => { setScreen('select'); setClueModal(null); }}>← 返回档案</button>
            <button className="end-btn" onClick={() => startGame(curCI, curDiff)}>再试一次</button>
            {winResult && (
              <button className="end-btn primary" onClick={() => { setClueModal(null); setScreen('select'); }}>继续调查 →</button>
            )}
          </div>
        </div>

        {clueModal && (
          <div className="clue-modal-overlay show">
            <div className="clue-modal-box">
              <div className="clue-modal-label">🔍 新线索解锁</div>
              <div className="clue-modal-num">{clueModal.num}</div>
              <div className="clue-modal-title">{clueModal.title}</div>
              <div className="clue-modal-text">{clueModal.text}</div>
              <button className="clue-modal-continue" onClick={() => setClueModal(null)}>继续调查 →</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === 'final') {
    return (
      <div id="app">
        <div className="screen-final">
          <div className="final-bg">
            <div className="final-title">★ 真相揭晓 ★</div>
            <div className="final-subtitle">— 事件全貌 —</div>

            <div className="final-section-title">▸ 已收集的线索</div>
            {unlockedClues.map((c, i) => (
              <div key={i} className="final-clue-item">
                <span className="final-clue-num">{c.num}</span>　{c.title}
              </div>
            ))}

            <div className="final-divider" />
            <div className="final-section-title">▸ 幕后黑手</div>
            <div className="final-answer">{finalData?.answer}</div>

            <div className="final-divider" />
            <div className="final-section-title">▸ 尾声</div>
            <div className="final-text">{finalData?.epilogue}</div>

            <div className="final-divider" />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="end-btn" onClick={() => setScreen('select')}>← 返回档案</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
