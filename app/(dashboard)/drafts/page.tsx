"use client";

import { useState, useEffect, useRef } from "react";

type Draft = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: { name: string };
  images: { id: number; filename: string; path: string; order: number }[];
};
type Account = { id: number; nickname: string; naverId: string; isActive: boolean };
type Board = { id: number; name: string; boardId: string };
type Cafe = { id: number; name: string; boards: Board[] };

function ScheduleForm({
  draftId,
  draftTitle,
  accounts,
  cafes,
  onClose,
}: {
  draftId: number;
  draftTitle: string;
  accounts: Account[];
  cafes: Cafe[];
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [cafeId, setCafeId] = useState("");
  const [boardId, setBoardId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [msg, setMsg] = useState("");

  const selectedCafe = cafes.find((c) => c.id === Number(cafeId));
  const selectClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300";

  async function handleSubmit() {
    if (!accountId || !boardId || !scheduledAt) return setMsg("모든 항목을 입력해주세요.");
    setMsg("등록 중...");
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, accountId, boardId, scheduledAt }),
    });
    const data = await res.json();
    if (data.error) { setMsg(`❌ ${data.error}`); return; }
    setMsg("✅ 예약 등록 완료");
    setAccountId(""); setCafeId(""); setBoardId(""); setScheduledAt("");
  }

  return (
    <div className="mt-4 border-t border-blue-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-blue-700">예약 등록 — <span className="font-normal text-gray-600">{draftTitle}</span></p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕ 닫기</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">송출 계정</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={selectClass}>
            <option value="">계정 선택</option>
            {accounts.filter((a) => a.isActive).map((a) => (
              <option key={a.id} value={a.id}>{a.nickname} ({a.naverId})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">카페 선택</label>
          <select value={cafeId} onChange={(e) => { setCafeId(e.target.value); setBoardId(""); }} className={selectClass}>
            <option value="">카페 선택</option>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">게시판 선택</label>
          <select value={boardId} onChange={(e) => setBoardId(e.target.value)} className={selectClass} disabled={!selectedCafe}>
            <option value="">{selectedCafe ? "게시판 선택" : "카페를 먼저 선택하세요"}</option>
            {selectedCafe?.boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium mb-1 block">예약 시간</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={selectClass} />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">예약 등록</button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  );
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ filename: string; path: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<number | null>(null);
  const [schedulingId, setSchedulingId] = useState<number | null>(null);
  const [newDraftScheduling, setNewDraftScheduling] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchAll() {
    const [d, a, c] = await Promise.all([
      fetch("/api/drafts").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/cafes").then((r) => r.json()),
    ]);
    setDrafts(d);
    setAccounts(a);
    setCafes(c);
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.path) setImages((prev) => [...prev, { filename: data.filename, path: data.path }]);
    }
  }

  async function handleSave(withSchedule = false) {
    if (!title || !content) return setMsg("제목과 내용을 입력해주세요.");
    setMsg("저장 중...");
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, authorId: 1, images }),
    });
    const data = await res.json();
    if (data.error) { setMsg(`❌ ${data.error}`); return; }
    setMsg("✅ 저장 완료");
    const savedTitle = title;
    setTitle(""); setContent(""); setImages([]);
    await fetchAll();
    if (withSchedule) {
      setSavedDraftId(data.id);
      setNewDraftScheduling(true);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("원고를 삭제하시겠습니까?")) return;
    await fetch("/api/drafts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAll();
  }

  const inputClass = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">원고 관리</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* 작성 폼 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">새 원고 작성</h3>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full ${inputClass}`} />
            <div>
              <p className="text-xs text-gray-500 mb-1">내용 (HTML 직접 입력 가능)</p>
              <textarea
                placeholder="내용을 입력하세요. HTML 태그도 사용 가능합니다."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className={`w-full font-mono ${inputClass}`}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">이미지 첨부 (선택)</p>
              <input type="file" ref={fileRef} multiple accept="image/*" onChange={handleUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg">
                이미지 선택
              </button>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.path} alt={img.filename} className="w-16 h-16 object-cover rounded border border-gray-200" />
                      <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => handleSave(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg">저장</button>
              <button onClick={() => handleSave(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">저장 + 예약등록 →</button>
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
          </div>

          {/* 새 원고 저장 후 예약 폼 */}
          {newDraftScheduling && savedDraftId && (
            <ScheduleForm
              draftId={savedDraftId}
              draftTitle={drafts.find((d) => d.id === savedDraftId)?.title ?? "방금 저장한 원고"}
              accounts={accounts}
              cafes={cafes}
              onClose={() => { setNewDraftScheduling(false); setSavedDraftId(null); }}
            />
          )}
        </div>

        {/* 원고 목록 */}
        <div className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{draft.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{draft.author.name} · {new Date(draft.createdAt).toLocaleDateString("ko-KR")}</p>
                  {draft.images.length > 0 && <p className="text-xs text-gray-400">이미지 {draft.images.length}개</p>}
                </div>
                <div className="flex gap-1 ml-2 flex-wrap justify-end">
                  <button
                    onClick={() => { setSchedulingId(schedulingId === draft.id ? null : draft.id); setPreview(null); }}
                    className={`px-2 py-1 text-xs rounded ${schedulingId === draft.id ? "bg-blue-600 text-white" : "bg-blue-50 hover:bg-blue-100 text-blue-600"}`}
                  >예약 등록</button>
                  <button
                    onClick={() => { setPreview(preview === draft.id ? null : draft.id); setSchedulingId(null); }}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded"
                  >미리보기</button>
                  <button onClick={() => handleDelete(draft.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded">삭제</button>
                </div>
              </div>

              {preview === draft.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="prose prose-sm max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: draft.content }} />
                  {draft.images.map((img) => (
                    <img key={img.id} src={img.path} alt={img.filename} className="mt-2 max-w-full rounded border border-gray-200" />
                  ))}
                </div>
              )}

              {schedulingId === draft.id && (
                <ScheduleForm
                  draftId={draft.id}
                  draftTitle={draft.title}
                  accounts={accounts}
                  cafes={cafes}
                  onClose={() => setSchedulingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
