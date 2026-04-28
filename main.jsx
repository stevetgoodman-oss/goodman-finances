import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { Upload, Plus, Trash2, Wallet, Target, TrendingUp, LogOut, Smartphone, Cloud, ShieldCheck, Menu, X } from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_BUDGETS = [
  { name: 'Car Insurance', group: 'Insurance & Vehicle', monthlyBudget: 120, keywords: ['car insurance','aami','racv insurance','budget direct'] },
  { name: 'AGL Gas & Electricity', group: 'Utilities', monthlyBudget: 280, keywords: ['agl','gas','electricity'] },
  { name: 'Water', group: 'Utilities', monthlyBudget: 90, keywords: ['south east water','water'] },
  { name: 'Gym', group: 'Health & Fitness', monthlyBudget: 100, keywords: ['gym','fitness first','anytime fitness','derrimut'] },
  { name: 'Phone & Internet', group: 'Utilities', monthlyBudget: 180, keywords: ['telstra','optus','vodafone','aussie broadband','nbn','internet'] },
  { name: 'Home Insurance', group: 'Insurance & Vehicle', monthlyBudget: 180, keywords: ['home insurance','contents insurance'] },
  { name: 'Kids Swimming Lessons', group: 'Kids', monthlyBudget: 180, keywords: ['swim','swimming'] },
  { name: 'Mila Gymnastics', group: 'Kids', monthlyBudget: 100, keywords: ['gymnastics'] },
  { name: 'Mila Acro', group: 'Kids', monthlyBudget: 100, keywords: ['acro'] },
  { name: 'Netflix', group: 'Subscriptions', monthlyBudget: 26, keywords: ['netflix'] },
  { name: 'Amazon', group: 'Subscriptions', monthlyBudget: 10, keywords: ['amazon prime','prime video'] },
  { name: 'Spotify', group: 'Subscriptions', monthlyBudget: 14, keywords: ['spotify'] },
  { name: 'Stronglifts 5x5 App', group: 'Subscriptions', monthlyBudget: 10, keywords: ['stronglifts'] },
  { name: 'DoorDash Subscription', group: 'Subscriptions', monthlyBudget: 13, keywords: ['dashpass','doordash subscription'] },
  { name: 'Hayu', group: 'Subscriptions', monthlyBudget: 8, keywords: ['hayu'] },
  { name: 'Disney', group: 'Subscriptions', monthlyBudget: 15, keywords: ['disney'] },
  { name: 'HBO', group: 'Subscriptions', monthlyBudget: 15, keywords: ['hbo','binge','max'] },
  { name: 'Apple Storage', group: 'Subscriptions', monthlyBudget: 5, keywords: ['apple','icloud'] },
  { name: 'Google Storage', group: 'Subscriptions', monthlyBudget: 5, keywords: ['google storage','google one'] },
  { name: 'Car Rego', group: 'Insurance & Vehicle', monthlyBudget: 80, keywords: ['vicroads','rego','registration'] },
  { name: 'Mila School Fees', group: 'Kids', monthlyBudget: 500, keywords: ['school fees','school'] },
  { name: 'Rates', group: 'Home', monthlyBudget: 250, keywords: ['rates','council'] },
  { name: 'Groceries', group: 'Variable Spending', monthlyBudget: 1200, keywords: ['woolworths','coles','aldi','costco','groceries'] },
  { name: 'Petrol', group: 'Transport', monthlyBudget: 300, keywords: ['shell','bp','caltex','ampol','petrol','fuel','7-eleven'] },
  { name: 'Coffee', group: 'Variable Spending', monthlyBudget: 180, keywords: ['coffee','cafe','café'] },
  { name: 'Takeaway', group: 'Variable Spending', monthlyBudget: 300, keywords: ['ubereats','doordash','mcdonald','kfc','takeaway','pizza'] },
  { name: 'Miscellaneous Kids', group: 'Kids', monthlyBudget: 250, keywords: ['kids','toy','kmart','target'] },
  { name: 'Chemist', group: 'Health & Fitness', monthlyBudget: 120, keywords: ['chemist','chemist warehouse','pharmacy','priceline'] },
  { name: 'Steve Lou Entertainment', group: 'Lifestyle', monthlyBudget: 400, keywords: ['restaurant','cinema','ticketek','bar','entertainment'] },
  { name: 'Mortgage', group: 'Home', monthlyBudget: 6600, keywords: ['mortgage','home loan'] },
  { name: 'ETFs', group: 'Investing / Saving', monthlyBudget: 2500, keywords: ['cmc','vanguard','etf'] },
  { name: 'Savings', group: 'Investing / Saving', monthlyBudget: 1000, keywords: ['savings'] },
  { name: 'Other', group: 'Uncategorised', monthlyBudget: 0, keywords: [] },
];

