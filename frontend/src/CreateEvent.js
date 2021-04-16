import React from 'react';
const Auth = require('./libs/Auth');
/**
 * CreateEvent Function
 */
export default function CreateEvent() {
  const[eventName, changeName] = React.useState("");
  const[startDate, changeStartDate] = React.useState("");
  const[startTime, changeStartTime] = React.useState("");
  const[endDate, changeEndDate] = React.useState("");
  const[endTime, changeEndTime] = React.useState("");
  const[capacity, changeCapacity] = React.useState("");
  const[repeat, changeRepeat] = React.useState(false);

  /**
   * Handles form submission
   * @param {event} event
   */
  function handleSubmit(event) {
    event.preventDefault();
    const foundToken = localStorage.getItem('auth_token');
    if (foundToken) {
      fetch('http://localhost:3010/api/events', {
        method: "POST",
        body: JSON.stringify({
          "eventname":eventName,
          "starttime":new Date(startDate+" "+startTime).toISOString(),
          "endtime":new Date(endDate+" "+endTime).toISOString(),
          "capacity":parseInt(capacity),
          "repeat":repeat,
        }),
        headers: Auth.JWTHeaderJson(),
      }).then(response => response.json())
      .then((json) => {
        console.log(json);
      })
      .catch((error) => {
        console.log(error);
      });
    }
  };
  return (
    <div>
      <form onSubmit={handleSubmit}>
      <label>
        Event Name:
        <input type="text" value={eventName}
          onChange={(event) => {changeName(event.target.value);}} />
      </label><br/>
      <label>
        Start Date:
        <input type="text" value={startDate}
          onChange={(event) => {changeStartDate(event.target.value);}} />
      </label><br/>
      <label>
        Start Time:
        <input type="text" value={startTime}
          onChange={(event) => {changeStartTime(event.target.value);}} />
      </label><br/>
      <label>
        End Date:
        <input type="text" value={endDate}
          onChange={(event) => {changeEndDate(event.target.value);}} />
      </label><br/>
      <label>
        End Time:
        <input type="text" value={endTime}
          onChange={(event) => {changeEndTime(event.target.value);}} />
      </label><br/>
      <label>
        Capacity:
        <input type="text" value={capacity}
          onChange={(event) => {changeCapacity(event.target.value);}} />
      </label><br/>
      {repeat && <button onClick={(event) => {changeRepeat(!repeat);}}>Repeat</button>}
      {!repeat && <button onClick={(event) => {changeRepeat(!repeat);}}>Don't Repeat</button>}
      <input type="submit" value="Submit" />
    </form>
    </div>

  );
}
