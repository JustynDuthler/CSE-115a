// Database connection File
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

pool.connect()

// basic testing query
exports.dbTest = async() => {
    pool.query('SELECT * FROM USERS', (err, res) => {
        console.log(err, res);
        pool.end;
    });
};

// Inserts a new event entry into the database
// Returns the newly created event eventID
exports.insertEvent = async (eventName, startTime, endTime, businessID, capacity=null) => {
  const insert = 'INSERT INTO Events (eventName, startTime, endTime, businessID, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING eventID';
  const query = {
    text: insert,
    values: [eventName, startTime, endTime, businessID, capacity],
  };
  
  const {rows} = await pool.query(query);
  return rows[0].eventid;
};

exports.insertBusinessAccount = async (businessName, password, phoneNumber, businessEmail) => {
  const insert = 'INSERT INTO Businesses (businessName, Password, phoneNumber, businessEmail) VALUES ($1, $2, $3, $4) RETURNING businessID';
  const query = {
    text: insert,
    values: [businessName, password, phoneNumber, businessEmail],
  };

  const {rows} = await pool.query(query);
  return rows[0].businessID;
};

// retrieve by event uuid 
// retrieve startTime and endTime

exports.getEventID = async (eventID) => {
  const queryText = 'SELECT * FROM Events e WHERE  e.eventID = $1';
  const query = {
    text: queryText,
    values: [eventID],
  };
  
  const {rows} = await pool.query(query);
  console.log(rows[0])
  return rows[0];
}

exports.insertUserAccount = async (userName, password, email) => {
  const insert = 'INSERT INTO Users (userName, Password, userEmail) VALUES ($1, $2, $3) RETURNING userID';
  const query = {
    text: insert,
    values: [userName, password, email],
  };

  const {rows} = await pool.query(query);
  return rows[0].userID;
};

console.log(`Connected to database '${process.env.DB}'`);