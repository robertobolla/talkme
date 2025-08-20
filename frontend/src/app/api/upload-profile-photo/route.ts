import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIANDO UPLOAD DE FOTO ===');
    console.log('URL de la petición:', request.url);
    console.log('Método:', request.method);

    const { userId } = await auth();
    console.log('Usuario ID:', userId);

    if (!userId) {
      console.log('Usuario no autorizado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    console.log('Archivo recibido:', file ? `${file.name} (${file.size} bytes)` : 'No archivo');

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen' }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        error: `El archivo debe ser menor a 5MB. Tamaño actual: ${Math.round(file.size / 1024)} KB`
      }, { status: 400 });
    }

    // Verificar variables de entorno
    if (!process.env.STRAPI_URL || !process.env.STRAPI_API_TOKEN) {
      console.error('Variables de entorno no configuradas');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Crear FormData para enviar a Strapi
    const strapiFormData = new FormData();
    strapiFormData.append('files', file);

    console.log('Token de Strapi:', process.env.STRAPI_API_TOKEN ? 'Configurado' : 'No configurado');
    console.log('URL de Strapi:', `${process.env.STRAPI_URL}/api/upload`);
    console.log('FormData creado con archivo:', file.name, file.size, 'bytes');

    try {
      const uploadResponse = await fetch(`${process.env.STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        body: strapiFormData,
      });

      console.log('Status de respuesta de Strapi:', uploadResponse.status);
      console.log('Headers de respuesta:', Object.fromEntries(uploadResponse.headers.entries()));

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Error response from Strapi:', errorText);
        throw new Error(`Error al subir archivo a Strapi: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      const uploadedFile = uploadResult[0];

      console.log('Archivo subido exitosamente:', uploadedFile.id);

      // Construir URL completa para la imagen
      const imageUrl = `${process.env.STRAPI_URL}${uploadedFile.url}`;
      console.log('URL completa de la imagen:', imageUrl);

      return NextResponse.json({
        success: true,
        fileId: uploadedFile.id,
        url: imageUrl
      });

    } catch (fetchError) {
      console.error('Error en fetch a Strapi:', fetchError);
      throw new Error(`Error de conexión con Strapi: ${fetchError instanceof Error ? fetchError.message : 'Error desconocido'}`);
    }

  } catch (error) {
    console.error('Error uploading profile photo:', error);

    // Devolver un error más específico
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error al subir la foto: ${errorMessage}` },
      { status: 500 }
    );
  }
} 