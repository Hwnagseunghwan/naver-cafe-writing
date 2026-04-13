"use client";

import { useState, useEffect } from "react";

type Account = {
  id: number;
  nickname: string;
  naverId: string;
  naverPw: string;
  isActive: boolean;
  createdAt: string;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [nickname, setNickname] = useState("");
  const [naverId, setNaverId] = useState("");
  const [naverPw, setNaverPw] = useState("");
  const [msg, setMsg] = useState("");

  async function fetchAccounts() {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
  }

  useEffect(() => { fetchAccounts(); }, []);

  async function handleAdd() {
    if (!nickname || !naverId || !naverPw) return setMsg("모든 항목을 입력해주세요.");
    setMsg("추가 중...");
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, naverId, naverPw }),
    });
    const data = await res.json();
    if (data.error) { setMsg(`❌ ${data.error}`); return; }
    setMsg("✅ 추가 완료");
    setNickname(""); setNaverId(""); setNaverPw("");
    fetchAccounts();
  }

  async function handleToggle(id: number, isActive: boolean) {
    await fetch("/api/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchAccounts();
  }

  async function handleDelete(id: number) {
    if (!confirm("계정을 삭제하시겠습니까?")) return;
    await fetch("/api/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAccounts();
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">계정 관리</h2>

      {/* 추가 폼 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">계정 추가</h3>
        <div className="flex flex-col gap-3">
          <input type="text" placeholder="닉네임 (예: 홍길동계정1)" value={nickname} onChange={(e) => setNickname(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="text" placeholder="네이버 아이디" value={naverId} onChange={(e) => setNaverId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input type="password" placeholder="네이버 비밀번호" value={naverPw} onChange={(e) => setNaverPw(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="flex items-center gap-3">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">추가</button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </div>
      </div>

      {/* 계정 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">닉네임</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">아이디</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium w-20">상태</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{acc.nickname}</td>
                <td className="px-4 py-3 text-gray-500">{acc.naverId}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${acc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {acc.isActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleToggle(acc.id, acc.isActive)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded">
                      {acc.isActive ? "비활성화" : "활성화"}
                    </button>
                    <button onClick={() => handleDelete(acc.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 text-xs rounded">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
