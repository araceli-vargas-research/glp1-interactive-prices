"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Expand, RotateCcw, X } from "lucide-react";
import dynamic from "next/dynamic";
const UniverseScene = dynamic(() => import("./universe-scene"), { ssr: false });
import PolicyStory, { PolicyCaveat, PriceAnalysis } from "./policy-story";
import PriceLandscape from "./price-landscape";
import { productDoseColor } from "./dose-colors";
import { getExplorePrice, PRICE_OBSERVED_ON, type ChartPoint, type ChartSeries } from "../data/glp1-prices";
import "./universe.css";

type Drug = { id:string; name:string; molecule:string; maker:"Novo Nordisk"|"Eli Lilly"; form:string; approved:string; doses:string[]; note:string; accent:string; source:string; sourceName:string; model:"pen"|"vial"|"bottle"; };

const drugs:Drug[] = [
  {id:"wegovy",name:"Wegovy",molecule:"semaglutide",maker:"Novo Nordisk",form:"Weekly single-dose injection",approved:"Jun 2021",doses:["0.25","0.5","1","1.7","2.4"],note:"Wegovy is available in five strengths for once-weekly injection. The 2.4 mg dose is the usual recommended maintenance dose.",accent:"#79c8f7",model:"pen",source:"https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/215256s033lbl.pdf",sourceName:"FDA prescribing information"},
  {id:"zepbound",name:"Zepbound",molecule:"tirzepatide",maker:"Eli Lilly",form:"Weekly injection · pen, vial or KwikPen",approved:"Nov 2023",doses:["2.5","5","7.5","10","12.5","15"],note:"Six strengths available in a vial.",accent:"#ffbe78",model:"vial",source:"https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/217806Orig1s020lbl.pdf",sourceName:"FDA prescribing information"},
  {id:"oral-wegovy",name:"Wegovy pill",molecule:"semaglutide",maker:"Novo Nordisk",form:"Daily tablet",approved:"Dec 2025",doses:["1.5","4","9","25"],note:"The first oral GLP-1 approved in the U.S. for weight management. Approved Dec 22, 2025, before Foundayo.",accent:"#ee99c4",model:"bottle",source:"https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/218316Orig1s000lbl.pdf",sourceName:"FDA tablet label"},
  {id:"wegovy-hd",name:"Wegovy HD",molecule:"semaglutide",maker:"Novo Nordisk",form:"Weekly single-dose injection",approved:"Mar 2026",doses:["7.2"],note:"A higher semaglutide dose for eligible adults who have tolerated 2.4 mg for at least four weeks and need further weight reduction.",accent:"#c6a3f4",model:"pen",source:"https://www.fda.gov/news-events/press-announcements/fda-approves-fourth-product-under-national-priority-voucher-program-higher-dose-semaglutide",sourceName:"FDA approval announcement"},
  {id:"foundayo",name:"Foundayo",molecule:"orforglipron",maker:"Eli Lilly",form:"Daily tablet",approved:"Apr 2026",doses:["0.8","2.5","5.5","9","14.5","17.2"],note:"Lilly’s oral GLP-1 was approved Apr 1, 2026 and had LillyDirect shipping scheduled to begin Apr 6, followed by broader availability Apr 9, about three months after oral Wegovy’s U.S. arrival.",accent:"#f5a88f",model:"bottle",source:"https://www.fda.gov/news-events/press-announcements/fda-approves-first-new-molecular-entity-under-national-priority-voucher-program",sourceName:"FDA approval announcement"}
];

