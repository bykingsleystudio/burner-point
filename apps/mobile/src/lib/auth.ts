import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './config';

export type ClerkTokenGetter = () => Promise<string | null>;

export type BurnerProfile = Partial<{
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  country: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}>;

export async function exchangeClerkForApiSession(getToken: ClerkTokenGetter, profile?: BurnerProfile) {
  let clerkToken = await getToken();
  if (!clerkToken) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    clerkToken = await getToken();
  }
  if (!clerkToken) throw new Error('Missing Clerk session token');

  const { data } = await axios.post(`${API_BASE_URL}/auth/clerk/exchange`, {
    clerkToken,
    profile,
  });

  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  return data;
}

export async function getApiAccessToken(getToken: ClerkTokenGetter, profile?: BurnerProfile) {
  const existing = await SecureStore.getItemAsync('accessToken');
  if (existing) return existing;

  const data = await exchangeClerkForApiSession(getToken, profile);
  return data.accessToken as string;
}

export async function clearApiSession() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
