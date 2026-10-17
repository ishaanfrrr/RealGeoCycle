import { StyleSheet, View, Text, Linking} from 'react-native';

export default function Tips() {
  return (
    <View>
      <Text style = {styles.header}>404 | Not found</Text>
      <Text style={{color: 'dodgerblue',textAlign:'center',fontSize:20,marginTop:30}}
      //@ts-ignore
      onPress={() => Linking.openURL('/',"_self")}> Go to home page? </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    color:'white',
    fontSize: 50,
    textAlign:'center',
    marginTop:60
  }
});
