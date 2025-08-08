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

    // Crear FormData para enviar a Strapi
    const strapiFormData = new FormData();
    strapiFormData.append('files', file);

    // Subir archivo a Strapi
    const strapiToken = '7542f3245bc3cedf9b9d646d3a8a028f8f6b8db0ccbf7ca5163a7bb977a7697f43f60ed0ea3926eff5a163243188ef475b3a985a106acdd69afe7e1fe6a1cff4d9b2fae167f8d5408f20ed7358f0fad5266a7fa968440fb23e5a0edde2f5875b2988289d6538ae57c1b4d2169fa3c6f91758640814fba94dddab158d0d8609ac';

    console.log('Token de Strapi:', strapiToken ? 'Configurado' : 'No configurado');
    console.log('URL de Strapi:', 'http://localhost:1337/api/upload');
    console.log('FormData creado con archivo:', file.name, file.size, 'bytes');

    try {
      const uploadResponse = await fetch('http://localhost:1337/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${strapiToken}`,
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

      return NextResponse.json({
        success: true,
        fileId: uploadedFile.id,
        url: uploadedFile.url
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