import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Plus, Trash2, Filter, Download, Image as ImageIcon, Database, BarChart3, Search, Pencil, Save, X, Trophy, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bet-screenshot-tracker-v1";

const sports = ["All", "NBA", "NFL", "MLB", "NHL", "Soccer", "Tennis", "Golf", "UFC", "NCAAF", "NCAAB", "Other"];
const betTypes = ["All", "Moneyline", "Spread", "Total / Goals", "Player Prop", "Parlay", "Same Game Parlay", "Future", "Other"];
const statuses = ["All", "Open", "Won", "Lost", "Push", "Void"];

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const starterBets = [
  {
    id: makeId(),
    createdAt: new Date().toISOString(),
    screenshotName: "sample_robinhood_bet.png",
    screenshotDataUrl: "",
    sportsbook: "Robinhood",
    sport: "NBA",
    betType: "Spread",
    event: "Lakers vs Suns",
    selection: "Lakers +4.5",
    wagerCost: 25,
    potentialPayout: 47.73,
    actualPayout: 47.73,
    status: "Won",
    notes: "Sample row — replace with real screenshot data."
  },
  {
    id: makeId(),
    createdAt: new Date().toISOString(),
    screenshotName: "sample_parlay.png",
    screenshotDataUrl: "",
    sportsbook: "Robinhood",
    sport: "NFL",
    betType: "Parlay",
    event: "Weekend slate",
    selection: "3-leg parlay",
    wagerCost: 10,
    potentialPayout: 82.5,
    actualPayout: 0,
    status: "Lost",
    notes: "Use actual payout only after settled."
  }
];

