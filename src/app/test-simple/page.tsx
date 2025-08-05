'use client';

export default function TestSimple() {
    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
            <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>Prueba Simple de Estilos</h1>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <h2>Card de Prueba</h2>
                <p>Este es un contenido de prueba con estilos inline.</p>
            </div>

            <button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '10px'
            }}>
                Botón de Prueba
            </button>

            <button style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
            }}>
                Botón Secundario
            </button>
        </div>
    );
} 