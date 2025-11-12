import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const generateCertificate = async (
  userId: string,
  courseId: string,
  courseName: string,
  userName: string
) => {
  try {
    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('user_certificates')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      toast.info('Certificate already generated for this course');
      return existing.id;
    }

    // Create certificate record
    const { data, error } = await supabase
      .from('user_certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        issued_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('🎉 Certificate generated! Check your certificates section.');
    return data.id;
  } catch (error) {
    console.error('Certificate generation error:', error);
    toast.error('Failed to generate certificate');
    return null;
  }
};

export const downloadCertificatePDF = async (
  certificateId: string,
  userName: string,
  courseName: string,
  completionDate: string
) => {
  try {
    // Create a simple HTML certificate
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Georgia', serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            text-align: center;
            border: 10px solid #f0f0f0;
          }
          .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
          }
          h1 {
            color: #333;
            font-size: 48px;
            margin: 20px 0;
            font-weight: 300;
            letter-spacing: 2px;
          }
          h2 {
            color: #667eea;
            font-size: 32px;
            margin: 30px 0;
            font-weight: bold;
          }
          .recipient {
            font-size: 42px;
            color: #333;
            font-weight: bold;
            margin: 30px 0;
            padding: 20px 0;
            border-top: 2px solid #667eea;
            border-bottom: 2px solid #667eea;
          }
          .course {
            font-size: 28px;
            color: #555;
            margin: 20px 0;
          }
          .date {
            color: #888;
            font-size: 18px;
            margin-top: 40px;
          }
          .signature {
            margin-top: 60px;
            padding-top: 10px;
            border-top: 2px solid #333;
            display: inline-block;
            min-width: 200px;
          }
          .footer {
            margin-top: 40px;
            color: #888;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#667eea"/>
              <text x="50" y="65" font-size="50" fill="white" text-anchor="middle" font-weight="bold">CT1</text>
            </svg>
          </div>
          <h1>Certificate of Completion</h1>
          <p style="font-size: 18px; color: #666;">This is to certify that</p>
          <div class="recipient">${userName}</div>
          <p style="font-size: 18px; color: #666;">has successfully completed the course</p>
          <div class="course">${courseName}</div>
          <div class="date">Issued on ${new Date(completionDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</div>
          <div class="signature">
            <div style="font-weight: bold; font-size: 20px;">CT1 Training</div>
            <div style="color: #888; font-size: 14px;">Authorized Signature</div>
          </div>
          <div class="footer">
            Certificate ID: ${certificateId}<br>
            CT1 Contractor Hub - One-Up Your Business
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(certificateHTML);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      toast.error('Please allow popups to download certificate');
    }
  } catch (error) {
    console.error('Certificate download error:', error);
    toast.error('Failed to download certificate');
  }
};