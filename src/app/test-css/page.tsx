'use client';

import '../test-styles.css';

export default function TestCSS() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#222222', minHeight: '100vh' }}>
      <h1 className="test-title">Prueba de CSS Simple</h1>

      <div className="test-card">
        <h2>Card con CSS</h2>
        <p>Este es un contenido de prueba usando clases CSS.</p>
      </div>

      <button className="test-button">
        Botón con CSS
      </button>

      <button className="test-button" style={{ backgroundColor: '#6b7280' }}>
        Botón Secundario
      </button>
    </div>
  );
} 