import notifee, {AndroidImportance, AndroidStyle} from '@notifee/react-native';
const sendSingleDeviceNotification = data => {
  var myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append(
    'Authorization',
    'key=AAAA6OFgbkY:APA91bElYgox5t6Lp5SBnv58D_eTzgZgKdlZX23AoCxPhDMQMGgIzgJVpX5z56c6uKicINaNVTlhfQ_JUyWBG_XMF40zLcUk1U9pOrcP9GX-wLolGvEC0xYD05EIKabQjChUNu701dLp',
  );

  var raw = JSON.stringify({
    data: {
      chatroomID: data.chatroomID,
      body: data.body,
      title: data.title,
      type: data.type,
      username: data.username,
    },
    // notification: {

    // },
    to: data.token,
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  fetch('https://fcm.googleapis.com/fcm/send', requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
};

const sendMultiDeviceNotification = data => {
  var myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append(
    'Authorization',
    'key=AAAA6OFgbkY:APA91bElYgox5t6Lp5SBnv58D_eTzgZgKdlZX23AoCxPhDMQMGgIzgJVpX5z56c6uKicINaNVTlhfQ_JUyWBG_XMF40zLcUk1U9pOrcP9GX-wLolGvEC0xYD05EIKabQjChUNu701dLp',
  );

  var raw = JSON.stringify({
    data: {
      chatroomID: data.chatroomID,
      body: data.body,
      title: data.title,
      type: data.type,
      username: data.username,
    },
    registration_ids: data.token,
  });
  // console.log(raw);

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  fetch('https://fcm.googleapis.com/fcm/send', requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
};

const DisplayNotification = async remoteMessage => {
  // Create a channel
  const channelId = await notifee.createChannel({
    id: 'important',
    name: 'Important Notifications',
    importance: AndroidImportance.HIGH,
  });
  // Display a notification
  await notifee.displayNotification({
    // title: '<p style="color: #3777f0;"><b>Message</span></p></b></p>;',
    body: `<b>${remoteMessage.data.username}</b>: ${remoteMessage.data.body}`,
    subtitle: remoteMessage.data.title,

    android: {
      channelId,
      smallIcon: 'ic_stat_name', // optional, defaults to 'ic_launcher'.
      largeIcon:
        'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/1.jpg',
      circularLargeIcon: true,

      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
        launchActivity: 'com.chatnative.HomeScreen',
      },
      // style: {
      //   type: AndroidStyle.MESSAGING,
      //   person: {
      //     name: remoteMessage.data.username,
      //     icon: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/1.jpg',
      //   },
      // },
      // messages: [{text: remoteMessage.data.body}],
    },
    data: remoteMessage.data,
  });
};

export default {
  sendSingleDeviceNotification,
  sendMultiDeviceNotification,
  DisplayNotification,
};
