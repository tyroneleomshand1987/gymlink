
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./supabase";

const workouts = [
  {
    id: 1,
    name: "Full Body Beginner",
    level: "Beginner",
    duration: "25 min",
    category: "Full Body",
    description: "Build confidence with a balanced full-body session.",
    exercises: [
      ["Bodyweight squats", "3 sets × 12 reps"],
      ["Push-ups", "3 sets × 8 reps"],
      ["Dumbbell rows", "3 sets × 10 reps"],
      ["Plank", "3 sets × 30 seconds"],
    ],
  },
  {
    id: 2,
    name: "Upper Body Strength",
    level: "Intermediate",
    duration: "40 min",
    category: "Upper Body",
    description: "Train your chest, back, shoulders and arms.",
    exercises: [
      ["Bench press", "3 sets × 8 reps"],
      ["Lat pulldowns", "3 sets × 10 reps"],
      ["Shoulder press", "3 sets × 10 reps"],
      ["Biceps curls", "3 sets × 12 reps"],
    ],
  },
  {
    id: 3,
    name: "Leg Day",
    level: "Intermediate",
    duration: "35 min",
    category: "Lower Body",
    description: "A focused workout for legs and glutes.",
    exercises: [
      ["Squats", "3 sets × 10 reps"],
      ["Romanian deadlifts", "3 sets × 10 reps"],
      ["Lunges", "3 sets × 10 each leg"],
      ["Calf raises", "3 sets × 15 reps"],
    ],
  },
  {
    id: 4,
    name: "Quick Cardio",
    level: "Beginner",
    duration: "15 min",
    category: "Cardio",
    description: "A short session to get your heart rate up.",
    exercises: [
      ["March or jog in place", "3 minutes"],
      ["Step-ups", "3 sets × 1 minute"],
      ["Jumping jacks or step jacks", "3 sets × 30 seconds"],
      ["Cool down walk", "3 minutes"],
    ],
  },
  {
    id: 5,
    name: "Core Builder",
    level: "Beginner",
    duration: "20 min",
    category: "Core",
    description: "Improve core strength and stability.",
    exercises: [
      ["Plank", "3 sets × 30 seconds"],
      ["Dead bugs", "3 sets × 10 reps"],
      ["Bird dogs", "3 sets × 10 reps"],
      ["Reverse crunches", "3 sets × 12 reps"],
    ],
  },
  {
    id: 6,
    name: "Full Body Power",
    level: "Advanced",
    duration: "45 min",
    category: "Full Body",
    description: "A challenging strength-focused full-body session.",
    exercises: [
      ["Squats", "4 sets × 8 reps"],
      ["Bench press", "4 sets × 8 reps"],
      ["Rows", "4 sets × 10 reps"],
      ["Farmer carries", "3 rounds"],
    ],
  },
];

const categories = [
  "All",
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Cardio",
  "Core",
];

