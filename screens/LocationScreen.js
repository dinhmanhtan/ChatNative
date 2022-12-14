import React, {useEffect, useState} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {StyleSheet, Text, View, Dimensions, Pressable} from 'react-native';
import {Button} from 'react-native-paper';
import {Auth} from 'aws-amplify';
import {ChatRoom, Message, Location as LocationMap} from '../src/models';
import {useNavigation} from '@react-navigation/core';
import {DataStore} from '@aws-amplify/datastore';
import GetLocation from 'react-native-get-location';
import NotificationService from '../components/NotificationService';

export default function LocationScreen({route}) {
  // console.log("props", route);
  const navigation = useNavigation();
  const [authUser, setAuthuser] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  useEffect(() => {
    (async () => {
      GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })
        .then(location => {
          console.log(location);
          setMapRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        })
        .catch(error => {
          const {code, message} = error;
          console.warn(code, message);
        });
    })();
    const getAuthUser = async () => {
      await Auth.currentAuthenticatedUser().then(setAuthuser);
    };
    getAuthUser();
  }, []);

  const sendMessage = async () => {
    // send message
    const location = new LocationMap({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    });
    const user = await Auth.currentAuthenticatedUser();
    const navigateToChatroom = user => {
      const data = {
        body: '[Location]',
        title: route.params.chatRoom.name
          ? route.params.chatRoom.name
          : 'Message',
        type: 'MESSAGE',
        token: route.params.chatRoom.isGroup
          ? route.params.otherTokens
          : route.params.otherTokens[0],
        chatroomID: route.params.chatRoom.id,
        username: authUser.username,
      };
      if (!route.params.chatRoom.isGroup)
        NotificationService.sendSingleDeviceNotification(data);
      else NotificationService.sendMultiDeviceNotification(data);

      //console.log(route.params.chatRoom.id);
      navigation.navigate('ChatRoom', {id: route.params.chatRoom.id});
    };

    const updateLastMessage = async newMessage => {
      console.log(route.params.chatRoom);
      DataStore.save(
        ChatRoom.copyOf(route.params.chatRoom, updatedChatRoom => {
          updatedChatRoom.LastMessage = newMessage;
        }),
      ).then(navigateToChatroom);
    };

    const newMessage = await DataStore.save(
      new Message({
        userID: user.attributes.sub,
        chatroomID: route.params.chatRoom.id,
        replyToMessageID: route.params.replyToMessageID,
        location,
        status: 'SENT',
      }),
    ).then(updateLastMessage);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        showsMyLocationButton={true}
        showsUserLocation={true}
        followsUserLocation={true}
        showsCompass={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        onPress={event => console.log(event.nativeEvent.coordinate)}>
        <Marker
          coordinate={mapRegion}
          title="Marker"
          onPress={() => console.log(mapRegion)}
        />
      </MapView>
      <Button style={styles.yourLocation} onPress={sendMessage}>
        Share your Location
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    //justifyContent: "center",
  },
  map: {
    width: Dimensions.get('window').width,
    height: 0.7 * Dimensions.get('window').height,
  },
  yourLocation: {
    marginTop: 15,
    padding: 7,
    backgroundColor: '#e28743',
  },
});
