import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Camera as CameraIcon, Menu, ScanLine } from "lucide-react-native";

// Hardcoded IP for physical device testing
const BACKEND_URL = "http://10.122.21.23:3000/api/analyze";

const splashImage = require('../assets/eco-splash.png');
const iconImage = require('../assets/eco-icon.png');

export default function ScannerScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 100,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ]).start(() => {
      setTimeout(() => {
        setShowSplash(false);
      }, 500);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });
      // 60 seconds timeout for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let response;
      try {
        response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: photo.base64 }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          alert("Request timed out. The server might be unreachable or taking too long. Please try again.");
          return;
        }
        throw fetchErr;
      }
      const data = await response.json();
      console.log("RAW RESPONSE:", data);

      if (response.ok) {
        if (user && userProfile) {
          try {
            const mainCategory = data?.category || data?.items?.[0]?.category || "Other";
            await addDoc(collection(db, "scans"), {
              userId: user.uid,
              userName: userProfile.name || "Unknown",
              areaName: userProfile.areaName || "Unknown",
              wing: userProfile.wing || "Unknown",
              timestamp: serverTimestamp(),
              category: mainCategory,
              analysisResults: data,
            });
          } catch (e) {
            console.error("Firestore save err:", e);
          }
        }
        router.push({
          pathname: "/result",
          params: { data: JSON.stringify(data) },
        });
      } else {
        if (data.error === "API_LIMIT") {
          alert(data.message);
        } else {
          alert(data.error || "Analysis Failed");
        }
      }
    } catch (err: any) {
      console.error("Scan Error:", err);
      alert(`Network Error: Ensure the backend is running at ${BACKEND_URL} and accessible from this device.`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading)
    return (
      <View className="flex-1 items-center justify-center bg-[#F0F4F0]">
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  if (!user) return null;
  if (hasPermission === null)
    return (
      <View className="flex-1 items-center justify-center bg-[#F0F4F0]">
        <Text className="text-gray-500 font-medium tracking-wide">
          Requesting camera access...
        </Text>
      </View>
    );
  if (hasPermission === false)
    return (
      <View className="flex-1 items-center justify-center bg-[#F0F4F0]">
        <Text className="text-gray-500 font-medium tracking-wide">
          No camera access. Modify settings.
        </Text>
      </View>
    );

  if (showSplash) {
    return (
      <View className="flex-1 bg-[#F0F4F0] justify-center items-center">
        <Animated.View style={{ transform: [{ scale: logoAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }], opacity: logoAnimation }}>
          <Animated.Image source={splashImage} style={{ width: 300, height: 300, resizeMode: 'contain' }} />
        </Animated.View>
        <View className="mt-8 w-[200px] h-2 bg-[#ccebd7] rounded-full overflow-hidden">
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: '#1B4332',
              width: progress.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1 }} ref={cameraRef} facing="back">
        {/* Top Overlay */}
        <SafeAreaView className="w-full flex-row justify-end items-center px-6 pt-8">
          {userProfile?.role === "secretary" && (
            <TouchableOpacity
              onPress={() => router.push("/admin")}
              className="bg-[#f59e0b]/90 px-5 py-3 rounded-full shadow-md border border-white/20"
            >
              <Text className="text-white font-extrabold shadow-sm">
                Admin Dashboard
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>

        {/* Central Square */}
        <View className="flex-1 items-center justify-center">
          <View className="w-72 h-72 border-4 border-[#F0F4F0]/60 rounded-3xl items-center justify-center bg-black/10">
            <ScanLine color="rgba(255,255,255,0.6)" size={80} />
          </View>
          <Text className="text-white text-lg font-bold mt-8 shadow-xl drop-shadow-xl tracking-wide">
            Position item in target
          </Text>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View 
            className="absolute z-50 w-full h-full items-center justify-center border border-transparent"
            style={{ backgroundColor: 'rgba(27, 67, 50, 0.9)' }}
          >
            <ActivityIndicator size={100} color="#ffffff" />
            <Text className="text-white text-2xl font-bold mt-6 tracking-wide shadow-sm">
              Analyzing waste with AI...
            </Text>
          </View>
        )}

        {/* Bottom Controls */}
        <SafeAreaView className="w-full items-center pb-16">
          <TouchableOpacity
            onPress={takePicture}
            disabled={loading}
            className="w-20 h-20 rounded-full bg-[#1B4332] items-center justify-center border-[4px] border-white shadow-2xl elevation-xl"
          >
            {loading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <CameraIcon color="#ffffff" size={34} />
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