function currency(value) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function percent(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function emptyForm() {
  return {
    screenshotName: "",
    screenshotDataUrl: "",
    sportsbook: "Robinhood",
    sport: "NBA",
    betType: "Moneyline",
    event: "",
    selection: "",
    wagerCost: "",
    potentialPayout: "",
    actualPayout: "",
    status: "Open",
    notes: ""
  };
}

export default function App() {
  const [bets, setBets] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [filters, setFilters] = useState({ sport: "All", betType: "All", status: "All", search: "" });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBets(JSON.parse(stored));
      } catch {
        setBets(starterBets);
      }
    } else {
      setBets(starterBets);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  }, [bets]);

  const filteredBets = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return bets.filter((bet) => {
      const sportOk = filters.sport === "All" || bet.sport === filters.sport;
      const typeOk = filters.betType === "All" || bet.betType === filters.betType;
      const statusOk = filters.status === "All" || bet.status === filters.status;
      const searchOk = !q || [bet.event, bet.selection, bet.notes, bet.screenshotName, bet.sportsbook]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
      return sportOk && typeOk && statusOk && searchOk;
    });
  }, [bets, filters]);

  const summary = useMemo(() => {
    const totalCost = filteredBets.reduce((sum, b) => sum + Number(b.wagerCost || 0), 0);
    const potential = filteredBets.reduce((sum, b) => sum + Number(b.potentialPayout || 0), 0);
    const actual = filteredBets.reduce((sum, b) => sum + Number(b.actualPayout || 0), 0);
    const settled = filteredBets.filter((b) => ["Won", "Lost", "Push", "Void"].includes(b.status));
    const wins = filteredBets.filter((b) => b.status === "Won").length;
    const net = actual - totalCost;
    const roi = totalCost > 0 ? (net / totalCost) * 100 : NaN;
    return { totalCost, potential, actual, net, roi, count: filteredBets.length, settled: settled.length, wins };
  }, [filteredBets]);

  const groupedByType = useMemo(() => {
    const rows = {};
    filteredBets.forEach((bet) => {
      const key = bet.betType || "Other";
      if (!rows[key]) rows[key] = { betType: key, cost: 0, actual: 0, count: 0 };
      rows[key].cost += Number(bet.wagerCost || 0);
      rows[key].actual += Number(bet.actualPayout || 0);
      rows[key].count += 1;
    });
    return Object.values(rows).sort((a, b) => b.cost - a.cost);
  }, [filteredBets]);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, screenshotName: file.name, screenshotDataUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function addBet() {
    const newBet = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      ...form,
      wagerCost: Number(form.wagerCost || 0),
      potentialPayout: Number(form.potentialPayout || 0),
      actualPayout: Number(form.actualPayout || 0)
    };
    setBets((prev) => [newBet, ...prev]);
    setForm(emptyForm());
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeBet(id) {
    setBets((prev) => prev.filter((bet) => bet.id !== id));
  }

  function startEdit(bet) {
    setEditingId(bet.id);
    setDraft({ ...bet });
  }

  function saveEdit() {
    setBets((prev) => prev.map((bet) => bet.id === editingId ? {
      ...draft,
      wagerCost: Number(draft.wagerCost || 0),
      potentialPayout: Number(draft.potentialPayout || 0),
      actualPayout: Number(draft.actualPayout || 0)
    } : bet));
    setEditingId(null);
    setDraft(null);
  }

  function exportCsv() {
    const headers = ["createdAt", "sportsbook", "sport", "betType", "event", "selection", "wagerCost", "potentialPayout", "actualPayout", "status", "screenshotName", "notes"];
    const rows = filteredBets.map((bet) => headers.map((header) => `"${String(bet[header] ?? "").replaceAll('"', '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bet-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetDemo() {
    setBets(starterBets.map((b) => ({ ...b, id: makeId(), createdAt: new Date().toISOString() })));
    setFilters({ sport: "All", betType: "All", status: "All", search: "" });
  }

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
              <Database className="h-3.5 w-3.5" /> Local screenshot database prototype
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Robinhood Bet Report Builder</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Upload bet screenshots, enter the extracted details, build a local database, and shape a report showing wager cost versus payouts. This prototype stores data in your browser using localStorage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportCsv} className="rounded-2xl bg-white text-slate-950 hover:bg-slate-100">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={resetDemo} variant="secondary" className="rounded-2xl bg-white/10 text-white hover:bg-white/20">
              Reset demo
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Upload + Add Bet</h2>
                  <p className="text-sm text-slate-500">Use the screenshot as the source image, then enter or correct the fields.</p>
                </div>
                <Upload className="h-6 w-6 text-slate-400" />
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                {form.screenshotDataUrl ? (
                  <div className="space-y-3">
                    <img src={form.screenshotDataUrl} alt="Uploaded bet screenshot" className="mx-auto max-h-60 rounded-2xl object-contain shadow-sm" />
                    <p className="truncate text-xs text-slate-500">{form.screenshotName}</p>
                  </div>
                ) : (
                  <div className="space-y-3 py-8">
                    <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="text-sm font-medium">Drop-in area placeholder</p>
                    <p className="text-xs text-slate-500">Click below to choose a Robinhood bet screenshot.</p>
                  </div>
                )}
                <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="mt-3 rounded-2xl">
                  Choose screenshot
                </Button>
              </div>

              <div className="rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                OCR note: this starter app previews screenshots and lets you manually enter fields. The production version can add OCR extraction later.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Sport" labelClass={labelClass}>
                  <select className={inputClass} value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
                    {sports.filter((s) => s !== "All").map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Bet type" labelClass={labelClass}>
                  <select className={inputClass} value={form.betType} onChange={(e) => setForm({ ...form, betType: e.target.value })}>
                    {betTypes.filter((b) => b !== "All").map((b) => <option key={b}>{b}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Event" labelClass={labelClass}><input className={inputClass} value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} placeholder="Team A vs Team B" /></Field>
              <Field label="Selection" labelClass={labelClass}><input className={inputClass} value={form.selection} onChange={(e) => setForm({ ...form, selection: e.target.value })} placeholder="Example: Over 2.5 goals, Celtics ML, +7.5 spread" /></Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Cost" labelClass={labelClass}><input className={inputClass} type="number" min="0" step="0.01" value={form.wagerCost} onChange={(e) => setForm({ ...form, wagerCost: e.target.value })} placeholder="25" /></Field>
                <Field label="Potential" labelClass={labelClass}><input className={inputClass} type="number" min="0" step="0.01" value={form.potentialPayout} onChange={(e) => setForm({ ...form, potentialPayout: e.target.value })} placeholder="47.73" /></Field>
                <Field label="Actual" labelClass={labelClass}><input className={inputClass} type="number" min="0" step="0.01" value={form.actualPayout} onChange={(e) => setForm({ ...form, actualPayout: e.target.value })} placeholder="0" /></Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Status" labelClass={labelClass}>
                  <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {statuses.filter((s) => s !== "All").map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Sportsbook" labelClass={labelClass}><input className={inputClass} value={form.sportsbook} onChange={(e) => setForm({ ...form, sportsbook: e.target.value })} /></Field>
              </div>

              <Field label="Notes" labelClass={labelClass}><textarea className={`${inputClass} min-h-20`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Line movement, cash-out, context, etc." /></Field>

              <Button onClick={addBet} className="w-full rounded-2xl bg-slate-950 hover:bg-slate-800">
                <Plus className="mr-2 h-4 w-4" /> Add to database
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric icon={<DollarSign className="h-5 w-5" />} label="Total cost" value={currency(summary.totalCost)} sub={`${summary.count} filtered bets`} />
              <Metric icon={<Trophy className="h-5 w-5" />} label="Actual payouts" value={currency(summary.actual)} sub={`${summary.wins} wins / ${summary.settled} settled`} />
              <Metric icon={<BarChart3 className="h-5 w-5" />} label="Net" value={currency(summary.net)} sub="Actual payout minus cost" tone={summary.net >= 0 ? "good" : "bad"} />
              <Metric icon={<BarChart3 className="h-5 w-5" />} label="ROI" value={percent(summary.roi)} sub="Net divided by cost" tone={Number.isFinite(summary.roi) && summary.roi >= 0 ? "good" : "bad"} />
            </div>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold"><Filter className="h-5 w-5" /> Report filters</h2>
                    <p className="text-sm text-slate-500">Filter performance by sport, bet type, status, or keyword.</p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input className={`${inputClass} pl-9`} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search event, selection, notes..." />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select className={inputClass} value={filters.sport} onChange={(e) => setFilters({ ...filters, sport: e.target.value })}>{sports.map((s) => <option key={s}>{s}</option>)}</select>
                  <select className={inputClass} value={filters.betType} onChange={(e) => setFilters({ ...filters, betType: e.target.value })}>{betTypes.map((b) => <option key={b}>{b}</option>)}</select>
                  <select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="p-5">
                <h2 className="mb-3 text-xl font-bold">Cost vs payout by bet type</h2>
                <div className="space-y-3">
                  {groupedByType.length === 0 ? <p className="text-sm text-slate-500">No rows match the filters.</p> : groupedByType.map((row) => {
                    const max = Math.max(row.cost, row.actual, 1);
                    return (
                      <div key={row.betType} className="rounded-2xl border border-slate-100 p-3">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold">{row.betType}</span>
                          <span className="text-slate-500">{row.count} bets</span>
                        </div>
                        <div className="space-y-2">
                          <Bar label="Cost" value={row.cost} max={max} color="bg-slate-900" />
                          <Bar label="Actual payout" value={row.actual} max={max} color="bg-emerald-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="text-xl font-bold">Bet database</h2>
                  <p className="text-sm text-slate-500">Edit rows as you refine what the final report should show.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Screenshot</th><th className="px-4 py-3">Sport</th><th className="px-4 py-3">Bet type</th><th className="px-4 py-3">Event / Selection</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Potential</th><th className="px-4 py-3">Actual</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBets.map((bet) => {
                        const isEdit = editingId === bet.id;
                        const active = isEdit ? draft : bet;
                        return (
                          <tr key={bet.id} className="align-top hover:bg-slate-50/60">
                            <td className="px-4 py-3">
                              {active.screenshotDataUrl ? <img src={active.screenshotDataUrl} alt="Bet screenshot thumb" className="h-14 w-14 rounded-xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100"><ImageIcon className="h-5 w-5 text-slate-400" /></div>}
                              <div className="mt-1 max-w-24 truncate text-xs text-slate-400">{active.screenshotName}</div>
                            </td>
                            <td className="px-4 py-3">{isEdit ? <select className={inputClass} value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value })}>{sports.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}</select> : active.sport}</td>
                            <td className="px-4 py-3">{isEdit ? <select className={inputClass} value={draft.betType} onChange={(e) => setDraft({ ...draft, betType: e.target.value })}>{betTypes.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}</select> : active.betType}</td>
                            <td className="px-4 py-3">
                              {isEdit ? <div className="space-y-2"><input className={inputClass} value={draft.event} onChange={(e) => setDraft({ ...draft, event: e.target.value })} /><input className={inputClass} value={draft.selection} onChange={(e) => setDraft({ ...draft, selection: e.target.value })} /></div> : <><div className="font-semibold">{active.event || "—"}</div><div className="text-slate-500">{active.selection || "—"}</div></>}
                            </td>
                            <td className="px-4 py-3">{isEdit ? <input className={inputClass} type="number" value={draft.wagerCost} onChange={(e) => setDraft({ ...draft, wagerCost: e.target.value })} /> : currency(active.wagerCost)}</td>
                            <td className="px-4 py-3">{isEdit ? <input className={inputClass} type="number" value={draft.potentialPayout} onChange={(e) => setDraft({ ...draft, potentialPayout: e.target.value })} /> : currency(active.potentialPayout)}</td>
                            <td className="px-4 py-3">{isEdit ? <input className={inputClass} type="number" value={draft.actualPayout} onChange={(e) => setDraft({ ...draft, actualPayout: e.target.value })} /> : currency(active.actualPayout)}</td>
                            <td className="px-4 py-3">{isEdit ? <select className={inputClass} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{statuses.filter(s => s !== "All").map(s => <option key={s}>{s}</option>)}</select> : <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(active.status)}`}>{active.status}</span>}</td>
                            <td className="px-4 py-3">
                              {isEdit ? (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={saveEdit} className="rounded-xl bg-slate-950"><Save className="h-4 w-4" /></Button>
                                  <Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setDraft(null); }} className="rounded-xl"><X className="h-4 w-4" /></Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="secondary" onClick={() => startEdit(bet)} className="rounded-xl"><Pencil className="h-4 w-4" /></Button>
                                  <Button size="sm" variant="secondary" onClick={() => removeBet(bet.id)} className="rounded-xl text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, labelClass, children }) {
  return <div className="space-y-1"><label className={labelClass}>{label}</label>{children}</div>;
}

function Metric({ icon, label, value, sub, tone }) {
  const toneClass = tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-slate-950";
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">{icon}</div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
        <div className="mt-1 text-xs text-slate-400">{sub}</div>
      </CardContent>
    </Card>
  );
}

function Bar({ label, value, max, color }) {
  const width = Math.max(3, Math.min(100, (Number(value || 0) / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{currency(value)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function statusClass(status) {
  switch (status) {
    case "Won": return "bg-emerald-50 text-emerald-700";
    case "Lost": return "bg-red-50 text-red-700";
    case "Open": return "bg-blue-50 text-blue-700";
    case "Push": return "bg-slate-100 text-slate-700";
    case "Void": return "bg-amber-50 text-amber-700";
    default: return "bg-slate-100 text-slate-700";
  }
}
