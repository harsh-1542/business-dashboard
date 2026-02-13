const emailService = require('./email.service');
const smsService = require('./sms.service');
const { query } = require('../config/database');

/**
 * Get active communication channels for a workspace
 */
const getWorkspaceCommunicationChannels = async (workspaceId) => {
  const result = await query(
    `SELECT type, provider, config, is_active
     FROM integrations
     WHERE workspace_id = $1 AND is_active = true AND type IN ('email', 'sms')`,
    [workspaceId]
  );

  const channels = {
    email: false,
    sms: false,
  };

  result.rows.forEach(row => {
    if (row.type === 'email') channels.email = true;
    if (row.type === 'sms') channels.sms = true;
  });

  return channels;
};

/**
 * Log automation event
 */
const logAutomation = async ({
  workspaceId,
  eventType,
  entityType,
  entityId,
  actionTaken,
  status = 'success',
  errorMessage = null,
}) => {
  try {
    await query(
      `INSERT INTO automation_logs (workspace_id, event_type, entity_type, entity_id, action_taken, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [workspaceId, eventType, entityType, entityId, actionTaken, status, errorMessage]
    );
  } catch (error) {
    console.error('Failed to log automation:', error);
  }
};

/**
 * Send welcome message (email and/or SMS based on workspace config)
 */
const sendWelcomeMessage = async ({
  workspaceId,
  contactId,
  contactEmail,
  contactPhone,
  contactName,
  businessName,
}) => {
  const channels = await getWorkspaceCommunicationChannels(workspaceId);
  const results = {
    email: null,
    sms: null,
  };

  // Send email if configured and contact has email
  if (channels.email && contactEmail) {
    try {
      results.email = await emailService.sendWelcomeEmail({
        to: contactEmail,
        contactName,
        businessName,
      });

      await logAutomation({
        workspaceId,
        eventType: 'contact_created',
        entityType: 'contact',
        entityId: contactId,
        actionTaken: 'welcome_email_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      await logAutomation({
        workspaceId,
        eventType: 'contact_created',
        entityType: 'contact',
        entityId: contactId,
        actionTaken: 'welcome_email_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  // Send SMS if configured and contact has phone
  if (channels.sms && contactPhone) {
    try {
      results.sms = await smsService.sendWelcomeSMS({
        to: contactPhone,
        contactName,
        businessName,
      });

      await logAutomation({
        workspaceId,
        eventType: 'contact_created',
        entityType: 'contact',
        entityId: contactId,
        actionTaken: 'welcome_sms_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send welcome SMS:', error);
      await logAutomation({
        workspaceId,
        eventType: 'contact_created',
        entityType: 'contact',
        entityId: contactId,
        actionTaken: 'welcome_sms_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  return results;
};

/**
 * Send booking confirmation message
 */
const sendBookingConfirmationMessage = async ({
  workspaceId,
  bookingId,
  contactEmail,
  contactPhone,
  contactName,
  businessName,
  serviceName,
  bookingDate,
  bookingTime,
  duration,
  location,
}) => {
  const channels = await getWorkspaceCommunicationChannels(workspaceId);
  const results = {
    email: null,
    sms: null,
  };

  // Send email if configured and contact has email
  if (channels.email && contactEmail) {
    try {
      results.email = await emailService.sendBookingConfirmation({
        to: contactEmail,
        contactName,
        businessName,
        serviceName,
        bookingDate,
        bookingTime,
        duration,
        location,
      });

      await logAutomation({
        workspaceId,
        eventType: 'booking_created',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'confirmation_email_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      await logAutomation({
        workspaceId,
        eventType: 'booking_created',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'confirmation_email_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  // Send SMS if configured and contact has phone
  if (channels.sms && contactPhone) {
    try {
      results.sms = await smsService.sendBookingConfirmationSMS({
        to: contactPhone,
        contactName,
        businessName,
        serviceName,
        bookingDate,
        bookingTime,
        location,
      });

      await logAutomation({
        workspaceId,
        eventType: 'booking_created',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'confirmation_sms_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send booking confirmation SMS:', error);
      await logAutomation({
        workspaceId,
        eventType: 'booking_created',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'confirmation_sms_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  return results;
};

/**
 * Send booking reminder message
 */
const sendBookingReminderMessage = async ({
  workspaceId,
  bookingId,
  contactEmail,
  contactPhone,
  contactName,
  businessName,
  serviceName,
  bookingDate,
  bookingTime,
  location,
}) => {
  const channels = await getWorkspaceCommunicationChannels(workspaceId);
  const results = {
    email: null,
    sms: null,
  };

  // Send email reminder
  if (channels.email && contactEmail) {
    try {
      results.email = await emailService.sendBookingReminder({
        to: contactEmail,
        contactName,
        businessName,
        serviceName,
        bookingDate,
        bookingTime,
        location,
      });

      await logAutomation({
        workspaceId,
        eventType: 'booking_reminder',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'reminder_email_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send booking reminder email:', error);
      await logAutomation({
        workspaceId,
        eventType: 'booking_reminder',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'reminder_email_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  // Send SMS reminder
  if (channels.sms && contactPhone) {
    try {
      results.sms = await smsService.sendBookingReminderSMS({
        to: contactPhone,
        contactName,
        businessName,
        serviceName,
        bookingDate,
        bookingTime,
        location,
      });

      await logAutomation({
        workspaceId,
        eventType: 'booking_reminder',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'reminder_sms_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send booking reminder SMS:', error);
      await logAutomation({
        workspaceId,
        eventType: 'booking_reminder',
        entityType: 'booking',
        entityId: bookingId,
        actionTaken: 'reminder_sms_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  return results;
};

/**
 * Send form completion request
 */
const sendFormRequestMessage = async ({
  workspaceId,
  formSubmissionId,
  contactEmail,
  contactPhone,
  contactName,
  businessName,
  formName,
  formLink,
}) => {
  const channels = await getWorkspaceCommunicationChannels(workspaceId);
  const results = {
    email: null,
    sms: null,
  };

  // Send email
  if (channels.email && contactEmail) {
    try {
      results.email = await emailService.sendFormRequest({
        to: contactEmail,
        contactName,
        businessName,
        formName,
        formLink,
      });

      await logAutomation({
        workspaceId,
        eventType: 'form_assigned',
        entityType: 'form_submission',
        entityId: formSubmissionId,
        actionTaken: 'form_request_email_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send form request email:', error);
      await logAutomation({
        workspaceId,
        eventType: 'form_assigned',
        entityType: 'form_submission',
        entityId: formSubmissionId,
        actionTaken: 'form_request_email_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  // Send SMS
  if (channels.sms && contactPhone) {
    try {
      results.sms = await smsService.sendFormRequestSMS({
        to: contactPhone,
        contactName,
        businessName,
        formName,
        formLink,
      });

      await logAutomation({
        workspaceId,
        eventType: 'form_assigned',
        entityType: 'form_submission',
        entityId: formSubmissionId,
        actionTaken: 'form_request_sms_sent',
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to send form request SMS:', error);
      await logAutomation({
        workspaceId,
        eventType: 'form_assigned',
        entityType: 'form_submission',
        entityId: formSubmissionId,
        actionTaken: 'form_request_sms_sent',
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  sendWelcomeMessage,
  sendBookingConfirmationMessage,
  sendBookingReminderMessage,
  sendFormRequestMessage,
  getWorkspaceCommunicationChannels,
};