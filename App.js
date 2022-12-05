import {SafeAreaProvider} from 'react-native-safe-area-context';
import React, {useEffect, useState} from 'react';
import Navigation from './navigation';
import {DataStore, Hub, Auth} from 'aws-amplify';
import {Amplify} from '@aws-amplify/core';
import awsmobile from './src/aws-exports';
import {withAuthenticator} from 'aws-amplify-react-native';
import {Message, User} from './src/models';
import {AmplifyTheme} from 'aws-amplify-react-native';
import {StatusBar} from 'react-native';
import {Voximplant} from 'react-native-voximplant';
import {
  VOXIMPLANT_ACCOUNT,
  VOXIMPLANT_APP,
  PASS,
} from './components/VideoCall/Constants';
import messaging from '@react-native-firebase/messaging';
// import NotificationService from './components/NotificationService';
import notifee from '@notifee/react-native';
import NotificationService from './components/NotificationService';

// import moment from "moment";

Amplify.configure(awsmobile);

function App() {
  // const isLoadingComplete = useCachedResources();
  // const colorScheme = useColorScheme();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const voximplant = Voximplant.getInstance();
  const [isLoginCall, setIsLoginCall] = useState(false);
  const [isAddCalluser, setIsAddCallUser] = useState(false);

  const fetchUser = async () => {
    const userData = await Auth.currentAuthenticatedUser();
    const user = await DataStore.query(User, userData.attributes.sub);
    // const users = await DataStore.query(User);
    // console.log('userdata', userData);
    // console.log("users", users);
    // console.log("user", user);
    if (user) {
      setUserData(userData);
      setUser(user);
    }
  };

  useEffect(() => {
    // Create listener
    // console.log("registeriong listener");
    const listener = Hub.listen('datastore', async hubData => {
      const {event, data} = hubData.payload;
      //console.log(data);

      if (
        event === 'outboxMutationProcessed' &&
        data.model === Message &&
        !['DELIVERED', 'READ'].includes(data.element.status)
      ) {
        // set the message status to delivered
        DataStore.save(
          Message.copyOf(data.element, updated => {
            updated.status = 'DELIVERED';
          }),
        );
      }
    });

    // Remove listener
    return () => listener();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = DataStore.observe(User, user.id).subscribe(msg => {
      if (msg.model === User && msg.opType === 'UPDATE') {
        setUser(msg.element);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    async function requestUserPermission() {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    }
    requestUserPermission();
  }, []);

  // Get token FCM
  useEffect(() => {
    // Get the device token

    if (user) {
      messaging()
        .getToken()
        .then(token => {
          console.log(token);
          DataStore.save(
            User.copyOf(user, u => {
              u.tokenFCM = token;
            }),
          );
        });

      // If using other push notification providers (ie Amazon SNS, etc)
      // you may need to get the APNs token instead for iOS:
      // if(Platform.OS == 'ios') { messaging().getAPNSToken().then(token => { return saveTokenToDatabase(token); }); }

      // Listen to whether the token changes
      return messaging().onTokenRefresh(token => {
        console.log(token);
      });
    }
  }, [user]);

  //

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('foregroundMessage', JSON.stringify(remoteMessage));
      NotificationService.DisplayNotification(remoteMessage);
      // Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });
    return unsubscribe;
  });

  // useEffect(() => {
  //   notifee.onBackgroundEvent(async data => {
  //     if (data.type == 3) {
  //       console.log('notee', data.detail.data);
  //     }
  //   });
  // });

  useEffect(() => {
    // console.log('fetch');
    fetchUser();
  }, []);

  // messaging().onMessage(onMessageReceived => {
  //   console.log(onMessageReceived);
  // });

  useEffect(() => {
    const interval = setInterval(async () => {
      await updateLastOnline();
    }, 40000 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const updateLastOnline = async () => {
    if (!user) {
      return;
    }

    const response = await DataStore.save(
      User.copyOf(user, updated => {
        updated.lastOnlineAt = +new Date();
        updated.name = userData.username;
        updated.imageUri =
          user.imageUri != null
            ? user.imageUri
            : 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/1.jpg';
      }),
    );
    setUser(response);
    console.log(response);
  };

  //----------------- Video Call

  // const [userCalls, setUserCalls] = useState(null);
  // const [fetchUsers, setFetchUsers] = useState(false);

  // const getArticlesFromApi = () => {
  //   fetch(
  //     'https://api.voximplant.com/platform_api/GetUsers/?account_id=5733968&application_id=10523132&api_key=dab228ec-81bd-40c3-b4c7-ba33125f4e97',
  //   )
  //     .then(response => response.json())
  //     .then(json => setData(json.result.map(user => user.user_name)))
  //     .finally(() => setFetchUsers(true));
  // };

  // ----------------- Register user to Voximplant

  const postUser = () => {
    fetch(
      `https://api.voximplant.com/platform_api/AddUser/?account_id=5733968&user_name=${userData.username}&user_display_name=${userData.username}&user_password=12345678&application_id=10523132&api_key=dab228ec-81bd-40c3-b4c7-ba33125f4e97`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstParam: 'yourValue',
          secondParam: 'yourOtherValue',
        }),
      },
    )
      .then(response => response.json())
      .then(json => console.log(json))
      .finally(() => setIsAddCallUser(true));
  };

  // useEffect(() => {
  //   getArticlesFromApi();
  // }, []);

  useEffect(() => {
    if (userData) {
      postUser();
    }
  }, [userData]);

  //--------------- Login user to Voximplant
  async function login() {
    // console.log(userAuth);
    console.log(
      `${userData.username}@${VOXIMPLANT_APP}.${VOXIMPLANT_ACCOUNT}.voximplant.com`,
    );
    try {
      let clientState = await voximplant.getClientState();
      if (clientState === Voximplant.ClientState.DISCONNECTED) {
        await voximplant.connect();
        await voximplant.login(
          `${userData.username}@${VOXIMPLANT_APP}.${VOXIMPLANT_ACCOUNT}.voximplant.com`,
          PASS,
        );
      }
      if (clientState === Voximplant.ClientState.CONNECTED) {
        await voximplant.login(
          `${userData.username}@${VOXIMPLANT_APP}.${VOXIMPLANT_ACCOUNT}.voximplant.com`,
          PASS,
        );
      }
      setIsLoginCall(true);
      console.log('login1');
    } catch (e) {
      let message;
      switch (e.name) {
        case Voximplant.ClientEvents.ConnectionFailed:
          message = 'Connection error, check your internet connection';
          break;
        case Voximplant.ClientEvents.AuthResult:
          message = convertCodeMessage(e.code);
          break;
        default:
          message = 'Unknown error. Try again';
      }
      showLoginError(message);
    }
  }

  function convertCodeMessage(code) {
    switch (code) {
      case 401:
        return 'Invalid password';
      case 404:
        return 'Invalid user';
      case 491:
        return 'Invalid state';
      default:
        return 'Try again later';
    }
  }

  function showLoginError(message) {
    console.log(message);
    Alert.alert('Login error', message, [
      {
        text: 'OK',
      },
    ]);
  }

  useEffect(() => {
    if (userData && isAddCalluser) {
      login();
    }
  }, [userData, isAddCalluser]);

  return (
    <SafeAreaProvider>
      <Navigation />
      <StatusBar />
    </SafeAreaProvider>
  );
  // }
}

const customTheme = {
  ...AmplifyTheme,
  button: {
    ...AmplifyTheme.button,
    backgroundColor: 'blue',
  },
  sectionFooterLink: {
    ...AmplifyTheme.sectionFooterLink,
    color: 'blue',
  },
  sectionFooterLinkDisabled: {
    ...AmplifyTheme.sectionFooterLinkDisabled,
    color: '#34a1eb',
  },
  buttonDisabled: {
    ...AmplifyTheme.buttonDisabled,
    backgroundColor: '#34a1eb',
  },
};
export default withAuthenticator(App, {theme: customTheme});
