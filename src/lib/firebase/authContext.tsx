"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from './config';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleAccessToken: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signInWithGithub: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Inicio con Google
  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Extraer credencial de Google para posibles llamadas a Google Drive
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vn_gdrive_token', credential.accessToken);
        }
      }
      return result.user;
    } catch (err) {
      console.error('Error al iniciar sesión con Google:', err);
      throw err;
    }
  };

  // Inicio con GitHub
  const signInWithGithub = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      return result.user;
    } catch (err) {
      console.error('Error al iniciar sesión con GitHub:', err);
      throw err;
    }
  };

  // Inicio con Correo y Contraseña
  const signInWithEmail = async (email: string, pass: string): Promise<User | null> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return result.user;
    } catch (err) {
      console.error('Error al iniciar sesión con correo:', err);
      throw err;
    }
  };

  // Registro con Correo y Contraseña
  const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<User | null> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      throw err;
    }
  };

  // Cerrar sesión
  const signOutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
      setGoogleAccessToken(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vn_gdrive_token');
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        googleAccessToken,
        signInWithGoogle,
        signInWithGithub,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
