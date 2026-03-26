import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { buildCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { enrollmentId, format } = await req.json();

    if (!enrollmentId) {
      return new Response(JSON.stringify({ error: 'Enrollment ID is required' }), {
        status: 400,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching notes for enrollment:', enrollmentId);

    // Fetch user notes with lesson and module information
    const { data: notes, error: notesError } = await supabaseClient
      .from('user_lesson_notes')
      .select(`
        *,
        course_lessons (
          title,
          course_modules (
            title,
            training_courses (
              title
            )
          )
        )
      `)
      .eq('enrollment_id', enrollmentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch notes' }), {
        status: 500,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    if (!notes || notes.length === 0) {
      return new Response(JSON.stringify({ error: 'No notes found' }), {
        status: 404,
        headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const courseName = notes[0]?.course_lessons?.course_modules?.training_courses?.title || 'Course';

    if (format === 'text') {
      // Generate plain text format
      let textContent = `Notes for: ${courseName}\n`;
      textContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
      textContent += '=' .repeat(50) + '\n\n';

      notes.forEach((note, index) => {
        const moduleTitle = note.course_lessons?.course_modules?.title || 'Unknown Module';
        const lessonTitle = note.course_lessons?.title || 'Unknown Lesson';
        
        textContent += `${index + 1}. ${moduleTitle} - ${lessonTitle}\n`;
        textContent += `Date: ${new Date(note.created_at).toLocaleDateString()}\n`;
        textContent += '-'.repeat(30) + '\n';
        textContent += note.content + '\n\n';
      });

      return new Response(textContent, {
        headers: {
          ...buildCorsHeaders(req),
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="${courseName.replace(/[^\w\s-]/g, '')}-notes.txt"`,
        },
      });
    }

    // Default to JSON format for now (can extend to PDF later)
    return new Response(JSON.stringify({
      courseName,
      exportDate: new Date().toISOString(),
      notes: notes.map(note => ({
        moduleTitle: note.course_lessons?.course_modules?.title,
        lessonTitle: note.course_lessons?.title,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      }))
    }), {
      headers: {
        ...buildCorsHeaders(req),
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${courseName.replace(/[^\w\s-]/g, '')}-notes.json"`,
      },
    });

  } catch (error) {
    console.error('Export notes error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});