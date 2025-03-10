// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Resend } from 'npm:resend@3.2.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Starting send-booking-notification function")

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing new booking notification request');
    const { courseId, userId, status } = await req.json();

    if (!courseId || !userId || !status) {
      throw new Error('Missing required parameters');
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get course details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (courseError) throw courseError;

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError;

    if (!course || !user) {
      throw new Error('Course or user not found')
    }

    // Format date
    const courseDate = new Date(course.date)
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(courseDate)

    // Send confirmation email to user
    await resend.emails.send({
      from: 'Cuisine Italienne <no-reply@unjardinpourfelix.org>',
      to: user.email,
      subject: `${status === 'confirmed' ? 'Confirmation de réservation' : "Inscription sur liste d'attente"} - ${course.title}`,
      html: `
        <h1>${status === 'confirmed' ? 'Confirmation de votre réservation' : "Inscription sur liste d'attente"}</h1>
        <p>Bonjour ${user.full_name || ''},</p>
        <p>${status === 'confirmed' 
          ? 'Votre réservation a bien été confirmée pour le cours suivant :'
          : "Vous êtes inscrit(e) sur la liste d'attente pour le cours suivant :"}</p>
        <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <h2 style="color: #065f46; margin-top: 0;">${course.title}</h2>
          <p><strong>Date :</strong> ${formattedDate}</p>
          <p><strong>Lieu :</strong> ${course.location}</p>
          <p><strong>Prix :</strong> ${course.price} €</p>
        </div>
        ${status === 'confirmed' 
          ? `<p>Nous vous attendons avec impatience !</p>
             <p>En cas d'empêchement, merci de nous prévenir au plus tôt.</p>`
          : `<p>Nous vous contacterons dès qu'une place se libère.</p>`}
        <p>À bientôt !</p>
        <p style="margin-top: 40px; font-size: 0.9em; color: #6b7280;">
          Les bénéfices sont intégralement reversés à l'association "Un Jardin pour Félix"
        </p>
      `
    });

    // Send notification to admin
    await resend.emails.send({
      from: 'Cuisine Italienne <no-reply@unjardinpourfelix.org>',
      to: 'hugues.rabier@gmail.com',
      subject: `Nouvelle ${status === 'confirmed' ? 'réservation' : 'inscription liste d\'attente'} - ${course.title}`,
      html: `
        <h1>Nouvelle ${status === 'confirmed' ? 'réservation' : 'inscription liste d\'attente'}</h1>
        <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <h2 style="color: #065f46; margin-top: 0;">${course.title}</h2>
          <p><strong>Date :</strong> ${formattedDate}</p>
          <p><strong>Participant :</strong> ${user.full_name || user.email}</p>
          <p><strong>Email :</strong> ${user.email}</p>
          <p><strong>Statut :</strong> ${status === 'confirmed' ? 'Confirmé' : 'Liste d\'attente'}</p>
          ${status === 'confirmed' 
            ? `<p><strong>Places restantes :</strong> ${course.available_seats - 1}</p>`
            : ''}
        </div>
      `
    });

    return new Response(
      JSON.stringify({ message: 'Notifications sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in send-booking-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})