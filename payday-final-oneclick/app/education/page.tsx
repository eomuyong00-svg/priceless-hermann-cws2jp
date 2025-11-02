'use client'
import React from 'react'

export default function Education(){
  const resources = [
    { title:'Investopedia — Technical Analysis', url:'https://www.investopedia.com/terms/t/technicalanalysis.asp', lang:'EN', why:'기초 개념 정리(지표, 패턴, 리스크)' },
    { title:'Binance Academy — Trading Basics', url:'https://academy.binance.com/en/categories/trading', lang:'EN', why:'거래소 관점의 실무 팁' },
    { title:'BabyPips — School of Pipsology', url:'https://www.babypips.com/learn', lang:'EN', why:'리스크/심리/전략을 쉬운 용어로' },
    { title:'CME Group Education', url:'https://www.cmegroup.com/education.html', lang:'EN', why:'선물/파생 개념과 리스크 관리' },
    { title:'나무위키 — 캔들/차트 기초', url:'https://namu.wiki/w/%EC%BA%94%EB%93%A4%EC%B0%A8%ED%8A%B8', lang:'KO', why:'한국어로 빠르게 훑기' },
  ]
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">교육 허브</h1>
        <p className="opacity-80 mb-6">트레이딩 입문자를 위한 핵심 자료 모음. 기초 개념 → 리스크 관리 → 심리/전략 순서로 보세요.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map((r,i)=>(
            <a key={i} href={r.url} target="_blank" className="card p-4 hover:bg-black/5 dark:hover:bg-white/5 transition">
              <div className="text-lg font-semibold">{r.title}</div>
              <div className="text-xs opacity-70 mt-1">{r.lang} · {r.why}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