function currency(n) { return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(Number(n || 0)); }
function monthKey(date) { return (date || '').slice(0, 7); }
function norm(s) { return (s || '').toLowerCase(); }
function autoCategory(description, budgets) { const d = norm(description); for (const b of budgets) if ((b.keywords || []).some(k => d.includes(norm(k)))) return b.name; return 'Other'; }
function parseDate(value) { if (!value) return new Date().toISOString().slice(0,10); const s = String(value).trim(); const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; } const d = new Date(s); return isNaN(d) ? new Date().toISOString().slice(0,10) : d.toISOString().slice(0,10); }

function Auth({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signIn');
  const [message, setMessage] = useState('');

  if (!supabase) return <div className="auth"><div className="authCard"><h1>Goodman Finances Inc.</h1><p>This version is built for phone use and shared login. Add your Supabase URL and anon key to <code>.env</code>, then deploy to Vercel.</p><p className="pill"><Smartphone size={16}/> Mobile-first PWA ready</p></div></div>;

  async function submit(e) {
    e.preventDefault(); setMessage('');
    const fn = mode === 'signIn' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
    const { data, error } = await fn({ email, password });
    if (error) setMessage(error.message); else { setMessage(mode === 'signUp' ? 'Account created. Check email confirmation if enabled.' : 'Signed in.'); if (data.session) onAuthed(data.session); }
  }

  return <div className="auth"><div className="authCard"><h1>Goodman Finances Inc.</h1><p>Shared household budget for Steve & Lou.</p><form onSubmit={submit} className="form"><input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/><button>{mode === 'signIn' ? 'Sign in' : 'Create account'}</button></form><button className="linkBtn" onClick={()=>setMode(mode==='signIn'?'signUp':'signIn')}>{mode === 'signIn' ? 'Create an account' : 'Already have an account? Sign in'}</button>{message && <p className="message">{message}</p>}<div className="trust"><span><ShieldCheck size={16}/> Email/password</span><span><Cloud size={16}/> Shared cloud sync</span></div></div></div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [householdId, setHouseholdId] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7));
  const [newTx, setNewTx] = useState({ date: new Date().toISOString().slice(0,10), description: '', amount: '', category: 'Other', type: 'expense' });
  const [importPreview, setImportPreview] = useState([]);
  const [view, setView] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!supabase) { setLoading(false); return; } supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); }); const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s)); return () => sub.subscription.unsubscribe(); }, []);
  useEffect(() => { if (session) initialise(); }, [session]);

  async function initialise() {
    setLoading(true);
    const userId = session.user.id;
    let { data: member } = await supabase.from('household_members').select('household_id').eq('user_id', userId).limit(1).maybeSingle();
    let hId = member?.household_id;
    if (!hId) {
      const { data: h, error: hErr } = await supabase.from('households').insert({ name: 'Goodman Household', created_by: userId }).select().single();
      if (hErr) { alert(hErr.message); setLoading(false); return; }
      hId = h.id;
      await supabase.from('household_members').insert({ household_id: hId, user_id: userId, role: 'owner' });
      await supabase.from('budgets').insert(DEFAULT_BUDGETS.map(b => ({ household_id: hId, name: b.name, category_group: b.group, monthly_budget: b.monthlyBudget, keywords: b.keywords })));
    }
    setHouseholdId(hId); await loadData(hId); setLoading(false);
  }

  async function loadData(hId = householdId) {
    const [{ data: b }, { data: t }] = await Promise.all([
      supabase.from('budgets').select('*').eq('household_id', hId).order('category_group'),
      supabase.from('transactions').select('*').eq('household_id', hId).order('tx_date', { ascending: false })
    ]);
    setBudgets((b || []).map(x => ({ id:x.id, name:x.name, group:x.category_group, monthlyBudget:Number(x.monthly_budget), keywords:x.keywords || [] })));
    setTransactions((t || []).map(x => ({ id:x.id, date:x.tx_date, description:x.description, amount:Number(x.amount), category:x.category, type:x.tx_type, source:x.source })));
  }

  const categories = useMemo(() => ['Salary','Bonus','Other Income', ...budgets.map(b => b.name)], [budgets]);
  const monthly = useMemo(() => transactions.filter(t => monthKey(t.date) === selectedMonth), [transactions, selectedMonth]);
  const income = monthly.filter(t => t.type === 'income' || t.amount > 0).reduce((a,t)=>a+Number(t.amount),0);
  const expenses = Math.abs(monthly.filter(t => (t.type === 'expense' || t.amount < 0) && !['ETFs','Savings'].includes(t.category)).reduce((a,t)=>a+Number(t.amount),0));
  const investing = Math.abs(monthly.filter(t => ['ETFs','Savings'].includes(t.category)).reduce((a,t)=>a+Number(t.amount),0));
  const surplus = income - expenses - investing;
  const monthlyBudget = budgets.filter(b => b.group !== 'Investing / Saving').reduce((a,b)=>a+Number(b.monthlyBudget || 0),0);
  const spendVsBudget = expenses - monthlyBudget;
  const categoryRows = useMemo(() => budgets.map(b => { const spent = Math.abs(monthly.filter(t => t.category === b.name && (t.amount < 0 || t.type === 'expense')).reduce((a,t)=>a+Number(t.amount),0)); return { ...b, spent, remaining: Number(b.monthlyBudget || 0) - spent }; }).sort((a,b)=> b.spent - a.spent), [budgets, monthly]);

  async function addTransaction() {
    if (!newTx.description || !newTx.amount) return;
    const amount = Math.abs(Number(newTx.amount)) * (newTx.type === 'expense' ? -1 : 1);
    const row = { household_id: householdId, tx_date: newTx.date, description: newTx.description, amount, category: newTx.category, tx_type: newTx.type, source: 'manual', created_by: session.user.id };
    const { error } = await supabase.from('transactions').insert(row);
    if (error) alert(error.message); else { setNewTx({ date: new Date().toISOString().slice(0,10), description: '', amount: '', category: 'Other', type: 'expense' }); loadData(); }
  }
  async function updateBudget(row, monthlyBudget) { setBudgets(budgets.map(b => b.id === row.id ? {...b, monthlyBudget} : b)); await supabase.from('budgets').update({ monthly_budget: monthlyBudget }).eq('id', row.id); }
  async function updateTxCategory(id, category) { setTransactions(transactions.map(t => t.id === id ? {...t, category} : t)); await supabase.from('transactions').update({ category }).eq('id', id); }
  async function deleteTx(id) { await supabase.from('transactions').delete().eq('id', id); loadData(); }

  function handleCsv(file) {
    if (!file) return;
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: (res) => {
      const rows = res.data.map(r => { const keys = Object.keys(r); const dateKey = keys.find(k => /date/i.test(k)) || keys[0]; const descKey = keys.find(k => /description|transaction|details|narrative/i.test(k)) || keys[1]; const amountKey = keys.find(k => /amount|debit|credit/i.test(k)) || keys[keys.length - 1]; let amount = Number(String(r[amountKey] ?? '0').replace(/[$,]/g,'')); if (Number.isNaN(amount)) amount = 0; const description = r[descKey] || 'Imported transaction'; return { date: parseDate(r[dateKey]), description, amount, category: amount > 0 ? 'Other Income' : autoCategory(description, budgets), type: amount > 0 ? 'income' : 'expense' }; });
      setImportPreview(rows);
    }});
  }
  async function importCsvRows() { const rows = importPreview.map(r => ({ household_id: householdId, tx_date: r.date, description: r.description, amount: r.amount, category: r.category, tx_type: r.type, source: 'cba_csv', created_by: session.user.id })); const { error } = await supabase.from('transactions').insert(rows); if (error) alert(error.message); else { setImportPreview([]); loadData(); } }

  if (loading) return <div className="loading">Loading Goodman Finances Inc…</div>;
  if (!session) return <Auth onAuthed={setSession} />;

  const nav = [['dashboard','Dashboard'],['budgets','Budgets'],['add','Add'],['import','Import'],['transactions','Transactions']];
  return <div className="app"><header className="top"><div><h1>Goodman Finances Inc.</h1><p>Shared household budget — AUD</p></div><button className="menu" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></header>
    <nav className={menuOpen ? 'tabs open' : 'tabs'}>{nav.map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id); setMenuOpen(false)}}>{label}</button>)}<button className="signout" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sign out</button></nav>
    <div className="monthBar"><label>Month</label><input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} /></div>
    {view==='dashboard' && <><section className="cards"><Metric icon={<Target/>} label="Spending vs Budget" value={currency(spendVsBudget)} sub={spendVsBudget <= 0 ? `${currency(Math.abs(spendVsBudget))} under budget` : `${currency(spendVsBudget)} over budget`} danger={spendVsBudget>0}/><Metric icon={<Wallet/>} label="Monthly Surplus" value={currency(surplus)} sub="After spending + savings/investing" danger={surplus<0}/><Metric icon={<TrendingUp/>} label="Income" value={currency(income)} sub="Salary, bonus and other income"/><Metric icon={<Smartphone/>} label="Actual Spend" value={currency(expenses)} sub={`Budget: ${currency(monthlyBudget)}`} danger={expenses>monthlyBudget}/></section><CategoryList rows={categoryRows.slice(0,8)} compact /></>}
    {view==='budgets' && <CategoryList rows={categoryRows} onBudget={updateBudget} />}
    {view==='add' && <section className="panel"><h2>Add Transaction</h2><div className="form"><input type="date" value={newTx.date} onChange={e=>setNewTx({...newTx,date:e.target.value})}/><input placeholder="Description" value={newTx.description} onChange={e=>setNewTx({...newTx,description:e.target.value})}/><input placeholder="Amount" type="number" value={newTx.amount} onChange={e=>setNewTx({...newTx,amount:e.target.value})}/><select value={newTx.type} onChange={e=>setNewTx({...newTx,type:e.target.value})}><option value="expense">Expense</option><option value="income">Income</option></select><select value={newTx.category} onChange={e=>setNewTx({...newTx,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select><button onClick={addTransaction}><Plus size={16}/> Add</button></div></section>}
    {view==='import' && <section className="panel"><h2>CBA CSV Import</h2><p className="muted">Export transactions from NetBank as CSV, then upload here. Auto-categorisation uses your category keywords.</p><label className="upload"><Upload size={18}/> Upload CSV<input type="file" accept=".csv" onChange={e=>handleCsv(e.target.files[0])}/></label>{importPreview.length>0 && <><p>{importPreview.length} transactions ready.</p><button onClick={importCsvRows}>Import transactions</button></>}</section>}
    {view==='transactions' && <section className="panel"><h2>Transactions</h2><div className="txList">{monthly.map(t=><div className="txCard" key={t.id}><div><strong>{t.description}</strong><small>{t.date}</small></div><select value={t.category} onChange={e=>updateTxCategory(t.id, e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><div className={t.amount<0?'bad':'good'}>{currency(t.amount)}</div><button className="icon" onClick={()=>deleteTx(t.id)}><Trash2 size={15}/></button></div>)}</div></section>}
  </div>;
}
function Metric({icon,label,value,sub,danger}) { return <div className={`card ${danger?'danger':''}`}><div className="cardIcon">{icon}</div><div><p>{label}</p><h3>{value}</h3><small>{sub}</small></div></div> }
function CategoryList({ rows, onBudget, compact }) { return <section className="panel"><h2>{compact ? 'Top Categories' : 'Budget Categories'}</h2><div className="catList">{rows.map(r=><div className="catCard" key={r.name}><div><strong>{r.name}</strong><small>{r.group}</small></div>{onBudget ? <input value={r.monthlyBudget} type="number" onChange={e=>onBudget(r, Number(e.target.value))}/> : <span>{currency(r.monthlyBudget)}</span>}<span>{currency(r.spent)}</span><span className={r.remaining<0?'bad':'good'}>{currency(r.remaining)}</span></div>)}</div></section> }

createRoot(document.getElementById('root')).render(<App />);
