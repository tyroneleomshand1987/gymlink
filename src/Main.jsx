import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { supabase } from "./supabase";

const workouts = [
  {
    name: "Full Body Beginner",
    level: "Beginner",
    description:
      "Warm-up, full-body strength exercises and a complete cooldown."
  },
  {
    name: "Upper Body Strength",
    level: "Intermediate",
    description:
      "Chest, shoulders, back and arms with structured sets and rest periods."
  },
  {
    name: "Lower Body Power",
    level: "Advanced",
    description:
      "A powerful leg-focused workout designed to build strength and fitness."
  },
  {
    name: "Home HIIT Circuit",
    level: "All Levels",
    description:
      "An equipment-free workout you can complete at home."
  }
];

function App() {
  const [page, setPage] = useState("Home");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("Build muscle");
  const [level, setLevel] = useState("Beginner");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      setUser(data.session?.user ?? null);
    }

    getInitialSession();

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setName("");
        setGoal("Build muscle");
        setLevel("Beginner");
        setSaved(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, experience_level, goal")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setAuthMessage("Could not load profile: " + error.message);
        return;
      }

      if (data) {
        setName(data.display_name || "");
        setLevel(data.experience_level || "Beginner");
        setGoal(data.goal || "Build muscle");
      }
    }

    loadProfile();
  }, [user]);

  function openAccount(mode) {
    setAuthMode(mode);
    setAuthMessage("");
    setPassword("");
    setPage("Account");
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setAuthMessage("");

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });

        if (error) throw error;

        if (data.session) {
          setAuthMessage("Account created successfully!");
          setPage("Profile");
        } else {
          setAuthMessage(
            "Account created. Check your email to confirm your account, then log in."
          );
          setAuthMode("login");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) throw error;

        setAuthMessage("You are now logged in!");
        setPage("Profile");
      }
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setName("");
      setGoal("Build muscle");
      setLevel("Beginner");
      setSaved(false);
      setAuthMessage("You have logged out.");
      setPage("Home");
    } catch (error) {
      setAuthMessage(error.message || "Could not log out.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!user) {
      setAuthMessage("Please log in before saving your profile.");
      setPage("Account");
      return;
    }

    if (!name.trim()) {
      setAuthMessage("Please enter your name.");
      return;
    }

    setBusy(true);
    setAuthMessage("");
    setSaved(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name: name.trim(),
            experience_level: level,
            goal,
            updated_at: new Date().toISOString()
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      setSaved(true);
      setAuthMessage("Your GymLink profile has been saved!");
    } catch (error) {
      setAuthMessage("Could not save profile: " + error.message);
    } finally {
      setBusy(false);
    }
  }
