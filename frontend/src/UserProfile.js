import React from 'react';
import Container from '@material-ui/core/Container';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import {makeStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Context from './Context';
import Auth from './libs/Auth';
import IndividualEvent from './IndividualEvent';
import Paper from '@material-ui/core/Paper';
import DateFnsUtils from '@date-io/date-fns';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import clsx from 'clsx';
import format from 'date-fns/format';
import {IconButton} from '@material-ui/core';
// TODO:
// 1. Once public business pages are implemented, add a link to them.
// 2. Once users can become linked to businesses by email for membership
//    Make business names persists even if the user is not currently signed up for events
//    from the business.
// 3. Add a past events section for events that are in the past.


// The userprofile page makes 2 api calls initally on load to get user information
// and list information for that user. It then displays the events a user is signed
// up grouped by business name. The eventList state holds the currently signed up for
// events and must be updated(by replacing the reference since it is an object) when a
// user withdraws from an event. eventState is either null or an eventid. If it's an
// eventid, then display the individualevent page for the event
/**
 * UserProfile component
 * @return {object} UserProfile JSX
 */
export default function UserProfile() {
  const [error, setError] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [userData, setUserData] = React.useState([]);
  const [eventList, setEventList] = React.useState({});
  const [eventState, setEventState] = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [showAll, setShowAll] = React.useState(false);
  const context = React.useContext(Context);

  /**
   * removeUserAttending
   * API call to remove user from an event
   * @param {string} eventid
   * @return {Number}
   */
  async function removeUserAttending(eventid) {
    const apicall = 'http://localhost:3010/api/users/removeUserAttending';
    return fetch(apicall, {
      method: 'DELETE',
      body: JSON.stringify({'eventid': eventid}),
      headers: Auth.JWTHeaderJson(),
    }).then((response)=>{
      if (!response.ok) {
        if (response.status === 401) {
          Auth.removeJWT();
          context.setAuthState(false);
        }
        throw response;
      }
      return response;
    }).then((json)=>{
      return 1;
    })
        .catch((error) => {
          console.log(error);
          return -1;
        });
  };

  /**
   * removeUserAndReload
   * Calls removeUserAttending then updates state
   * @param {*} eventid
   * @param {*} eventKey
   * @param {*} eventValue
   * @param {*} eventList
   */
  async function removeUserAndReload(eventid, eventKey, eventValue, eventList) {
    // call API to remove user from attendees table
    const test = await removeUserAttending(eventid);
    // if withdraw failed, don't remove event from list.
    if (test !== 1) {
      console.log('Could not withdraw from event');
      return;
    }

    // splice out event
    eventList[eventKey].splice(eventValue, 1);
    // copy eventlist into a new object so state can update
    const updatedEventList = JSON.parse(JSON.stringify(eventList));
    // if no more events for a business remove business from dict
    if (updatedEventList[eventKey].length == 0) {
      delete updatedEventList[eventKey];
    }
    // update eventList state
    setEventList(updatedEventList);
  };

  // I wrote this how react recommends
  // https://reactjs.org/docs/faq-ajax.html
  // I added event state to the dependant list so that it will re fetch data
  // in case an event is removed while in the individual event view.
  React.useEffect(async () => {
    const userRes = fetch('http://localhost:3010/api/users/getUser', {
      method: 'GET',
      headers: Auth.JWTHeaderJson(),
    }).then((res) => res.json())
        .then((data) => {
          setUserData(data);
        },
        (error) => {
          setError(error);
        },
        );
    const eventRes = fetch('http://localhost:3010/api/users/getUserEvents', {
      method: 'GET',
      headers: Auth.JWTHeaderJson(),
    }).then((res) => res.json())
        .then((data) => {
          // The value is an array of events for that business
          const eventDict = {};
          for (const index in data) {
            if (data.hasOwnProperty(index)) {
              if (eventDict[data[index].businessname] == null) {
                eventDict[data[index].businessname] = [];
              }
            }
            eventDict[data[index].businessname].push(data[index]);
          }
          setEventList(eventDict);
        },
        (error) => {
          setError(error);
        },
        );
    await Promise.all([userRes, eventRes]);
    setIsLoaded(true);
  }, [eventState]);


  const useStyles = makeStyles((theme) => ({
    paper: {
      marginTop: theme.spacing(8),
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    eventStyle: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    typography: {
      flexGrow: 1,
    },
    select: {
      background: theme.palette.secondary.main,
      color: theme.palette.common.white,
    },
    noselect: {
      background: theme.palette.secondary.light,
      color: theme.palette.common.white,
    },
    highlight: {
      background: theme.palette.primary.light,
      color: theme.palette.common.white,
    },
    highlight2: {
      background: theme.palette.primary.main,
      color: theme.palette.common.white,
    },
    nonCurrentMonthDay: {
      color: theme.palette.text.disabled,
    },
    day: {
      width: 36,
      height: 36,
      fontSize: theme.typography.caption.fontSize,
      margin: '0 2px',
      color: 'inherit',
    },
    customDayHighlight: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: '2px',
      right: '2px',
      border: `1px solid ${theme.palette.secondary.main}`,
      borderRadius: '50%',
    },
  }));
  const classes = useStyles();

  /**
   * renderWrappedDays
   * @param {*} date
   * @param {*} selectedDate
   * @param {*} dayInCurrentMonth
   * @return {object} JSX
   */
  const renderWrappedDays = (date, selectedDate, dayInCurrentMonth) => {
    const dateClone = new Date(date);
    const currentDay = dateClone.getDate() == selectedDate.getDate() &&
        dateClone.getMonth() == selectedDate.getMonth() &&
        dateClone.getYear() == selectedDate.getYear();

    let isEvent = false;
    for (const business in eventList) {
      for (const e in eventList[business]) {
        const date = new Date(eventList[business][e].starttime);
        if (date.getDate() == dateClone.getDate() &&
            date.getMonth() == dateClone.getMonth() &&
            date.getYear() == dateClone.getYear()) {
          isEvent = true;
          break;
        }
      }
    }
    const wrapperClassName = clsx({
      [classes.select]: isEvent && currentDay && dayInCurrentMonth,
      [classes.noselect]: !isEvent && currentDay && dayInCurrentMonth,
      [classes.highlight]: isEvent && dateClone.getDay() % 2 && !currentDay && dayInCurrentMonth,
      [classes.highlight2]: isEvent && dateClone.getDay() % 2 === 0 &&
        !currentDay && dayInCurrentMonth,
      [classes.nonCurrentMonthDay]: !dayInCurrentMonth,
    });

    const dayClassName = clsx(classes.day, {
      [classes.highlightNonCurrentMonthDay]: !dayInCurrentMonth,
    });

    return (
      <div className={wrapperClassName}>
        <IconButton className={dayClassName}>
          <span> {format(dateClone, 'd')} </span>
        </IconButton>
      </div>
    );
  };

  // UI Stuff
  const items = [];
  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <div>Loading...</div>;
  } else if (eventState !== null) {
    // if the eventState is set to an eventID then show an individualEvent page with a back button
    items.push(
        <div key='event' className={classes.eventStyle}>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            onClick={() => {
              setIsLoaded(null);
              setEventState(null);
            }}
          >
          Back
          </Button>
          <IndividualEvent eventID={eventState}/>
        </div>,
    );
  } else if (Object.keys(eventList) == 0) {
    // If there are no events in the event list, then put a link to the event signup page
    items.push(
        <div key='findEvents' className={classes.eventStyle}>
          <Typography>
            Currently signed up for 0 events
          </Typography>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            href='/events'
          >
            Find Events
          </Button>
        </div>,
    );
  } else {
    const items2 = [];
    // Var key is the business name
    for (const key in eventList) {
      const eventListJSX = [];
      // Value is the index of the event
      for (const value in eventList[key]) {
        const eventid = eventList[key][value].eventid;
        const eventName = eventList[key][value].eventname;
        const startDate = new Date(eventList[key][value].starttime);
        const dateString = (startDate.getHours() % 12) + ':' +
        // display 2 digit minutes if less than 10 minutes
        // www.stackoverflow.com/questions/8935414/getminutes-0-9-how-to-display-two-digit-numbers
        ((startDate.getMinutes()<10?'0':'') + startDate.getMinutes()) +
        (startDate.getHours() / 12 >= 1 ? 'PM' : 'AM') + ' ' + startDate.toDateString();
        const eventKey = key;
        const eventValue = value;
        if (showAll || (startDate.getDate() == selectedDate.getDate() &&
          startDate.getMonth() == selectedDate.getMonth() &&
          startDate.getYear() == selectedDate.getYear())) {
          eventListJSX.push(
              <ListItem
                button={true}
                key={eventid}
                onClick={
                  () => {
                    setEventState(eventid);
                  }
                }
              >
                <ListItemText key={eventid}
                  primary={eventName}
                  secondary={dateString}
                />
                <ListItemSecondaryAction key={eventid}>
                  <Button key={eventid}
                    type='submit'
                    variant='contained'
                    color='primary'
                    onClick={() => {
                      removeUserAndReload(eventid, eventKey, eventValue, eventList);
                    }}
                  >
                    Withdraw
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>,
          );
        }
      }
      if (eventListJSX.length > 0) {
        items2.push(
            <Grid item xs={12} key={key}>
              <Typography variant='h6'>
                {key}
              </Typography>
              <Divider/>
              <List>
                {eventListJSX}
              </List>
            </Grid>,
        );
      }
    }
    if (items2.length === 0) {
      items2.push(
          <Grid container item xs={12}
            key='noEvents'
            alignItems='center'
            justify='center'
            direction='column'>
            <Typography variant='h6'>
              No events for selected date
            </Typography><br/>
            <Button key='showAll'
              type='submit'
              variant='contained'
              color='primary'
              onClick={() => {
                setShowAll(true);
              }}
            >
              Show All Registered Events
            </Button>
          </Grid>,
      );
    } else {
      items2.push(
          <Grid container item xs={12}
            key='hasEvents'
            alignItems='center'
            justify='center'
            direction='column'>
            <div key='event' className={classes.eventStyle}>
              <Button key='showAll'
                type='submit'
                variant='contained'
                color='primary'
                onClick={() => {
                  setShowAll(!showAll);
                }}
              >
                {showAll ? 'Show Only For Date' : 'Show All Registered Events'}
              </Button>
            </div>
          </Grid>,
      );
    }
    items.push(<Grid item key='eventList' container justify='flex-end' spacing={8}>{items2}</Grid>);
  }

  return (
    <Paper>
      <Container component='main' maxWidth='md'>
        <div className={classes.paper}>
          <Typography className={classes.typography} variant='h1'>
            {userData.username}
          </Typography>
          <Typography className={classes.typography} variant='h4'>
            {userData.email}
          </Typography>
          <Grid container justify='center' direction='row' spacing={8}>
            {eventState === null &&<Grid item xs={6} container justify='flex-start'>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DatePicker
                  variant='static'
                  label='Event select'
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                  }}
                  renderDay={renderWrappedDays}
                />
              </MuiPickersUtilsProvider>
            </Grid>}
            <Grid item container xs={6} md={6}>
              {items}
            </Grid>
          </Grid>
        </div>
      </Container>
    </Paper>
  );
}
