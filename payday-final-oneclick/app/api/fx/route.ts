import { NextResponse } from 'next/server'
export async function GET(){
  try{
    const r = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=KRW',{ cache:'no-store' })
    const j = await r.json()
    return NextResponse.json(j)
  }catch(e:any){
    return NextResponse.json({ error:String(e) }, { status:500 })
  }
}