function App() {
  const [page, setPage] = useState("Home");
  const [authMode, setAuthMode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    if (!supabase?.auth) return;

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Session error:", error);
      setUser(data?.session?.user ?? null);
    }).catch((error) => {
      console.error("Could not load session:", error);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
    };
  }, []);

  function notify(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function navigate(nextPage) {
    setPage(nextPage);
    setSelectedWorkout(null);
    setMobileMenu(false);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAuth(event) {
    event.preventDefault();
    setMessage("");

    if (!supabase?.auth) {
      notify(
        "Supabase is not configured. Check src/supabase.js and your Vercel environment variables.",
        "error"
      );
      return;
    }

    if (!email.trim() || !password) {
      notify("Enter your email address and password.", "error");
      return;
    }

    if (authMode === "register" && password.length < 6) {
      notify("Your password must be at least 6 characters.", "error");
      return;
    }

    setAuthLoading(true);

    try {
      let result;

      if (authMode === "register") {
        result = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });
      } else if (authMode === "reset") {
        result = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: window.location.origin }
        );
      } else {
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      if (result.error) throw result.error;

      if (authMode === "register") {
        if (result.data?.session) {
          setUser(result.data.user);
          setAuthMode("");
          setPassword("");
          notify("Welcome to GymLink! Your account is ready.", "success");
        } else {
          notify(
            "Registration submitted. Check your email for a confirmation link if email confirmation is enabled.",
            "success"
          );
        }
      } else if (authMode === "reset") {
        notify(
          "If an account exists for that email, password reset instructions will be sent.",
          "success"
        );
        setAuthMode("login");
      } else {
        setUser(result.data?.user ?? null);
        setAuthMode("");
        setPassword("");
        notify("You are now signed in.", "success");
      }
    } catch (error) {
      notify(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    if (!supabase?.auth) {
      notify("Supabase is not configured.", "error");
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      notify(error.message, "error");
      return;
    }

    setUser(null);
    setAuthMode("");
    navigate("Home");
    notify("You have signed out.", "success");
  }

  function startWorkout(workout) {
    setSelectedWorkout(workout);
    setPage("Workouts");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishWorkout(workout) {
    setCompleted((previous) => [
      ...previous,
      { id: Date.now(), name: workout.name, date: new Date().toLocaleDateString() },
    ]);
    setSelectedWorkout(null);
    setPage("Progress");
    notify("Workout completed. Great work!", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesCategory =
      category === "All" || workout.category === category;

    const matchesSearch =
      workout.name.toLowerCase().includes(search.toLowerCase()) ||
      workout.description.toLowerCase().includes(search.toLowerCase()) ||
      workout.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Athlete";

  function WorkoutCard({ workout }) {
    return (
      <article className="workout-card">
        <div className={`workout-art art-${workout.id}`}>
          <span className="art-symbol">
            {workout.category === "Cardio" ? "↗" :
             workout.category === "Core" ? "◎" :
             workout.category === "Lower Body" ? "⌁" : "✦"}
          </span>
          <span className="art-label">{workout.category}</span>
        </div>
        <div className="workout-card-content">
          <div className="workout-meta">
            <span className="level">{workout.level}</span>
            <span>{workout.duration}</span>
          </div>
          <h3>{workout.name}</h3>
          <p>{workout.description}</p>
          <button
            className="button button-primary button-full"
            onClick={() => startWorkout(workout)}
          >
            View workout <span aria-hidden="true">→</span>
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="app-shell">
      <style>{`
        * { box-sizing: border-box; }
        :root {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #f4f6fb;
          background: #090c12;
          font-synthesis: none;
        }
        body { margin: 0; min-width: 320px; background: #090c12; }
        button, input { font: inherit; }
        button { cursor: pointer; }
        button:focus-visible, input:focus-visible {
          outline: 2px solid #9b8cff; outline-offset: 3px;
        }
        .app-shell { min-height: 100vh; }
        .site-header {
          position: sticky; top: 0; z-index: 20;
          background: rgba(9,12,18,.94); backdrop-filter: blur(16px);
          border-bottom: 1px solid #202634;
        }
        .header-inner {
          max-width: 1180px; margin: auto; padding: 14px 22px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 20px;
        }
        .brand {
          display: flex; align-items: center; gap: 10px;
          background: none; border: 0; color: white; padding: 0;
          font-weight: 850; font-size: 20px; letter-spacing: -.8px;
        }
        .brand-mark {
          width: 39px; height: 39px; display: grid; place-items: center;
          background: linear-gradient(145deg,#8f80ff,#6550e8);
          border-radius: 12px; color: white; font-size: 20px;
        }
        .brand-accent { color: #a89aff; }
        .desktop-nav { display: flex; gap: 5px; align-items: center; }
        .nav-button {
          color: #a6adbd; border: 0; background: transparent;
          border-radius: 10px; padding: 10px 12px; font-size: 14px;
        }
        .nav-button:hover, .nav-button.active {
          color: white; background: #1a2030;
        }
        .header-actions { display: flex; gap: 9px; align-items: center; }
        .button {
          border: 1px solid transparent; border-radius: 11px;
          padding: 11px 16px; font-weight: 750; font-size: 14px;
          transition: transform .15s, background .15s;
        }
        .button:hover { transform: translateY(-1px); }
        .button-primary {
          background: #9281ff; color: #090914;
        }
        .button-primary:hover { background: #aa9dff; }
        .button-secondary {
          color: #f4f6fb; background: #151a25; border-color: #30384a;
        }
        .button-secondary:hover { background: #20283a; }
        .button-full { width: 100%; display: flex; justify-content: space-between; align-items: center; }
        .menu-toggle { display: none; }
        main { max-width: 1180px; margin: auto; padding: 30px 22px 64px; }
        .hero {
          position: relative; overflow: hidden; border-radius: 28px;
          padding: clamp(28px,6vw,70px); border: 1px solid #302c51;
          background:
            radial-gradient(ellipse at 82% 30%,rgba(121,94,255,.24),transparent 38%),
            linear-gradient(125deg,#151a2b,#10131d 65%,#1b1730);
        }
        .hero:after {
          content: "G"; position: absolute; right: 7%; top: 4%;
          color: rgba(167,151,255,.08); font-size: clamp(200px,30vw,390px);
          line-height: 1; font-weight: 950; pointer-events: none;
        }
        .hero-content { position: relative; z-index: 1; max-width: 650px; }
        .eyebrow {
          display: inline-flex; gap: 8px; align-items: center;
          color: #c4baff; text-transform: uppercase; letter-spacing: 2px;
          font-weight: 850; font-size: 11px;
        }
        .eyebrow:before { content: ""; width: 22px; height: 2px; background: #9c8cff; }
        h1 { font-size: clamp(39px,7vw,76px); line-height: 1.03; letter-spacing: -3px; margin: 20px 0; }
        .gradient-text {
          background: linear-gradient(90deg,#bcb1ff,#8171ff);
          color: transparent; background-clip: text;
        }
        .hero p { max-width: 550px; color: #b6bdcd; line-height: 1.8; font-size: 16px; }
        .hero-buttons { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 27px; }
        .hero-stats {
          display: flex; flex-wrap: wrap; gap: 30px; margin-top: 42px;
          padding-top: 24px; border-top: 1px solid #343448;
        }
        .stat strong { display: block; font-size: 23px; }
        .stat span { color: #9ca5b8; font-size: 12px; }
        .section { margin-top: 42px; }
        .section-heading {
          display: flex; justify-content: space-between; align-items: end;
          gap: 16px; margin-bottom: 18px;
        }
        .section-heading h2, .page-title { margin: 0; font-size: clamp(25px,4vw,34px); letter-spacing: -1px; }
        .section-heading p, .page-description { color: #9ca5b8; margin: 8px 0 0; line-height: 1.65; }
        .text-button { background: transparent; color: #b5aaff; border: 0; font-weight: 800; padding: 8px 0; }
        .workout-grid {
          display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px;
        }
        .workout-card {
          background: #111621; border: 1px solid #252d3d; border-radius: 19px;
          overflow: hidden; min-width: 0; transition: border-color .2s, transform .2s;
        }
        .workout-card:hover { border-color: #6558a8; transform: translateY(-3px); }
        .workout-art {
          height: 145px; position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 70% 25%,#42377e,#191d31 60%,#151924);
        }
        .art-2, .art-6 { background: radial-gradient(circle at 70% 25%,#68402e,#29202a 60%,#151924); }
        .art-3 { background: radial-gradient(circle at 70% 25%,#275d61,#182b37 60%,#151924); }
        .art-4 { background: radial-gradient(circle at 70% 25%,#635b29,#302b22 60%,#151924); }
        .art-5 { background: radial-gradient(circle at 70% 25%,#5b3267,#2c203a 60%,#151924); }
        .art-symbol { font-size: 90px; color: rgba(255,255,255,.16); font-weight: 900; }
        .art-label {
          position: absolute; top: 13px; left: 13px; background: #0b0e17c9;
          color: #e1dcff; border: 1px solid #ffffff20;
          padding: 6px 9px; border-radius: 8px; font-size: 11px; font-weight: 800;
        }
        .workout-card-content { padding: 18px; }
        .workout-meta { display: flex; justify-content: space-between; color: #9ba4b8; font-size: 12px; }
        .level { color: #b7acff; }
        .workout-card h3 { margin: 12px 0 8px; font-size: 19px; }
        .workout-card p { color: #9da6b7; line-height: 1.65; min-height: 50px; font-size: 13px; }
        .feature-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 15px; }
        .feature {
          padding: 23px; border-radius: 17px; background: #111621;
          border: 1px solid #252d3d;
        }
        .feature-icon {
          display: grid; place-items: center; width: 43px; height: 43px;
          border-radius: 13px; background: #27213f; color: #b7acff;
          font-size: 21px; margin-bottom: 16px;
        }
        .feature h3 { margin: 0 0 8px; }
        .feature p { color: #9ca5b8; font-size: 13px; line-height: 1.7; margin: 0; }
        .page-top { margin: 10px 0 26px; }
        .toolbar { display: flex; gap: 12px; margin: 24px 0 20px; flex-wrap: wrap; }
        .search-input, .form-input {
          width: 100%; background: #0c1019; color: white; border: 1px solid #30384a;
          border-radius: 11px; padding: 13px 14px; min-width: 0;
        }
        .search-input { flex: 1; min-width: 220px; }
        .category-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .category-button {
          border: 1px solid #30384a; color: #b4bbca; background: #111621;
          border-radius: 999px; padding: 9px 14px; font-size: 13px;
        }
        .category-button.active { background: #9281ff; border-color: #9281ff; color: #090914; font-weight: 800; }
        .empty-state {
          text-align: center; padding: 50px 20px; background: #111621;
          border: 1px dashed #30384a; border-radius: 18px; color: #aeb5c5;
        }
        .detail-panel {
          background: #111621; border: 1px solid #30384a; border-radius: 20px;
          padding: clamp(20px,4vw,34px); margin-bottom: 26px;
        }
        .detail-panel h2 { margin-top: 8px; }
        .exercise-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 16px 0; border-bottom: 1px solid #252d3d;
        }
        .exercise-row:last-child { border-bottom: 0; }
        .exercise-row span { color: #a8b0c0; font-size: 13px; text-align: right; }
        .auth-layout {
          display: grid; grid-template-columns: 1fr 1fr; gap: 26px;
          max-width: 900px; margin: 20px auto;
        }
        .auth-promo {
          border-radius: 22px; padding: 32px;
          background: radial-gradient(circle at 80% 20%,#453b7d,transparent 40%),#151a2b;
          border: 1px solid #34304e; display: flex; flex-direction: column; justify-content: center;
        }
        .auth-promo h2 { font-size: 34px; letter-spacing: -1.5px; }
        .auth-promo p { color: #b3bbcb; line-height: 1.8; }
        .auth-card {
          background: #111621; border: 1px solid #2b3343;
          padding: 28px; border-radius: 22px;
        }
        .auth-card h2 { margin: 0 0 8px; font-size: 27px; }
        .auth-card > p { color: #9da6b7; font-size: 13px; line-height: 1.6; }
        .form-field { margin: 16px 0; }
        .form-field label { display: block; margin-bottom: 8px; color: #c6ccda; font-size: 13px; font-weight: 700; }
        .form-input { display: block; }
        .auth-switch { text-align: center; color: #a7afbf; font-size: 13px; margin-top: 18px; }
        .auth-switch button { color: #b9adff; background: none; border: 0; font-weight: 800; }
        .notice {
          margin: 18px 0; border-radius: 12px; padding: 13px 15px;
          background: #182238; color: #c8d7ff; border: 1px solid #33476d;
          line-height: 1.6; font-size: 13px;
        }
        .notice.error { background: #321a20; border-color: #71313e; color: #ffc2cb; }
        .notice.success { background: #153126; border-color: #2c6548; color: #b9f2d2; }
        .progress-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .progress-card { background: #111621; border: 1px solid #293244; padding: 22px; border-radius: 17px; }
        .progress-card strong { display: block; font-size: 32px; margin-bottom: 7px; }
        .progress-card span { color: #a4adbe; font-size: 13px; }
        .history-row { display: flex; justify-content: space-between; gap: 12px; padding: 16px 0; border-bottom: 1px solid #252d3d; }
        .history-row span { color: #9ca5b8; font-size: 13px; }
        .profile-card { max-width: 650px; padding: 28px; background: #111621; border: 1px solid #293244; border-radius: 20px; }
        .profile-avatar {
          width: 64px; height: 64px; display: grid; place-items: center;
          border-radius: 20px; background: #292343; color: #c4baff;
          font-size: 25px; font-weight: 900; margin-bottom: 18px;
        }
        .site-footer { border-top: 1px solid #202634; padding: 28px 22px; color: #8992a5; text-align: center; font-size: 12px; }
        .site-footer strong { color: #c4baff; }
        @media (max-width: 850px) {
          .desktop-nav { display: none; }
          .menu-toggle { display: inline-flex; }
          .mobile-nav { display: flex; flex-direction: column; padding: 0 22px 14px; gap: 5px; }
          .workout-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .auth-layout { grid-template-columns: 1fr; }
          .auth-promo { display: none; }
        }
        @media (max-width: 560px) {
          .header-inner { padding: 12px 14px; gap: 8px; }
          .brand { font-size: 17px; gap: 7px; }
          .brand-mark { width: 34px; height: 34px; }
          .header-actions { gap: 6px; }
          .header-actions .button { padding: 9px 10px; font-size: 12px; }
          main { padding: 18px 14px 45px; }
          .hero { padding: 28px 21px; border-radius: 21px; }
          h1 { letter-spacing: -1.8px; }
          .hero p { font-size: 14px; }
          .hero-stats { gap: 18px; }
          .stat strong { font-size: 20px; }
          .workout-grid { grid-template-columns: 1fr; }
          .workout-art { height: 125px; }
          .feature-grid { grid-template-columns: 1fr; }
          .progress-grid { grid-template-columns: 1fr; }
          .section-heading { align-items: start; }
          .auth-card { padding: 21px; }
          .exercise-row { align-items: flex-start; }
        }
      `}</style>

      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate("Home")} aria-label="GymLink home">
            <span className="brand-mark">G</span>
            <span>Gym<span className="brand-accent">Link</span></span>
          </button>

          <nav className="desktop-nav" aria-label="Main navigation">
            {["Home", "Workouts", "Progress", "Community"].map((item) => (
              <button
                key={item}
                className={`nav-button ${page === item ? "active" : ""}`}
                onClick={() => navigate(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            {user ? (
              <button className="button button-secondary" onClick={() => navigate("Profile")}>
                My profile
              </button>
            ) : (
              <>
                <button className="button button-secondary" onClick={() => { setAuthMode("login"); setMessage(""); }}>
                  Log in
                </button>
                <button className="button button-primary" onClick={() => { setAuthMode("register"); setMessage(""); }}>
                  Register
                </button>
              </>
            )}
            <button
              className="button button-secondary menu-toggle"
              onClick={() => setMobileMenu((value) => !value)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenu}
            >
              ☰
            </button>
          </div>
        </div>

        {mobileMenu && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {["Home", "Workouts", "Progress", "Community", "Profile"].map((item) => (
              <button key={item} className={`nav-button ${page === item ? "active" : ""}`} onClick={() => navigate(item)}>
                {item}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main>
        {message && (
          <div className={`notice ${messageType}`} role="status">
            {message}
            <button
              onClick={() => setMessage("")}
              style={{ float: "right", background: "none", color: "inherit", border: 0 }}
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {authMode ? (
          <section className="auth-layout">
            <div className="auth-promo">
              <span className="eyebrow">Your fitness journey starts here</span>
              <h2>Stronger habits.<br /><span className="gradient-text">Stronger you.</span></h2>
              <p>Discover workouts, build consistency and keep track of the sessions you complete.</p>
              <p>GymLink brings your training journey together in one place.</p>
            </div>

            <div className="auth-card">
              <h2>
                {authMode === "register" ? "Create your account" :
                 authMode === "reset" ? "Reset your password" : "Welcome back"}
              </h2>
              <p>
                {authMode === "register" ? "Join GymLink and start building your routine." :
                 authMode === "reset" ? "Enter your email to request a password reset." :
                 "Sign in to continue your fitness journey."}
              </p>

              <form onSubmit={handleAuth}>
                {authMode === "register" && (
                  <div className="form-field">
                    <label htmlFor="fullName">Your name</label>
                    <input
                      id="fullName"
                      className="form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your name"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {authMode !== "reset" && (
                  <div className="form-field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      className="form-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={authMode === "register" ? "At least 6 characters" : "Enter your password"}
                      autoComplete={authMode === "register" ? "new-password" : "current-password"}
                      minLength={authMode === "register" ? 6 : undefined}
                      required
                    />
                  </div>
                )}

                <button className="button button-primary button-full" type="submit" disabled={authLoading}>
                  {authLoading ? "Please wait..." :
                   authMode === "register" ? "Create account" :
                   authMode === "reset" ? "Send reset email" : "Log in"}
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <div className="auth-switch">
                {authMode === "register" ? (
                  <>Already registered? <button onClick={() => { setAuthMode("login"); setMessage(""); }}>Log in</button></>
                ) : authMode === "login" ? (
                  <>
                    <button onClick={() => { setAuthMode("reset"); setMessage(""); }}>Forgot password?</button>
                    <br /><br />
                    New to GymLink? <button onClick={() => { setAuthMode("register"); setMessage(""); }}>Register</button>
                  </>
                ) : (
                  <>Remembered it? <button onClick={() => { setAuthMode("login"); setMessage(""); }}>Back to login</button></>
                )}
              </div>
              <button className="text-button" style={{ marginTop: 16 }} onClick={() => { setAuthMode(""); setMessage(""); }}>
                ← Back to GymLink
              </button>
            </div>
          </section>
        ) : page === "Home" ? (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="eyebrow">Your training. Your progress.</span>
                <h1>Make every<br />rep <span className="gradient-text">count.</span></h1>
                <p>
                  Find workouts that fit your goals, build a routine that works
                  for you, and keep moving forward with GymLink.
                </p>
                <div className="hero-buttons">
                  <button className="button button-primary" onClick={() => navigate("Workouts")}>
                    Explore workouts →
                  </button>
                  <button className="button button-secondary" onClick={() => { setAuthMode("register"); setMessage(""); }}>
                    Create free account
                  </button>
                </div>
                <div className="hero-stats">
                  <div className="stat"><strong>{workouts.length}</strong><span>Starter workouts</span></div>
                  <div className="stat"><strong>All levels</strong><span>Beginner to advanced</span></div>
                  <div className="stat"><strong>Your pace</strong><span>Build your routine</span></div>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Find your next workout</h2>
                  <p>Choose a session and get moving.</p>
                </div>
                <button className="text-button" onClick={() => navigate("Workouts")}>View all →</button>
              </div>
              <div className="workout-grid">
                {workouts.slice(0, 3).map((workout) => <WorkoutCard key={workout.id} workout={workout} />)}
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Built to keep you moving</h2>
                  <p>Simple tools to help you stay consistent.</p>
                </div>
              </div>
              <div className="feature-grid">
                <div className="feature">
                  <div className="feature-icon">✦</div>
                  <h3>Workouts for you</h3>
                  <p>Explore sessions by training area, level and available time.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">↗</div>
                  <h3>Track your sessions</h3>
                  <p>Mark completed workouts and review your activity on this device.</p>
                </div>
                <div className="feature">
                  <div className="feature-icon">◎</div>
                  <h3>Stay consistent</h3>
                  <p>Build a routine you can maintain and progress at your own pace.</p>
                </div>
              </div>
            </section>
          </>
        ) : page === "Workouts" ? (
          <>
            <div className="page-top">
              <h1 className="page-title">{selectedWorkout ? selectedWorkout.name : "Explore workouts"}</h1>
              <p className="page-description">
                {selectedWorkout ? selectedWorkout.description : "Find the right session for your training goals."}
              </p>
            </div>

            {selectedWorkout ? (
              <section className="detail-panel">
                <div className="workout-meta">
                  <span className="level">{selectedWorkout.level}</span>
                  <span>{selectedWorkout.duration}</span>
                </div>
                <h2>Today's session</h2>
                <p className="page-description">Use a suitable weight and range of motion for your ability. Warm up first and stop if you feel pain.</p>
                {selectedWorkout.exercises.map(([name, reps], index) => (
                  <div className="exercise-row" key={name}>
                    <div><strong>{index + 1}. {name}</strong></div>
                    <span>{reps}</span>
                  </div>
                ))}
                <div className="hero-buttons">
                  <button className="button button-primary" onClick={() => finishWorkout(selectedWorkout)}>
                    Mark workout complete ✓
                  </button>
                  <button className="button button-secondary" onClick={() => setSelectedWorkout(null)}>
                    Back to workouts
                  </button>
                </div>
              </section>
            ) : (
              <>
                <div className="toolbar">
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search workouts..."
                    aria-label="Search workouts"
                  />
                </div>
                <div className="category-row">
                  {categories.map((item) => (
                    <button
                      key={item}
                      className={`category-button ${category === item ? "active" : ""}`}
                      onClick={() => setCategory(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {filteredWorkouts.length ? (
                  <div className="workout-grid">
                    {filteredWorkouts.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h3>No workouts found</h3>
                    <p>Try another search or select a different category.</p>
                    <button className="button button-secondary" onClick={() => { setSearch(""); setCategory("All"); }}>
                      Clear filters
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : page === "Progress" ? (
          <>
            <div className="page-top">
              <h1 className="page-title">Your progress</h1>
              <p className="page-description">Every completed session is a step forward.</p>
            </div>
            <div className="progress-grid">
              <div className="progress-card"><strong>{completed.length}</strong><span>Workouts completed this visit</span></div>
              <div className="progress-card"><strong>{new Set(completed.map((item) => item.name)).size}</strong><span>Different workouts completed</span></div>
              <div className="progress-card"><strong>{user ? "Active" : "Guest"}</strong><span>Account status</span></div>
            </div>
            <section className="section detail-panel">
              <h2>Workout history</h2>
              {completed.length ? [...completed].reverse().map((item) => (
                <div className="history-row" key={item.id}>
                  <strong>{item.name}</strong><span>{item.date}</span>
                </div>
              )) : (
                <div className="empty-state">
                  <h3>Your first workout starts here</h3>
                  <p>Complete a session and it will appear in your history during this visit.</p>
                  <button className="button button-primary" onClick={() => navigate("Workouts")}>Find a workout →</button>
                </div>
              )}
              <p className="page-description">This starter version keeps workout history in the current app session. Database-backed history can be added once your Supabase tables are configured.</p>
            </section>
          </>
        ) : page === "Community" ? (
          <>
            <div className="page-top">
              <h1 className="page-title">GymLink community</h1>
              <p className="page-description">Make your training journey a consistent habit.</p>
            </div>
            <section className="detail-panel">
              <div className="feature-icon">◎</div>
              <h2>Your next step starts today</h2>
              <p className="page-description">
                Pick a workout, set a realistic goal and celebrate each session you complete.
                Community profiles, friend connections and shared challenges are not yet connected
                to a backend in this starter version.
              </p>
              <button className="button button-primary" onClick={() => navigate("Workouts")}>Explore workouts →</button>
            </section>
          </>
        ) : (
          <>
            <div className="page-top">
              <h1 className="page-title">My profile</h1>
              <p className="page-description">Your GymLink account.</p>
            </div>
            <section className="profile-card">
              <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
              <h2>{displayName}</h2>
              <p className="page-description">{user?.email || "You are browsing as a guest."}</p>
              {user ? (
                <>
                  <div className="history-row"><strong>Account status</strong><span>Signed in</span></div>
                  <div className="history-row"><strong>Completed sessions</strong><span>{completed.length}</span></div>
                  <div className="hero-buttons">
                    <button className="button button-secondary" onClick={handleSignOut}>Sign out</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="page-description">Register or log in to create your GymLink account.</p>
                  <div className="hero-buttons">
                    <button className="button button-primary" onClick={() => { setAuthMode("register"); setMessage(""); }}>Register</button>
                    <button className="button button-secondary" onClick={() => { setAuthMode("login"); setMessage(""); }}>Log in</button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <strong>GymLink</strong> — Your training. Your progress. Your journey.
      </footer>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
