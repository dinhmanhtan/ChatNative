import {View, Image, Text, useWindowDimensions, Pressable} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Feather} from '@expo/vector-icons';
import {Auth, DataStore} from 'aws-amplify';
import {ChatRoom, ChatRoomUser, User} from '../src/models';
import moment from 'moment';
import {useNavigation} from '@react-navigation/core';

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

  return (
    <Pressable
      onPress={openInfo}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
      }}>
      <Image
        source={{
          uri: chatRoom?.imageUri || user?.imageUri,
        }}
        style={{width: 30, height: 30, borderRadius: 30}}
      />

      <View style={{flex: 1, marginLeft: 10}}>
        <Text style={{fontWeight: 'bold'}}>{chatRoom?.name || user?.name}</Text>
        <Text numberOfLines={1}>
          {isGroup ? getUsernames() : getLastOnlineText()}
        </Text>
      </View>

      <Feather
        name="camera"
        size={24}
        color="black"
        style={{marginHorizontal: 10}}
      />
      <Feather
        name="edit-2"
        size={24}
        color="black"
        style={{marginHorizontal: 10}}
      />
    </Pressable>
  );
};

export default ChatRoomHeader;
