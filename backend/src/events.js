const db = require('./db');
const dotenv = require('dotenv');
dotenv.config();

exports.create = async (req, res) => {
  const event = req.body;
  const eventid =
      await db.insertEvent(event.eventname, event.starttime, event.endtime,
      req.payload.id, event.capacity, event.description);
  // add generated event ID to event object before returning
  event.eventid = eventid;
  res.status(201).send(event);
};

exports.delete = async (req, res) => {
  const event = await db.getEventByID(req.params.eventid);
  // 404 if event not found, otherwise delete and send 200
  if (!event) {
    res.status(404).send();
  } else {
    await db.deleteEvent(req.params.eventid);
    res.status(200).send();
  }
};

exports.getEvents = async (req, res) => {
  if (req.query.start && req.query.end) {
    // if start and end query provided, query DB for events in between
    const events = await db.getEventsByRange(req.query.start, req.query.end);
    res.status(200).json(events);
  } else if (req.query.start) {
    // if only start query provided, query DB for events starting after that time
    const events = await db.getEventsByStart(req.query.start);
    res.status(200).json(events);
  } else if (req.query.end) {
    // if only end query provided, query DB for events ending before that time
    const events = await db.getEventsByEnd(req.query.end);
    res.status(200).json(events);
  } else {
    // if no queries provided, query DB for all events
    // if the account is a business account, only show the events made by that business
    if (req.payload.userType == "business") {
      const events = await db.getBusinessEvents(req.payload.id);
      res.status(200).json(events);
    } else if (req.payload.userType == "user") {
      const events = await db.getEvents();
      res.status(200).json(events);
    }
  }
};

exports.getEventByID = async (req, res) => {
  const event = await db.getEventByID(req.params.eventid);
  // 200 if event found, 404 if not found
  if (!event) {
    res.status(404).send();
  } else {
    res.status(200).json(event);
  }
};

exports.signup = async (req, res) => {
  const eventid = req.params.eventid;
  const userid = req.payload.id;  // this doesn't work, userID is undefined
  const event = await db.getEventByID(req.params.eventid);
  console.log(event.capacity);
  // 404 if event not found
  if (!event) {
    res.status(404).send();
  } else {
    const userAttending = await db.checkUserAttending(eventid, userid);
    if (userAttending) {
      // if user already attending event, send 409
      res.status(409).send();
    } else {
      // if capacity is full
      const capacity = await db.checkRemainingEventCapacity(eventid);
      console.log(capacity.length);
      if (capacity.length === event.capacity) {
        console.log("Event is already full.");
      } else {
        // if not already attending, add user to attendees then send 200
        await db.insertAttendees(eventid, userid);
        res.status(200).send();
      }
    }
  }
};
