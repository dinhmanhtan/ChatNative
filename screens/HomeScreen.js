import React, {useState, useEffect} from 'react';

import {
  Text,
  Image,
  Pressable,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  LogBox,
} from 'react-native';
import {Auth, DataStore} from 'aws-amplify';
import {ChatRoom, ChatRoomUser, Message} from '../src/models';
import ChatRoomItem from '../components/ChatRoomItem';
import {Voximplant} from 'react-native-voximplant';
// import calls from '../components/VideoCall/Store';
import {useNavigation} from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import notifee, {EventType} from '@notifee/react-native';
import NotificationService from '../components/NotificationService';

export default function HomeScreen() {
  LogBox.ignoreAllLogs();
  const [chatRooms, setChatRooms] = useState([]);
  const [observe, setObserve] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const voximplant = Voximplant.getInstance();

  const navigation = useNavigation();

  useEffect(() => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      // console.log(remoteMessage);
      if (remoteMessage.data.type == 'MESSAGE')
        navigation.navigate('ChatRoom', {
          id: remoteMessage.data.chatroomID,
        });

      NotificationService.DisplayNotification(remoteMessage);
    });
  });

  // notifee.onBackgroundEvent(async ({type, detail}) => {
  //   // console.log(data);

  //   // Check if the user pressed the "Mark as read" action
  //   if (type == 3) {
  //     if (detail.notification.data.type === 'MESSAGE')
  //       navigation.navigate('ChatRoom', {
  //         id: detail.notification.data.chatroomID,
  //       });

  //     await notifee.cancelNotification(notification.id);
  //   }
  // });

  const fetchuserAuth = async () => {
    // console.log('bb');

    const userData = await Auth.currentAuthenticatedUser().then(setUserAuth);

    // console.log(userData);

    // setChatRooms(chatRooms);
  };
  useEffect(() => {
    fetchuserAuth();
    // console.log("1", chatRooms);
  }, []);

  useEffect(() => {
    const fb = item => {
      // console.log('item');
      setChatRooms(
        item
          .filter(
            chatRoomUser => chatRoomUser.user.id === userAuth.attributes.sub,
          )
          .map(chatRoomUser => chatRoomUser.chatRoom),
      );
      setObserve(true);
      // setUserAuth(userData);
    };

    const fetchChatRooms = async () => {
      // console.log('fetchChatRooms');
      const b = await DataStore.query(ChatRoomUser).then(fb);
    };

    if (userAuth) {
      fetchChatRooms();
    }
  }, [userAuth]);

  useEffect(() => {
    if (userAuth) {
      const subscription = DataStore.observe(ChatRoomUser).subscribe(
        chatroomUser => {
          // console.log(chatroomUser);
          // console.log(userAuth);
          if (
            chatroomUser.model === ChatRoomUser &&
            chatroomUser.opType === 'INSERT' &&
            chatroomUser.element.user.id === userAuth?.attributes.sub
          ) {
            console.log('yes', chatroomUser.element.chatRoom);
            setChatRooms(existingChatRoom => [
              chatroomUser.element.chatRoom,
              ...existingChatRoom,
            ]);
          }
        },
      );

      return () => subscription.unsubscribe();
    }
  }, [userAuth]);

  // useEffect(() => {
  //   if (userAuth) {
  //     const subscription = DataStore.observe(ChatRoom).subscribe((chatroom) => {
  //       // console.log(chatroomUser);

  //       if (
  //         chatroom.model === ChatRoom &&
  //         chatroom.opType === "UPDATE" &&
  //         chatroom.element.chatRoomLastMessageId
  //       ) {
  //         console.log("chatrooms", chatRooms);
  //         for (let i = 0; i < chatRooms.length; i++) {
  //           if (
  //             chatRooms[i].id === chatroom.element.id &&
  //             chatRooms[i].chatRoomLastMessageId !=
  //               chatroom.element.chatRoomLastMessageId
  //           ) {
  //             console.log("change");
  //             const rooms = chatRooms.filter(
  //               (room) => room.id != chatRooms[i].id
  //             );
  //             const finalRooms = [chatroom.element, ...rooms];
  //             console.log("rooms", rooms);
  //             console.log("final", finalRooms);
  //             setChatRooms(finalRooms);
  //           }
  //         }
  //       }
  //     });

  //     return () => subscription.unsubscribe();
  //   }
  // }, [userAuth]);
  // console.log('rooms', chatRooms);
  // ---------------------------------
  // Listen for coming call
  // useEffect(() => {
  //   // console.log('islogin', isLoginCall);

  //   voximplant.on(Voximplant.ClientEvents.IncomingCall, incomingCallEvent => {
  //     calls.set(incomingCallEvent.call.callId, incomingCallEvent.call);
  //     navigation.navigate('IncomingCall', {
  //       callId: incomingCallEvent.call.callId,
  //     });
  //   });
  //   return function cleanup() {
  //     voximplant.off(Voximplant.ClientEvents.IncomingCall);
  //   };
  // });

  if (!userAuth) {
    return <ActivityIndicator />;
  } else {
    // console.log(userAuth);
  }

  return (
    <View style={styles.page}>
      <FlatList
        data={chatRooms}
        renderItem={({item}) => <ChatRoomItem chatroom={item} />}
        showsVerticalScrollIndicator={false}
      />
      {/* <Pressable
        onPress={logOut}
        style={{
          backgroundColor: "red",
          height: 50,
          margin: 10,
          borderRadius: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>Logout</Text>
      </Pressable> */}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: 'white',
    flex: 1,
  },
});
