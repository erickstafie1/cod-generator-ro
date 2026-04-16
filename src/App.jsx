import { useState, useRef, useEffect } from "react";

const JUDETE = ["Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brăila","Brașov","București","Buzău","Călărași","Caraș-Severin","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați","Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți","Mureș","Neamț","Olt","Prahova","Sălaj","Satu Mare","Sibiu","Suceava","Teleorman","Timiș","Tulcea","Vâlcea","Vaslui","Vrancea"];

// ── TIMER ──
function Timer({ minutes = 14 }) {
  const [s, setS] = useState(minutes * 60);
  useEffect(() => { const t = setInterval(() => setS(x => x > 0 ? x - 1 : 0), 1000); return () => clearInterval(t); }, []);
  const p = n => String(n).padStart(2, "0");
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[[p(Math.floor(s / 60)), "MIN"], [p(s % 60), "SEC"]].map(([v, l], i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "10px 18px", fontSize: 26, fontWeight: 900, fontFamily: "monospace", minWidth: 56 }}>{v}</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 3, letterSpacing: 2 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ── EDITABLE FIELD ──
function E({ val, set, tag = "span", textarea = false, style = {}, em }) {
  if (!em) { const Tag = tag; return <Tag style={style}>{val}</Tag>; }
  const base = { ...style, background: "rgba(99,102,241,0.08)", border: "1.5px dashed #6366f1", borderRadius: 4, outline: "none", fontFamily: "Inter,system-ui,sans-serif", color: "inherit", fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", padding: "2px 6px", width: "100%", boxSizing: "border-box" };
  if (textarea) return <textarea value={val} onChange={e => set(e.target.value)} rows={3} style={{ ...base, resize: "vertical", display: "block" }} />;
  return <input value={val} onChange={e => set(e.target.value)} style={{ ...base, display: "block" }} />;
}

// ── SAFE IMAGE ──
function Img({ src, alt, style }) {
  const [err, setErr] = useState(false);
  if (!src || err) return (
    <div style={{ ...style, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 36 }}>🖼️</span>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>Imagine indisponibilă</span>
    </div>
  );
  return <img src={src} alt={alt || ""} style={{ ...style, objectFit: "cover" }} onError={() => setErr(true)} />;
}

// ── LANDING PAGE ──
function LandingPage({ data, setData, em }) {
  const [order, setOrder] = useState({ nume: "", telefon: "", judet: "", localitate: "", adresa: "", bump: false });
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const formRef = useRef();

  const price = data.price || 149;
  const oldPrice = data.oldPrice || Math.round(price * 1.6);
  const bumpPrice = data.bumpPrice || 29;
  const disc = Math.round((1 - price / oldPrice) * 100);
  const total = price * qty + (order.bump && data.bumpProduct ? bumpPrice : 0);
  const imgs = data.images || [];
  const hero = imgs[0];
  const ctx = imgs.slice(1);

  const upd = k => v => setData(d => ({ ...d, [k]: v }));
  const updB = (i, v) => setData(d => { const b = [...(d.benefits||[])]; b[i]=v; return {...d,benefits:b}; });
  const updT = (i,k,v) => setData(d => { const t=[...(d.testimonials||[])]; t[i]={...t[i],[k]:v}; return {...d,testimonials:t}; });
  const updH = (i,k,v) => setData(d => { const h=[...(d.howItWorks||[])]; h[i]={...h[i],[k]:v}; return {...d,howItWorks:h}; });
  const updF = (i,k,v) => setData(d => { const f=[...(d.faq||[])]; f[i]={...f[i],[k]:v}; return {...d,faq:f}; });

  const inp = { padding:"12px 14px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:15, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"Inter,system-ui,sans-serif" };
  const F = { fontFamily:"'Inter',system-ui,sans-serif", background:"#fff", color:"#111" };
  const imgH = { width:"100%", height:300, display:"block" };

  if (done) return (
    <div style={{...F, padding:"60px 24px", textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>✅</div>
      <h2 style={{color:"#16a34a",fontSize:24,fontWeight:800,margin:"0 0 10px"}}>Comandă plasată!</h2>
      <p style={{color:"#555",fontSize:16,lineHeight:1.7}}>Te vom contacta în maxim <strong>24 ore</strong>.<br/>Plata la livrare — nu plătești nimic acum.</p>
    </div>
  );

  return (
    <div style={F}>
      <div style={{background:"#111",color:"#fff",textAlign:"center",padding:"10px 16px",fontSize:13,fontWeight:600}}>
        🚚 LIVRARE GRATUITĂ peste 200 lei &nbsp;·&nbsp; ☎ 0700 000 000
      </div>
      <div style={{background:"#dc2626",color:"#fff",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:13,fontWeight:700}}>⚡ Doar <strong>{data.stock||7} bucăți</strong> rămase!</div>
        <Timer minutes={data.timerMinutes||14} />
      </div>

      {/* HERO IMAGE */}
      <Img src={hero} alt={data.productName} style={imgH} />

      {/* HEADLINE */}
      <div style={{padding:"24px 20px 16px"}}>
        <div style={{display:"inline-block",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700,marginBottom:12}}>
          OFERTĂ SPECIALĂ · -{disc}% REDUCERE
        </div>
        <E val={data.headline} set={upd("headline")} tag="h1" em={em}
          style={{fontSize:24,fontWeight:900,lineHeight:1.25,margin:"0 0 10px",color:"#111"}} />
        <E val={data.subheadline} set={upd("subheadline")} tag="p" textarea em={em}
          style={{fontSize:15,color:"#555",lineHeight:1.7,margin:"0 0 20px"}} />

        <div style={{background:"#fafafa",border:"1.5px solid #e5e7eb",borderRadius:16,padding:20,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
            <span style={{fontSize:38,fontWeight:900,color:"#dc2626"}}>{(price*qty).toFixed(0)} lei</span>
            <span style={{fontSize:20,color:"#d1d5db",textDecoration:"line-through"}}>{(oldPrice*qty).toFixed(0)} lei</span>
            <span style={{background:"#dc2626",color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:13,fontWeight:800}}>-{disc}%</span>
          </div>
          <p style={{fontSize:13,color:"#9ca3af",margin:"0 0 14px"}}>Include TVA · Plata la livrare (ramburs)</p>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:14,color:"#6b7280",fontWeight:500}}>Cantitate:</span>
            <div style={{display:"flex",alignItems:"center",border:"1.5px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:38,height:38,border:"none",background:"#f9fafb",fontSize:18,cursor:"pointer"}}>−</button>
              <span style={{width:40,textAlign:"center",fontSize:17,fontWeight:800}}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{width:38,height:38,border:"none",background:"#f9fafb",fontSize:18,cursor:"pointer"}}>+</button>
            </div>
          </div>
        </div>

        <button onClick={()=>formRef.current?.scrollIntoView({behavior:"smooth"})}
          style={{width:"100%",padding:16,borderRadius:12,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",border:"none",fontSize:17,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(220,38,38,0.35)"}}>
          🛒 COMANDĂ ACUM — PLATĂ LA LIVRARE
        </button>
        <p style={{fontSize:12,color:"#9ca3af",textAlign:"center",marginTop:8,marginBottom:0}}>Nu plătești nimic acum · Livrare 2–4 zile · Ramburs curier</p>
      </div>

      {/* TRUST */}
      <div style={{background:"#f9fafb",borderTop:"1px solid #f3f4f6",borderBottom:"1px solid #f3f4f6",padding:"16px 20px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[["🔒","Plată securizată","100% sigur"],["🚚","Livrare rapidă","2–4 zile"],["↩️","Retur gratuit","30 de zile"],["⭐","Clienți mulțumiți","4.9/5 stele"]].map(([ic,t,s])=>(
            <div key={t} style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:22}}>{ic}</span>
              <div><div style={{fontSize:13,fontWeight:700}}>{t}</div><div style={{fontSize:12,color:"#9ca3af"}}>{s}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* POZA 1 + BENEFICII 1-3 */}
      <Img src={ctx[0]} alt="produs" style={imgH} />
      <div style={{padding:"24px 20px"}}>
        <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>De ce să alegi {data.productName}?</h2>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(data.benefits||[]).slice(0,3).map((b,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"12px 14px"}}>
              <span style={{color:"#16a34a",fontWeight:900,fontSize:17,flexShrink:0}}>✓</span>
              <E val={b} set={v=>updB(i,v)} em={em} style={{fontSize:14,color:"#166534",lineHeight:1.6}} />
            </div>
          ))}
        </div>
      </div>

      {/* POZA 2 + CUM FUNCTIONEAZA */}
      <Img src={ctx[1]} alt="utilizare" style={imgH} />
      {data.howItWorks?.length > 0 && (
        <div style={{padding:"24px 20px"}}>
          <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 18px"}}>Cum funcționează?</h2>
          {data.howItWorks.map((step,i)=>(
            <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:16}}>
              <div style={{minWidth:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,flexShrink:0}}>{i+1}</div>
              <div style={{paddingTop:4}}>
                <E val={step.title} set={v=>updH(i,"title",v)} em={em} style={{fontSize:15,fontWeight:700,display:"block",marginBottom:3}} tag="strong" />
                <E val={step.desc} set={v=>updH(i,"desc",v)} em={em} style={{fontSize:13,color:"#6b7280",lineHeight:1.6}} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POZA 3 + BENEFICII 4-6 */}
      <Img src={ctx[2]} alt="rezultat" style={imgH} />
      {(data.benefits||[]).length > 3 && (
        <div style={{padding:"24px 20px"}}>
          <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>Mai multe motive să comanzi azi</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {(data.benefits||[]).slice(3).map((b,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"12px 14px"}}>
                <span style={{color:"#16a34a",fontWeight:900,fontSize:17,flexShrink:0}}>✓</span>
                <E val={b} set={v=>updB(i+3,v)} em={em} style={{fontSize:14,color:"#166534",lineHeight:1.6}} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POZA 4 + TESTIMONIALE */}
      <Img src={ctx[3]} alt="clienti" style={imgH} />
      {data.testimonials?.length > 0 && (
        <div style={{background:"#f9fafb",borderTop:"1px solid #f3f4f6",padding:"24px 20px"}}>
          <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 6px"}}>Ce spun clienții noștri</h2>
          <p style={{fontSize:13,color:"#9ca3af",marginBottom:18,marginTop:0}}>Peste {(data.reviewCount||1200).toLocaleString()} recenzii ⭐⭐⭐⭐⭐</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {data.testimonials.map((t,i)=>(
              <div key={i} style={{background:"#fff",border:"1px solid #f3f4f6",borderRadius:14,padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#fecaca,#fca5a5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#dc2626"}}>{t.name?.charAt(0)}</div>
                    <div>
                      <E val={t.name} set={v=>updT(i,"name",v)} em={em} style={{fontSize:14,fontWeight:700,display:"block"}} tag="strong" />
                      <E val={t.city} set={v=>updT(i,"city",v)} em={em} style={{fontSize:12,color:"#9ca3af"}} />
                    </div>
                  </div>
                  <span style={{color:"#fbbf24",fontSize:16}}>{"★".repeat(t.stars||5)}</span>
                </div>
                <E val={t.text} set={v=>updT(i,"text",v)} em={em} textarea style={{fontSize:14,color:"#374151",lineHeight:1.6,margin:0}} tag="p" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {data.faq?.length > 0 && (
        <div style={{padding:"24px 20px"}}>
          <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 16px"}}>Întrebări frecvente</h2>
          {data.faq.map((item,i)=>(
            <details key={i} style={{marginBottom:10,border:"1.5px solid #f3f4f6",borderRadius:12,overflow:"hidden"}}>
              <summary style={{padding:"14px 16px",fontSize:14,fontWeight:700,cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fafafa"}}>
                <E val={item.q} set={v=>updF(i,"q",v)} em={em} style={{fontSize:14,fontWeight:700}} />
                <span style={{color:"#dc2626",fontSize:20,marginLeft:12,flexShrink:0}}>+</span>
              </summary>
              <div style={{padding:"12px 16px"}}>
                <E val={item.a} set={v=>updF(i,"a",v)} em={em} textarea style={{fontSize:14,color:"#6b7280",lineHeight:1.7}} tag="p" />
              </div>
            </details>
          ))}
        </div>
      )}

      {/* COD FORM */}
      <div ref={formRef} style={{background:"linear-gradient(180deg,#fef2f2,#fff)",borderTop:"3px solid #dc2626",padding:"24px 20px"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <p style={{fontSize:13,fontWeight:700,color:"#dc2626",margin:"0 0 8px"}}>⏰ Oferta expiră în curând:</p>
          <Timer minutes={data.timerMinutes||14} />
        </div>
        <h2 style={{fontSize:22,fontWeight:900,margin:"0 0 6px"}}>Comandă acum — Plată la livrare</h2>
        <p style={{fontSize:14,color:"#6b7280",margin:"0 0 20px",lineHeight:1.6}}>Nu plătești nimic acum — curierul îți aduce produsul și plătești la ușă.</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input placeholder="Nume și prenume *" value={order.nume} onChange={e=>setOrder(o=>({...o,nume:e.target.value}))} style={inp} />
          <input placeholder="Număr de telefon *" value={order.telefon} onChange={e=>setOrder(o=>({...o,telefon:e.target.value}))} style={inp} />
          <select value={order.judet} onChange={e=>setOrder(o=>({...o,judet:e.target.value}))} style={{...inp,color:order.judet?"#111":"#9ca3af"}}>
            <option value="">Selectează județul *</option>
            {JUDETE.map(j=><option key={j} value={j}>{j}</option>)}
          </select>
          <input placeholder="Localitatea *" value={order.localitate} onChange={e=>setOrder(o=>({...o,localitate:e.target.value}))} style={inp} />
          <textarea placeholder="Strada, număr, bloc, apartament *" value={order.adresa} onChange={e=>setOrder(o=>({...o,adresa:e.target.value}))} rows={2} style={{...inp,resize:"none"}} />
          {data.bumpProduct && (
            <label style={{display:"flex",gap:12,alignItems:"flex-start",background:"#fffbeb",border:"2px dashed #fcd34d",borderRadius:12,padding:"14px 16px",cursor:"pointer"}}>
              <input type="checkbox" checked={order.bump} onChange={e=>setOrder(o=>({...o,bump:e.target.checked}))} style={{marginTop:3,accentColor:"#dc2626",width:18,height:18}} />
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#92400e",marginBottom:3}}>DA! Adaugă și {data.bumpProduct}</div>
                <div style={{fontSize:13,color:"#b45309"}}>Doar +{bumpPrice} lei — ofertă exclusivă</div>
              </div>
            </label>
          )}
          <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:14,padding:16,fontSize:14}}>
            <div style={{fontWeight:700,fontSize:12,color:"#9ca3af",marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Sumar comandă</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,color:"#374151"}}>
              <span>{data.productName} ×{qty}</span><span style={{fontWeight:600}}>{(price*qty).toFixed(0)} lei</span>
            </div>
            {order.bump && data.bumpProduct && (
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,color:"#374151"}}>
                <span>{data.bumpProduct}</span><span style={{fontWeight:600}}>{bumpPrice} lei</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,color:"#374151"}}>
              <span>Livrare</span><span style={{color:"#16a34a",fontWeight:700}}>GRATUITĂ</span>
            </div>
            <div style={{borderTop:"1.5px solid #f3f4f6",paddingTop:10,display:"flex",justifyContent:"space-between",fontWeight:900,fontSize:18}}>
              <span>Total la livrare</span><span style={{color:"#dc2626"}}>{total.toFixed(0)} lei</span>
            </div>
          </div>
          <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#15803d",display:"flex",gap:8,alignItems:"center"}}>
            <span>🔒</span><span>Plata se face <strong>doar la livrare</strong>. Datele tale sunt în siguranță.</span>
          </div>
          <button onClick={()=>{
            if(!order.nume||!order.telefon||!order.judet||!order.adresa){alert("Completează toate câmpurile *");return;}
            setDone(true);
          }} style={{padding:17,borderRadius:14,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",border:"none",fontSize:18,fontWeight:900,cursor:"pointer",boxShadow:"0 6px 20px rgba(220,38,38,0.4)"}}>
            🛒 FINALIZEAZĂ — {total.toFixed(0)} LEI LA LIVRARE
          </button>
          <p style={{fontSize:12,color:"#9ca3af",textAlign:"center",margin:0}}>Prin plasarea comenzii ești de acord cu T&C</p>
        </div>
      </div>
      <div style={{background:"#111",color:"#6b7280",padding:"20px",textAlign:"center",fontSize:12}}>
        <p style={{margin:"0 0 4px",color:"#9ca3af",fontWeight:600}}>© 2025 {data.productName}</p>
        <p style={{margin:0}}>Termeni · Confidențialitate · ANPC</p>
      </div>
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [screen, setScreen] = useState("input");
  const [aliUrl, setAliUrl] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const [loadPct, setLoadPct] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [em, setEm] = useState(false);
  const [error, setError] = useState("");

  // Detecteaza URL-ul backend-ului automat
  // In dev: localhost:3000, in productie: acelasi domeniu Vercel
  const API_URL = "/api/generate";

  async function generate() {
    if (!aliUrl.trim()) return;
    setScreen("loading"); setError(""); setLoadPct(5);

    const steps = [
      [10, "🔍 Accesez pagina AliExpress..."],
      [35, "🖼️ Extrag pozele produsului..."],
      [60, "✍️ Generez copywriting în română..."],
      [80, "📦 Construiesc pagina COD..."],
      [95, "✅ Finalizez..."],
    ];
    let si = 0;
    setLoadMsg(steps[0][1]);
    const tid = setInterval(() => {
      si = Math.min(si + 1, steps.length - 1);
      setLoadMsg(steps[si][1]);
      setLoadPct(steps[si][0]);
    }, 2800);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliUrl: aliUrl.trim() })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const { data } = await res.json();
      setPageData(data);
      setLoadPct(100);
      setTimeout(() => setScreen("result"), 400);
    } catch (e) {
      console.error(e);
      setError(e.message || "Eroare la generare. Verifică linkul și încearcă din nou.");
      setScreen("input");
    }
    clearInterval(tid);
  }

  // ── LOADING ──
  if (screen === "loading") return (
    <div style={{maxWidth:440,margin:"0 auto",padding:"64px 24px",textAlign:"center",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#dc2626,#b91c1c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 24px",boxShadow:"0 8px 24px rgba(220,38,38,0.3)"}}>🤖</div>
      <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 8px"}}>Se generează pagina ta...</h2>
      <p style={{color:"#6b7280",fontSize:15,margin:"0 0 32px",lineHeight:1.6}}>{loadMsg}</p>
      <div style={{background:"#f3f4f6",borderRadius:100,height:10,overflow:"hidden"}}>
        <div style={{height:"100%",background:"linear-gradient(90deg,#dc2626,#f87171)",borderRadius:100,width:`${loadPct}%`,transition:"width 0.8s ease"}} />
      </div>
      <p style={{fontSize:13,color:"#9ca3af",marginTop:10}}>{loadPct}%</p>
    </div>
  );

  // ── RESULT ──
  if (screen === "result" && pageData) return (
    <div style={{maxWidth:640,margin:"0 auto",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #f3f4f6",background:"#fff",position:"sticky",top:0,zIndex:20,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
        <button onClick={()=>setScreen("input")} style={{fontSize:13,color:"#6b7280",background:"none",border:"none",cursor:"pointer",padding:"6px 10px",borderRadius:8}}>← Înapoi</button>
        <span style={{flex:1,fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pageData.productName}</span>
        <button onClick={()=>setEm(e=>!e)}
          style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${em?"#6366f1":"#e5e7eb"}`,background:em?"#eef2ff":"transparent",color:em?"#4f46e5":"#374151",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          {em?"✏️ Editare ON":"✏️ Editează"}
        </button>
        <button style={{padding:"7px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(220,38,38,0.3)"}}>
          🚀 Publică
        </button>
      </div>
      {em && (
        <div style={{padding:"10px 20px",background:"#eef2ff",borderBottom:"1px solid #c7d2fe",display:"flex",gap:8,alignItems:"center",fontSize:13,color:"#4338ca",fontWeight:500}}>
          ✏️ Modul editare activ — click pe orice text pentru a-l modifica direct
        </div>
      )}
      <div style={{border:"1px solid #f3f4f6",borderRadius:16,overflow:"hidden",margin:16,boxShadow:"0 2px 16px rgba(0,0,0,0.06)"}}>
        <LandingPage data={pageData} setData={setPageData} em={em} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 16px 28px"}}>
        <button onClick={generate} style={{padding:12,borderRadius:12,border:"1px solid #e5e7eb",background:"#fff",fontSize:14,cursor:"pointer",fontWeight:600}}>
          🔄 Regenerează
        </button>
        <button style={{padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(220,38,38,0.3)"}}>
          🚀 Publică pagina
        </button>
      </div>
    </div>
  );

  // ── INPUT ──
  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"40px 20px",fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#dc2626,#b91c1c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(220,38,38,0.28)"}}>🛒</div>
        <h1 style={{fontSize:30,fontWeight:900,margin:"0 0 8px",lineHeight:1.2}}>Generator COD România</h1>
        <p style={{color:"#6b7280",fontSize:15,margin:0,lineHeight:1.6}}>Pune linkul AliExpress — generăm pagina completă cu pozele reale ale produsului.</p>
      </div>

      <div style={{background:"#fff",border:"1px solid #f3f4f6",borderRadius:20,padding:28,boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>
        <label style={{fontSize:13,fontWeight:700,color:"#374151",display:"block",marginBottom:10}}>
          Link produs AliExpress
        </label>
        <input
          value={aliUrl}
          onChange={e=>setAliUrl(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&aliUrl.trim()&&generate()}
          placeholder="https://www.aliexpress.com/item/..."
          style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1.5px solid #e5e7eb",fontSize:15,boxSizing:"border-box",outline:"none",fontFamily:"inherit",transition:"border 0.2s"}}
          onFocus={e=>e.target.style.borderColor="#dc2626"}
          onBlur={e=>e.target.style.borderColor="#e5e7eb"}
        />
        <p style={{fontSize:12,color:"#9ca3af",margin:"8px 0 0",lineHeight:1.6}}>
          Serverul nostru accesează pagina AliExpress, extrage pozele reale și generează tot copywriting-ul în română.
        </p>

        {error && (
          <div style={{marginTop:14,padding:"12px 16px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,fontSize:13,color:"#dc2626",fontWeight:500}}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={generate} disabled={!aliUrl.trim()}
          style={{width:"100%",marginTop:20,padding:16,borderRadius:12,background:aliUrl.trim()?"linear-gradient(135deg,#dc2626,#b91c1c)":"#e5e7eb",color:aliUrl.trim()?"#fff":"#9ca3af",border:"none",fontSize:16,fontWeight:800,cursor:aliUrl.trim()?"pointer":"not-allowed",boxShadow:aliUrl.trim()?"0 4px 16px rgba(220,38,38,0.35)":"none",transition:"all 0.2s"}}>
          Generează pagina de vânzare →
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
        {[
          ["🖼️","Poze reale AliExpress","Extrase direct de pe pagina produsului"],
          ["✍️","Copy în română","Titlu, beneficii, FAQ, testimoniale COD"],
          ["✏️","Editor inline","Modifici orice text direct pe pagină"],
          ["🚀","Publică instant","URL propriu gata de reclame Facebook"]
        ].map(([ic,t,d])=>(
          <div key={t} style={{background:"#f9fafb",borderRadius:14,padding:16,border:"1px solid #f3f4f6"}}>
            <div style={{fontSize:26,marginBottom:8}}>{ic}</div>
            <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{t}</div>
            <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:24,padding:"16px 20px",background:"#f9fafb",borderRadius:14,border:"1px solid #f3f4f6",fontSize:13,color:"#6b7280",lineHeight:1.7}}>
        <strong style={{color:"#374151"}}>Cum funcționează:</strong><br/>
        1. Pui linkul AliExpress<br/>
        2. Serverul Vercel accesează pagina și extrage pozele<br/>
        3. Claude generează tot copywriting-ul în română<br/>
        4. Pagina COD completă apare în ~15 secunde
      </div>
    </div>
  );
}
