import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; slotId: string }> }
) {
    try {
        const { slotId } = await params;
        const body = await request.json();
        const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

        const response = await fetch(`${STRAPI_URL}/api/availability-slots/${slotId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(STRAPI_API_TOKEN ? { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` } : {}),
            },
            body: JSON.stringify({
                data: body
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data.data);
    } catch (error) {
        console.error('Error updating availability slot:', error);
        return NextResponse.json(
            { error: 'Error al actualizar horario de disponibilidad' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; slotId: string }> }
) {
    try {
        const { slotId } = await params;
        const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

        const response = await fetch(`${STRAPI_URL}/api/availability-slots/${slotId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(STRAPI_API_TOKEN ? { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` } : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return NextResponse.json({ message: 'Horario eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting availability slot:', error);
        return NextResponse.json(
            { error: 'Error al eliminar horario de disponibilidad' },
            { status: 500 }
        );
    }
} 