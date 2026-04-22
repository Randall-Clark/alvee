import { useState } from "react";
import { Search, Shield, ShieldOff, Ban, ChevronUp, ChevronDown } from "lucide-react";
import { MOCK_USERS, TIER_COLORS, TIER_LABELS, type AdminUser } from "@/data/mockData";

const GOLD = "#C9A84C";

type SortKey = "name" | "points" | "eventsAttended" | "createdAt" | "nfcCardTier";

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${TIER_COLORS[tier]}25`, color: TIER_COLORS[tier] }}>
      {TIER_LABELS[tier]}
    </span>
  );
}

function StatusBadge({ banned }: { banned: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${banned ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-500"}`}>
      {banned ? "Suspendu" : "Actif"}
    </span>
  );
}

export function Users() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const filtered = MOCK_USERS
    .filter(u =>
      (filterTier === "all" || u.nfcCardTier === filterTier) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = a[sortKey]; const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const Th = ({ label, skey }: { label: string; skey: SortKey }) => (
    <th onClick={() => toggleSort(skey)} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none whitespace-nowrap hover:text-foreground">
      <span className="flex items-center gap-1">
        {label}
        {sortKey === skey ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
      </span>
    </th>
  );

  const tierCounts = { all: MOCK_USERS.length, none: 0, standard: 0, prime: 0, platinum: 0 };
  MOCK_USERS.forEach(u => { tierCounts[u.nfcCardTier]++; });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-foreground">Utilisateurs</h1>
        <p className="text-muted-foreground text-sm mt-1">{MOCK_USERS.length} membres inscrits sur Alvee</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "platinum", "prime", "standard", "none"] as const).map(t => (
          <button key={t} onClick={() => setFilterTier(t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={filterTier === t
              ? { background: t === "all" ? GOLD : TIER_COLORS[t], color: "#0D0D0D" }
              : { background: "transparent", color: t === "all" ? "#888" : TIER_COLORS[t], border: `1px solid ${t === "all" ? "#888" : TIER_COLORS[t]}40` }
            }>
            {t === "all" ? `Tous (${tierCounts.all})` : `${TIER_LABELS[t]} (${tierCounts[t]})`}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} résultat(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <Th label="Nom" skey="name" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <Th label="Carte NFC" skey="nfcCardTier" />
                <Th label="Points" skey="points" />
                <Th label="Participations" skey="eventsAttended" />
                <Th label="Inscrit le" skey="createdAt" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(u === selected ? null : u)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `${TIER_COLORS[u.nfcCardTier]}30`, color: TIER_COLORS[u.nfcCardTier] }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.country === "CA" ? "🇨🇦" : "🇫🇷"} {u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3"><TierBadge tier={u.nfcCardTier} /></td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: GOLD }}>{u.points.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{u.eventsAttended}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3"><StatusBadge banned={u.banned} /></td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      {u.banned ? <Shield size={14} className="text-green-500" /> : <Ban size={14} className="text-red-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="bg-card border border-card-border rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Parrainage</p>
            <p className="text-lg font-bold" style={{ color: GOLD }}>{selected.referralCount}/10</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Événements créés</p>
            <p className="text-lg font-bold text-foreground">{selected.eventsCreated}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Points accumulés</p>
            <p className="text-lg font-bold text-foreground">{selected.points.toLocaleString("fr-FR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pays</p>
            <p className="text-lg font-bold text-foreground">{selected.country === "CA" ? "🇨🇦 Canada" : "🇫🇷 France"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
