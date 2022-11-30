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

// import moment from "moment";

Amplify.configure(awsmobile);

function App() {
  // const isLoadingComplete = useCachedResources();
  // const colorScheme = useColorScheme();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const voximplant = Voximplant.getInstance();
  const [isLoginCall, setIsLoginCall] = useState(false);

  const fetchUser = async () => {
    const userData = await Auth.currentAuthenticatedUser();
    const user = await DataStore.query(User, userData.attributes.sub);
    // const users = await DataStore.query(User);
    console.log('userdata', userData);
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
    // console.log('fetch');
    fetchUser();
  }, []);

  // const updateName = async (name) => {
  //   if (!user) {
  //     return;
  //   }
  //   const response = await DataStore.save(
  //     User.copyOf(user, (updated) => {
  //       updated.name = name;
  //     })
  //   );
  // };

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

  // Video Call

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
    if (userData) {
      login();
    }
  }, [userData]);
  // console.log(isLoginCall);
  // const VoximplantApiClient = require('@voximplant/apiclient-nodejs').default;
  // const getCallUser = async () => {
  //   const client = new VoximplantApiClient();
  //   client.onReady = function () {
  //     // Get two first identities.
  //     client.Users.getUsers({applicationId: '1', count: '2'})
  //       .then(ev => console.log(ev))
  //       .catch(err => console.error(err));
  //   };
  // };

  // if (!userData) {
  //   console.log('null');
  //   return null;
  // }

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
