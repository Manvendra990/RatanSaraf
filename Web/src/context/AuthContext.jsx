import { createContext, useContext, useState } from 'react';
import { getSession, setSession, signIn } from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, updateSession] = useState(getSession);
  async function login(identifier, password) { const result = await signIn(identifier, password); updateSession(result); return result; }
  function logout() { setSession(null); updateSession(null); }
  return <AuthContext.Provider value={{ session, user: session?.user, loggedIn: Boolean(session?.token || session?.user), login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
