'use client';

export default function DebugStyles() {
  return (
    <div className="min-h-screen bg-secondary p-5">
      <div className="container">
        <h1 className="text-primary mb-4">Debug de Estilos SASS</h1>

        <div className="card p-4 mb-4">
          <h2 className="card__title">Card de Prueba</h2>
          <p className="card__description">Esta es una descripción de prueba.</p>
        </div>

        <div className="grid grid--md-cols-2 gap-4 mb-4">
          <div className="card p-4">
            <h3 className="card__title">Columna 1</h3>
            <p className="card__description">Contenido de la primera columna.</p>
          </div>
          <div className="card p-4">
            <h3 className="card__title">Columna 2</h3>
            <p className="card__description">Contenido de la segunda columna.</p>
          </div>
        </div>

        <div className="form">
          <div className="form__group">
            <label className="form__label">Campo de Prueba</label>
            <input
              type="text"
              className="form__input"
              placeholder="Escribe algo aquí..."
            />
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button className="btn btn--primary">Botón Primario</button>
          <button className="btn btn--secondary">Botón Secundario</button>
          <button className="btn btn--ghost">Botón Ghost</button>
        </div>

        <div className="alert alert--success mt-4">
          <span>Este es un mensaje de éxito</span>
        </div>

        <div className="alert alert--error mt-4">
          <span>Este es un mensaje de error</span>
        </div>

        <div className="mt-4">
          <h3>Clases de Utilidad:</h3>
          <div className="flex gap-2 mt-2">
            <span className="text-primary">Texto Primario</span>
            <span className="text-secondary">Texto Secundario</span>
            <span className="text-muted">Texto Muted</span>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="bg-blue-600 text-white p-2 rounded">Fondo Azul</div>
            <div className="bg-slate-600 text-white p-2 rounded">Fondo Gris</div>
            <div className="bg-white text-black p-2 rounded border">Fondo Blanco</div>
          </div>
        </div>
      </div>
    </div>
  );
} 