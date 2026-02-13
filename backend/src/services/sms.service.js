const twilio = require('twilio');

let twilioClient = null;

// Initialize Twilio
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('✅ Twilio initialized');
} else {
  console.warn('⚠️  Twilio credentials not configured');
}

/**
 * Send SMS using Twilio
 */
const sendSMS = async ({ to, message }) => {
  try {
    if (!twilioClient) {
      console.log('📱 SMS would be sent to:', to);
      console.log('Message:', message);
      return {
        success: true,
        message: 'Twilio not configured - SMS logged to console',
        mockMode: true,
      };
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log(`✅ SMS sent to ${to}`);
    
    return {
      success: true,
      sid: response.sid,
      status: response.status,
    };
  } catch (error) {
    console.error('❌ Twilio error:', error.message);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send welcome SMS to new contact
 */
const sendWelcomeSMS = async ({ to, contactName, businessName }) => {
  const message = `Hi ${contactName || 'there'}! Welcome to ${businessName}. We've received your inquiry and will get back to you soon. Reply STOP to unsubscribe.`;
  
  return await sendSMS({ to, message });
};

/**
 * Send booking confirmation SMS
 */
const sendBookingConfirmationSMS = async ({
  to,
  contactName,
  businessName,
  serviceName,
  bookingDate,
  bookingTime,
  location,
}) => {
  const message = `Hi ${contactName || 'there'}! Your ${serviceName} booking at ${businessName} is confirmed for ${bookingDate} at ${bookingTime}. Location: ${location}. See you there!`;
  
  return await sendSMS({ to, message });
};

/**
 * Send booking reminder SMS
 */
const sendBookingReminderSMS = async ({
  to,
  contactName,
  businessName,
  serviceName,
  bookingDate,
  bookingTime,
  location,
}) => {
  const message = `Reminder: ${contactName || 'Hi there'}, you have a ${serviceName} appointment tomorrow at ${bookingTime}. Location: ${location}. ${businessName}`;
  
  return await sendSMS({ to, message });
};

/**
 * Send form completion request SMS
 */
const sendFormRequestSMS = async ({
  to,
  contactName,
  businessName,
  formName,
  formLink,
}) => {
  const message = `Hi ${contactName || 'there'}! Please complete the ${formName} form for ${businessName}: ${formLink}`;
  
  return await sendSMS({ to, message });
};

module.exports = {
  sendSMS,
  sendWelcomeSMS,
  sendBookingConfirmationSMS,
  sendBookingReminderSMS,
  sendFormRequestSMS,
};