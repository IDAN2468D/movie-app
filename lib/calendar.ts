import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

export interface CalendarEventData {
  title: string;
  startDate: string; // ISO string or combination of date and time
  time: string; // e.g. "20:00"
  location: string;
  notes?: string;
}

/**
 * Requests calendar permissions from the user.
 */
export async function requestCalendarPermissions() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status === 'granted') {
    if (Platform.OS === 'ios') {
      await Calendar.requestRemindersPermissionsAsync();
    }
    return true;
  }
  return false;
}

/**
 * Finds a writable calendar or creates a new one for CineBook.
 */
async function getCineBookCalendar() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  
  // Look for our specific calendar
  const cineBookCalendar = calendars.find(
    (cal) => cal.title === 'CineBook' || cal.name === 'CineBook'
  );

  if (cineBookCalendar) {
    return cineBookCalendar.id;
  }

  // If not found, create a new one (common practice to have a dedicated app calendar)
  if (Platform.OS === 'android') {
    return await createAndroidCalendar();
  } else {
    // On iOS we usually just use the default calendar if possible
    const defaultCalendar = calendars.find((cal) => cal.isPrimary) || calendars[0];
    return defaultCalendar.id;
  }
}

async function createAndroidCalendar() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultSource = calendars.length > 0 
    ? calendars[0].source 
    : { name: 'CineBook', type: 'LOCAL', isLocalAccount: true };

  const newCalendarID = await Calendar.createCalendarAsync({
    title: 'CineBook',
    color: '#FF1464',
    entityType: Calendar.EntityTypes.EVENT,
    ...(defaultSource.id ? { sourceId: defaultSource.id } : {}),
    source: defaultSource,
    name: 'CineBook',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });


  return newCalendarID;
}

/**
 * Adds a movie booking to the native calendar.
 */
export async function addBookingToCalendar(eventData: CalendarEventData) {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      Alert.alert('שגיאה', 'יש לאשר גישה ליומן כדי להוסיף את ההקרנה.');
      return false;
    }

    const calendarId = await getCineBookCalendar();
    
    // Parse start date and time
    // eventData.startDate is "YYYY-MM-DD", eventData.time is "HH:mm"
    const [year, month, day] = eventData.startDate.split('-').map(Number);
    const [hours, minutes] = eventData.time.split(':').map(Number);
    
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 150 * 60 * 1000); // Default 2.5 hours

    await Calendar.createEventAsync(calendarId, {
      title: `🎥 CineBook: ${eventData.title}`,
      startDate,
      endDate,
      location: eventData.location,
      notes: eventData.notes || `הזמנת כרטיסים לסרט ${eventData.title}`,
      timeZone: 'Asia/Jerusalem',
      alarms: [{ relativeOffset: -60, method: Calendar.AlarmMethod.ALERT }], // 1 hour before
    });

    Alert.alert('הצלחה', 'ההקרנה נוספה ליומן שלך בהצלחה!');
    return true;
  } catch (error) {
    console.error('Error adding to calendar:', error);
    Alert.alert('שגיאה', 'לא ניתן היה להוסיף את ההקרנה ליומן.');
    return false;
  }
}
