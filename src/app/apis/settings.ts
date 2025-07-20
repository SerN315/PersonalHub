import axios from "axios";

// Fetch user data (using HTTP-only cookie automatically)
export const fetchUser = async () => {
  const res = await axios.get("/api/auth/user", {
    withCredentials: true,
  });
  return res.data.user;
};

// Update user info
export const updateUser = async (updates: any) => {
  const res = await axios.patch("/api/user", updates, {
    withCredentials: true,
  });
  return res.data.user;
};

// Logout
export const logoutUser = async () => {
  const res = await axios.post("/api/logout", null, {
    withCredentials: true,
  });
  return res.data;
};

// Upload avatar image (FormData cannot be sent with axios easily for credentials)
export const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload-avatar", {
    method: "POST",
    credentials: "include", // use cookie
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.publicUrl;
};

// Change password
export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const res = await fetch("/api/change-password", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to change password");
  return data.message;
};
