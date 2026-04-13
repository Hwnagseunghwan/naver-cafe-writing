"use client";

import { useState, useEffect } from "react";

type Draft = { id: number; title: string };
type Account = { id: number; nickname: string; naverId: string; isActive: boolean };
type Board = { id: number; name: string; boardId: string };
type Cafe = { id: number; name: string; boards: Board[] };

export default function SchedulePage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);

  const [draftId, setDraftId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [cafeId, setCafeId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/drafts").then((r) => r.json()).then(setDrafts);
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/cafes").then((r) => r.json()).then(setCafes);
  }, []);

  const selectedCafe = cafes.find((c) => c.id === Number(cafeId));

  async function handleSubmit() {
    if (!draftId || !accountId || !boardId || !scheduledAt) return setMsg("모든 항목을 입력해주세요.");
    setMsg("등록 중...");
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, accountId, boardId, scheduledAt }),
    });
    const data = await res.json();
    if (data.error) { setMsg(`❌ ${data.error}`); return; }
    setMsg("✅ 예약 등록 완료");
    setDraftId(""); setAccountId(""); setCafeId(""); setBoardId(""); setScheduledAt("");
  }

  const selectClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300";

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">예약 등록</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">원고 선택</label>
            <select value={draftId} onChange={(e) => setDraftId(e.target.value)} className={selectClass}>
              <option value="">원고를 선택하세요</option>
              {drafts.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">송출 계정</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
              <option value="">계정을 선택하세요</option>
              {accounts.filter((a) => a.isActive).map((a) => (
                <option key={a.id} value={a.id}>{a.nickname} ({a.naverId})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">카페 선택</label>
            <select value={cafeId} onChange={(e) => { setCafeId(e.target.value); setBoardId(""); }} className={selectClass}>
              <option value="">카페를 선택하세요</option>
              {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedCafe && (
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">게시판 선택</label>
              <select value={boardId} onChange={(e) => setBoardId(e.target.value)} className={selectClass}>
                <option value="">게시판을 선택하세요</option>
                {selectedCafe.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">예약 시간</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={selectClass}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">예약 등록</button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
