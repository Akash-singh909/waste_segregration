import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Leaf, Recycle, Trash2, Home, X, Camera, PawPrint, AlertTriangle } from 'lucide-react-native';

const CATEGORY_COLORS = {
  Plastic: '#3b82f6', // blue
  Paper: '#22c55e', // green
  Organic: '#f59e0b', // amber
  Metal: '#ef4444', // red
  Other: '#6b7280', // gray
};

const CATEGORY_RECYCLABLE = {
  Plastic: true,
  Paper: true,
  Organic: true,
  Metal: true,
  Other: false,
};

export default function ResultScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();

  let result: any = null;
  try {
    if (data) result = JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse result data", e);
  }

  const composition = result?.composition || 'UNKNOWN COMPOSITION';
  const impact = result?.impact || [];
  const risks = result?.risks || [];
  const disposalSteps = result?.disposalSteps || [];
  const isWaste = result?.isWaste !== false;

  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;

  const translateY1 = useRef(new Animated.Value(20)).current;
  const translateY2 = useRef(new Animated.Value(20)).current;
  const translateY3 = useRef(new Animated.Value(20)).current;
  const translateY4 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!result || (!result.composition && (!result.impact || result.impact.length === 0) && (!result.risks || result.risks.length === 0) && (!result.disposalSteps || result.disposalSteps.length === 0))) {
      return;
    }

    const animateCard = (fadeAnim: Animated.Value, translateAnim: Animated.Value, delay: number) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ])
      ]).start();
    };

    animateCard(fadeAnim1, translateY1, 0);
    animateCard(fadeAnim2, translateY2, 120);
    animateCard(fadeAnim3, translateY3, 240);
    animateCard(fadeAnim4, translateY4, 360);
  }, [result]);

  if (!result || (!result.composition && (!result.impact || result.impact.length === 0) && (!result.risks || result.risks.length === 0) && (!result.disposalSteps || result.disposalSteps.length === 0))) {
    return (
      <SafeAreaView className="flex-1 bg-[#F0F4F0] justify-center items-center p-6">
        <ActivityIndicator size="large" color="#1B4332" />
        <Text className="mt-4 text-[#1B4332] font-medium text-lg">Analyzing waste...</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-[#1B4332] px-6 py-3 rounded-full flex-row items-center shadow-lg">
          <Camera color="#fff" size={20} className="mr-2" />
          <Text className="text-white font-bold text-lg">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F0F4F0]">
      {/* Top Header */}
      <View className={`flex-row justify-end px-6 ${Platform.OS === 'ios' ? 'pt-4' : 'pt-10'}`}>
        <TouchableOpacity onPress={() => router.back()} className="bg-white p-3 rounded-full shadow-sm">
          <X color="#1B4332" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6 pt-2">

        {/* Composition Card */}
        {isWaste ? (
          <Animated.View
            style={{
              backgroundColor: '#eaffea',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowOpacity: 0.1,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
              opacity: fadeAnim1,
              transform: [{ translateY: translateY1 }]
            }}
          >
            <Text style={{ color: '#0a4a2a', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: 18 }}>
              {composition}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            style={{
              backgroundColor: '#eaffea',
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
              alignItems: 'center',
              shadowOpacity: 0.1,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
              opacity: fadeAnim1,
              transform: [{ translateY: translateY1 }]
            }}
          >
            <Leaf color="#1B4332" size={48} className="mb-4" />
            <Text className="text-xl font-black text-[#1B4332] text-center mb-2">
              It looks like this isn't waste!
            </Text>
            <Text className="text-base text-[#1B4332] text-center font-medium leading-relaxed px-2">
              Our AI detects a non-waste object. Please try scanning actual waste or recyclable items.
            </Text>
          </Animated.View>
        )}

        {/* Environmental Impact Card */}
        {isWaste && impact?.length > 0 && (
          <Animated.View
            style={{
              backgroundColor: '#ffebeb',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowOpacity: 0.1,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
              opacity: fadeAnim2,
              transform: [{ translateY: translateY2 }]
            }}
          >
            <View className="flex-row items-center mb-3">
              <AlertTriangle color="#8a1a1a" size={24} className="mr-2" />
              <Text className="font-black text-lg" style={{ color: '#8a1a1a' }}>Environmental Impact</Text>
            </View>
            <View className="pl-1">
              {impact?.map((item: string, index: number) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text style={{ color: '#8a1a1a', fontSize: 16, marginRight: 8, marginTop: 2 }}>•</Text>
                  <Text className="flex-1 font-medium" style={{ color: '#8a1a1a', fontSize: 16, lineHeight: 22 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Living Creature Risk Card */}
        {isWaste && risks?.length > 0 && (
          <Animated.View
            style={{
              backgroundColor: '#fff5e6',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowOpacity: 0.1,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: 3,
              opacity: fadeAnim3,
              transform: [{ translateY: translateY3 }]
            }}
          >
            <View className="flex-row items-center mb-3">
              <PawPrint color="#8a4a00" size={24} className="mr-2" />
              <Text className="font-black text-lg" style={{ color: '#8a4a00' }}>Living Creature Risk</Text>
            </View>
            <View className="pl-1">
              {risks?.map((item: string, index: number) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text style={{ color: '#8a4a00', fontSize: 16, marginRight: 8, marginTop: 2 }}>•</Text>
                  <Text className="flex-1 font-medium" style={{ color: '#8a4a00', fontSize: 16, lineHeight: 22 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {isWaste && disposalSteps && disposalSteps.length > 0 && (
          <Animated.View 
            className="bg-[#e6f4ff] rounded-xl p-4 mb-4 shadow-sm" 
            style={{ elevation: 3, opacity: fadeAnim4, transform: [{ translateY: translateY4 }] }}
          >
            <Text className="text-[#003366] font-bold text-lg mb-2 flex-row items-center">
              ♻️ How to Segregate
            </Text>
            {disposalSteps.map((step: string, index: number) => (
              <Text key={index} className="text-[#003366] text-base mb-1" style={{ lineHeight: 22 }}>
                {index + 1}. {step}
              </Text>
            ))}
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View className="flex-row justify-center mt-2 mb-10 w-full">
          <TouchableOpacity
            className="w-full bg-white border-2 border-[#1B4332] rounded-2xl py-4 items-center shadow-sm flex-row justify-center"
            onPress={() => router.back()}
          >
            <Camera color="#1B4332" size={22} className="mr-2" />
            <Text className="text-[#1B4332] font-black tracking-wide text-lg">Scan Again</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
