const { query, transaction } = require('../config/database');
const messagingService = require('../services/messaging.service');

/**
 * Create a booking (PUBLIC - no authentication)
 * This is used by customers on the public booking page
 */
const createPublicBooking = async (req, res, next) => {
  try {
    const {
      workspaceId,
      serviceTypeId,
      firstName,
      lastName,
      email,
      phone,
      bookingDate,
      bookingTime,
      notes,
    } = req.body;

    // Verify workspace exists and is active
    const workspaceResult = await query(
      'SELECT id, business_name, timezone, is_active FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    const workspace = workspaceResult.rows[0];

    if (!workspace.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Bookings are not currently available',
      });
    }

    // Verify service type exists and is active
    const serviceTypeResult = await query(
      `SELECT id, name, duration_minutes, location, is_active
       FROM service_types
       WHERE id = $1 AND workspace_id = $2`,
      [serviceTypeId, workspaceId]
    );

    if (serviceTypeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service type not found',
      });
    }

    const serviceType = serviceTypeResult.rows[0];

    if (!serviceType.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This service is not currently available for booking',
      });
    }

    // Verify at least email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required',
      });
    }

    // Create contact, conversation, and booking in a transaction
    const result = await transaction(async (client) => {
      // Check if contact already exists
      let contact;
      const existingContactResult = await client.query(
        `SELECT id, first_name, last_name, email, phone
         FROM contacts
         WHERE workspace_id = $1 AND (email = $2 OR phone = $3)
         LIMIT 1`,
        [workspaceId, email || null, phone || null]
      );

      if (existingContactResult.rows.length > 0) {
        contact = existingContactResult.rows[0];
      } else {
        // Create new contact
        const contactResult = await client.query(
          `INSERT INTO contacts (workspace_id, first_name, last_name, email, phone, source)
           VALUES ($1, $2, $3, $4, $5, 'booking')
           RETURNING id, first_name, last_name, email, phone`,
          [workspaceId, firstName, lastName, email || null, phone || null]
        );
        contact = contactResult.rows[0];
      }

      // Create conversation if doesn't exist
      const conversationCheck = await client.query(
        `SELECT id FROM conversations WHERE workspace_id = $1 AND contact_id = $2`,
        [workspaceId, contact.id]
      );

      let conversationId;
      if (conversationCheck.rows.length > 0) {
        conversationId = conversationCheck.rows[0].id;
      } else {
        const conversationResult = await client.query(
          `INSERT INTO conversations (workspace_id, contact_id)
           VALUES ($1, $2)
           RETURNING id`,
          [workspaceId, contact.id]
        );
        conversationId = conversationResult.rows[0].id;
      }

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (workspace_id, contact_id, service_type_id, booking_date, booking_time, status, notes)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING id, workspace_id, contact_id, service_type_id, booking_date, booking_time, status, notes, created_at`,
        [workspaceId, contact.id, serviceTypeId, bookingDate, bookingTime, notes || null]
      );
      const booking = bookingResult.rows[0];

      // Add system message to conversation
      await client.query(
        `INSERT INTO messages (conversation_id, sender_type, channel, content)
         VALUES ($1, 'system', 'system', $2)`,
        [
          conversationId,
          `New booking created: ${serviceType.name} on ${bookingDate} at ${bookingTime}`,
        ]
      );

      return { contact, booking };
    });

    // Format date for display
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Send booking confirmation asynchronously
    setImmediate(async () => {
      try {
        await messagingService.sendBookingConfirmationMessage({
          workspaceId,
          bookingId: result.booking.id,
          contactEmail: email,
          contactPhone: phone,
          contactName: `${firstName} ${lastName}`,
          businessName: workspace.business_name,
          serviceName: serviceType.name,
          bookingDate: formattedDate,
          bookingTime: bookingTime,
          duration: serviceType.duration_minutes,
          location: serviceType.location,
        });
      } catch (error) {
        console.error('Failed to send booking confirmation:', error);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully! You will receive a confirmation shortly.',
      data: {
        booking: {
          id: result.booking.id,
          serviceType: serviceType.name,
          date: bookingDate,
          time: bookingTime,
          duration: serviceType.duration_minutes,
          location: serviceType.location,
          status: result.booking.status,
        },
        contact: {
          id: result.contact.id,
          name: `${firstName} ${lastName}`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings for a workspace (PRIVATE - Owner/Staff only)
 */
const getWorkspaceBookings = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check if user has access to workspace
    const accessCheck = await query(
      `SELECT w.id, w.owner_id 
       FROM workspaces w
       LEFT JOIN workspace_staff ws ON w.id = ws.workspace_id AND ws.user_id = $2
       WHERE w.id = $1 AND (w.owner_id = $2 OR ws.user_id = $2)`,
      [workspaceId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this workspace',
      });
    }

    // Get bookings with related data
    const result = await query(
      `SELECT b.id, b.booking_date, b.booking_time, b.status, b.notes, b.created_at,
              c.id as contact_id, c.first_name, c.last_name, c.email, c.phone,
              st.id as service_type_id, st.name as service_name, st.duration_minutes, st.location
       FROM bookings b
       JOIN contacts c ON b.contact_id = c.id
       JOIN service_types st ON b.service_type_id = st.id
       WHERE b.workspace_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [workspaceId]
    );

    const bookings = result.rows.map(b => ({
      id: b.id,
      date: b.booking_date,
      time: b.booking_time,
      status: b.status,
      notes: b.notes,
      createdAt: b.created_at,
      contact: {
        id: b.contact_id,
        firstName: b.first_name,
        lastName: b.last_name,
        email: b.email,
        phone: b.phone,
      },
      serviceType: {
        id: b.service_type_id,
        name: b.service_name,
        duration: b.duration_minutes,
        location: b.location,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        bookings,
        count: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status (PRIVATE - Owner/Staff only)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Valid statuses
    const validStatuses = ['pending', 'confirmed', 'completed', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Check if booking exists and user has access
    const bookingCheck = await query(
      `SELECT b.id, b.workspace_id, w.owner_id
       FROM bookings b
       JOIN workspaces w ON b.workspace_id = w.id
       LEFT JOIN workspace_staff ws ON w.id = ws.workspace_id AND ws.user_id = $2
       WHERE b.id = $1 AND (w.owner_id = $2 OR ws.user_id = $2)`,
      [bookingId, userId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have access',
      });
    }

    // Update booking status
    const result = await query(
      `UPDATE bookings
       SET status = $1
       WHERE id = $2
       RETURNING id, workspace_id, contact_id, service_type_id, booking_date, booking_time, status, notes, created_at, updated_at`,
      [status, bookingId]
    );

    const booking = result.rows[0];

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking: {
          id: booking.id,
          date: booking.booking_date,
          time: booking.booking_time,
          status: booking.status,
          notes: booking.notes,
          updatedAt: booking.updated_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPublicBooking,
  getWorkspaceBookings,
  updateBookingStatus,
};