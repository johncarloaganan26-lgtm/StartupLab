import nodemailer from 'nodemailer';
import sharp from 'sharp';

// Email configuration using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to get sender name
const getSender = () => `"StartupLab" <${process.env.EMAIL_USER}>`

function makeTicketNumber(registrationId: string, eventId: string, registeredAt?: string) {
  const base = `${registrationId}|${eventId}|${registeredAt || ''}`;
  const hash = (input: string) => {
    let h = 5381;
    for (let i = 0; i < input.length; i += 1) {
      h = ((h << 5) + h) + input.charCodeAt(i);
    }
    return Math.abs(h >>> 0);
  };

  const p1 = hash(base).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  const p2 = hash(base.split('').reverse().join('')).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `STL-${p1}-${p2}`;
}

function buildTicketSvg(params: {
  ticketNumber: string
  userName: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  status: string
  registrationId: string
}) {
  const esc = (v: string) =>
    String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const generated = new Date().toLocaleString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="820" viewBox="0 0 1400 820">
  <rect width="1400" height="820" fill="#f8fafc"/>
  <rect x="40" y="40" width="1320" height="740" rx="22" fill="#ffffff" stroke="#d1d5db" stroke-width="3"/>
  <rect x="40" y="40" width="1320" height="120" rx="22" fill="#0f172a"/>
  <rect x="40" y="120" width="1320" height="40" fill="#0f172a"/>
  <text x="420" y="105" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">EVENT ACCESS TICKET</text>
  <rect x="1120" y="70" width="190" height="48" rx="24" fill="#dbeafe"/>
  <text x="1148" y="101" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#1d4ed8">${esc(params.status.toUpperCase())}</text>
  <text x="70" y="95" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#38bdf8">StartupLab</text>
  <text x="70" y="130" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4" fill="#cbd5e1">BUSINESS CENTER</text>

  <text x="80" y="230" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#0f172a">${esc(params.eventTitle)}</text>
  <text x="80" y="270" font-family="Arial, sans-serif" font-size="24" fill="#64748b">Present this ticket at the event entrance.</text>

  <rect x="80" y="310" width="600" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="100" y="348" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#64748b">TICKET NUMBER</text>
  <text x="100" y="396" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${esc(params.ticketNumber)}</text>

  <rect x="720" y="310" width="560" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="740" y="348" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#64748b">ATTENDEE</text>
  <text x="740" y="396" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${esc(params.userName)}</text>

  <rect x="80" y="450" width="410" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="100" y="488" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#64748b">DATE</text>
  <text x="100" y="536" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${esc(params.eventDate)}</text>

  <rect x="510" y="450" width="320" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="530" y="488" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#64748b">TIME</text>
  <text x="530" y="536" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${esc(params.eventTime)}</text>

  <rect x="850" y="450" width="430" height="120" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
  <text x="870" y="488" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#64748b">LOCATION</text>
  <text x="870" y="536" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">${esc(params.eventLocation)}</text>

  <rect x="40" y="710" width="1320" height="70" fill="#0f172a"/>
  <text x="70" y="754" font-family="Arial, sans-serif" font-size="20" fill="#cbd5e1">Registration ID: ${esc(params.registrationId.toUpperCase())}</text>
  <text x="900" y="754" font-family="Arial, sans-serif" font-size="20" fill="#cbd5e1">Generated: ${esc(generated)}</text>
</svg>`;
}

// Send forgot password email
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: getSender(),
    to: email,
    subject: 'Password Reset Request - StartupLab',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0b4b8f; text-align: center;">StartupLab Password Reset</h2>
        <p>You recently requested to reset your password for your StartupLab account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #0b4b8f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p style="font-size: 12px; color: #666;">This link will expire in 1 hour.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>StartupLab Business Center</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

// Send event registration confirmation email
export async function sendEventRegistrationEmail(
  email: string,
  userName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  status: string = 'pending',
  ticket?: { registrationId: string; eventId: string; registeredAt?: string | null }
) {
  const statusMessages: Record<string, string> = {
    pending: 'Your registration is pending approval.',
    waitlisted: 'You have been added to the waitlist.',
    confirmed: 'Your registration has been confirmed!',
    cancelled: 'Your registration has been cancelled.',
    attended: 'You have attended the event.',
  };
  
  const statusMessage = statusMessages[status] || statusMessages.pending;
  
  const statusColors: Record<string, string> = {
    pending: '#ffc107',
    waitlisted: '#6c757d',
    confirmed: '#28a745',
    cancelled: '#dc3545',
    attended: '#17a2b8',
  };
  
  const statusColor = statusColors[status] || statusColors.pending;

  const attachments: any[] = [];
  if (status === 'confirmed' && ticket?.registrationId && ticket?.eventId) {
    const ticketNumber = makeTicketNumber(ticket.registrationId, ticket.eventId, ticket.registeredAt || undefined);
    const ticketSvg = buildTicketSvg({
      ticketNumber,
      userName,
      eventTitle,
      eventDate,
      eventTime,
      eventLocation,
      status,
      registrationId: ticket.registrationId,
    });

    try {
      const pngBuffer = await sharp(Buffer.from(ticketSvg, 'utf-8'))
        .png({ quality: 95 })
        .toBuffer();

      attachments.push({
        filename: `startuplab_ticket_${ticketNumber}.png`,
        content: pngBuffer,
        contentType: 'image/png',
      });
    } catch (e) {
      console.error('Ticket PNG generation failed, falling back to SVG:', e);
      attachments.push({
        filename: `startuplab_ticket_${ticketNumber}.svg`,
        content: Buffer.from(ticketSvg, 'utf-8'),
        contentType: 'image/svg+xml',
      });
    }
  }

  const mailOptions: any = {
    from: getSender(),
    to: email,
    subject: `Registration ${status === 'confirmed' ? 'Confirmed' : 'Update'}: ${eventTitle} - StartupLab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${statusColor}; text-align: center;">Registration ${status === 'confirmed' ? 'Confirmed' : 'Update'}</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for registering for <strong>${eventTitle}</strong>!</p>
        <p style="color: ${statusColor}; font-weight: bold;">${statusMessage}</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${statusColor};">Event Details:</h3>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Time:</strong> ${eventTime}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
        </div>

        <p>We look forward to seeing you at the event!</p>
        ${status === 'confirmed' && attachments.length > 0 ? `<p><strong>Your event ticket is attached</strong> to this email for download.</p>` : ''}
        <p>If you have any questions or need to cancel your registration, please contact our support team.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>StartupLab Business Center</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending registration email:', error);
    return false;
  }
}

