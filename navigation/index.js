/**
 * If you are not familiar with React Navigation, check out the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React, {useState, useEffect} from 'react';
import {View, Text, Image, useWindowDimensions, Pressable} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import HomeScreen from '../screens/HomeScreen';
import UsersScreen from '../screens/UsersScreen';
import ChatRoomHeader from './ChatRoomHeader';
import GroupInfoScreen from '../screens/GroupInfoScreen';
import ProfileScreen from '../components/Profile/Profile';
import LocationScreen from '../screens/LocationScreen';
import DocumentScreen from '../screens/DocumentScreen';

import LoginScreen from '../components/screens/LoginScreen';
import MainScreen from '../components/screens/MainScreen';
import CallScreen from '../components/screens/CallScreen';
import IncomingCallScreen from '../components/screens/IncomingCallScreen';
import {navigationRef} from '../components/routes/routes';
import CreateChatHeader from './CreateChatHeader';
import EditProfileScreen from '../components/Profile/EditProfileScreen';
import {User} from '../src/models';
import {Auth, DataStore} from 'aws-amplify';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({navigation, route}) => ({
            headerTitle: props => <HomeHeader {...navigation} {...route} />,
          })}
        />
        <Stack.Screen
          name="ChatRoom"
          component={ChatRoomScreen}
          options={({route}) => ({
            headerTitle: () => <ChatRoomHeader id={route.params?.id} />,
            headerBackTitleVisible: false,
          })}
        />
        <Stack.Screen name="GroupInfoScreen" component={GroupInfoScreen} />
        <Stack.Screen
          name="UsersScreen"
          component={UsersScreen}
          options={({navigation, route}) => ({
            title: 'Users',
            headerRight: props => <CreateChatHeader {...navigation} />,
          })}
        />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{
            title: 'Login Video Call',
          }}
        />
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{headerLeft: null}}
        />
        <Stack.Screen
          name="Call"
          component={CallScreen}
          options={{headerLeft: null}}
        />
        <Stack.Screen
          name="IncomingCall"
          component={IncomingCallScreen}
          options={{headerLeft: null}}
        />
        <Stack.Screen
          name="DocumentScreen"
          component={DocumentScreen}
          options={{title: null}}
        />
        <Stack.Screen
          name="LocationScreen"
          component={LocationScreen}
          options={{
            title: 'Location',
          }}
        />
        <Stack.Screen
          name="EditProfileScreen"
          component={EditProfileScreen}
          options={{
            title: 'Edit',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const HomeHeader = props => {
  const {width} = useWindowDimensions();
  const navigation1 = useNavigation();
  const [user, setUser] = useState(null);

  const uri = props.params && props.params['uri'];
  // console.log(uri);

  const fetchUser = async () => {
    const authUser = await Auth.currentAuthenticatedUser();
    await DataStore.query(User, authUser.attributes.sub).then(setUser);
  };

  // console.log(props);

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        // justifyContent: 'space-between',
        width,
        padding: 10,
        alignItems: 'center',
      }}>
      <Pressable onPress={() => navigation1.navigate('ProfileScreen')}>
        <Image
          source={{
            uri:
              uri ||
              (user && user.imageUri) ||
              'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/1.jpg',
          }}
          style={{width: 30, height: 30, borderRadius: 30}}
        />
      </Pressable>
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          marginLeft: 50,
          fontWeight: 'bold',
        }}>
        Message
      </Text>
      <Feather
        name="camera"
        size={24}
        color="black"
        style={{marginHorizontal: 10}}
      />
      <Pressable onPress={() => navigation1.navigate('UsersScreen')}>
        <Feather
          name="edit-2"
          size={24}
          color="black"
          style={{marginHorizontal: 10}}
        />
      </Pressable>
    </View>
  );
};

export default Navigation;
