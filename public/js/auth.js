import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function signIn(email, password) {
  const { user, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  localStorage.setItem("userId", user.id);
}

async function signUp(email, password) {
  const { user, error } = await supabase.auth.signUp({ email, password });
  if (error) return alert(error.message);
  localStorage.setItem("userId", user.id);
}