// Send event registration notification to admin
export async function sendRegistrationNotificationEmail(
  eventTitle: string,
  userName: string,
  userEmail: string,
  eventDate: string,
  status: string = 'pending'
) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
  
  const statusColors: Record<string, string> = {
    pending: '#ffc107',
    confirmed: '#28a745',
    cancelled: '#dc3545',
    noShow: '#dc3545',
    attended: '#17a2b8',
    waitlisted: '#6c757d'
  };
  
  const statusColor = statusColors[status] || '#ffc107';
  
  const mailOptions = {
    from: getSender(),
    to: supportEmail,
    subject: `New Registration (${status.toUpperCase()}): ${eventTitle} - StartupLab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${statusColor}; text-align: center;">New Event Registration - ${status.toUpperCase()}</h2>
        <p>A new attendee has registered for <strong>${eventTitle}</strong>.</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span></p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${statusColor};">Attendee Information:</h3>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${statusColor};">Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>StartupLab Business Center</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending registration notification email:', error);
    return false;
  }
}

// Verify email configuration
export async function verifyEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('Email configuration verified');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}

// Send registration approved notification to support
export async function sendRegistrationApprovedNotification(
  eventTitle: string,
  userName: string,
  userEmail: string,
  eventDate: string
) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
  
  const mailOptions = {
    from: getSender(),
    to: supportEmail,
    subject: `Registration APPROVED: ${eventTitle} - StartupLab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745; text-align: center;">Registration APPROVED</h2>
        <p>A registration has been <strong>APPROVED</strong> for <strong>${eventTitle}</strong>.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745;">Attendee Information:</h3>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745;">Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>StartupLab Business Center</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending registration approved notification email:', error);
    return false;
  }
}

// Send registration rejected notification to support
export async function sendRegistrationRejectedNotification(
  eventTitle: string,
  userName: string,
  userEmail: string,
  eventDate: string,
  rejectionReason?: string
) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
  
  const mailOptions = {
    from: getSender(),
    to: supportEmail,
    subject: `Registration REJECTED: ${eventTitle} - StartupLab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc3545; text-align: center;">Registration REJECTED</h2>
        <p>A registration has been <strong>REJECTED</strong> for <strong>${eventTitle}</strong>.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc3545;">Attendee Information:</h3>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #dc3545;">Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
        </div>

        ${rejectionReason ? `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404;">Rejection Reason:</h3>
          <p>${rejectionReason}</p>
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>StartupLab Business Center</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending registration rejected notification email:', error);
    return false;
  }
}

// Send attendance marked notification to support
export async function sendAttendanceNotification(
  eventTitle: string,
  userName: string,
  userEmail: string,
  eventDate: string
) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
  
  const mailOptions = {
    from: getSender(),
    to: supportEmail,
    subject: `Attendance Marked: ${eventTitle} - StartupLab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #17a2b8; text-align: center;">Attendance Marked</h2>
        <p>An attendee has been marked as <strong>ATTENDED</strong> for <strong>${eventTitle}</strong>.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #17a2b8;">Attendee Information:</h3>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #17a2b8;">Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>StartupLab Business Center</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending attendance notification email:', error);
    return false;
  }
}

// Send thank you email to guest who submitted contact form
export async function sendContactFormConfirmationEmail(
  email: string,
  name: string
) {
  const mailOptions = {
    from: getSender(),
    to: email,
    subject: 'Thank You for Contacting StartupLab',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0b4b8f; text-align: center;">Thank You for Contacting Us!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and would like to thank you for getting in touch with StartupLab.</p>
        <p>Our team will review your inquiry and get back to you as soon as possible, typically within 24 hours.</p>
        <p>In the meantime, feel free to browse our upcoming events:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="background-color: #0b4b8f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Browse Events
          </a>
        </div>
        <p>We look forward to connecting with you at our upcoming events!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p><strong>StartupLab Business Center</strong></p>
          <p>2nd Floor, Pearl Plaza Building, General Trias, Cavite Philippines</p>
          <p>Help Desk: support@startuplab.example.com</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending contact form confirmation email:', error);
    return false;
  }
}

// Send contact form notification to admin
export async function sendContactFormNotificationToAdmin(
  name: string,
  email: string,
  company: string,
  mobile: string,
  eventType: string,
  message: string
) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
  
  const mailOptions = {
    from: getSender(),
    to: supportEmail,
    subject: `New Contact Form Submission from ${name} - StartupLab`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0b4b8f; text-align: center;">New Contact Form Submission</h2>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0b4b8f;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company/Organization:</strong> ${company || 'Not provided'}</p>
          <p><strong>Mobile:</strong> ${mobile}</p>
          <p><strong>Event Type Interested In:</strong> ${eventType || 'Not specified'}</p>
        </div>

        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0b4b8f;">Message:</h3>
          <p>${message}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>This is an automated notification from the StartupLab contact form.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending contact form notification to admin:', error);
    return false;
  }
}
