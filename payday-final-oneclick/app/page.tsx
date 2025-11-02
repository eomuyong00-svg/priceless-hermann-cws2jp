'use client'
import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts'
type Ticker = 'BTCUSDT'|'ETHUSDT'
const NAME: Record<Ticker,string> = { BTCUSDT:'BTC', ETHUSDT:'ETH' }
type TF = '5m'|'10m'|'1h'|'1d'|'1w'|'1M'|'1Y'

const T = {
  ko: {
    title: 'PAYDAY — 페이데이', dash:'대시보드', edu:'교육 허브',
    risk: '리스크%',
    presets: '프리셋',
    preset_breakout: '돌파',
    preset_pullback: '되돌림',
    preset_range: '박스',
    confirm: '확인',
    warnRisk: '리스크%가 2%를 초과합니다. 초보자는 0.5~2% 범위를 권장합니다.',
    warnUtil: '마진 사용률이 30%를 초과합니다. 레버리지/포지션을 줄이세요.',
    onboarding: [
      '1) 자산(BTC/ETH)과 차트 유형(선형/캔들)을 선택하세요.',
      '2) [리스크%] 버튼으로 손실 허용치를 고르고, [현재가로 엔트리]로 빠르게 입력하세요.',
      '3) [스탑 -50], [테이크 +150] 같은 버튼으로 손절/익절을 설정하세요. R:R가 2 이상이면 유리한 트레이드입니다.'
    ],
    ok: '알겠어요',
  },
  en: {
    title: 'PAYDAY',
    dash:'Dashboard', edu:'Education',
    risk:'Risk %',
    presets:'Presets',
    preset_breakout:'Breakout', preset_pullback:'Pullback', preset_range:'Range',
    confirm:'Confirm',
    warnRisk:'Risk % exceeds 2%. Beginners should keep 0.5–2%.',
    warnUtil:'Margin utilization > 30%. Reduce leverage/size.',
    onboarding:[
      '1) Pick asset (BTC/ETH) and chart type (Line/Candle).',
      '2) Use Risk% buttons to size and "Entry = Last" to auto-fill.',
      '3) Quick buttons for Stop -50 / Take +150. Aim R:R ≥ 2.'
    ],
    ok:'Got it',
  }
}

