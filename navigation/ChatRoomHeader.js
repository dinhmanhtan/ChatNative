import {
  View,
  Image,
  Text,
  useWindowDimensions,
  Pressable,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Auth, DataStore} from 'aws-amplify';
import {ChatRoom, ChatRoomUser, User} from '../src/models';
import moment from 'moment';
import {useNavigation} from '@react-navigation/core';
import {
  VOXIMPLANT_ACCOUNT,
  VOXIMPLANT_APP,
} from '../components/VideoCall/Constants';
import {Voximplant} from 'react-native-voximplant';

const ChatRoomHeader = ({id, children}) => {
  const {width} = useWindowDimensions();
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [chatRoom, setChatRoom] = useState(undefined);
  const navigation = useNavigation();

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatRoom != undefined)
      .filter(chatRoomUser => chatRoomUser.chatRoom.id === id)
      .map(chatRoomUser => chatRoomUser.user);

    setAllUsers(fetchedUsers);

    const authUser = await Auth.currentAuthenticatedUser();
    setUser(
      fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null,
    );
  };

  const fetchChatRoom = async () => {
    DataStore.query(ChatRoom, id).then(setChatRoom);
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchUsers();
    fetchChatRoom();
  }, []);

  const getLastOnlineText = () => {
    if (!user?.lastOnlineAt) {
      return null;
    }

    // if lastOnlineAt is less than 5 minutes ago, show him as ONLINE
    const lastOnlineDiffMS = moment().diff(moment(user.lastOnlineAt));
    if (lastOnlineDiffMS < 1 * 60 * 1000) {
      // less than 5 minutes
      return 'online';
    } else {
      return `Last seen online ${moment(user.lastOnlineAt).fromNow()}`;
    }
  };

  const openInfo = () => {
    // redirect to info page
    navigation.navigate('GroupInfoScreen', {id});
  };

  const getUsernames = () => {
    return allUsers.map(user => user.name).join(', ');
  };

  const isGroup = allUsers.length > 2;

  //
  async function makeCall(isVideoCall) {
    console.log('user', user.name);
    try {
      if (Platform.OS === 'android') {
        let permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (isVideoCall) {
          permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const recordAudioGranted =
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';
        const cameraGranted =
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
        if (recordAudioGranted) {
          if (isVideoCall && !cameraGranted) {
            console.warn(
              'MainScreen: makeCall: camera permission is not granted',
            );
            return;
          }
        } else {
          console.warn(
            'MainScreen: makeCall: record audio permission is not granted',
          );
          return;
        }
      }
      navigation.navigate('Call', {
        isVideoCall: isVideoCall,
        callee: `${user.name}@${VOXIMPLANT_APP}.${VOXIMPLANT_ACCOUNT}.voximplant.com`,
        isIncomingCall: false,
        chatroomID: id,
      });
    } catch (e) {
      console.warn(`MainScreen: makeCall failed: ${e}`);
    }
  }
  //
  useEffect(() => {
    login();
  }, []);
  const voximplant = Voximplant.getInstance();
  async function login() {
    const userData = await Auth.currentAuthenticatedUser();
    try {
      let clientState = await voximplant.getClientState();
      if (clientState === Voximplant.ClientState.DISCONNECTED) {
        await voximplant.connect();
        await voximplant.login(
          `${userData.attributes.username}@${VOXIMPLANT_APP}.${VOXIMPLANT_ACCOUNT}.voximplant.com`,
          PASS,
        );
      }
      if (clientState === Voximplant.ClientState.CONNECTED) {
        await voximplant.login(
          `${userData.attributes.username}@${VOXIMPLANT_APP}.${VOXIMPLANT_ACCOUNT}.voximplant.com`,
          PASS,
        );
      }
    } catch (e) {
      let message;
      switch (e.name) {
        case Voximplant.ClientEvents.ConnectionFailed:
          message = 'Connection error, check your internet connection';
          break;
        case Voximplant.ClientEvents.AuthResult:
          message = 'Error authentication';
          break;
        default:
          message = 'Unknown error. Try again';
      }
      // showLoginError(message);
    }
  }

  return (
    <Pressable
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
      }}>
      <Pressable onPress={openInfo}>
        <Image
          source={{
            uri: chatRoom?.imageUri || user?.imageUri,
          }}
          style={{width: 30, height: 30, borderRadius: 30}}
        />
      </Pressable>

      <View style={{flex: 1, marginLeft: 10}}>
        <Text style={{fontWeight: 'bold'}}>{chatRoom?.name || user?.name}</Text>
        <Text numberOfLines={1}>
          {isGroup ? getUsernames() : getLastOnlineText()}
        </Text>
      </View>
      <MaterialIcons
        name="call"
        size={24}
        color="black"
        style={{marginRight: 5}}
      />
      <Pressable onPress={() => makeCall(true)}>
        <MaterialIcons
          name="video-call"
          size={27}
          color="black"
          style={{marginLeft: 10}}
        />
      </Pressable>
    </Pressable>
  );
};

export default ChatRoomHeader;
