import {useRoute} from '@react-navigation/native';
import {DataStore, Auth} from 'aws-amplify';
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import UserItem from '../components/UserItem';
import {ChatRoom, User, ChatRoomUser} from '../src/models';

export default function GroupInfoScreen() {
  const [chatRoom, setChatRoom] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const route = useRoute();

  useEffect(() => {
    fetchChatRoom();
    fetchUsers();
  }, []);

  const fetchChatRoom = async () => {
    if (!route.params?.id) {
      console.warn('No chatroom id provided');
      return;
    }
    const chatroom = await DataStore.query(ChatRoom, route.params.id);
    if (!chatroom) {
      console.error("Couldn't find a chat room with this id");
    } else {
      setChatRoom(chatroom);
    }
  };

  const fetchUsers = async () => {
    const fetchedUsers = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatRoom != undefined)
      .filter(chatRoomUser => chatRoomUser.chatRoom.id === route.params?.id)
      .map(chatRoomUser => chatRoomUser.user);

    setAllUsers(fetchedUsers);
  };

  const confirmDelete = async user => {
    // check if Auth user is admin of this group
    const authData = await Auth.currentAuthenticatedUser();
    if (chatRoom?.Admin?.id !== authData.attributes.sub) {
      Alert.alert('You are not the admin of this group');
      return;
    }

    if (user.id === chatRoom?.Admin?.id) {
      Alert.alert('You are the admin, you cannot delete yourself');
      return;
    }

    Alert.alert(
      'Confirm delete',
      `Are you sure you want to delete ${user.name} from the group`,
      [
        {
          text: 'Delete',
          onPress: () => deleteUser(user),
          style: 'destructive',
        },
        {
          text: 'Cancel',
        },
      ],
    );
  };

  const deleteUser = async user => {
    const chatRoomUsersToDelete = (await DataStore.query(ChatRoomUser))
      .filter(chatRoomUser => chatRoomUser.chatRoom != undefined)
      .filter(
        cru => cru.chatRoom.id === chatRoom.id && cru.user.id === user.id,
      );

    console.log(chatRoomUsersToDelete);

    if (chatRoomUsersToDelete.length > 0) {
      await DataStore.delete(chatRoomUsersToDelete[0]);

      setAllUsers(allUsers.filter(u => u.id !== user.id));
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{chatRoom?.name}</Text>

      <Text style={styles.title}>Users ({allUsers.length})</Text>
      <FlatList
        data={allUsers}
        renderItem={({item}) => (
          <UserItem
            user={item}
            isAdmin={chatRoom?.Admin?.id === item.id}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    padding: 10,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
});
