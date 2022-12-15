import React from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {View, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

function CreateChatHeader(props) {
  const onclickSearch = () => {
    props.setParams({search: true});
  };
  onclickGroup = () => {
    props.setParams({isNewGroup: true});
  };
  return (
    <View style={{flexDirection: 'row', marginRight: 13, alignItems: 'center'}}>
      <FontAwesome
        name="search"
        style={styles.icon}
        size={24}
        color="black"
        onPress={onclickSearch}
      />
      <MaterialIcons
        name="group-add"
        style={styles.icon}
        size={29}
        color="black"
        onPress={onclickGroup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    paddingHorizontal: 10,
  },
});

export default CreateChatHeader;
