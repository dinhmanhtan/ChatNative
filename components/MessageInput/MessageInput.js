import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
} from 'react-native';

import Feather from 'react-native-vector-icons/Feather';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {DataStore} from '@aws-amplify/datastore';
import {ChatRoom, Message} from '../../src/models';
import {Auth, Storage} from 'aws-amplify';
import EmojiModal from 'react-native-emoji-modal';
// import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
// import {Audio, AVPlaybackStatus} from 'expo-av';
// import AudioPlayer from '../AudioPlayer';
import MessageComponent from '../Message';
// import * as DocumentPicker from 'expo-document-picker';
import {useNavigation} from '@react-navigation/core';

const MessageInput = ({chatRoom, messageReplyTo, removeMessageReplyTo}) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const [image, setImage] = useState(null);
  const [progress, setProgress] = useState(0);

  const [recording, setRecording] = useState(null);
  const [soundURI, setSoundURI] = useState(null);
  const [documentURI, setDocumentURI] = useState(null);
  const navigation = useNavigation();

  // useEffect(() => {
  //   (async () => {
  //     if (Platform.OS !== 'web') {
  //       const libraryResponse =
  //         await ImagePicker.requestMediaLibraryPermissionsAsync();
  //       const photoResponse = await ImagePicker.requestCameraPermissionsAsync();
  //       await Audio.requestPermissionsAsync();

  //       if (
  //         libraryResponse.status !== 'granted' ||
  //         photoResponse.status !== 'granted'
  //       ) {
  //         alert('Sorry, we need camera roll permissions to make this work!');
  //       }
  //     }
  //   })();
  // }, []);

  // const pickDocument = async () => {
  //   let result = await DocumentPicker.getDocumentAsync({});
  //   console.log(result);
  //   setDocumentURI(result.uri);
  // };

  const sendMessage = async () => {
    // send message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        replyToMessageID: messageReplyTo?.id,
      }),
    );

    updateLastMessage(newMessage);
    resetFields();
  };

  const updateLastMessage = async newMessage => {
    console.log(newMessage);
    DataStore.save(
      ChatRoom.copyOf(chatRoom, updatedChatRoom => {
        updatedChatRoom.LastMessage = newMessage;
      }),
    );
  };

  const onPlusClicked = () => {
    console.warn('On plus clicked');
  };

  const onPress = () => {
    if (image) {
      console.log('message');
      sendImage();
    } else if (soundURI) {
      sendAudio();
    } else if (message) {
      sendMessage();
    } else if (documentURI) {
      sendDocument();
    } else {
      onPlusClicked();
    }
  };

  const resetFields = () => {
    setMessage('');
    setIsEmojiPickerOpen(false);
    setImage(null);
    setProgress(0);
    setSoundURI(null);
    setDocumentURI(null);
    removeMessageReplyTo();
  };

  // Image picker
  // const pickImage = async () => {
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 0.5,
  //   });

  //   if (!result.cancelled) {
  //     setImage(result.uri);
  //   }
  // };

  // const takePhoto = async () => {
  //   const result = await ImagePicker.launchCameraAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     aspect: [4, 3],
  //   });

  //   if (!result.cancelled) {
  //     setImage(result.uri);
  //   }
  // };

  const progressCallback = progress => {
    setProgress(progress.loaded / progress.total);
  };

  const sendImage = async () => {
    if (!image) {
      return;
    }
    const blob = await getBlob(image);
    const {key} = await Storage.put(`${uuidv4()}.png`, blob, {
      progressCallback,
    });

    // send message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        image: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        replyToMessageID: messageReplyTo?.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const getBlob = async uri => {
    const respone = await fetch(uri);
    const blob = await respone.blob();
    return blob;
  };

  // async function startRecording() {
  //   try {
  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });

  //     console.log('Starting recording..');
  //     const {recording} = await Audio.Recording.createAsync(
  //       Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY,
  //     );
  //     setRecording(recording);
  //     console.log('Recording started');
  //   } catch (err) {
  //     console.error('Failed to start recording', err);
  //   }
  // }

  // async function stopRecording() {
  //   console.log('Stopping recording..');
  //   if (!recording) {
  //     return;
  //   }

  //   setRecording(null);
  //   await recording.stopAndUnloadAsync();
  //   await Audio.setAudioModeAsync({
  //     allowsRecordingIOS: false,
  //   });

  //   const uri = recording.getURI();
  //   console.log('Recording stopped and stored at', uri);
  //   if (!uri) {
  //     return;
  //   }
  //   setSoundURI(uri);
  // }

  const sendAudio = async () => {
    if (!soundURI) {
      return;
    }
    const uriParts = soundURI.split('.');
    const extenstion = uriParts[uriParts.length - 1];
    const blob = await getBlob(soundURI);
    const {key} = await Storage.put(`${uuidv4()}.${extenstion}`, blob, {
      progressCallback,
    });

    // send message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        audio: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        status: 'SENT',
        replyToMessageID: messageReplyTo?.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  const sendDocument = async () => {
    if (!documentURI) {
      return;
    }
    const uriParts = documentURI.split('.');
    const extenstion = uriParts[uriParts.length - 1];
    const blob = await getBlob(documentURI);
    const {key} = await Storage.put(`${uuidv4()}.${extenstion}`, blob, {
      progressCallback,
    });

    // send message
    const user = await Auth.currentAuthenticatedUser();
    const newMessage = await DataStore.save(
      new Message({
        content: message,
        document: key,
        userID: user.attributes.sub,
        chatroomID: chatRoom.id,
        status: 'SENT',
        replyToMessageID: messageReplyTo?.id,
      }),
    );

    updateLastMessage(newMessage);

    resetFields();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {height: isEmojiPickerOpen ? '52%' : 'auto'}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}>
      {messageReplyTo && (
        <View
          style={{
            backgroundColor: '#f2f2f2',
            padding: 5,
            flexDirection: 'row',
            alignSelf: 'stretch',
            justifyContent: 'space-between',
          }}>
          <View style={{flex: 1}}>
            <Text>Reply to:</Text>
            <MessageComponent message={messageReplyTo} />
          </View>
          <Pressable onPress={() => removeMessageReplyTo()}>
            <AntDesign
              name="close"
              size={24}
              color="black"
              style={{margin: 5}}
            />
          </Pressable>
        </View>
      )}

      {(image || documentURI || soundURI) && (
        <View style={styles.sendImageContainer}>
          {(image || documentURI) && (
            <Image
              source={{
                uri: image
                  ? image
                  : 'https://auth7074d48482fa400bb2388f6e074c33a7105513-staging.s3.ap-southeast-1.amazonaws.com/public/document-icon.jpg',
              }}
              style={{width: 100, height: 100, borderRadius: 10}}
            />
          )}
          {/* {soundURI && <AudioPlayer soundURI={soundURI} />} */}

          <View
            style={{
              flex: 1,
              justifyContent: 'flex-start',
              alignSelf: 'flex-end',
            }}>
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: '#3777f0',
                width: `${progress * 100}%`,
              }}
            />
          </View>

          <Pressable
            onPress={() => {
              setImage(null);
              setDocumentURI(null);
              setSoundURI(null);
            }}>
            <AntDesign
              name="close"
              size={24}
              color="black"
              style={{margin: 5}}
            />
          </Pressable>
        </View>
      )}
      {/* {soundURI && <AudioPlayer soundURI={soundURI} />} */}

      {isEmojiPickerOpen && (
        <EmojiModal
          onEmojiSelected={emoji =>
            setMessage(currentMessage => currentMessage + emoji)
          }
          columns={10}
          emojiSize={30}
        />
      )}

      <View style={styles.row}>
        <View style={styles.inputContainer}>
          <Pressable
            onPress={() => setIsEmojiPickerOpen(currentValue => !currentValue)}>
            <SimpleLineIcons
              name="emotsmile"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Message..."
            onPressIn={() => setIsEmojiPickerOpen(false)}
          />
          <Pressable
          // onPress={() =>
          //   navigation.navigate('LocationScreen', {
          //     chatRoom: chatRoom,
          //     replyToMessageID: messageReplyTo?.id,
          //   })
          // }
          >
            <Ionicons name="ios-location-outline" size={24} color="black" />
          </Pressable>
          {/* onPress={pickDocument} */}
          <Pressable>
            <Ionicons name="document-attach-outline" size={24} color="black" />
          </Pressable>
          {/* onPress={pickImage} */}
          <Pressable>
            <Feather
              name="image"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>
          {/* onPress={takePhoto} */}
          <Pressable>
            <Feather
              name="camera"
              size={24}
              color="#595959"
              style={styles.icon}
            />
          </Pressable>
          {/* onPressIn={startRecording} onPressOut={stopRecording} */}
          <Pressable>
            <MaterialCommunityIcons
              name={recording ? 'microphone' : 'microphone-outline'}
              size={24}
              color={recording ? 'red' : '#595959'}
              style={styles.icon}
            />
          </Pressable>
        </View>

        <Pressable onPress={onPress} style={styles.buttonContainer}>
          {message || image || soundURI || documentURI ? (
            <Ionicons name="send" size={18} color="white" />
          ) : (
            <AntDesign name="plus" size={28} color="white" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    padding: 10,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    backgroundColor: '#f2f2f2',
    flex: 1,
    marginRight: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#dedede',
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    marginHorizontal: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  buttonContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#3777f0',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 35,
  },

  sendImageContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
  },
});

export default MessageInput;
