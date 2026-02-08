'use client';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Attempt to call our Rust command
    invoke('get_character_details', { target: '一' })
      .then((result) => setData(result))
      .catch((err) => setError(err));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Backend Bridge Test</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data ? (
        <pre style={{ background: '#f4f4f4', padding: '10px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Loading data from Rust...</p>
      )}
    </div>
  );
}
