import React from 'react';
import Container from '@material-ui/core/Container';
import {makeStyles} from '@material-ui/core/styles';
import {IconButton} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import Context from './Context';
import Auth from './libs/Auth';
import TextField from '@material-ui/core/TextField';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IndividualEvent from './IndividualEvent';
import DateFnsUtils from '@date-io/date-fns';
import {DatePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
import clsx from 'clsx';
import format from 'date-fns/format';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

/**
 * BusinessProfile component
 * @return {object} BusinessProfile JSX
 */
export default function BusinessProfile() {
  const [error, setError] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [businessData, setBusinessData] = React.useState([]);
  const [memberList] = React.useState([]);
  const [eventList, setEventList] = React.useState({});
  const [emailInput, setEmailInput] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailMsg, setEmailMsg] = React.useState('');
  const [eventState, setEventState] = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [confirmDialog, setConfirmDialog] = React.useState(false);
  const [cancelEventID, setCancelEventID] = React.useState('');
  const [deleteAll, setDeleteAll] = React.useState(false);
  const context = React.useContext(Context);

  /**
   * deleteEvent
   * API call for deleting event
   * @param {*} eventid
   * @param {*} all
   * @return {Number}
   */
  function deleteEvent(eventid, all) {
    console.log(eventid);
    const apicall = 'http://localhost:3010/api/events/'+eventid;
    return fetch(apicall, {
      method: 'DELETE',
      body: JSON.stringify({'eventid': eventid, 'deleteAll': all}),
      headers: Auth.headerJsonJWT(),
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
      console.log(json);
      return 1;
    })
        .catch((error) => {
          console.log(error);
          return -1;
        });
  };

  /**
   * deleteEventAndReload
   * Calls deleteEvent then sets state
   * @param {*} eventid
   * @param {*} all
   */
  async function deleteEventAndReload(eventid, all=false) {
    // call API to remove event from events table
    const test = await deleteEvent(eventid, all);
    // if delete failed, don't remove event from list.
    if (test !== 1) {
      return;
    }
    // copy eventlist
    const eventListCopy = JSON.parse(JSON.stringify(eventList));
    if (all) {
      for (const event in eventList) {
        if (eventList[event].repeatid == eventList[eventid].repeatid) {
          delete eventListCopy[event];
        }
      }
    } else {
      // delete event
      delete eventListCopy[eventid];
    }
    // update eventList state
    setEventList(eventListCopy);
  };

  // I wrote this how react recommends
  // https://reactjs.org/docs/faq-ajax.html
  // Since the dependents array provided at the end is empty, this
  // should only ever run once
  React.useEffect(async () => {
    const businessRes = fetch('http://localhost:3010/api/businesses/getBusiness', {
      method: 'GET',
      headers: Auth.headerJsonJWT(),
    }).then((res) => res.json())
        .then((data) => {
          setBusinessData(data);
        },
        (error) => {
          setError(error);
        },
        );
    const eventRes = fetch('http://localhost:3010/api/businesses/getBusinessEvents', {
      method: 'GET',
      headers: Auth.headerJsonJWT(),
    }).then((res) => res.json())
        .then((data) => {
          // The value is an array of events for that business
          const eventDict = {};
          for (const index in data) {
            if (data.hasOwnProperty(index)) {
              eventDict[data[index].eventid] = data[index];
            }
          }
          setEventList(eventDict);
        },
        (error) => {
          setError(error);
        },
        );
    // /* Uncomment when member retrieval api is done */
    // const memberRes = fetch('http://localhost:3010/api/members/getMembers', {
    //   method: 'GET',
    //   headers: Auth.headerJsonJWT(),
    // }).then((res) => res.json())
    //     .then((data) => {
    //       setMemberData(data);
    //     },
    //     (error) => {
    //       setError(error);
    //     },
    //     );
    await Promise.all([businessRes, eventRes]);
    setIsLoaded(true);
  }, []);

  /**
   * handleSubmit
   * Handles adding members to a business
   * @param {*} event
   * @param {*} memberlist
   */
  function handleSubmit(event, memberlist) {
    event.preventDefault();
    fetch('http://localhost:3010/api/members/insertMembers', {
      method: 'POST',
      body: JSON.stringify(memberlist),
      headers: Auth.headerJsonJWT(),
    })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 409) {
              setEmailError(true);
              setEmailMsg(
                  'Error: Some members don\'t exist or are already added');
            }
            throw response;
          } else {
            setEmailError(false);
            return response;
          }
        })
        .then((json) => {
          console.log(json);
        })
        .catch((error) => {
          console.log(error);
        });
  }

  /**
   * validateInput
   * Validates input for adding members to business
   * @param {*} event
   */
  const validateInput = (event) => {
    // regex to check for valid email format
    const emailRegex = new RegExp([
      '^(([^<>()[\\]\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\.,;:\\s@\"]+)*)',
      '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
      '[0-9]{1,3}\])|(([a-zA-Z\\-0-9]+\\.)+',
      '[a-zA-Z]{2,}))$'].join(''));
    const memberArray = emailInput.split(',');
    for (const e in memberArray) {
      if (!emailRegex.test(memberArray[e])) {
        setEmailError(true);
        setEmailMsg('One or more invalid email(s).');
        return;
      }
    }
    handleSubmit(event, memberArray);
  };

  /**
   * handleKeypress
   * Checks if keypress was enter, then submits form
   * @param {*} event Event submission event
   */
  const handleKeypress = (event) => {
    // only start submit process if enter is pressed
    if (event.key === 'Enter') {
      validateInput(event);
    }
  };

  const useStyles = makeStyles((theme) => ({
    paper: {
      marginTop: theme.spacing(8),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    eventStyle: {
      marginTop: theme.spacing(2),
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
    dialogText: {
      marginLeft: 15,
      marginRight: 15,
    },
  }));

  /**
   * formatDate
   * @param {string} dateString
   * @param {boolean} includeDate
   * @return {string} formatted date string
   */
  function formatDate(dateString, includeDate=true) {
    return (dateString.getHours() % 12) + ':' +
    // display 2 digit minutes if less than 10 minutes
    // https://stackoverflow.com/questions/8935414/getminutes-0-9-how-to-display-two-digit-numbers
    ((dateString.getMinutes()<10?'0':'') + dateString.getMinutes()) +
    (dateString.getHours() / 12 >= 1 ? 'PM' : 'AM') +
        ' ' + (includeDate ? dateString.toDateString():'');
  }

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
    for (const e in eventList) {
      if (eventList.hasOwnProperty(e)) {
        const date = new Date(eventList[e].starttime);
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
      [classes.highlight]: isEvent && dateClone.getDay() % 2 &&
          !currentDay && dayInCurrentMonth,
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
  if (error) {
    return <div>Error: {error.message}</div>;
  } else if (!isLoaded) {
    return <div>Loading...</div>;
  } else {
    const items = [];
    const items2 = [];
    const members = [];
    const eventListJSX = [];
    for (const m in memberList) {
      if (memberList.hasOwnProperty(m)) {
        const member = memberList[m];
        <ListItem button={true}
          key={member.userid}
          onClick={() => {
            /* Link to public user profile page ? */
          }}>
          <ListItemText key={member.userid}
            primary={member.username}
            secondary={member.email.toLowerCase()}/>
          <ListItemSecondaryAction>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              onClick={() => {
                removeMember(member.userid);
              }}
            >
              Remove
            </Button>
          </ListItemSecondaryAction>
        </ListItem>;
      }
    }
    for (const key in eventList) {
      if (eventList.hasOwnProperty(key)) {
        const eventid = eventList[key].eventid;
        const eventName = eventList[key].eventname;
        const startDate = new Date(eventList[key].starttime);
        const dateString = formatDate(startDate);
        if (startDate.getDate() == selectedDate.getDate() &&
            startDate.getMonth() == selectedDate.getMonth() &&
            startDate.getYear() == selectedDate.getYear()) {
          eventListJSX.push(
              <ListItem button
                key={eventid}
                onClick={() => {
                  setEventState(eventid);
                }}>
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
                      setCancelEventID(eventid);
                      setDeleteAll(false);
                      setConfirmDialog(true);
                    }}
                  >
                    {'Cancel event'}
                  </Button><br/>
                  {eventList[key].repeatid &&
                      <Button key={eventList[key].repeatid}
                        type='submit'
                        variant='contained'
                        color='secondary'
                        onClick={() => {
                          setCancelEventID(eventid);
                          setDeleteAll(true);
                          setConfirmDialog(true);
                        }}
                      >
                        {'Delete All'}
                      </Button>}
                </ListItemSecondaryAction>
              </ListItem>,
          );
        }
      }
    }
    if (eventState !== null) {
      // if the eventState is set to an eventID
      // then show an individualEvent page with a back button
      items2.push(
          <div key='event' className={classes.eventStyle}>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              onClick={() => {
                setEventState(null);
              }}
            >
              Back
            </Button>
            <IndividualEvent eventID={eventState}/>
          </div>,
      );
    } else {
      items.push(
          <Grid item xs={6} md={6} key={businessData.businessname}>
            <Typography variant='h6'>
              Created Events
            </Typography>
            <Divider/>
            <Grid container justify='center'>
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
            </Grid>
            <List>
              {eventListJSX}
            </List>
            {eventList.length === 0 && <Typography>
              Currently created 0 events
            </Typography>}
            {eventList.length === 0 && <Button
              type='submit'
              variant='contained'
              color='primary'
              href='/events/create'
            >
              Create Events
            </Button>}
          </Grid>,
      );
      items.push(
          <Grid key='member list' item xs={6} md={6}>
            <Typography variant='h6'>
              Members
            </Typography>
            <Divider/>
            <List>
              {members}
            </List>
            {members.length === 0 && <Typography>
              Currently added 0 members
            </Typography>}
            <TextField
              error={emailError}
              helperText={emailError ? emailMsg : ''}
              variant='filled'
              margin='normal'
              fullWidth
              id='email'
              label='Email Addresses'
              name='email'
              autoComplete='email'
              multiline
              onChange={(event) => {
                setEmailInput(event.target.value);
              }}
              onKeyPress={handleKeypress}
            />
            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              className={classes.submit}
              onClick={validateInput}
            >
              Add Members
            </Button>
          </Grid>,
      );
      items2.push(<Grid key='eventList2' container spacing={8}>{items}</Grid>);
    }
    return (
      <Container component='main' maxWidth='md'>
        <div className={classes.paper}>
          <Typography className={classes.typography} variant='h1'>
            {businessData.businessname}
          </Typography>
          <Typography className={classes.typography} variant='h4'>
            {businessData.email.toLowerCase()}
          </Typography>
          {items2}

          {/* Confirmation dialog for cancelling events */}
          <Dialog open={confirmDialog} onClose={() => {
            setConfirmDialog(false);
          }}
          aria-labelledby="confirm-dialog-title">
            <DialogTitle id="confirm-dialog-title">
              {deleteAll ? 'Cancel Repeating Event' : 'Cancel Event'}
            </DialogTitle>
            <DialogContentText className={classes.dialogText}>
              {/* Change message for deleting all vs. cancelling one event */}
              {deleteAll ?
                  'Are you sure you want to delete all instances of' +
                  ' this repeating event?' :
                  'Are you sure you want to cancel this event?'}
            </DialogContentText>
            <DialogActions>
              <Button
                color="primary"
                onClick={() => {
                  // Call deleteEventAndReload, close dialog if user clicks Yes
                  deleteEventAndReload(cancelEventID, deleteAll);
                  setConfirmDialog(false);
                }}>
                Yes
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  // Close dialog and don't delete event if user clicks No
                  setConfirmDialog(false);
                }}>
                No
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </Container>
    );
  }
}
