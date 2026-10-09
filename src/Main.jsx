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

  return (
    <div className="app">
      <header>
        <h1>GymLink</h1>
        <p>Your fitness journey starts here.</p>
        <nav>
          <button onClick={() => setPage("Home")}>Home</button>
          <button onClick={() => setPage("Workouts")}>Workouts</button>
          {user ? (
            <>
              <button onClick={() => setPage("Profile")}>My Profile</button>
              <button onClick={handleLogout} disabled={busy}>Log Out</button>
            </>
          ) : (
            <>
              <button onClick={() => openAccount("login")}>Log In</button>
              <button onClick={() => openAccount("signup")}>Register</button>
            </>
          )}
        </nav>
      </header>

      <main>
        {page === "Home" && (
          <section>
            <h2>Welcome to GymLink</h2>
            <p>Discover workouts, build strength and track your fitness goals.</p>
            <button onClick={() => setPage("Workouts")}>Explore Workouts</button>
            {!user && (
              <button onClick={() => openAccount("signup")}>Create Account</button>
            )}
          </section>
        )}

        {page === "Workouts" && (
          <section>
            <h2>Workout Plans</h2>
            {workouts.map((workout) => (
              <article key={workout.name}>
                <h3>{workout.name}</h3>
                <p><strong>Level:</strong> {workout.level}</p>
                <p>{workout.description}</p>
                <button onClick={() => {
                  setAuthMessage("");
                  setPage("Workout");
                }}>View Workout</button>
              </article>
            ))}
          </section>
        )}

        {page === "Workout" && (
          <section>
            <h2>Workout Details</h2>
            <p>Choose a workout plan from the Workouts page to get started.</p>
            <button onClick={() => setPage("Workouts")}>Back to Workouts</button>
          </section>
        )}

        {page === "Account" && (
          <section>
            <h2>{authMode === "signup" ? "Register" : "Log In"}</h2>
            <form onSubmit={handleAuth}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />

              <button type="submit" disabled={busy}>
                {busy ? "Please wait..." : authMode === "signup" ? "Register" : "Log In"}
              </button>
            </form>

            <button onClick={() => openAccount(authMode === "signup" ? "login" : "signup")}>
              {authMode === "signup" ? "Already registered? Log In" : "Need an account? Register"}
            </button>
          </section>
        )}

        {page === "Profile" && (
          <section>
            <h2>My Profile</h2>
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <label htmlFor="goal">Fitness goal</label>
            <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option>Build muscle</option>
              <option>Lose weight</option>
              <option>Improve fitness</option>
              <option>Increase strength</option>
            </select>

            <label htmlFor="level">Experience level</label>
            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <button onClick={saveProfile} disabled={busy}>
              {busy ? "Saving..." : "Save Profile"}
            </button>
          </section>
        )}

        {authMessage && <p role="status">{authMessage}</p>}
      </main>
    </div>
  );
}

export default App;
