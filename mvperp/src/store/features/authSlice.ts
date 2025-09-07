import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import jwt from "jsonwebtoken";

interface AuthState {
  user: { username: string } | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

const fakeSecret = "clave_fake";

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ username: string; password: string }>) => {
      const { username, password } = action.payload;
      if (username === "admin" && password === "1234") {
        const token = jwt.sign({ username }, fakeSecret, { expiresIn: "1h" });
        state.user = { username };
        state.token = token;
      } else {
        alert("Credenciales inválidas");
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
