'use client';

export default function TestColors() {
    return (
        <div className="min-h-screen bg-secondary p-5">
            <div className="container">
                <h1 className="text-primary mb-4">Prueba de Colores (Estilo Tailwind)</h1>

                <div className="grid grid--md-cols-3 gap-4 mb-4">
                    <div className="bg-blue-600 text-white p-4 rounded-lg">
                        <h3>Fondo Azul</h3>
                        <p>Color: #2563eb (Blue-600)</p>
                    </div>

                    <div className="bg-slate-600 text-white p-4 rounded-lg">
                        <h3>Fondo Gris</h3>
                        <p>Color: #475569 (Slate-600)</p>
                    </div>

                    <div className="bg-white text-black p-4 rounded-lg border">
                        <h3>Fondo Blanco</h3>
                        <p>Color: #ffffff (White)</p>
                    </div>
                </div>

                <div className="card p-4 mb-4">
                    <h2 className="card__title">Comparación de Colores</h2>
                    <p className="card__description">
                        Ahora los colores deberían verse más similares a Tailwind:
                    </p>
                    <ul className="mt-4 space-y-2">
                        <li><strong>Fondo Azul:</strong> Azul (#2563eb) - como Tailwind blue-600</li>
                        <li><strong>Fondo Gris:</strong> Gris oscuro (#475569) - como Tailwind slate-600</li>
                        <li><strong>Fondo Blanco:</strong> Blanco (#ffffff) - como Tailwind white</li>
                    </ul>
                </div>

                <div className="flex gap-4 mt-4">
                    <button className="btn btn--primary">Botón Primario</button>
                    <button className="btn btn--secondary">Botón Secundario</button>
                    <button className="btn btn--ghost">Botón Ghost</button>
                </div>

                <div className="mt-4">
                    <h3>Colores Adicionales (Estilo Tailwind):</h3>
                    <div className="grid grid--md-cols-2 gap-4 mt-2">
                        <div className="bg-green-600 text-white p-3 rounded">Verde</div>
                        <div className="bg-red-600 text-white p-3 rounded">Rojo</div>
                        <div className="bg-yellow-600 text-white p-3 rounded">Amarillo</div>
                        <div className="bg-purple-600 text-white p-3 rounded">Púrpura</div>
                        <div className="bg-pink-600 text-white p-3 rounded">Rosa</div>
                        <div className="bg-indigo-600 text-white p-3 rounded">Índigo</div>
                    </div>
                </div>
            </div>
        </div>
    );
} 