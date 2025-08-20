const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Create nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.pass,
  },
});

// Send welcome email when a new user is created
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  const mailOptions = {
    from: functions.config().gmail.email,
    to: user.email,
    subject: 'Welcome to Synaphack Hackathon 🚀',
    text: `Hi ${user.displayName || 'Participant'}, thanks for registering!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6cf7;">Welcome to Synaphack! 🚀</h2>
        <p>Hi <b>${user.displayName || 'Participant'}</b>,</p>
        <p>Thank you for registering for our hackathon platform. We're excited to have you join our community of innovators!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse upcoming hackathon events</li>
          <li>Register for events that interest you</li>
          <li>Form or join teams</li>
          <li>Submit your projects</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy hacking!</p>
        <p>The Synaphack Team</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions)
    .then(() => console.log(`Welcome email sent to ${user.email}`))
    .catch((error) => console.error('Error sending welcome email:', error));
});

// Send team invitation email
exports.sendTeamInvite = functions.firestore
  .document('teamInvites/{inviteId}')
  .onCreate(async (snapshot, context) => {
    const invite = snapshot.data();
    
    if (!invite || !invite.inviteeEmail) {
      console.error('Invalid team invite data');
      return null;
    }

    try {
      // Get event details
      const eventDoc = await db.collection('events').doc(invite.eventId).get();
      const event = eventDoc.exists ? eventDoc.data() : { title: 'Hackathon Event' };

      const mailOptions = {
        from: functions.config().gmail.email,
        to: invite.inviteeEmail,
        subject: `Team Invitation: ${invite.teamName} - ${event.title}`,
        text: `You've been invited to join team ${invite.teamName} for ${event.title}. Use invite code: ${context.params.inviteId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a6cf7;">Team Invitation 👥</h2>
            <p>Hi there,</p>
            <p>You've been invited to join <b>${invite.teamName}</b> for the <b>${event.title}</b> hackathon!</p>
            <p>To accept this invitation, click the link below:</p>
            <p>
              <a href="${functions.config().app.url || 'https://synaphack.com'}/join-team/${context.params.inviteId}" 
                 style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </p>
            <p>Or use this invite code: <b>${context.params.inviteId}</b></p>
            <p>This invitation will expire in 48 hours.</p>
            <p>Good luck and happy hacking!</p>
            <p>The Synaphack Team</p>
          </div>
        `
      };

      return transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending team invite email:', error);
      return null;
    }
  });

// Send judge invitation email
exports.sendJudgeInvite = functions.firestore
  .document('judgeInvites/{inviteId}')
  .onCreate(async (snapshot, context) => {
    const invite = snapshot.data();
    
    if (!invite || !invite.judgeEmail) {
      console.error('Invalid judge invite data');
      return null;
    }

    try {
      // Get event details
      const eventDoc = await db.collection('events').doc(invite.eventId).get();
      const event = eventDoc.exists ? eventDoc.data() : { title: 'Hackathon Event' };

      const mailOptions = {
        from: functions.config().gmail.email,
        to: invite.judgeEmail,
        subject: `Judge Invitation: ${event.title}`,
        text: `You've been invited to be a judge for ${event.title}. Use invite code: ${context.params.inviteId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a6cf7;">Judge Invitation 🏆</h2>
            <p>Hi there,</p>
            <p>You've been invited to be a judge for the <b>${event.title}</b> hackathon!</p>
            <p>To accept this invitation, click the link below:</p>
            <p>
              <a href="${functions.config().app.url || 'https://synaphack.com'}/join-judge/${context.params.inviteId}" 
                 style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </p>
            <p>Or use this invite code: <b>${context.params.inviteId}</b></p>
            <p>This invitation will expire in 7 days.</p>
            <p>Thank you for your participation!</p>
            <p>The Synaphack Team</p>
          </div>
        `
      };

      return transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending judge invite email:', error);
      return null;
    }
  });

// Send submission confirmation email
exports.sendSubmissionConfirmation = functions.firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snapshot, context) => {
    const submission = snapshot.data();
    
    if (!submission || !submission.submitterEmail) {
      console.error('Invalid submission data');
      return null;
    }

    try {
      // Get event details
      const eventDoc = await db.collection('events').doc(submission.eventId).get();
      const event = eventDoc.exists ? eventDoc.data() : { title: 'Hackathon Event' };

      // Get round details if applicable
      let roundName = 'Main Submission';
      if (submission.roundId && submission.roundId !== 'main') {
        const rounds = event.rounds || [];
        const round = rounds.find(r => r.id === submission.roundId);
        if (round) roundName = round.name;
      }

      const mailOptions = {
        from: functions.config().gmail.email,
        to: submission.submitterEmail,
        subject: `Submission Confirmed: ${event.title} - ${roundName}`,
        text: `Your submission for ${event.title} (${roundName}) has been received.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a6cf7;">Submission Confirmed ✅</h2>
            <p>Hi ${submission.submitterName || 'there'},</p>
            <p>Your submission for <b>${event.title}</b> (${roundName}) has been successfully received!</p>
            <p><b>Project Name:</b> ${submission.projectName || 'N/A'}</p>
            <p><b>Submission Time:</b> ${new Date().toLocaleString()}</p>
            <p>Our judges will review your submission and provide feedback. You'll be notified of any updates.</p>
            <p>Good luck!</p>
            <p>The Synaphack Team</p>
          </div>
        `
      };

      return transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending submission confirmation email:', error);
      return null;
    }
  });

// Send bulk event announcements
exports.sendEventAnnouncement = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { eventId, subject, message, recipientType } = data;
  
  if (!eventId || !subject || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Get event details
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }
    const event = eventDoc.data();

    // Check if the caller is the event organizer
    if (event.organizerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the event organizer can send announcements');
    }

    // Get recipients based on type
    let recipientEmails = [];
    
    if (recipientType === 'all' || recipientType === 'participants') {
      // Get all participants
      const registrationsSnapshot = await db.collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .get();
      
      registrationsSnapshot.forEach(doc => {
        const registration = doc.data();
        if (registration.email && !recipientEmails.includes(registration.email)) {
          recipientEmails.push(registration.email);
        }
      });
    }
    
    if (recipientType === 'all' || recipientType === 'judges') {
      // Get all judges
      const judgeAssignmentsSnapshot = await db.collection('judgeAssignments')
        .where('eventId', '==', eventId)
        .where('status', '==', 'active')
        .get();
      
      judgeAssignmentsSnapshot.forEach(doc => {
        const assignment = doc.data();
        if (assignment.judgeEmail && !recipientEmails.includes(assignment.judgeEmail)) {
          recipientEmails.push(assignment.judgeEmail);
        }
      });
    }

    if (recipientEmails.length === 0) {
      throw new functions.https.HttpsError('not-found', 'No recipients found');
    }

    // Send emails in batches of 50 (Gmail daily limit is ~500)
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const batch = recipientEmails.slice(i, i + batchSize);
      batches.push(batch);
    }

    // Process each batch
    const results = await Promise.all(batches.map(async (batch) => {
      // For Gmail, we need to send individual emails rather than using BCC
      // as Gmail has limits on the number of recipients per email
      const emailPromises = batch.map(email => {
        const mailOptions = {
          from: functions.config().gmail.email,
          to: email,
          subject: `${event.title}: ${subject}`,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a6cf7;">${event.title}</h2>
              <h3>${subject}</h3>
              <div>${message}</div>
              <hr>
              <p><small>This is an automated message from the Synaphack platform.</small></p>
            </div>
          `
        };

        return transporter.sendMail(mailOptions);
      });

      return Promise.all(emailPromises);
    }));

    return { success: true, recipientCount: recipientEmails.length };
  } catch (error) {
    console.error('Error sending event announcement:', error);
    throw new functions.https.HttpsError('internal', 'Error sending announcement');
  }
});

