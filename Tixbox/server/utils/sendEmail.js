const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Never throws - a failed email must not break a booking.
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!transporter) {
      console.log(`\n[EMAIL - SMTP not configured] To: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, ' ')}\n`);
      return;
    }
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
};

const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const bookingConfirmationEmail = (user, booking, show, movie, theatre) => ({
  to: user.email,
  subject: `Booking Confirmed - ${movie.title} (${booking.bookingCode})`,
  html: `
    <h2>Your tickets are confirmed 🎬</h2>
    <p>Hi ${user.name},</p>
    <p><b>Booking ID:</b> ${booking.bookingCode}</p>
    <p><b>Movie:</b> ${movie.title}</p>
    <p><b>Theatre:</b> ${theatre.name}, ${theatre.city} (${show.screenName})</p>
    <p><b>Show time:</b> ${fmt(show.startTime)}</p>
    <p><b>Seats:</b> ${booking.seats.map((s) => s.seatId).join(', ')}</p>
    <hr/>
    <p><b>Payment receipt</b></p>
    <p>Method: ${booking.payment.method}<br/>Transaction ID: ${booking.payment.transactionId}<br/>
    Amount paid: ₹${booking.totalAmount}</p>
    <p>Enjoy the show!<br/>- iMovies</p>`,
});

const bookingCancelledEmail = (user, booking, movie) => ({
  to: user.email,
  subject: `Booking Cancelled - ${booking.bookingCode}`,
  html: `<p>Hi ${user.name},</p><p>Your booking <b>${booking.bookingCode}</b> for <b>${movie.title}</b> has been cancelled.
  ${booking.payment.status === 'refunded' ? `A refund of ₹${booking.totalAmount} has been initiated.` : ''}</p><p>- iMovies</p>`,
});

const newShowEmail = (user, movie, theatre, show) => ({
  to: user.email,
  subject: `Now booking: ${movie.title}`,
  html: `<p>Hi ${user.name},</p><p><b>${movie.title}</b> from your watchlist is now available at ${theatre.name}, ${theatre.city}
  on ${fmt(show.startTime)}. Book your seats now on iMovies!</p>`,
});

module.exports = { sendEmail, bookingConfirmationEmail, bookingCancelledEmail, newShowEmail };
