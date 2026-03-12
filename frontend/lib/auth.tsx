"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthUser {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  isSignedIn: false,
  isLoading: true,
  signIn: () => { },
  signOut: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isSignedIn: Boolean(user), isLoading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/* ------------------------------------------------------------------ */
/*  Header Auth Controls                                               */
/* ------------------------------------------------------------------ */

export function HeaderAuthControls() {
  const { user, isSignedIn, isLoading, signOut } = useAuth();
  const router = useRouter();

  if (isLoading) return null;

  if (isSignedIn && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-muted">{user.name || user.email}</span>
        <button
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="rounded-full px-4 py-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/sign-in"
        className="rounded-full px-4 py-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        Sign In
      </Link>
      <Link
        href="/sign-up"
        className="btn-gradient rounded-full px-5 py-2 text-sm"
      >
        Get Started
      </Link>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Auth Actions                                               */
/* ------------------------------------------------------------------ */

export function LandingAuthActions() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) return null;

  if (isSignedIn) {
    return (
      <Link className="btn-ghost rounded-full px-7 py-3.5 text-sm" href="/dashboard">
        Open Dashboard
      </Link>
    );
  }

  return (
    <Link href="/sign-up" className="btn-ghost rounded-full px-7 py-3.5 text-sm">
      Create Free Account
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sign In Upgrade Button                                             */
/* ------------------------------------------------------------------ */

export function SignInUpgradeButton({ label, className }: { label: string; className?: string }) {
  const { isSignedIn } = useAuth();

  if (isSignedIn) return null;

  return (
    <Link href="/sign-in" className={className}>
      {label}
    </Link>
  );
}
