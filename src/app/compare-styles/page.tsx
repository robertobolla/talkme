'use client';

export default function CompareStyles() {
  return (
    <div className="min-h-screen bg-secondary p-5">
      <div className="container">
        <h1 className="text-primary mb-4">Comparación de Estilos</h1>
        
        <div className="grid grid--md-cols-2 gap-8">
          {/* Columna SASS */}
          <div>
            <h2 className="text-xl font-bold mb-4">Estilos SASS (Actual)</h2>
            
            {/* Cards */}
            <div className="card p-4 mb-4">
              <h3 className="card__title">Card SASS</h3>
              <p className="card__description">Esta es una card con estilos SASS</p>
            </div>
            
            {/* Botones */}
            <div className="flex gap-2 mb-4">
              <button className="btn btn--primary">Primario</button>
              <button className="btn btn--secondary">Secundario</button>
              <button className="btn btn--ghost">Ghost</button>
            </div>
            
            {/* Formulario */}
            <div className="form">
              <div className="form__group">
                <label className="form__label">Campo SASS</label>
                <input className="form__input" placeholder="Input SASS" />
              </div>
            </div>
            
            {/* Alertas */}
            <div className="alert alert--success mt-4">
              <span>Alerta de éxito SASS</span>
            </div>
            
            <div className="alert alert--error mt-4">
              <span>Alerta de error SASS</span>
            </div>
          </div>
          
          {/* Columna Tailwind (Simulada) */}
          <div>
            <h2 className="text-xl font-bold mb-4">Estilos Tailwind (Original)</h2>
            
            {/* Cards */}
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>Card Tailwind</h3>
              <p style={{ color: '#475569', lineHeight: '1.6' }}>Esta es una card con estilos Tailwind</p>
            </div>
            
            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-in-out'
              }}>Primario</button>
              <button style={{
                backgroundColor: '#475569',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-in-out'
              }}>Secundario</button>
              <button style={{
                backgroundColor: 'transparent',
                color: '#475569',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 150ms ease-in-out'
              }}>Ghost</button>
            </div>
            
            {/* Formulario */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>Campo Tailwind</label>
              <input style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                transition: 'border-color 150ms ease-in-out'
              }} placeholder="Input Tailwind" />
            </div>
            
            {/* Alertas */}
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span>Alerta de éxito Tailwind</span>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <span>Alerta de error Tailwind</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Diferencias Identificadas:</h3>
          <ul className="space-y-2 text-secondary">
            <li>• Espaciado y padding</li>
            <li>• Bordes redondeados</li>
            <li>• Sombras</li>
            <li>• Colores de fondo</li>
            <li>• Tipografía</li>
            <li>• Transiciones</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 