function ExplorePriceLineChart({ chartSeries, color, expanded = false }: { chartSeries: ChartSeries[]; color: string; expanded?: boolean }) {
 const [hoveredPoint,setHoveredPoint]=useState<ChartPoint|null>(null);
 const [pinnedPoint,setPinnedPoint]=useState<ChartPoint|null>(null);
 const activePoint=hoveredPoint??pinnedPoint;
 const gridMaskId=useId();
 const chartRef=useRef<HTMLDivElement>(null);
 const [width,setWidth]=useState(420);
 useEffect(()=>{
  const element=chartRef.current;
  if(!element)return;
  const observer=new ResizeObserver(([entry])=>setWidth(Math.max(240,entry.contentRect.width)));
  observer.observe(element);
  return()=>observer.disconnect();
 },[]);
 const isPriceOrOfferPoint=(point:ChartPoint)=>point.status!=="announced"&&point.event!=="Channel expansion";
 const allPoints = chartSeries.flatMap(series => series.points).filter(isPriceOrOfferPoint);
 if (allPoints.length === 0) return <p className="price-chart-empty">No dated regular-price changes are available for this dose.</p>;
 const height=expanded?410:300, left=48, right=24, top=36, bottom=48;
 const eventAxisInset=24;
 const chartLeft=left+eventAxisInset, chartRight=width-right-eventAxisInset;
 const chartWidth=chartRight-chartLeft;
 const dates=[...new Set(allPoints.map(point=>point.date))].sort((a,b)=>a.localeCompare(b));
 const startDate=Date.parse(dates[0]);
 const endDate=Date.parse(dates[dates.length-1]);
 const xForDate=(date:string)=>{
   const ratio=startDate===endDate?0.5:(Date.parse(date)-startDate)/(endDate-startDate);
   return chartLeft+ratio*chartWidth;
 };
 const values=allPoints.map(point=>point.value);
 const yAxisMax=Math.max(200,Math.ceil(Math.max(...values)/200)*200);
 const y=(value:number)=>top+((yAxisMax-value)/yAxisMax)*(height-top-bottom);
 const axisLabelStyle={ fontSize:12, fontWeight:600, fontFamily:"'Montserrat', Arial, sans-serif", fill:"#59617f" } as const;
 const pointLabelStyle={ fontSize:13, fontWeight:600, fontFamily:"'Montserrat', Arial, sans-serif", fill:"#1d283d" } as const;
 const formatMonthYear=(date:string)=>new Intl.DateTimeFormat("en-US",{month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`));
 const regularObservationDates=allPoints.filter(point=>point.status==="observed"&&point.basis==="regular").map(point=>point.date).sort();
 const finalObservationDate=regularObservationDates.at(-1);
 const tickCandidates=dates.filter(date=>allPoints.some(point=>point.date===date&&point.basis==="regular"&&point.status!=="announced"&&point.displayMode!=="marker"));
 for(const date of dates){
  if(allPoints.some(point=>point.date===date&&(point.basis==="conditional"||point.basis==="introductory"||point.basis==="temporary")&&point.status!=="announced"))tickCandidates.push(date);
 }
 if(finalObservationDate&&!tickCandidates.includes(finalObservationDate))tickCandidates.push(finalObservationDate);
 const visibleTicksByMonth=new Map<string,string>();
 for(const date of tickCandidates.sort((a,b)=>a.localeCompare(b))){
   const monthKey=date.slice(0,7);
   if(!visibleTicksByMonth.has(monthKey)||date===finalObservationDate)visibleTicksByMonth.set(monthKey,date);
 }
 const candidateTicks=[...visibleTicksByMonth.values()].sort((a,b)=>a.localeCompare(b));
 // Greedily retain readable ticks, always reserving room for the endpoint.
 const visibleTickDates:string[]=[];
 for(const date of candidateTicks){
  const previous=visibleTickDates.at(-1);
  const endpoint=candidateTicks.at(-1)!;
  if(date===endpoint){
   if(previous&&xForDate(date)-xForDate(previous)<76)visibleTickDates.pop();
   visibleTickDates.push(date);
  }else if((!previous||xForDate(date)-xForDate(previous)>=76)&&xForDate(endpoint)-xForDate(date)>=76)visibleTickDates.push(date);
 }
 const priceLabels=new Map<string,{x:number;bottom:number;width:number}>();
 for(const series of chartSeries){
  const points=series.points.filter(isPriceOrOfferPoint).slice().sort((a,b)=>a.date.localeCompare(b.date));
  points.forEach((point,index)=>{
   // Verification dots remain interactive, but never repeat an established price.
   if(index>0&&points[index-1].value===point.value)return;
   const labelWidth=`$${point.value}`.length*9;
   const incomingDrop=index>0&&points[index-1].value!==point.value&&point.status!=="observed";
   const labelX=Math.min(width-right-labelWidth,xForDate(point.date)+(incomingDrop?12:-labelWidth/2));
   priceLabels.set(point.id,{x:labelX,bottom:y(point.value)-(point.displayMode==="marker"?6:4.5)-14,width:labelWidth});
  });
 }
 return <div ref={chartRef} className="price-chart-container">
 <svg className="explore-price-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price history line chart">
  <defs><mask id={gridMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}><rect width={width} height={height} fill="white"/>{[...priceLabels.entries()].map(([id,label])=><rect key={id} x={label.x-4} y={label.bottom-19} width={label.width+8} height="23" fill="black"/>)}</mask></defs>
  {Array.from({length:yAxisMax/200+1},(_,row)=>{const value=yAxisMax-row*200;return <g key={value}><line x1={left} y1={y(value)} x2={width-right} y2={y(value)} mask={`url(#${gridMaskId})`}/><text x={left-12} y={y(value)+4} textAnchor="end" style={axisLabelStyle}>${value}</text></g>})}
  {chartSeries.map(series => {
    const basis = series.basis.toLowerCase();
    const dash = basis === "conditional" ? "8 6" : basis === "introductory" || basis === "temporary" ? "3 5" : undefined;
    const visiblePoints=series.points.filter(isPriceOrOfferPoint);
    const sortedPoints=visiblePoints.filter(point=>point.displayMode!=="marker").slice().sort((a,b)=>a.date.localeCompare(b.date));
    const segments:{path:string;schematic:boolean}[]=[];
    for(let index=1;index<sortedPoints.length;index++){
      const previous=sortedPoints[index-1],point=sortedPoints[index];
      if(point.status==="observed"&&point.value!==previous.value)continue;
      segments.push({path:`M ${xForDate(previous.date)} ${y(previous.value)} H ${xForDate(point.date)}`,schematic:!!previous.dateLabel});
      if(point.value!==previous.value)segments.push({path:`M ${xForDate(point.date)} ${y(previous.value)} V ${y(point.value)}`,schematic:false});
    }
    return <g key={series.key}>
      {series.showLine&&segments.map((segment,index)=><path key={index} d={segment.path} fill="none" stroke={color} strokeDasharray={segment.schematic?"5 4":dash} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
      {visiblePoints.map((point,index)=>{
        const pointX=xForDate(point.date);
        const label=priceLabels.get(point.id);
        const tooltip=[
          point.dateLabel ?? point.date,
          `$${point.value} USD / ${point.periodDays}-day supply`,
          `Basis: ${point.basis}`,
          `Status: ${point.status === "observed" ? "Observed snapshot; not a dated price cut" : point.status}`,
          `Event: ${point.event}`,
          `Channel: ${point.channel}`,
          `Eligibility: ${point.eligibility}`,
          point.note,
          point.effectiveUntil ? `Effective until: ${point.effectiveUntil}` : undefined,
          `Source: ${point.sourceUrl}`,
        ].filter(Boolean).join("\n");
        return <g key={`${point.id}-${index}`} onMouseEnter={()=>setHoveredPoint(point)} onMouseLeave={()=>setHoveredPoint(null)}>
          <circle cx={pointX} cy={y(point.value)} r={point.displayMode==="marker"?"6":"4.5"} fill={point.announcement||point.displayMode==="marker"?"white":color} stroke={color} tabIndex={0} role="button" aria-label={tooltip} onClick={()=>setPinnedPoint(previous=>previous?.id===point.id?null:point)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setPinnedPoint(previous=>previous?.id===point.id?null:point);}if(event.key==="Escape"){setPinnedPoint(null);setHoveredPoint(null);}}} onFocus={()=>setHoveredPoint(point)} onBlur={()=>setHoveredPoint(null)}><title>{tooltip}</title></circle>
          {label&&<text className="price-chart-value" x={label.x} y={label.bottom} dominantBaseline="text-after-edge" textAnchor="start" style={pointLabelStyle}>${point.value}</text>}
        </g>;
      })}
    </g>;
  })}
  {visibleTickDates.map(date=>{const tickX=xForDate(date);return <g key={date}><line x1={tickX} y1={height-bottom+3} x2={tickX} y2={height-bottom+8} stroke="#7b8298"/><text className="price-chart-date" x={tickX} y={height-10} textAnchor="middle" style={axisLabelStyle}>{allPoints.some(point => point.date === date && point.dateLabel) ? "Prior offer*" : formatMonthYear(date)}</text></g>})}
 </svg>
 <div className="price-chart-readout" aria-live="polite">
  {activePoint ? <>
   <strong>{activePoint.dateLabel ? "Prior offer · date unverified" : formatMonthYear(activePoint.date)} · ${activePoint.value} USD / {activePoint.periodDays}-day supply</strong>
   <span>{activePoint.dateLabel ?? activePoint.date} · {activePoint.basis} · {activePoint.status === "observed" ? "Observed snapshot; not a dated price cut" : activePoint.event}</span>
   <span>{activePoint.channel} · {activePoint.eligibility}</span>
   {activePoint.note&&<span>{activePoint.note}</span>}
   {activePoint.effectiveUntil&&<span>Offer expires {activePoint.effectiveUntil}.</span>}
  </> : <span>Hover or focus a price point to see its date, offer and eligibility here.</span>}
 </div>
 <div className="price-chart-legend" aria-label="Chart legend">
   {allPoints.some(point=>point.basis==="regular")&&<span><i className="legend-line legend-line-regular" style={{"--legend-color":color} as React.CSSProperties}/>Regular price</span>}
   {allPoints.some(point=>point.basis==="conditional")&&<span><i className="legend-line legend-line-conditional" style={{"--legend-color":color} as React.CSSProperties}/>Conditional offer</span>}
  {allPoints.some(point=>point.basis==="introductory"||point.basis==="temporary")&&<span><i className="legend-marker" style={{"--legend-color":color} as React.CSSProperties}/>Introductory / temporary offer</span>}
 </div>
 </div>;
}

type ExplorePrice = NonNullable<ReturnType<typeof getExplorePrice>>;

function PriceHistoryContent({price, productId, dose, device, color, expanded=false}: {
 price:ExplorePrice; productId:string; dose:string; device:string; color:string; expanded?:boolean;
}) {
 const introductory=productId==="wegovy"&&(dose==="0.25"||dose==="0.5");
 const sources=[...new Set([price.source,...price.offerSources.map(offer=>offer.source),...price.series.map(point=>point.sourceUrl)])];
 return <>
  <p className="price-unit-label">U.S. dollars (USD) · {price.periodDays}-day supply · {dose} mg · {device}</p>
  <ExplorePriceLineChart chartSeries={price.chartSeries} color={color} expanded={expanded}/>
  {introductory&&<p className="price-offer-summary"><strong>$199 for the first two eligible low-dose fills, then $349.</strong> The introductory price is not the ongoing treatment price. Eligible 0.25 mg and 0.5 mg fills only; offer expires December 31, 2026.</p>}
  {productId==="zepbound"&&price.conditionalOffer&&<p className="price-offer-summary"><strong>{price.headline} regular · ${price.conditionalOffer.usd} conditional.</strong> Journey offer: first purchase, then refill within 45 days of prior delivery/receipt. Needles/syringes may require a separate purchase.</p>}
  {productId==="foundayo"&&price.series.some(point=>point.status==="observed"&&point.basis==="temporary")&&<p className="price-offer-summary">Temporary offer expires December 31, 2026; eligibility applies.</p>}
  <p className="price-history-note">Manufacturer self-pay offers; eligibility applies. Snapshots are observations, not dated price cuts. Regular prices are not guaranteed after offers expire.</p>
  {price.lastObserved&&<p className="price-observation-date">Prices verified {new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(`${price.lastObserved}T00:00:00Z`))}.</p>}
  <details className="price-methodology">
   <summary>Sources and methodology</summary>
   <p>{price.detail}</p>
   <p>Each history is specific to this product, dose and device. Injections use 28-day supplies; tablets use 30-day supplies. These are manufacturer self-pay offers, not list or net prices, and are not clinical equivalents. Dates are spaced by elapsed time. Lines connect documented regular or conditional prices; isolated markers show offers or snapshots whose change date is unknown.</p>
   {price.series.some(point=>point.dateLabel)&&<p>*Prior retail savings offer: start date unverified. The plotted baseline is schematic and uses a different channel from the March 2025 NovoCare Pharmacy launch.</p>}
   {productId==="foundayo"&&<p>The chart omits non-price announcements. Available and observed prices and offers are shown separately.</p>}
   <ul className="price-event-details">{price.series.map(point=><li key={point.id}><strong>{point.dateLabel??point.date} · ${point.value} USD · {point.basis}</strong><br/>{point.status==="observed"?"Observed snapshot; not a dated price cut":point.event}. {point.channel}. {point.eligibility}{point.note&&<> · {point.note}</>}{point.effectiveUntil&&<> · Offer expires {point.effectiveUntil}</>}</li>)}</ul>
   <div className="price-sources">{sources.map((source,index)=><a key={source} href={source} target="_blank" rel="noreferrer">{index===0?"Current price source":`Historical / offer source ${index}`} ↗</a>)}</div>
  </details>
 </>;
}

export default function Page(){
 const [selected,setSelected]=useState("wegovy"); const [dose,setDose]=useState<string|null>("2.4"); const [chartExpanded,setChartExpanded]=useState(false);
 const expandedDialogRef=useRef<HTMLDialogElement>(null);
 const [universeFocused,setUniverseFocused]=useState(false);
 useEffect(()=>{
  const section=document.getElementById("universe");
  if(!section)return;
  const observer=new IntersectionObserver(([entry])=>setUniverseFocused(entry.isIntersecting),{rootMargin:"-25% 0px -25% 0px"});
  observer.observe(section);
  return()=>observer.disconnect();
 },[]);
 const detailPanelRef=useRef<HTMLElement>(null);
 const [detailHeight,setDetailHeight]=useState<number>();
 const item=drugs.find(d=>d.id===selected)!;
 const displayedPrice=getExplorePrice(item.name,dose||item.doses[item.doses.length-1],item.model==="vial"?"Vial":item.model==="bottle"?"Tablet":"Pen");
 const priceDevice=item.model==="vial"?"Vial":item.model==="bottle"?"Tablet":"Single-dose pen";
 const selectedAccent=item.id==="wegovy"&&dose==="2.4"?"#b9c6cf":productDoseColor(item.id,dose||undefined,item.accent);
 const choose=(id:string)=>{const d=drugs.find(x=>x.id===id)!;setSelected(id);setDose(d.doses[d.doses.length-1]);};
 useEffect(()=>{
  if(!chartExpanded)return;
  const dialog=expandedDialogRef.current;
  if(!dialog)return;
  dialog.showModal();
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  return()=>{document.body.style.overflow=previousOverflow;dialog.close();};
 },[chartExpanded]);
 const navigate=(section: "policy" | "universe" | "compare")=>{document.getElementById(section)?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});};
 useEffect(()=>{
  const panel=detailPanelRef.current,legend=panel?.querySelector<HTMLElement>(".dose-price-chart");
  if(!panel||!legend)return;
  const measure=()=>setDetailHeight(Math.max(510, Math.ceil(legend.getBoundingClientRect().bottom-panel.getBoundingClientRect().top+panel.scrollTop+12)));
  const observer=new ResizeObserver(measure);
  observer.observe(panel);observer.observe(legend);
  measure();
  return()=>observer.disconnect();
 },[selected,dose]);
 const productUniverse = (
<section id="universe" className="page-explore-section" aria-label="Explore medicines">
   <section className="intro" aria-label="Introduction"><div className="eyebrow">PRODUCT UNIVERSE</div><h2>Rival brands Novo Nordisk<br/><em>& Eli Lilly.</em></h2><p>Select a product to explore its format, strengths, approval date, and manufacturer self-pay offers. Prices are for the stated dose and channel; products and doses are not clinically interchangeable.</p></section>
   <div className="product-selection"><div className="intro-scroll">SELECT A PRODUCT <ArrowDownRight size={17}/></div><div className="orbit-dock" aria-label="Select a medicine">{drugs.filter(d=>d.id!=="wegovy-hd").map((d,i)=><button key={d.id} onClick={()=>choose(d.id)} className={selected===d.id||(d.id==="wegovy"&&selected==="wegovy-hd")?"current":""} style={{"--accent":d.id==="wegovy"&&(selected===d.id?dose:d.doses[d.doses.length-1])==="2.4"?"#b9c6cf":selected===d.id?selectedAccent:productDoseColor(d.id,d.doses[d.doses.length-1],d.accent)} as React.CSSProperties} aria-pressed={selected===d.id||(d.id==="wegovy"&&selected==="wegovy-hd")}><span className="dock-orb"/><span className="dock-copy"><strong>{d.name}</strong><small>{d.maker}</small></span><span className="dock-number">0{i+1}</span></button>)}</div><div className="scene-hint"><RotateCcw size={15}/> DRAG TO ROTATE · SELECT TO FOCUS</div></div>
   <aside ref={detailPanelRef} className="detail-panel" key={item.id} style={{"--accent":selectedAccent,"--detail-height":detailHeight?`${detailHeight}px`:undefined} as React.CSSProperties} aria-label={`${item.name} details`}>
    <div className="panel-top"><span className="panel-kicker">{item.maker} <span className="tiny-star">·</span> {item.approved}</span><span className="panel-index">{String(drugs.indexOf(item)+1).padStart(2,"0")} / {String(drugs.length).padStart(2,"0")}</span></div>
    {(item.id==="wegovy"||item.id==="wegovy-hd")&&<div className="wegovy-variants" role="group" aria-label="Wegovy presentation">{["wegovy","wegovy-hd"].map(id=><button key={id} type="button" aria-pressed={selected===id} onClick={()=>choose(id)}>{id==="wegovy"?"Wegovy":"Wegovy HD"}</button>)}</div>}
    <h2>{item.name}</h2><div className="molecule">{item.molecule}</div><div className="thin-rule"/>
    <div className="fact-row"><span>FORMAT</span><strong>{item.form}</strong></div><div className="fact-row"><span>FDA APPROVAL</span><strong>{item.approved}</strong></div>
    <div className="dose-head"><span>DOSE OPTIONS</span><span>{item.id === "zepbound" ? "VIAL SELF-PAY · USD / 28 DAYS" : `SELF-PAY · USD / ${item.model==="bottle"?30:28} DAYS`}</span></div><div className="dose-grid">{item.doses.map(n=>{const dosePrice=getExplorePrice(item.name,n,item.model==="vial"?"Vial":item.model==="bottle"?"Tablet":"Pen");return <button key={n} className={dose===n?"selected":""} style={{"--dose-accent":productDoseColor(item.id,n,item.accent)} as React.CSSProperties} onClick={()=>setDose(n)} aria-pressed={dose===n} aria-label={`${n} mg, current snapshot ${dosePrice?.headline??"price unavailable"}${item.id==="zepbound"&&dosePrice?.conditionalOffer?` regular; $${dosePrice.conditionalOffer.usd} conditional; refill within 45 days of prior delivery`:""}`}><span className="dose-value">{n}<small>mg</small></span><span className="dose-price">{dosePrice?.headline??"—"}{item.id==="zepbound"&&dosePrice?.conditionalOffer?" regular":""}</span>{item.id==="zepbound"&&dosePrice?.conditionalOffer&&<span className="dose-conditional">${dosePrice.conditionalOffer.usd} conditional</span>}</button>})}</div>
    {displayedPrice && <div className="price-module dose-price-chart"><div className="price-title"><span>{item.name.toUpperCase()} · {dose} MG · {priceDevice.toUpperCase()} · PRICE HISTORY</span><strong>{displayedPrice.headline}<small> USD / {displayedPrice.periodDays}-day supply</small></strong></div><button type="button" className="expand-chart-button" onClick={()=>setChartExpanded(true)} aria-label="Expand price chart"><Expand size={15}/> Expand chart</button><PriceHistoryContent price={displayedPrice} productId={item.id} dose={dose||item.doses[item.doses.length-1]} device={priceDevice} color={selectedAccent}/></div>}
    <p className="item-note">{item.note}</p>
    <a className="source-link" href={item.source} target="_blank" rel="noreferrer">{item.sourceName} <ArrowUpRight size={15}/></a>
   </aside>
   <div className="orbit-legend" aria-label="Orbit colors"><span><i className="novo-line"/> Novo Nordisk</span><span><i className="lilly-line"/> Eli Lilly</span></div>

  </section>
 );
 const priceEvidence = (
  <section className="comparison price-evidence" aria-label="Tracked manufacturer product lineup">
<div className="compare-heading lineup-intro"><div className="eyebrow">THE TRACKED MARKET</div><h2>Two makers.<br/><em>Five tracked entries.</em></h2><p>Wegovy injection, Wegovy HD, Wegovy pill, Zepbound, and Foundayo. These editorial groupings are not a count of every device or formulation: Zepbound’s pen, vial, and KwikPen share one entry.</p></div><div className="compare-columns"><div className="maker-column novo">
    <div className="maker-heading"><span>NOVO NORDISK</span><strong>3 <small>tracked entries</small></strong><strong>10 <small>dose options</small></strong></div>
    {drugs.filter(d=>d.maker==="Novo Nordisk").map(d=><button key={d.id} onClick={()=>{choose(d.id);navigate("universe")}}><span><b>{d.name}</b><small>{d.form} · {d.approved}</small></span><span>{d.doses.length} {d.doses.length === 1 ? "dose" : "doses"} <ArrowUpRight size={17}/></span></button>)}</div>
    <div className="maker-column lilly">
    <div className="maker-heading"><span>ELI LILLY</span><strong>2 <small>tracked entries</small></strong><strong>12 <small>dose options</small></strong></div>
    {drugs.filter(d=>d.maker==="Eli Lilly").map(d=><button key={d.id} onClick={()=>{choose(d.id);navigate("universe")}}><span><b>{d.name}</b><small>{d.form} · {d.approved}</small></span><span>{d.doses.length} {d.doses.length === 1 ? "dose" : "doses"} <ArrowUpRight size={17}/></span></button>)}</div>
  </div>
  <p className="method-note">Scope: branded FDA-approved weight-management GLP-1 receptor agonists and tirzepatide (dual GIP/GLP-1), through {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${PRICE_OBSERVED_ON}T00:00:00Z`))}. Diabetes-only brands and compounded products are excluded. Wegovy injection and HD are shown separately to make the new 7.2 mg presentation visible; they share semaglutide and the Wegovy brand. Pricing, where shown, is a manufacturer self-pay offer for a specified dose/channel, not list or net price. The 3D objects are stylized illustrations, not product photographs.</p>
  </section>
 );
 const approvedMarket = (
<><section id="compare" className="comparison"><div className="compare-heading"><div className="eyebrow">DETAILED PRICE LANDSCAPE</div><h2>Explore every recorded offer.</h2><p>Filter by product, dose, and price basis. Injections use 28-day supplies; tablets use 30-day supplies. These are not clinical equivalents. Announcements and observed snapshots are distinguished from dated price changes. Wegovy’s predecessor baseline has an unverified start date.</p></div><PriceLandscape/></section><section className="comparison price-evidence" aria-label="Price-cut analysis"><PriceAnalysis/></section></>
 );
 return <div className="app-shell single-page">
  <UniverseScene selected={selected} dose={dose} drugs={drugs} onSelect={choose} focused={universeFocused} />
  <div className="space-grain" aria-hidden="true" />
  <div className="approval-corner">U.S. FDA APPROVALS · SEP 2026</div>
  <section id="policy" className="page-policy-section" aria-label="Policy story">
    <PolicyStory productUniverse={productUniverse} approvedMarket={approvedMarket} priceEvidence={priceEvidence} />
  </section>
  <div className="page-caveat-section"><PolicyCaveat /></div>
  <footer className="site-footer"><span>RESEARCH & DESIGN · ARACELI VARGAS</span><span>PRODUCT INFORMATION ONLY · NOT MEDICAL ADVICE</span></footer>
  {chartExpanded&&displayedPrice&&<dialog ref={expandedDialogRef} className="chart-modal-backdrop" onCancel={()=>setChartExpanded(false)} onKeyDown={event=>{if(event.key==="Escape")setChartExpanded(false)}} onClose={()=>setChartExpanded(false)} onClick={event=>{if(event.target===event.currentTarget)setChartExpanded(false)}}><section className="chart-modal" role="dialog" aria-modal="true" aria-labelledby="expanded-chart-title" onClick={event=>event.stopPropagation()}><div className="chart-modal-heading"><div><span className="panel-kicker">PRICE HISTORY · {item.name.toUpperCase()} · {dose} MG · {priceDevice.toUpperCase()}</span><h2 id="expanded-chart-title">{displayedPrice.headline}<small> USD / {displayedPrice.periodDays}-day supply</small></h2></div><button type="button" onClick={()=>setChartExpanded(false)} aria-label="Close expanded chart"><X size={20}/></button></div><PriceHistoryContent price={displayedPrice} productId={item.id} dose={dose||item.doses[item.doses.length-1]} device={priceDevice} color={selectedAccent} expanded/></section></dialog>}
 </div>
}
