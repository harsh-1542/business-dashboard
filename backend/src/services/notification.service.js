const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendWelcomeEmail = async (toEmail, firstName, businessName, replyToEmail) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not set. Email not sent.');
    return;
  }

  const msg = {
    to: toEmail,
    from: 'contact@harshshrimali.in',
    replyTo: replyToEmail,
    subject: `We've received your message - ${businessName}`,
    text: `Hi ${firstName},\n\nThanks for reaching out to ${businessName}. We have received your inquiry and a member of our team will get back to you shortly.\n\nBest regards,\n${businessName} Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to ${businessName}</h2>
        <p>Hi ${firstName},</p>
        <p>Thanks for reaching out to <strong>${businessName}</strong>. We have received your inquiry and a member of our team will get back to you shortly.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">You received this email because you contacted ${businessName}.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

const sendReplyEmail = async (toEmail, messageContent, businessName, replyToEmail) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not set. Reply email not sent.');
    return;
  }

  const msg = {
    to: toEmail,
    from: 'contact@harshshrimali.in',
    replyTo: replyToEmail,
    subject: `New message from ${businessName}`, // "Re: form..." might be better? But this is simple.
    text: messageContent,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #333;">${businessName} sent you a message</h3>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; font-size: 14px; line-height: 1.5;">${messageContent}</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">To reply, simply reply to this email.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Reply email sent to ${toEmail}`);
  } catch (error) {
    console.error('SendGrid reply error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
};

const sendBookingConfirmationEmail = async (toEmail, firstName, businessName, serviceName, bookingDate, bookingTime, replyToEmail) => {
  if (!process.env.SENDGRID_API_KEY) return;

  const msg = {
    to: toEmail,
    from: 'contact@harshshrimali.in',
    replyTo: replyToEmail,
    subject: `Booking Confirmed: ${serviceName} with ${businessName}`,
    text: `Hi ${firstName},\n\nYour booking for ${serviceName} with ${businessName} is confirmed for ${bookingDate} at ${bookingTime}.\n\nSee you soon!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmed!</h2>
        <p>Hi ${firstName},</p>
        <p>Your booking for <strong>${serviceName}</strong> with <strong>${businessName}</strong> has been successfully scheduled.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${bookingDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${bookingTime}</p>
          <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
        </div>
        <p>We look forward to seeing you!</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Booking confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error('SendGrid booking error:', error);
  }
};

module.exports = { sendWelcomeEmail, sendReplyEmail, sendBookingConfirmationEmail };
