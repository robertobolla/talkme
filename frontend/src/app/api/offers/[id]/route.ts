import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: offerId } = await params;

    console.log('=== Offer Detail API: Obteniendo detalles de oferta ===');
    console.log('Offer Detail API: userId:', userId);
    console.log('Offer Detail API: offerId:', offerId);

    // Llamar a la API de Strapi para obtener los detalles de la oferta
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/ofertas/${offerId}?populate=client,applicants,professional`);

    if (response.ok) {
      const data = await response.json();
      console.log('Offer Detail API: Datos de oferta obtenidos:', data);

      // Procesar los datos para incluir información más detallada
      const offer = data.data || data;

      // Si hay postulantes, obtener información adicional de cada uno
      if (offer.applicants && offer.applicants.length > 0) {
        console.log('Offer Detail API: Procesando', offer.applicants.length, 'postulantes');

        const applicantsWithDetails = await Promise.all(
          offer.applicants.map(async (applicant: any) => {
            try {
              console.log('Offer Detail API: Obteniendo detalles del postulante ID:', applicant.id);

              // Obtener información detallada del postulante
              const applicantResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/user-profiles/${applicant.id}?populate=*`, {
                headers: {
                  'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
                },
              });

              if (applicantResponse.ok) {
                const applicantData = await applicantResponse.json();
                console.log('Offer Detail API: Datos del postulante obtenidos:', {
                  id: applicantData.data?.id,
                  fullName: applicantData.data?.fullName,
                  email: applicantData.data?.email,
                  role: applicantData.data?.role
                });

                const enrichedApplicant = {
                  ...applicant,
                  ...applicantData.data,
                  // Asegurar que tenemos los campos necesarios
                  fullName: applicantData.data?.fullName || applicant.fullName || 'Sin nombre',
                  email: applicantData.data?.email || applicant.email || 'Sin email',
                  hourlyRate: applicantData.data?.hourlyRate || 0,
                  averageRating: applicantData.data?.averageRating || 0,
                  role: applicantData.data?.role || 'professional',
                  status: applicantData.data?.status || 'approved',
                };

                console.log('Offer Detail API: Postulante enriquecido:', {
                  id: enrichedApplicant.id,
                  fullName: enrichedApplicant.fullName,
                  email: enrichedApplicant.email,
                  role: enrichedApplicant.role
                });

                return enrichedApplicant;
              } else {
                console.error('Offer Detail API: Error obteniendo detalles del postulante', applicant.id, 'Status:', applicantResponse.status);
              }
            } catch (error) {
              console.error(`Error obteniendo detalles del postulante ${applicant.id}:`, error);
            }

            return applicant;
          })
        );

        offer.applicants = applicantsWithDetails;
        console.log('Offer Detail API: Postulantes procesados:', offer.applicants.length);
      } else {
        console.log('Offer Detail API: No hay postulantes en esta oferta');
      }

      // Si hay un profesional asignado, obtener información adicional
      if (offer.professional) {
        try {
          const professionalResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/user-profiles/${offer.professional.id}?populate=*`, {
            headers: {
              'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
          });

          if (professionalResponse.ok) {
            const professionalData = await professionalResponse.json();
            offer.professional = {
              ...offer.professional,
              ...professionalData.data,
            };
          }
        } catch (error) {
          console.error('Error obteniendo detalles del profesional:', error);
        }
      }

      return NextResponse.json({
        success: true,
        offer: offer
      });
    } else {
      let errorMessage = 'Error al obtener los detalles de la oferta';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        const textError = await response.text();
        errorMessage = textError || errorMessage;
      }

      console.error('Offer Detail API: Error de Strapi:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

  } catch (error) {
    console.error('Error en offer detail API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 