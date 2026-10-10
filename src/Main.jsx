
import React, { useEffect, useState } from "react";
import "./style.css";
import { supabase } from "./supabase";

const workouts = [
  {
    name: "Full Body Beginner",
    level: "Beginner",
    description: "A full-body workout to build strength and learn the basics.",
    exercises: [
      { name: "Squats", sets: 3, reps: "12 reps" },
      { name: "Push-ups", sets: 3, reps: "8–12 reps" },
      { name: "Dumbbell Rows", sets: 3, reps: "10 each side" },
      { name: "Plank", sets: 3, reps: "30 seconds" }
    ]
  },
  {
    name: "Upper Body Strength",
    level: "Intermediate",
    description: "Build your chest, shoulders, back and arms.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8–10 reps" },
      { name: "Shoulder Press", sets: 3, reps: "10 reps" },
      { name: "Lat Pulldown", sets: 3, reps: "10–12 reps" },
      { name: "Bicep Curls", sets: 3, reps: "12 reps" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12 reps" }
    ]
  },
  {
    name: "Lower Body Power",
    level: "Advanced",
    description: "A leg workout focused on strength and power.",
    exercises: [
      { name: "Squats", sets: 4, reps: "6–8 reps" },
      { name: "Romanian Deadlifts", sets: 4, reps: "8 reps" },
      { name: "Walking Lunges", sets: 3, reps: "10 each leg" },
      { name: "Leg Press", sets: 3, reps: "10 reps" },
      { name: "Calf Raises", sets: 4, reps: "15 reps" }
    ]
  },
  {
    name: "Home HIIT Circuit",
    level: "All Levels",
    description: "An equipment-free workout you can do at home.",
    exercises: [
      { name: "Jumping Jacks", sets: 3, reps: "30 seconds" },
      { name: "Bodyweight Squats", sets: 3, reps: "15 reps" },
      { name: "Mountain Climbers", sets: 3, reps: "30 seconds" },
      { name: "High Knees", sets: 3, reps: "30 seconds" },
      { name: "Plank", sets: 3, reps: "30 seconds" }
    ]
  }
];

function App() {
  const [page, setPage] = useState("Home");
  const [selectedWorkout, setSelectedWorkout] = useState(null);

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

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setAuthMessage(error.message);
      } else {
        setUser(data.session?.user ?? null);
      }
    }

    loadSession();

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
    let cancelled = false;

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

      if (cancelled) return;

      if (error) {
        setAuthMessage("Could not load profile: " + error.message);
        return;
      }

      if (data) {
        setName(data.display_name || "");
        setGoal(data.goal || "Build muscle");
        setLevel(data.experience_level || "Beginner");
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function navigate(destination) {
    setPage(destination);
    setAuthMessage("");
  }

  function openAccount(mode) {
    setAuthMode(mode);
    setPassword("");
    setAuthMessage("");
    navigate("Account");
  }

  function openWorkout(workout) {
    setSelectedWorkout(workout);
    navigate("Workout");
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
          navigate("Profile");
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

        navigate("Profile");
        setAuthMessage("You are now logged in!");
      }
    } catch (error) {
      setAuthMessage(error.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setAuthMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setSelectedWorkout(null);
      navigate("Home");
      setAuthMessage("You have logged out.");
    } catch (error) {
      setAuthMessage(error.message || "Could not log out.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!user) {
      openAccount("login");
      setAuthMessage("Please log in before saving your profile.");
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
          <button
            type="button"
            onClick={() => navigate("Home")}
            aria-current={page === "Home" ? "page" : undefined}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate("Workouts")}
            aria-current={page === "Workouts" ? "page" : undefined}
          >
            Workouts
          </button>

          {user ? (
            <>
              <button
                type="button"
                onClick={() => navigate("Profile")}
                aria-current={page === "Profile" ? "page" : undefined}
              >
                My Profile
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
              >
                {busy ? "Please wait..." : "Log Out"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAccount("login")}
                aria-current={page === "Account" && authMode === "login" ? "page" : undefined}
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => openAccount("signup")}
                aria-current={page === "Account" && authMode === "signup" ? "page" : undefined}
              >
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        {page === "Home" && (
          <section>
            <h2>Welcome to GymLink</h2>
            <p>
              Discover workouts, build strength and track your fitness goals.
            </p>
            <button type="button" onClick={() => navigate("Workouts")}>
              Explore Workouts
            </button>
            {!user && (
              <button type="button" onClick={() => openAccount("signup")}>
                Create Account
              </button>
            )}
          </section>
        )}

        {page === "Workouts" && (
          <section>
            <h2>Workout Plans</h2>
            <p>Choose a workout to see its exercises, sets and reps.</p>

            {workouts.map((workout) => (
              <article key={workout.name}>
                <h3>{workout.name}</h3>
                <p><strong>Level:</strong> {workout.level}</p>
                <p>{workout.description}</p>
                <button
                  type="button"
                  onClick={() => openWorkout(workout)}
                >
                  View Workout
                </button>
              </article>
            ))}
          </section>
        )}

        {page === "Workout" && (
          <section>
            {selectedWorkout ? (
              <>
                <h2>{selectedWorkout.name}</h2>
                <p><strong>Level:</strong> {selectedWorkout.level}</p>
                <p>{selectedWorkout.description}</p>
                <h3>Exercises</h3>

                {selectedWorkout.exercises.map((exercise, index) => (
                  <article key={`${exercise.name}-${index}`}>
                    <h4>{index + 1}. {exercise.name}</h4>
                    <p><strong>Sets:</strong> {exercise.sets}</p>
                    <p><strong>Reps / Duration:</strong> {exercise.reps}</p>
                  </article>
                ))}

                <button type="button" onClick={() => navigate("Workouts")}>
                  Back to Workouts
                </button>
              </>
            ) : (
              <>
                <h2>Choose a workout</h2>
                <button type="button" onClick={() => navigate("Workouts")}>
                  View Workout Plans
                </button>
              </>
            )}
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
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />

              <button type="submit" disabled={busy}>
                {busy
                  ? "Please wait..."
                  : authMode === "signup"
                    ? "Register"
                    : "Log In"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => openAccount(authMode === "signup" ? "login" : "signup")}
            >
              {authMode === "signup"
                ? "Already registered? Log In"
                : "Need an account? Register"}
            </button>

            <button type="button" onClick={() => navigate("Home")}>
              Back to Home
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
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
              placeholder="Enter your name"
            />

            <label htmlFor="goal">Fitness goal</label>
            <select
              id="goal"
              value={goal}
              onChange={(event) => {
                setGoal(event.target.value);
                setSaved(false);
              }}
            >
              <option>Build muscle</option>
              <option>Lose weight</option>
              <option>Improve fitness</option>
              <option>Increase strength</option>
            </select>

            <label htmlFor="level">Experience level</label>
            <select
              id="level"
              value={level}
              onChange={(event) => {
                setLevel(event.target.value);
                setSaved(false);
              }}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <button type="button" onClick={saveProfile} disabled={busy}>
              {busy ? "Saving..." : "Save Profile"}
            </button>

            {saved && <p>Your profile has been saved successfully.</p>}
          </section>
        )}

        {authMessage && (
          <p role="status" aria-live="polite">
            {authMessage}
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
