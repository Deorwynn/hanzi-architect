"use client";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function SmokeTest() {
  const [version, setVersion] = useState<string>("Not connected");

  const checkTauri = async () => {
    try {
      const msg = await invoke<string>("greet", { name: "Engineer" });
      setVersion(msg);
    } catch (err) {
      console.error(err);
      setVersion("Error: Tauri not detected");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#F9F7F2]">
      <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-center">
        <h1 className="text-2xl font-bold text-[#BC2410] mb-4">
          Hánzì Architect Smoke Test
        </h1>
        <p className="mb-6 text-gray-600">
          Status: <span className="font-mono font-bold">{version}</span>
        </p>
        <button
          onClick={checkTauri}
          className="px-6 py-2 bg-[#BC2410] text-white rounded-lg hover:bg-[#9a1d0d] transition-colors"
        >
          Test Desktop Bridge
        </button>
      </div>
    </main>
  );
}
