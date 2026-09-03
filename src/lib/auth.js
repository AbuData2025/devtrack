import { supabase } from './supabase';

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://devtrack-alpha.vercel.app',
    },
  });
  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};