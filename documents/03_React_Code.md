# 「あといくら？メモ」- ほぼ完成形のReact (Next.js) コード

このコードは、Next.js (App Router) + Tailwind CSS 環境で動くプロトタイプのコードです。
`app/page.tsx` にそのまま貼り付けることで動作するように1ファイルにまとめています。

```tsx
"use client";
import React, { useState, useMemo } from 'react';

// --- Types ---
type Category = 'food' | 'daily' | 'other';
interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string;
}

const CATEGORY_MAP = {
  food: { name: '食費', emoji: '🍙' },
  daily: { name: '日用品', emoji: '🧴' },
  other: { name: 'その他', emoji: '💡' }
};

const DEFAULT_BUDGETS = {
  all: 50000,
  food: 30000,
  daily: 10000,
  other: 10000
};

export default function HowMuchLeftApp() {
  const [activeTab, setActiveTab] = useState<'all' | Category>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showInputView, setShowInputView] = useState(false);
  
  // Input form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Logic ---
  const daysLeft = 14; // モック: 本来は月末までの日数を計算

  const stats = useMemo(() => {
    let relevantExpenses = expenses;
    if (activeTab !== 'all') {
      relevantExpenses = expenses.filter(e => e.category === activeTab);
    }
    
    const spent = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = DEFAULT_BUDGETS[activeTab];
    const remaining = budget - spent;
    const daily = remaining > 0 ? Math.floor(remaining / daysLeft) : 0;
    const ratio = spent / budget;
    
    return { budget, spent, remaining, daily, ratio };
  }, [activeTab, expenses, daysLeft]);

  // --- Handlers ---
  const handleSave = () => {
    if (!amount) return;
    setExpenses(prev => [...prev, {
      id: Date.now().toString(),
      amount: parseInt(amount, 10),
      category,
      date
    }]);
    setAmount('');
    setShowInputView(false);
  };

  const getStatusColor = (ratio: number) => {
    if (ratio >= 0.8) return 'bg-red-500 text-red-500';
    if (ratio >= 0.5) return 'bg-yellow-500 text-yellow-500';
    return 'bg-green-500 text-green-500';
  };
  
  const getStatusLabel = (ratio: number) => {
    if (ratio >= 0.8) return '🚨 使いすぎ危険！';
    if (ratio >= 0.5) return '⚠️ 注意ペース';
    return '👍 順調です';
  };

  const statusColorClass = getStatusColor(stats.ratio);

  // --- Views ---
  if (showInputView) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 text-gray-900 p-6 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold">支出を入力</h1>
          <button onClick={() => setShowInputView(false)} className="text-blue-600 font-semibold">キャンセル</button>
        </header>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 flex items-center">
          <span className="text-3xl font-bold text-gray-400 mr-2">¥</span>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="text-4xl font-bold w-full outline-none"
            autoFocus
          />
        </div>

        <div className="mb-6">
          <h3 className="text-gray-500 font-semibold mb-3">カテゴリ</h3>
          <div className="flex gap-2">
            {(['food', 'daily', 'other'] as Category[]).map(cat => (
              <button 
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${category === cat ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' : 'bg-white border-2 border-transparent text-gray-600'}`}
              >
                {CATEGORY_MAP[cat].emoji} {CATEGORY_MAP[cat].name}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-auto"
        >
          保存する
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 text-gray-900 pb-24 relative overflow-hidden">
      <header className="p-6 pt-10">
        <h1 className="text-xl font-bold text-center">2026年4月</h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-200/50 p-1 mx-6 rounded-xl mb-6">
        {['all', 'food', 'daily', 'other'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'all' ? '全体' : CATEGORY_MAP[tab as Category].name}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-white mx-6 rounded-3xl p-6 shadow-sm mb-4">
        <div className="flex justify-between text-gray-500 text-sm font-semibold mb-2">
          <span>今月予算</span>
          <span className="text-gray-900 text-base">¥{stats.budget.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-sm font-semibold mb-4">
          <span>使用済み</span>
          <span className="text-gray-900 text-base">¥{stats.spent.toLocaleString()}</span>
        </div>
        
        <div className="h-px w-full bg-gray-100 mb-4" />
        
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-lg">残り</span>
          <span className="font-bold text-3xl tracking-tight">¥{stats.remaining.toLocaleString()}</span>
        </div>

        {/* Progress */}
        <div className="h-2 w-full bg-gray-100 rounded-full mb-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${statusColorClass.split(' ')[0]}`}
            style={{ width: `${Math.min(100, stats.ratio * 100)}%` }}
          />
        </div>
        
        <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold bg-opacity-10 ${statusColorClass.split(' ')[1]} ${statusColorClass.split(' ')[0].replace('bg-', 'bg-opacity-10 bg-')}`}>
          {getStatusLabel(stats.ratio)}
        </div>
      </div>

      {/* Pacing Card */}
      <div className="bg-white mx-6 rounded-2xl p-5 shadow-sm">
        <p className="text-center font-semibold text-gray-500 mb-4">残り日数：<span className="text-gray-900">14日</span></p>
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-sm text-gray-500">■ 1日あたり</span>
            <span className="font-bold text-xl text-blue-600">¥{stats.daily.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-sm text-gray-500">■ 1週間目安</span>
            <span className="font-bold text-xl text-blue-600">¥{(stats.daily * 7).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <button 
          onClick={() => setShowInputView(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-200 transform transition active:scale-95 flex items-center gap-2 pr-6"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span className="font-bold">支出入力</span>
        </button>
      </div>
    </div>
  );
}
```
