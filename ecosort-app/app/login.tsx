import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [name, setName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [wing, setWing] = useState('');
  const [role, setRole] = useState<'user' | 'secretary'>('user');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (!isLogin && (!name || !areaName || !wing)) {
      setError('Please fill in all registration fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Create profile in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          name,
          areaName,
          wing,
          role
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="leaf" size={64} color="#16a34a" />
          <Text style={styles.title}>EcoSort AI</Text>
          <Text style={styles.subtitle}>Smart Waste Management</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Society / Area Name"
                placeholderTextColor="#9ca3af"
                value={areaName}
                onChangeText={setAreaName}
              />
              <TextInput
                style={styles.input}
                placeholder="Wing / Sector"
                placeholderTextColor="#9ca3af"
                value={wing}
                onChangeText={setWing}
              />
              
              <Text style={styles.label}>Select Role</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
                  onPress={() => setRole('user')}
                >
                  <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>Resident</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleButton, role === 'secretary' && styles.roleButtonActive]}
                  onPress={() => setRole('secretary')}
                >
                  <Text style={[styles.roleText, role === 'secretary' && styles.roleTextActive]}>Secretary</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color="#9ca3af" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => { setIsLogin(!isLogin); setError(''); }}>
            <Text style={styles.switchButtonText}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
  title: { fontSize: 36, fontWeight: '800', color: '#166534', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#15803d', marginTop: 8, fontWeight: '500' },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  formTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937', marginBottom: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginBottom: 16 },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#1f2937' },
  eyeIcon: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', marginHorizontal: 4, backgroundColor: '#f9fafb' },
  roleButtonActive: { backgroundColor: '#dcfce7', borderColor: '#22c55e' },
  roleText: { fontSize: 15, fontWeight: '600', color: '#4b5563' },
  roleTextActive: { color: '#166534' },
  actionButton: { backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  actionButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  switchButton: { marginTop: 24, alignItems: 'center' },
  switchButtonText: { color: '#2563eb', fontSize: 15, fontWeight: '500' },
  errorText: { color: '#dc2626', marginBottom: 16, textAlign: 'center', fontWeight: '500' },
});
