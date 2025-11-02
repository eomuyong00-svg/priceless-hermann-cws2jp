import { NextResponse } from 'next/server'

export async function GET(req: Request){
  try{
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol') || 'BTCUSDT'
    const interval = searchParams.get('interval') || '5m'
    const limit = Math.min(parseInt(searchParams.get('limit')||'500',10), 1000)
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    const r = await fetch(url, { cache:'no-store' })
    if(!r.ok) return NextResponse.json({ error:'fetch failed' }, { status:500 })
    const arr = await r.json()
    // Map to {t,o,h,l,c}
    const out = arr.map((k:any)=>({ t:k[6], o:Number(k[1]), h:Number(k[2]), l:Number(k[3]), c:Number(k[4]) }))
    return NextResponse.json({ candles: out })
  }catch(e:any){
    return NextResponse.json({ error:String(e) }, { status:500 })
  }
}
