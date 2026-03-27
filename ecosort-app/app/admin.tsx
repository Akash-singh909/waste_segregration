import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PieChart from 'react-native-pie-chart';

export default function AdminDashboard() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalScans: 0, totalItems: 0, categories: {} as Record<string, number> });

  // Mock State Average for Plastic
  const THANE_CITY_PLASTIC_AVG = 45; 

  useEffect(() => {
    if (authLoading) return;
    
    if (!userProfile || userProfile.role !== 'secretary') {
      setLoading(false);
      return;
    }

    const fetchScans = async () => {
      try {
        const q = query(
          collection(db, 'scans'),
          where('areaName', '==', userProfile.areaName)
        );
        const querySnapshot = await getDocs(q);
        
        let totalItemsCount = 0;
        let catCounts: Record<string, number> = {
          Plastic: 0,
          Organic: 0,
          Paper: 0,
          Metal: 0,
          Other: 0
        };

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const items = data.analysisResults?.items || [];
          const itemArray = Array.isArray(items) ? items : [data.analysisResults?.item_name ? data.analysisResults : []];
          
          itemArray.forEach((item: any) => {
            if (item.category) {
              totalItemsCount++;
              const cat = item.category;
              catCounts[cat] = (catCounts[cat] || 0) + 1;
            }
          });
        });

        const percentages: Record<string, number> = {};
        if (totalItemsCount > 0) {
          Object.keys(catCounts).forEach(cat => {
            percentages[cat] = Math.round((catCounts[cat] / totalItemsCount) * 100);
          });
        }

        setStats({
          totalScans: querySnapshot.size,
          totalItems: totalItemsCount,
          categories: percentages
        });
      } catch(e) {
        console.error('Error fetching admin stats', e);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [userProfile, authLoading]);

  if (authLoading || loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  if (!userProfile || userProfile.role !== 'secretary') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorText}>This area is restricted to Secretaries only.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Go to Scanner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const plasticPercent = stats.categories['Plastic'] || 0;
  const isWorseThanAvg = plasticPercent > THANE_CITY_PLASTIC_AVG;
  const comparisonDiff = Math.abs(plasticPercent - THANE_CITY_PLASTIC_AVG);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-account" size={48} color="#166534" />
        <Text style={styles.title}>{userProfile.areaName} Admin</Text>
        <Text style={styles.subtitle}>Secretary Dashboard</Text>
      </View>

      {/* State Comparison Mock-up */}
      <View style={[styles.comparisonCard, isWorseThanAvg ? styles.comparisonCardWarning : styles.comparisonCardGood]}>
        <View style={styles.comparisonHeader}>
          <Ionicons name={isWorseThanAvg ? 'warning' : 'trophy'} size={24} color={isWorseThanAvg ? '#b45309' : '#15803d'} />
          <Text style={[styles.comparisonTitle, { color: isWorseThanAvg ? '#b45309' : '#15803d' }]}>
            State Comparison
          </Text>
        </View>
        <Text style={styles.comparisonText}>
          Your society generates <Text style={{fontWeight: 'bold'}}>{plasticPercent}% Plastic</Text> waste.
        </Text>
        <Text style={[styles.comparisonHighlight, { color: isWorseThanAvg ? '#dc2626' : '#16a34a' }]}>
          {isWorseThanAvg 
            ? `That's ${comparisonDiff}% MORE plastic than the Thane city average (${THANE_CITY_PLASTIC_AVG}%).` 
            : `Great job! That's ${comparisonDiff}% LESS plastic than the Thane city average (${THANE_CITY_PLASTIC_AVG}%).`}
        </Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalScans}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Items Logged</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Waste Composition</Text>
      
      {stats.totalItems === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No scans have been recorded in your society yet.</Text>
        </View>
      ) : (
        <View style={styles.compositionContainer}>
          <View style={styles.chartWrapper}>
            <PieChart
              widthAndHeight={220}
              series={Object.entries(stats.categories)
                .filter(([cat, percent]) => percent > 0)
                .map(([cat, percent]) => {
                  let color = '#6b7280';
                  if (cat === 'Plastic') color = '#3b82f6';
                  if (cat === 'Organic') color = '#f59e0b';
                  if (cat === 'Paper') color = '#22c55e';
                  if (cat === 'Metal') color = '#ef4444';
                  return { value: percent, color };
                })}
              cover={{ radius: 0.65, color: '#FFF' }}
            />
          </View>
          <View style={styles.legendContainer}>
            {Object.entries(stats.categories)
              .filter(([cat, percent]) => percent > 0 || cat === 'Plastic' || cat === 'Organic')
              .map(([cat, percent]) => {
                 let color = '#6b7280';
                 if (cat === 'Plastic') color = '#3b82f6';
                 if (cat === 'Organic') color = '#f59e0b';
                 if (cat === 'Paper') color = '#22c55e';
                 if (cat === 'Metal') color = '#ef4444';
                 return (
                  <View key={cat} style={styles.legendItem}>
                    <View style={[styles.legendColorBox, { backgroundColor: color }]} />
                    <Text style={styles.legendText}>{cat} ({percent}%)</Text>
                  </View>
                 );
              })}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: 20 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginTop: 12 },
  subtitle: { fontSize: 18, color: '#4b5563', fontWeight: '500', marginTop: 4 },
  
  errorTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  errorText: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  backButton: { backgroundColor: '#111827', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  comparisonCard: { borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 2 },
  comparisonCardWarning: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  comparisonCardGood: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  comparisonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  comparisonTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
  comparisonText: { fontSize: 15, color: '#374151', marginBottom: 8 },
  comparisonHighlight: { fontSize: 16, fontWeight: '700' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statBox: { flex: 0.48, backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  statValue: { fontSize: 36, fontWeight: '900', color: '#16a34a', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 16 },
  
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center' },

  compositionContainer: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  chartWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: -10, marginBottom: -10 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginVertical: 6 },
  legendColorBox: { width: 14, height: 14, borderRadius: 7, marginRight: 6 },
  legendText: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
});
