import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email es requerido' },
                { status: 400 }
            );
        }

        // Buscar y eliminar el perfil del usuario
        const searchResponse = await fetch(
            `${STRAPI_URL}/api/user-profiles?filters[email][$eq]=${encodeURIComponent(email)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (searchResponse.ok) {
            const searchData = await searchResponse.json();

            if (searchData.data && searchData.data.length > 0) {
                const userId = searchData.data[0].id;

                // Eliminar el perfil
                const deleteResponse = await fetch(`${STRAPI_URL}/api/user-profiles/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (deleteResponse.ok) {
                    return NextResponse.json({
                        success: true,
                        message: `Perfil eliminado para ${email}`,
                        deletedUserId: userId
                    });
                } else {
                    return NextResponse.json(
                        { error: 'Error al eliminar el perfil' },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json({
                    success: true,
                    message: `No se encontró perfil para ${email}`
                });
            }
        } else {
            return NextResponse.json(
                { error: 'Error al buscar el perfil' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error clearing user data:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
} 