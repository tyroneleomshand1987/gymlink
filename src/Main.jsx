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
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthMessage(error.message);
      setUser(data?.session?.user ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, experience_level")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setAuthMessage("Could not load profile: " + error.message);
        return;
      }

      if (data) {
        setName(data.display_name || "");
        setLevel(data.experience_level || "Beginner");
      }
    }

    loadProfile();
  }, [user]);

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
            "Registration started. Check your email to confirm your account, then log in."
          );
          setAuthMode("login");
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
    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setName("");
    setSaved(false);
    setAuthMessage("You have logged out.");
    setPage("Home");
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

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: name.trim(),
        experience_level: level,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    setBusy(false);

    if (error) {
      setAuthMessage("Could not save profile: " + error.message);
      setSaved(false);
      return;
    }

    setSaved(true);
    setAuthMessage(
      "Profile saved to your GymLink account. Your selected goal is not saved yet."
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          GYM<span>LINK</span>
        </div>
        <p className="tagline">
          Meet people. Train together. Get healthier.
        </p>
        <p>
          {user ? `Logged in: ${user.email}` : "Welcome to GymLink"}
        </p>
      </header>

      <nav className="navigation">
        {[
          "Home",
          "Find Gym Friends",
          "Workouts",
          "Train at Home",
          "Profile",
          "Account"
        ].map((item) => (
          <button
            key={item}
            className={
              page === item ? "nav-button active" : "nav-button"
            }
            onClick={() => setPage(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <main className="main">
        {page === "Home" && (
          <>
            <section className="hero">
              <h1>
                Meet people.
                <br />
                Train harder.
                <br />
                Get healthier.
              </h1>
              <p>
                Connect with gym friends, find training partners
                and build a fitness community that keeps you motivated.
              </p>
              <button
                className="primary-button"
                onClick={() => setPage("Find Gym Friends")}
              >
                Find Gym Friends
              </button>
              {!user && (
                <p>
                  <button
                    className="text-button"
                    onClick={() => setPage("Account")}
                  >
                    Join GymLink or log in
                  </button>
                </p>
              )}
            </section>

            <section>
              <h2>Everything you need to stay motivated</h2>
              <div className="grid">
                <Feature
                  title="Find Gym Friends"
                  text="Meet people with similar fitness goals."
                  onClick={() => setPage("Find Gym Friends")}
                />
                <Feature
                  title="Build Your Profile"
                  text="Share your fitness level and goals."
                  onClick={() => setPage("Profile")}
                />
                <Feature
                  title="Train at Home"
                  text="Follow workouts outside the gym."
                  onClick={() => setPage("Train at Home")}
                />
                <Feature
                  title="Train Together"
                  text="Keep each other motivated."
                  onClick={() => setPage("Find Gym Friends")}
                />
              </div>
            </section>
          </>
        )}

        {page === "Account" && (
          <section className="page-section">
            <h1>{user ? "Your Account" : "Join GymLink"}</h1>

            {user ? (
              <div className="profile-box">
                <p>You are logged in as:</p>
                <strong>{user.email}</strong>

                <p>Your account is connected to Supabase.</p>

                <button
                  className="primary-button"
                  onClick={() => setPage("Profile")}
                >
                  View My Profile
                </button>

                <button
                  className="primary-button"
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="profile-box">
                <div className="grid">
                  <button
                    className="primary-button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthMessage("");
                    }}
                  >
                    Log In
                  </button>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthMessage("");
                    }}
                  >
                    Sign Up
                  </button>
                </div>

                <h2>
                  {authMode === "signup"
                    ? "Create your account"
                    : "Welcome back"}
                </h2>

                <form onSubmit={handleAuth}>
                  <label htmlFor="account-email">Email address</label>
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />

                  <label htmlFor="account-password">Password</label>
                  <input
                    id="account-password"
                    type="password"
                    autoComplete={
                      authMode === "signup"
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={busy}
                  >
                    {busy
                      ? "Please wait..."
                      : authMode === "signup"
                        ? "Create Account"
                        : "Log In"}
                  </button>
                </form>
              </div>
            )}

            {authMessage && (
              <p role="status" aria-live="polite">
                {authMessage}
              </p>
            )}
          </section>
        )}

        {page === "Find Gym Friends" && (
          <section className="page-section">
            <h1>Find Gym Friends</h1>
            <p className="muted">
              Start building your fitness community.
            </p>
            <div className="profile-box">
              <h2>Meet your future training partner</h2>
              <p>
                Create your profile to tell people about your goals
                and training level.
              </p>
              <button
                className="primary-button"
                onClick={() =>
                  setPage(user ? "Profile" : "Account")
                }
              >
                {user ? "Create My Profile" : "Sign Up to Get Started"}
              </button>
            </div>
          </section>
        )}

        {page === "Workouts" && (
          <WorkoutPage
            title="Gym Workouts"
            description="Structured workouts for every fitness level."
          />
        )}

        {page === "Train at Home" && (
          <WorkoutPage
            title="Train at Home"
            description="Workouts you can do without needing a gym."
          />
        )}

        {page === "Profile" && (
          <section className="page-section">
            <h1>Your GymLink Profile</h1>

            {!user ? (
              <div className="profile-box">
                <p>Log in to save your profile to your account.</p>
                <button
                  className="primary-button"
                  onClick={() => setPage("Account")}
                >
                  Log In or Sign Up
                </button>
              </div>
            ) : (
              <div className="profile-box">
                <label htmlFor="profile-name">Your name</label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Enter your name"
                />

                <label htmlFor="profile-level">Fitness level</label>
                <select
                  id="profile-level"
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setSaved(false);
                  }}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <label htmlFor="profile-goal">Your goal</label>
                <select
                  id="profile-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option>Build muscle</option>
                  <option>Lose weight</option>
                  <option>Improve fitness</option>
                  <option>Increase strength</option>
                  <option>Find a training partner</option>
                </select>

                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={saveProfile}
                >
                  {busy ? "Saving..." : "Save Profile"}
                </button>

                {saved && <p>Profile saved successfully.</p>}
              </div>
            )}

            {authMessage && (
              <p role="status" aria-live="polite">
                {authMessage}
              </p>
            )}
          </section>
        )}
      </main>

      <footer>
        <strong>GymLink</strong>
        <p>Meet people. Train together. Get healthier.</p>
        <p>© 2026 GymLink</p>
      </footer>
    </div>
  );
}

function Feature({ title, text, onClick }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="text-button" onClick={onClick}>
        Explore →
      </button>
    </article>
  );
}

function WorkoutPage({ title, description }) {
  return (
    <section className="page-section">
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      <div className="grid">
        {workouts.map((workout) => (
          <article className="card" key={workout.name}>
            <span className="badge">{workout.level}</span>
            <h3>{workout.name}</h3>
            <p>{workout.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
