"use client";

import { useState, useEffect } from "react";

type Board = { id: number; name: string; boardId: string };
type Cafe = { id: number; name: string; url: string; boards: Board[] };

export default function CafesPage() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [boards, setBoards] = useState([{ name: "", boardId: "" }]);
  const [msg, setMsg] = useState("");

  async function fetchCafes() {
    const res = await fetch("/api/cafes");
    setCafes(await res.json());
  }

  useEffect(() => { fetchCafes(); }, []);

  function addBoard() { setBoards([...boards, { name: "", boardId: "" }]); }
  function updateBoard(i: number, field: string, value: string) {
    setBoards(boards.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  }
  function removeBoard(i: number) { setBoards(boards.filter((_, idx) => idx !== i)); }

  async function handleAdd() {
    if (!name || !url) return setMsg("카페명과 URL을 입력해주세요.");
    const validBoards = boards.filter((b) => b.name && b.boardId);
    setMsg("추가 중...");
    const res = await fetch("/api/cafes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, boards: validBoards }),
    });
    const data = await res.json();
    if (data.error) { setMsg(`❌ ${data.error}`); return; }
    setMsg("✅ 추가 완료");
    setName(""); setUrl(""); setBoards([{ name: "", boardId: "" }]);
    fetchCafes();
  }

  async function handleDelete(id: number) {
    if (!confirm("카페를 삭제하시겠습니까? 게시판 정보도 함께 삭제됩니다.")) return;
    await fetch("/api/cafes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCafes();
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">카페 관리</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">카페 추가</h3>
        <div className="flex flex-col gap-3">
          <input type="text" placeholder="카페명 (예: 피터팬 좋은방)" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="text" placeholder="카페 URL (예: https://cafe.naver.com/xxxxx)" value={url} onChange={(e) => setUrl(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />

          <div>
            <p className="text-xs text-gray-500 mb-2">게시판 목록</p>
            {boards.map((b, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" placeholder="게시판명" value={b.name} onChange={(e) => updateBoard(i, "name", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <input type="text" placeholder="게시판 ID (숫자)" value={b.boardId} onChange={(e) => updateBoard(i, "boardId", e.target.value)} className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                {boards.length > 1 && (
                  <button onClick={() => removeBoard(i)} className="px-2 py-1 text-gray-400 hover:text-red-500 text-lg">×</button>
                )}
              </div>
            ))}
            <button onClick={addBoard} className="text-xs text-blue-500 hover:underline">+ 게시판 추가</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">추가</button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {cafes.map((cafe) => (
          <div key={cafe.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{cafe.name}</p>
                <a href={cafe.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{cafe.url}</a>
              </div>
              <button onClick={() => handleDelete(cafe.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded">삭제</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {cafe.boards.map((board) => (
                <span key={board.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {board.name} (ID: {board.boardId})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