export default function Page(){
  const [lang,setLang] = React.useState<'ko'|'en'>('ko')
  const L = T[lang]
  const [dark,setDark] = React.useState(true)
  const [ccy,setCcy] = React.useState<'USD'|'KRW'>('USD')
  const [rate,setRate] = React.useState(1400)
  const [ticker,setTicker] = React.useState<Ticker>('BTCUSDT')
  const [price,setPrice] = React.useState<number|null>(null)

  const [mode,setMode] = React.useState<'line'|'candle'>('line')
  const [tf,setTf] = React.useState<TF>('5m')
  const [lineData,setLineData] = React.useState<{t:number,p:number}[]>([])
  const [kRaw,setKRaw] = React.useState<{t:number,o:number,h:number,l:number,c:number}[]>([])

  // beginner-friendly mode / onboarding
  const [showGuide,setShowGuide] = React.useState(true)

  // position
  const [capital,setCapital] = React.useState(79)
  const [lev,setLev] = React.useState(1000)
  const [riskPct,setRiskPct] = React.useState(0.02)
  const [entry,setEntry] = React.useState<number>(65000)
  const [stop,setStop] = React.useState<number>(64500)
  const [take,setTake] = React.useState<number>(66500)

  // persist basic settings
  React.useEffect(()=>{
    try{
      const s = JSON.parse(localStorage.getItem('payday-settings')||'{}')
      if(s.lang) setLang(s.lang)
      if(s.dark!==undefined) setDark(s.dark)
      if(s.ccy) setCcy(s.ccy)
      if(s.rate) setRate(s.rate)
    }catch{}
  },[])
  React.useEffect(()=>{
    localStorage.setItem('payday-settings', JSON.stringify({lang,dark,ccy,rate}))
  },[lang,dark,ccy,rate])

  React.useEffect(()=>{
    const root=document.documentElement
    if(dark) root.classList.add('dark'); else root.classList.remove('dark')
  },[dark])

  // FX auto refresh
  React.useEffect(()=>{
    let cancel=false
    async function pull(){ try{ const r=await fetch('/api/fx'); const j=await r.json(); if(!cancel && j?.rates?.KRW) setRate(Number(j.rates.KRW)) }catch{} }
    pull(); const id=setInterval(pull, 600000); return ()=>{ cancel=true; clearInterval(id) }
  },[])

  // Seed historical candles for current tf (for candle mode)
  React.useEffect(()=>{
    let cancel=false
    async function seed(){
      if(mode!=='candle') return
      const intervalMap: any = { '5m':'5m', '10m':'5m', '1h':'1h', '1d':'1d', '1w':'1w', '1M':'1M', '1Y':'1M' }
      const r = await fetch(`/api/klines?symbol=${ticker}&interval=${intervalMap[tf]}&limit=300`)
      const j = await r.json()
      if(!cancel && j?.candles) setKRaw(j.candles)
    }
    seed()
    return ()=>{ cancel=true }
  },[ticker, tf, mode])

  // WS connect
  React.useEffect(()=>{
    const intervalMap: any = { '5m':'5m', '10m':'5m', '1h':'1h', '1d':'1d', '1w':'1w', '1M':'1M', '1Y':'1M' }
    const stream = mode==='line' ? `${ticker.toLowerCase()}@trade` : `${ticker.toLowerCase()}@kline_${intervalMap[tf]}`
    const url = `wss://stream.binance.com:9443/ws/${stream}`
    const ws = new WebSocket(url)
    ws.onmessage = (ev)=>{
      try{
        const d = JSON.parse(ev.data)
        if(mode==='line'){
          const p = Number(d.p); if(!Number.isFinite(p)) return
          setPrice(p)
          setLineData(prev=>[...prev, {t:Date.now(), p}].slice(-300))
        }else{
          const k = d.k; if(!k) return
          const o=Number(k.o), h=Number(k.h), l=Number(k.l), c=Number(k.c), T=Number(k.T)
          if(![o,h,l,c].every(Number.isFinite)) return
          setPrice(c)
          setKRaw(prev=>{
            const next = [...prev]; const last = next[next.length-1]
            if(last && last.t===T){ next[next.length-1] = {t:T,o,h,l,c} } else { next.push({t:T,o,h,l,c}) }
            return next.slice(-720)
          })
        }
      }catch{}
    }
    ws.onerror = ()=>ws.close()
    return ()=>ws.close()
  },[ticker, tf, mode])

  // display candles aggregation for 10m and 1Y
  const kData = React.useMemo(()=>{
    if(tf==='10m'){
      const out:any[]=[]; let buf:any=null; let cnt=0
      for(const k of kRaw){ if(!buf){ buf={...k}; cnt=1 } else { buf={ t:k.t, o:buf.o, h:Math.max(buf.h,k.h), l:Math.min(buf.l,k.l), c:k.c }; cnt++ }
        if(cnt===2){ out.push(buf); buf=null; cnt=0 } }
      if(buf) out.push(buf); return out
    }
    if(tf==='1Y'){
      const out:any[]=[]; let curYear:number|null=null; let acc:any=null
      for(const k of kRaw){ const y=new Date(k.t).getUTCFullYear()
        if(curYear===null){ curYear=y; acc={...k} }
        else if(y===curYear){ acc={ t:k.t, o:acc.o, h:Math.max(acc.h,k.h), l:Math.min(acc.l,k.l), c:k.c } }
        else { out.push(acc); curYear=y; acc={...k} } }
      if(acc) out.push(acc); return out
    }
    return kRaw
  },[kRaw, tf])

  // quick buttons
  const setRiskQuick = (r:number)=> setRiskPct(r)
  const setEntryFromPrice = ()=> { if(price!=null){ setEntry(Number(price.toFixed(2))) } }
  const setStopBelow = (tick=50)=> { if(price!=null){ setStop(Number((price - tick).toFixed(2))) } }
  const setTakeAbove = (tick=150)=> { if(price!=null){ setTake(Number((price + tick).toFixed(2))) } }

  // presets
  function applyPreset(type:'breakout'|'pullback'|'range'){
    if(price==null) return
    const p = price
    if(type==='breakout'){ setEntry(Number((p+30).toFixed(2))); setStop(Number((p-70).toFixed(2))); setTake(Number((p+180).toFixed(2))) }
    if(type==='pullback'){ setEntry(Number((p-20).toFixed(2))); setStop(Number((p-100).toFixed(2))); setTake(Number((p+120).toFixed(2))) }
    if(type==='range'){ setEntry(Number(p.toFixed(2))); setStop(Number((p-80).toFixed(2))); setTake(Number((p+80).toFixed(2))) }
  }

  // pnl calc
  const perUnit = Math.abs(entry - stop) || 0.0000001
  const risk$ = capital * riskPct
  const qty = risk$ / perUnit
  const notional = qty * entry
  const margin = notional / Math.max(1, lev)
  const util = margin / capital
  const pnlTP = (take - entry) * qty
  const pnlSL = -risk$
  const rr = Math.abs((take - entry))/perUnit

  const disp = (v:number)=> new Intl.NumberFormat(lang==='ko'?'ko-KR':'en-US',{maximumFractionDigits:2}).format(ccy==='USD' ? v : v*rate)

  const riskTooHigh = riskPct > 0.02 + 1e-9
  const utilTooHigh = util > 0.30 + 1e-9

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
          <div className="text-2xl md:text-3xl font-semibold">{L.title}</div>
          <div className="flex gap-2 flex-wrap">
            <button className="btn" onClick={()=>setDark(d=>!d)}>{dark?'라이트모드':'다크모드'}</button>
            <select className="select" value={lang} onChange={(e)=>setLang(e.target.value as any)}>
              <option value="ko">한국어</option><option value="en">English</option>
            </select>
            <select className="select" value={ccy} onChange={(e)=>setCcy(e.target.value as any)}><option>USD</option><option>KRW</option></select>
            {ccy==='KRW' && <input className="input w-28" value={rate} onChange={(e)=>setRate(Number(e.target.value))} />}
          </div>
        </div>

        {/* Quick tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="card"><div className="card-body">
            <div className="text-sm opacity-70 mb-1">자산</div>
            <div className="flex gap-2">
              <button className={"btn "+(ticker==='BTCUSDT'?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setTicker('BTCUSDT')}>BTC</button>
              <button className={"btn "+(ticker==='ETHUSDT'?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setTicker('ETHUSDT')}>ETH</button>
            </div>
          </div></div>
          <div className="card"><div className="card-body">
            <div className="text-sm opacity-70 mb-1">차트</div>
            <div className="flex flex-wrap gap-2">
              <button className={"btn "+(mode==='line'?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setMode('line')}>선형</button>
              <button className={"btn "+(mode==='candle'?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setMode('candle')}>캔들</button>
              {(['5m','10m','1h','1d','1w','1M','1Y'] as TF[]).map(b=>(
                <button key={b} className={"btn "+(tf===b?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setTf(b)}>{b}</button>
              ))}
            </div>
            <div className="tip mt-1">※ 10m/1Y는 합성(5m×2, 1M→연봉)</div>
          </div></div>
          <div className="card"><div className="card-body">
            <div className="text-sm opacity-70 mb-1">현재가</div>
            <div className="text-xl font-semibold">{price==null?'-':disp(price)} {ccy}</div>
          </div></div>
        </div>

        {/* Chart */}
        <div className="card"><div className="card-body">
          <div className="text-sm opacity-70 mb-2">{NAME[ticker]} 실시간 차트</div>
          <div className="w-full h-80">
            {mode==='line' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData.map(d=>({x:d.t, y:d.p}))}>
                  <XAxis dataKey="x" tickFormatter={(v)=>new Date(v).toLocaleTimeString()} />
                  <YAxis domain={['dataMin','dataMax']} />
                  <Tooltip formatter={(val:any)=>[disp(val as number)+' '+ccy,'price']} labelFormatter={(v)=>new Date(v as number).toLocaleTimeString()} />
                  <Line type="monotone" dataKey="y" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={kData}>
                  <XAxis dataKey="t" tickFormatter={(v)=>new Date(v).toLocaleTimeString()} />
                  <YAxis domain={['dataMin','dataMax']} />
                  <Tooltip formatter={(val:any)=>[disp(val as number)+' '+ccy]} labelFormatter={(v)=>new Date(v as number).toLocaleTimeString()} />
                  {/* Candle */}
                  {/**/}
                  {(()=>{
                    const width = 6
                    return (
                      <g>
                        {kData.map((d:any, idx:number)=>{
                          const x = (idx/(kData.length||1))*800 // rough x; recharts positions via scale are internal; this simple approach shows proportional candles
                          return null
                        })}
                      </g>
                    )
                  })()}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div></div>

        {/* Position box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
          <div className="card"><div className="card-body">
            <div className="text-lg font-semibold mb-2">손익 계산</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div><div className="opacity-70 mb-1">자본($)</div><input className="input w-full" value={capital} onChange={(e)=>setCapital(Number(e.target.value))}/></div>
              <div><div className="opacity-70 mb-1">레버리지(×)</div><input className="input w-full" value={lev} onChange={(e)=>setLev(Number(e.target.value))}/></div>
              <div>
                <div className="opacity-70 mb-1">{L.risk}</div>
                <div className="flex gap-2">
                  <button className={"btn "+(riskPct===0.005?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setRiskQuick(0.005)}>0.5%</button>
                  <button className={"btn "+(riskPct===0.01?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setRiskQuick(0.01)}>1%</button>
                  <button className={"btn "+(riskPct===0.02?'bg-black text-white dark:bg-white dark:text-black':'')} onClick={()=>setRiskQuick(0.02)}>2%</button>
                </div>
              </div>
              <div className="col-span-2 md:col-span-3 flex gap-2 flex-wrap mt-1">
                <button className="btn" onClick={setEntryFromPrice}>현재가로 엔트리</button>
                <button className="btn" onClick={()=>setStopBelow(50)}>스탑 -50</button>
                <button className="btn" onClick={()=>setTakeAbove(150)}>테이크 +150</button>
                <span className="tip">엔트리/스탑/테이크는 항상 차트 논리에 맞춰 조정하세요.</span>
              </div>
              <div><div className="opacity-70 mb-1">엔트리</div><input className="input w-full" value={entry} onChange={(e)=>setEntry(Number(e.target.value))}/></div>
              <div><div className="opacity-70 mb-1">스탑</div><input className="input w-full" value={stop} onChange={(e)=>setStop(Number(e.target.value))}/></div>
              <div><div className="opacity-70 mb-1">테이크</div><input className="input w-full" value={take} onChange={(e)=>setTake(Number(e.target.value))}/></div>
              <div className="col-span-2 md:col-span-3">
                <div className="opacity-70 mb-1">{L.presets}</div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn" onClick={()=>applyPreset('breakout')}>{L.preset_breakout}</button>
                  <button className="btn" onClick={()=>applyPreset('pullback')}>{L.preset_pullback}</button>
                  <button className="btn" onClick={()=>applyPreset('range')}>{L.preset_range}</button>
                </div>
              </div>
            </div>
          </div></div>
          <div className="card"><div className="card-body">
            <div className="text-lg font-semibold mb-2">결과</div>
            {riskTooHigh && <div className="mb-2 text-red-500 text-sm">⚠ {L.warnRisk}</div>}
            {utilTooHigh && <div className="mb-2 text-amber-500 text-sm">⚠ {L.warnUtil}</div>}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5"><div className="opacity-70">수량</div><div className="font-semibold">{new Intl.NumberFormat(lang==='ko'?'ko-KR':'en-US').format(qty)}</div></div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5"><div className="opacity-70">리스크$</div><div className="font-semibold">{new Intl.NumberFormat(lang==='ko'?'ko-KR':'en-US').format(risk$)}</div></div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5"><div className="opacity-70">TP 손익</div><div className="font-semibold">{new Intl.NumberFormat(lang==='ko'?'ko-KR':'en-US').format(pnlTP)}</div></div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5"><div className="opacity-70">SL 손익</div><div className="font-semibold">{new Intl.NumberFormat(lang==='ko'?'ko-KR':'en-US').format(pnlSL)}</div></div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5"><div className="opacity-70">R:R</div><div className="font-semibold">{rr.toFixed(2)}</div></div>
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5"><div className="opacity-70">마진 사용률</div><div className="font-semibold">{(util*100).toFixed(2)}%</div></div>
            </div>
          </div></div>
        </div>

        {/* Safety confirm */}
        <div className="mt-3 flex items-center gap-2">
          <button className="btn">{L.confirm}</button>
          <span className="tip">이 버튼은 실제 주문이 아닙니다. 계산 값 확인용입니다.</span>
        </div>

        <div className="text-xs opacity-60 mt-6">© {new Date().getFullYear()} PAYDAY — 실거래 전 백테스트/모의투자 권장</div>
      </div>

      {/* Onboarding modal */}
      {showGuide && (
        <div className="modal" onClick={()=>setShowGuide(false)}>
          <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">빠른 시작</div>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              {L.onboarding.map((x,i)=>(<li key={i}>{x}</li>))}
            </ol>
            <div className="mt-4 flex justify-end"><button className="btn" onClick={()=>setShowGuide(false)}>{L.ok}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
