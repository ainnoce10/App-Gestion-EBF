import React, { useMemo, useState } from 'react';
import { ArrowLeft, X, ShoppingCart, Info, Plus, Check } from 'lucide-react';
import { StockItem, Site } from '../types';

type Props = {
  items: StockItem[];
  onBack: () => void;
  readOnly?: boolean;
  currentSite?: Site;
};

const currency = (v: number) => `${v.toLocaleString('fr-FR')} FCFA`;

export default function QuincaillerieCatalog({ items = [], onBack, readOnly = false, currentSite }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [specOpen, setSpecOpen] = useState<StockItem | null>(null);
  const [cart, setCart] = useState<Record<string, { item: StockItem; qty: number }>>({});
  const [animating, setAnimating] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category || 'Autre'))), [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (currentSite && currentSite !== Site.GLOBAL && i.site !== currentSite) return false;
      if (search && !(`${i.name} ${i.description || ''} ${i.category}`).toLowerCase().includes(search.toLowerCase())) return false;
      if (category && i.category !== category) return false;
      if (maxPrice !== '' && i.price > Number(maxPrice)) return false;
      if (inStockOnly && (!i.quantity || i.quantity <= 0)) return false;
      return true;
    });
  }, [items, search, category, maxPrice, inStockOnly, currentSite]);

  const addToCart = (item: StockItem) => {
    if (readOnly) return;
    setCart(prev => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, qty: existing ? existing.qty + 1 : 1 } };
    });
    setAnimating(item.id);
    setTimeout(() => setAnimating(null), 420);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const total = Object.values(cart).reduce((s, c) => s + c.item.price * c.qty, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-full hover:bg-orange-50 shadow-sm transition border border-gray-100"><ArrowLeft size={18} className="text-gray-600"/></button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Catalogue Quincaillerie</h2>
            <p className="text-gray-500 text-sm">Parcourez nos fiches produit et ajoutez au panier</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100">
            <ShoppingCart />
            <div className="text-sm font-bold">{Object.keys(cart).length} article(s)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-3 lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <input placeholder="Recherche rapide..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-ebf-orange outline-none" />
            <div className="mt-3 grid grid-cols-1 gap-2">
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-md border border-gray-200">
                <option value="">Toutes catégories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" placeholder="Prix max (FCFA)" value={maxPrice as any} onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))} className="flex-1 px-3 py-2 rounded-md border border-gray-200" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} /> En stock</label>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <h4 className="font-bold mb-2">Résumé Panier</h4>
            {Object.values(cart).length === 0 ? (
              <p className="text-sm text-gray-400">Panier vide</p>
            ) : (
              <div className="space-y-2">
                {Object.values(cart).map(c => (
                  <div key={c.item.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.item.name}</div>
                      <div className="text-xs text-gray-500">{c.qty} × {currency(c.item.price)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(c.item.id)} className="text-red-500 p-1 rounded hover:bg-red-50"><X size={14} /></button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 text-right font-bold">Total: {currency(total)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow p-3 border border-gray-100 flex flex-col">
                <div className="h-40 w-full bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="object-contain h-full w-full" /> : <div className="text-gray-300">No Image</div>}
                </div>
                <div className="mt-3 flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-3">{item.description || '—'}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-bold text-ebf-orange">{currency(item.price)}</div>
                  <div className="text-xs text-gray-500">{item.quantity > 0 ? `${item.quantity} ${item.unit}` : 'Rupture'}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => setSpecOpen(item)} className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50 flex items-center justify-center gap-2"><Info size={16}/> Fiche</button>
                  <button onClick={() => addToCart(item)} disabled={item.quantity <= 0 || readOnly} className={`px-3 py-2 rounded-md text-sm font-bold text-white ${item.quantity <= 0 || readOnly ? 'bg-gray-300 cursor-not-allowed' : 'bg-ebf-orange hover:opacity-90 transform transition'} ${animating === item.id ? 'animate-pulse scale-105' : ''}`}>
                    <Plus size={14}/> Ajouter
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-center text-gray-400 p-6">Aucun article correspondant.</div>}
          </div>
        </div>
      </div>

      {specOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60" onClick={() => setSpecOpen(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{specOpen.name}</h3>
                <p className="text-sm text-gray-500">{specOpen.category} • {specOpen.site}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-bold">{currency(specOpen.price)}</div>
                <button onClick={() => setSpecOpen(null)} className="p-2 rounded hover:bg-gray-50"><X /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded p-3 flex items-center justify-center">
                {specOpen.imageUrl ? <img src={specOpen.imageUrl} alt={specOpen.name} className="object-contain max-h-64" /> : <div className="text-gray-300">No Image</div>}
              </div>
              <div>
                <h4 className="font-bold mb-2">Description</h4>
                <p className="text-sm text-gray-600 mb-4">{specOpen.description || 'Pas de description détaillée.'}</p>
                {specOpen.specsUrl && <a href={specOpen.specsUrl} target="_blank" rel="noreferrer" className="text-sm text-ebf-orange font-bold">Voir la fiche technique</a>}
                <div className="mt-4">
                  <button onClick={() => { addToCart(specOpen); setSpecOpen(null); }} className="px-4 py-2 bg-ebf-orange text-white rounded-md font-bold flex items-center gap-2"><Plus/> Ajouter au panier</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer sticky summary for larger screens */}
      <div className="fixed left-0 right-0 bottom-0 z-50 p-4 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShoppingCart />
            <div>
              <div className="text-sm font-medium">{Object.values(cart).reduce((s, c) => s + c.qty, 0)} article(s)</div>
              <div className="text-xs text-gray-500">Total: {currency(total)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setCart({}); }} className="px-4 py-2 bg-gray-100 rounded-md">Vider</button>
            <button className={`px-4 py-2 bg-green-600 text-white rounded-md font-bold ${Object.keys(cart).length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}>Commander</button>
          </div>
        </div>
      </div>
    </div>
  );
}