// Send winner announcement emails
exports.sendWinnerAnnouncement = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { eventId, winners } = data;
  
  if (!eventId || !winners || !Array.isArray(winners)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Get event details
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }
    const event = eventDoc.data();

    // Check if the caller is the event organizer
    if (event.organizerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the event organizer can announce winners');
    }

    // Send emails to winners
    const emailPromises = winners.map(async (winner) => {
      const { teamName, category, rank, emails } = winner;
      
      if (!teamName || !category || !rank || !emails || !Array.isArray(emails)) {
        console.error('Invalid winner data:', winner);
        return null;
      }

      const rankText = rank === 1 ? '1st Place' : 
                      rank === 2 ? '2nd Place' : 
                      rank === 3 ? '3rd Place' : 
                      `${rank}th Place`;

      // For each team member email
      const emailPromises = emails.map(email => {
        const mailOptions = {
          from: functions.config().gmail.email,
          to: email,
          subject: `Congratulations! You're a Winner in ${event.title}`,
          text: `Congratulations! Your team ${teamName} has won ${rankText} in the ${category} category for ${event.title}.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a6cf7;">🏆 Congratulations! 🏆</h2>
              <p>Dear ${teamName} team member,</p>
              <p>We're thrilled to announce that your project has won <b>${rankText}</b> in the <b>${category}</b> category for <b>${event.title}</b>!</p>
              <p>This is an outstanding achievement and recognition of your hard work, creativity, and technical skills.</p>
              <p>Please check your dashboard for more details about your prize and next steps.</p>
              <p>Congratulations again!</p>
              <p>The Synaphack Team</p>
            </div>
          `
        };

        return transporter.sendMail(mailOptions);
      });

      return Promise.all(emailPromises);
    });

    // Flatten the array of promises and filter out any null values
    const flattenedPromises = (await Promise.all(emailPromises)).flat().filter(Boolean);

    return { success: true, winnersNotified: winners.length, emailsSent: flattenedPromises.length };
  } catch (error) {
    console.error('Error sending winner announcements:', error);
    throw new functions.https.HttpsError('internal', 'Error sending winner announcements');
  }
});