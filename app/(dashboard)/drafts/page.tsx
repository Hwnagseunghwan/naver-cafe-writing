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

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ filename: string; path: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<Draft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchDrafts() {
    const res = await fetch("/api/drafts");
    setDrafts(await res.json());
  }

  useEffect(() => { fetchDrafts(); }, []);

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

  async function handleSave() {
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
    setTitle(""); setContent(""); setImages([]);
    fetchDrafts();
  }

  async function handleDelete(id: number) {
    if (!confirm("원고를 삭제하시겠습니까?")) return;
    await fetch("/api/drafts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchDrafts();
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">원고 관리</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* 작성 폼 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">새 원고 작성</h3>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <div>
              <p className="text-xs text-gray-500 mb-1">내용 (HTML 직접 입력 가능)</p>
              <textarea
                placeholder="내용을 입력하세요. HTML 태그도 사용 가능합니다."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
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
            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">저장</button>
              {msg && <span className="text-sm text-gray-600">{msg}</span>}
            </div>
          </div>
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
                <div className="flex gap-1 ml-2">
                  <button onClick={() => setPreview(preview?.id === draft.id ? null : draft)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded">미리보기</button>
                  <button onClick={() => handleDelete(draft.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded">삭제</button>
                </div>
              </div>
              {preview?.id === draft.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="prose prose-sm max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: draft.content }} />
                  {draft.images.map((img) => (
                    <img key={img.id} src={img.path} alt={img.filename} className="mt-2 max-w-full rounded border border-gray-200" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
