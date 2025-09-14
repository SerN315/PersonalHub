export interface UserData {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar_url: string;
}

export interface UserStore {
  user: UserData | null;
  setUser: (user: UserData) => void;
}

export interface UserState {
  user: UserData | null;
  loading: boolean;
  fetched: boolean;
  setUser: (user: UserData | null) => void;
  setLoading: (loading: boolean) => void;
  setFetched: (fetched: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}
