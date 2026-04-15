import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Plus, Search, ShieldCheck, Users } from 'lucide-react-native';
import { BRAND } from '../../lib/brand';

const contacts = [
  ['Marketplace Buyer', '+1 415 555 0182', 'Verified route'],
  ['Travel Support', '+44 20 7946 0482', 'Global number'],
  ['Private Work Line', '+1 647 555 0198', 'US/CA calls'],
];

export default function ContactsScreen() {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.kicker}>Contacts</Text>
            <Text style={s.title}>Private address book.</Text>
          </View>
          <TouchableOpacity style={s.addButton} activeOpacity={0.78} onPress={() => Alert.alert('Add contact', 'Create a private contact alias for calls and SMS.')}>
            <Plus size={20} color={BRAND.colors.black} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.search} activeOpacity={0.78} onPress={() => Alert.alert('Search', 'Search contacts by alias, number, or country code.')}>
          <Search size={17} color={BRAND.colors.cyberGreen} />
          <Text style={s.searchText}>Search private contacts</Text>
        </TouchableOpacity>

        <View style={s.privacyCard}>
          <ShieldCheck size={20} color={BRAND.colors.cyberGreen} />
          <View style={{ flex: 1 }}>
            <Text style={s.privacyTitle}>Aliases over exposure</Text>
            <Text style={s.privacyText}>Keep real names optional. Route every conversation through the burner number you choose.</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Saved contacts</Text>
        {contacts.map(([name, number, tag]) => (
          <TouchableOpacity key={name} style={s.contactRow} activeOpacity={0.78}>
            <View style={s.avatar}>
              <Users size={16} color={BRAND.colors.cyberGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.contactName}>{name}</Text>
              <Text style={s.contactNumber}>{number}</Text>
            </View>
            <View style={s.tag}>
              <Text style={s.tagText}>{tag}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.callHint} activeOpacity={0.78} onPress={() => Alert.alert('Call flow', 'Calls open in the native call screen with haptic feedback and safe-area controls.')}>
          <Phone size={18} color={BRAND.colors.cyberGreen} />
          <Text style={s.callHintText}>Tap a contact to call, message, or assign a burner route.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.colors.black },
  content: { padding: 20, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: BRAND.colors.cyberGreen, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: BRAND.colors.white, fontSize: 34, lineHeight: 35, fontWeight: '900', textTransform: 'uppercase', marginTop: 10 },
  addButton: { width: 50, height: 50, borderRadius: BRAND.radii.sm, backgroundColor: BRAND.colors.cyberGreen, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 54, marginTop: 24, borderRadius: BRAND.radii.sm, borderWidth: 1, borderColor: BRAND.colors.border, backgroundColor: BRAND.colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  searchText: { color: BRAND.colors.muted, fontSize: 14 },
  privacyCard: { marginTop: 14, flexDirection: 'row', gap: 12, borderRadius: BRAND.radii.lg, padding: 16, backgroundColor: `${BRAND.colors.cyberGreen}0A`, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}28` },
  privacyTitle: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  privacyText: { color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18, marginTop: 4 },
  sectionTitle: { color: BRAND.colors.muted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 28, marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BRAND.radii.lg, padding: 14, backgroundColor: BRAND.colors.surface, borderWidth: 1, borderColor: BRAND.colors.border, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: BRAND.radii.md, backgroundColor: `${BRAND.colors.cyberGreen}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  contactName: { color: BRAND.colors.white, fontSize: 14, fontWeight: '900' },
  contactNumber: { color: BRAND.colors.muted, fontFamily: BRAND.typography.mono, fontSize: 12, marginTop: 3 },
  tag: { borderRadius: BRAND.radii.sm, backgroundColor: `${BRAND.colors.cyberGreen}12`, borderWidth: 1, borderColor: `${BRAND.colors.cyberGreen}28`, paddingHorizontal: 8, paddingVertical: 5 },
  tagText: { color: BRAND.colors.cyberGreen, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  callHint: { marginTop: 12, flexDirection: 'row', gap: 10, borderRadius: BRAND.radii.lg, padding: 16, backgroundColor: BRAND.colors.dark, borderWidth: 1, borderColor: BRAND.colors.border },
  callHintText: { flex: 1, color: BRAND.colors.metalStart, fontSize: 12, lineHeight: 18 },
});
