const db = require('./db/db');
const dotenv = require('dotenv');
dotenv.config();

exports.getTotalAttendees = async (req, res) => {
  const attendees = await db.checkRemainingEventCapacity(req.params.eventid);
  // 200 if event found, 404 if not found
  if (!attendees) {
    res.status(404).send();
  } else {
    res.status(200).json(attendees);
  }
};
