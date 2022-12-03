/**
 * If you are not familiar with React Navigation, check out the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import {View, Text, Image, useWindowDimensions, Pressable} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import HomeScreen from '../screens/HomeScreen';
import UsersScreen from '../screens/UsersScreen';
import ChatRoomHeader from './ChatRoomHeader';
import GroupInfoScreen from '../screens/GroupInfoScreen';
import ProfileScreen from '../components/Profile/Profile';
import LoginScreen from '../components/VideoCall/LoginScreen';
import MainScreen from '../components/VideoCall/MainScreen';
import CallScreen from '../components/VideoCall/CallScreen';
import IncomingCallScreen from '../components/VideoCall/IncomingCallScreen';
import LocationScreen from '../screens/LocationScreen';
import DocumentScreen from '../screens/DocumentScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerTitle: HomeHeader}}
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
          options={{
            title: 'Users',
          }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const HomeHeader = props => {
  const {width} = useWindowDimensions();
  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        // justifyContent: 'space-between',
        width,
        padding: 10,
        alignItems: 'center',
      }}>
      <Pressable onPress={() => navigation.navigate('ProfileScreen')}>
        <Image
          source={{
            uri: 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/1.jpg',
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
      <Pressable onPress={() => navigation.navigate('UsersScreen')}>
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
