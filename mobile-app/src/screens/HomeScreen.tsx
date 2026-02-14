import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../services/api';
import { Product, Farmer } from '../types';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;

// const categories = [
//   { id: 'grains', label: 'Grains', icon: '🌾' },
//   { id: 'veggie', label: 'Veggie', icon: '🥕' },
//   { id: 'fruits', label: 'Fruits', icon: '🍉' },
//   { id: 'livestock', label: 'Livestock', icon: '🐄' },
//   { id: 'tools', label: 'Tools', icon: '🔧' },
// ];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient
      .getProducts()
      .then((p) => setFeatured(p.slice(0, 6)))
      .catch(() => {});

    apiClient
      .getFarmers() 
      .then((f) => setFarmers(f.slice(0, 3)))
      .catch(() => {});
  }, []);

  const renderHarvest = ({ item }: { item: Product }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.harvestCard, { width: CARD_WIDTH }]}
      onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.harvestImage} />
      <View style={styles.harvestBadge}>
        <Text style={styles.badgeTxt}>TOP QUALITY</Text>
      </View>
      <View style={styles.harvestInfo}>
        <Text style={styles.harvestName}>{item.name}</Text>
        <Text style={styles.harvestPrice}>
          {item.price} SAR / {item.unit}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFarmer = (f: Farmer) => (
    <View key={f.id} style={styles.farmerRow}>
      <Image source={{ uri: f.profileInfo }} style={styles.farmerAvatar} />
      <View style={styles.farmerInfo}>
        <Text style={styles.farmerName}>{f.name}</Text>
        <Text style={styles.farmerCrop}>Main crop: {f.mainCrop}</Text>
        <Text style={styles.farmerStars}>★★★★★ ({f.orderCount} orders)</Text>
      </View>
      <TouchableOpacity style={styles.contactBtn}>
        <Text style={styles.contactBtnTxt}>Contact</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brand}>Suq l-Filaha</Text>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
          <Feather name="user" size={22} color="#111" />
        </TouchableOpacity>
      </View>

<View style={styles.greetingContainer}>
  <Text style={styles.greetingText}>Ahlan wa Sahlan,</Text>
  <Text style={styles.userName}>{user?.name}</Text>
</View>
      <View style={styles.searchWrap}>
        <Feather name="search" size={20} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search wholesale grains, fruits…"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Harvests</Text>
          <TouchableOpacity
                onPress={() => navigation.navigate('Products')}

          >
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featured}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          renderItem={renderHarvest}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 8,
                  paddingBottom: 20 
           }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      </View>

      {/* Categories */}
      {/* <View style={styles.section}>
<Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginBottom: 12 }]}>
    Categories
  </Text>        <View style={styles.pills}>
          {categories.map((c) => (
            <TouchableOpacity key={c.id} style={styles.pill}>
              <Text style={styles.pillEmoji}>{c.icon}</Text>
              <Text style={styles.pillLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View> */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Rated Farmers</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>Show Map</Text>
          </TouchableOpacity>
        </View>
        {farmers.map(renderFarmer)}
      </View>
    </ScrollView>
  );
}

/* -------------  STYLES  ------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', 
     // space for tab bar
     // 
      },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    paddingHorizontal: 20,
    marginTop: 56,
    marginBottom: 12,
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontSize: 22, fontWeight: '700', color: '#111' },
  logo: { width: 30, height: 30 },
// greeting: {
//     fontSize: 26,
//     fontWeight: '600',
//     color: '#111',
//     marginHorizontal: 20,
//     marginBottom: 16,
//     flexWrap: 'wrap', // Allow text to wrap to next line if too long
// },
greetingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // This allows wrapping to next line if name is too long
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'flex-start', // Align text baseline
},
greetingText: {
    fontSize: 26,
    fontWeight: '600',
    color: '#111',
},
userName: {
    fontSize: 26,
    fontWeight: '600',
    color: '#489163', // Different color for the name
    flexShrink: 1, // Allow name to shrink if needed
},
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  viewAll: { fontSize: 15, fontWeight: '600', color: '#489163' },
  harvestCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  harvestImage: { width: '100%', height: 140 },
  harvestBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#2d5016',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  harvestInfo: { padding: 14 },
  harvestName: { fontSize: 17, fontWeight: '600', color: '#111' },
  harvestPrice: { fontSize: 15, fontWeight: '600', color: '#489163', marginTop: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1e8',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pillEmoji: { fontSize: 20, marginRight: 6 },
  pillLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  farmerAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  farmerInfo: { flex: 1 },
  farmerName: { fontSize: 16, fontWeight: '600', color: '#111' },
  farmerCrop: { fontSize: 14, color: '#555', marginTop: 2 },
  farmerStars: { fontSize: 13, color: '#f59e0b', marginTop: 4 },
  contactBtn: {
    backgroundColor: '#eef5f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactBtnTxt: { color: '#489163', fontWeight: '600' },
});