/*
 * Copyright (c) 2011-2021, Zingaya, Inc. All rights reserved.
 */

'use strict';

import LoginManager from './LoginManager';

import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

class PushManager {
  pushToken = null;

  constructor() {}

  init() {
    try {
      messaging().onTokenRefresh(token => {
        console.log('Refresh token: ' + token);
      });
      messaging().onMessage(async message => {
        console.log('PushManager: FCM: notification: ' + message.data);
        LoginManager.getInstance().pushNotificationReceived(message.data);
      });

      messaging()
        .getToken()
        .then(token => {
          console.log(token);
          this.pushToken = token;
        })
        .catch(() => {
          console.warn('PushManager android: failed to get FCM token');
        });

      //   const channel = new firebase.notifications.Android.Channel(
      //     'voximplant_channel_id',
      //     'Incoming call channel',
      //     firebase.notifications.Android.Importance.Max,
      //   ).setDescription('Incoming call received');
      //   firebase.notifications().android.createChannel(channel);
    } catch (e) {
      console.warn(
        'React Native Firebase is not set up. Enable google-services plugin at the bottom of the build.gradle file',
      );
    }
  }

  getPushToken() {
    return this.pushToken;
  }

  async showLocalNotification(from) {
    console.log('PushManager: showLocalNotification');
    try {
      await notifee.requestPermission();

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'voximplant_channel_id',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });
      await notifee.displayNotification({
        title: 'Incoming call received',
        // body: 'Main body content of the notification',
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      });
    } catch (e) {
      console.warn(
        'React Native Firebase is not set up. Enable google-services plugin at the bottom of the build.gradle file',
      );
    }
  }

  removeDeliveredNotification() {
    // try {
    //   firebase.notifications().removeAllDeliveredNotifications();
    // } catch (e) {
    //   console.warn(
    //     'React Native Firebase is not set up. Enable google-services plugin at the bottom of the build.gradle file',
    //   );
    // }
  }
}

const pushManager = new PushManager();
export default pushManager;
