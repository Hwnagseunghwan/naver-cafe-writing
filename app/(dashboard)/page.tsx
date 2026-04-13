"use client";

import { useState, useEffect } from "react";

type ScheduledPost = {
  id: number;
  scheduledAt: string;
  status: string;
  postedUrl: string | null;
  errorMsg: string | null;
  executedAt: string | null;
  draft: { title: string };
  account: { nickname: string; naverId: string };
  board: { name: string; cafe: { name: string } };
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:  { label: "대기중",  className: "bg-yellow-100 text-yellow-700" },
  running:  { label: "송출중",  className: "bg-blue-100 text-blue-700" },
  success:  { label: "성공",    className: "bg-green-100 text-green-700" },
  failed:   { label: "실패",    className: "bg-red-100 text-red-700" },
};

export default function HomePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function fetchPosts() {
    const res = await fetch("/api/schedule");
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
    const timer = setInterval(fetchPosts, 30000);
    return () => clearInterval(timer);
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("예약을 삭제하시겠습니까?")) return;
    const res = await fetch("/api/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetchPosts();
  }

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">예약 현황</h2>
          <p className="text-sm text-gray-400 mt-0.5">30초마다 자동 갱신</p>
        </div>
        <div className="flex gap-2">
          {["all", "pending", "running", "success", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${filter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {s === "all" ? "전체" : STATUS_LABEL[s]?.label}
            </button>
          ))}
          <button onClick={fetchPosts} className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">
            새로고침
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20">예약된 글이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">원고 제목</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-28">카페/게시판</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-28">계정</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-36">예약시간</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium w-20">상태</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((post) => {
                const s = STATUS_LABEL[post.status] ?? STATUS_LABEL.pending;
                return (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {post.postedUrl ? (
                        <a href={post.postedUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                          {post.draft.title}
                        </a>
                      ) : post.draft.title}
                      {post.errorMsg && <p className="text-xs text-red-500 mt-0.5">{post.errorMsg}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {post.board.cafe.name}<br />{post.board.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {post.account.nickname}<br />{post.account.naverId}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(post.scheduledAt).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${s.className}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {post.status === "pending" && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded"
                        >
                          취소
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
