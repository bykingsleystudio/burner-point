import { View, Text, StyleSheet, ScrollView } from 'react-native';
const titles: Record<string,string> = { inbox:'Inbox', numbers:'Numbers', credits:'Credits', settings:'Settings' };
export default function Screen() {
  return (
    <ScrollView style={{ flex:1, backgroundColor:'#050505' }} contentContainerStyle={{ padding:16, paddingTop:60 }}>
      <Text style={{ fontSize:20, fontWeight:'700', color:'#fff', marginBottom:4 }}>{titles['inbox']}</Text>
      <Text style={{ fontSize:12, color:'#666' }}>Manage your inbox here.</Text>
      <View style={{ marginTop:24, backgroundColor:'#111', borderWidth:1, borderColor:'#1A1A1A', borderRadius:14, padding:32, alignItems:'center' }}>
        <Text style={{ fontSize:32, marginBottom:12 }}>{['inbox','numbers','credits','settings'].indexOf('inbox') >= 0 ? ['💬','📱','💰','⚙️'][['inbox','numbers','credits','settings'].indexOf('inbox')] : '📋'}</Text>
        <Text style={{ color:'#666', fontSize:13 }}>inbox content coming soon</Text>
      </View>
    </ScrollView>
  );
}
