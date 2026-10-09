
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const workouts = [
  {
    name: "Full Body Beginner",
    level: "Beginner",
    description: "Warm-up, full-body strength exercises and a complete cooldown."
  },
  {
    name: "Upper Body Strength",
    level: "Intermediate",
    description: "Chest, shoulders, back and arms with structured sets and rest periods."
  },
  {
    name: "Lower Body Power",
    level: "Advanced",
    description: "A powerful leg-focused workout designed to build strength and fitness."
  },
  {
    name: "Home HIIT Circuit",
    level: "All Levels",
    description: "An equipment-free workout you can complete at home."
  }
];

function App() {
  const [page, setPage] = useState("Home");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("Build muscle");
  const [level, setLevel] = useState("Beginner");
  const [saved, setSaved] = useState(false);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">GYM<span>LINK</span></div>
        <p className="tagline">Meet people. Train together. Get healthier.</p>
      </header>

      <nav className="navigation">
        {["Home", "Find Gym Friends", "Workouts", "Train at Home", "Profile"].map(item => (
          <button
            key={item}
            className={page === item ? "nav-button active" : "nav-button"}
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
              <h1>Meet people.<br />Train harder.<br />Get healthier.</h1>
              <p>
                Connect with gym friends, find training partners and build a
                fitness community that keeps you motivated.
              </p>
              <button className="primary-button" onClick={() => setPage("Find Gym Friends")}>
                Find Gym Friends
              </button>
            </section>

            <section>
              <h2>Everything you need to stay motivated</h2>
              <div className="grid">
                <Feature title="Find Gym Friends" text="Meet people with similar fitness goals and find a training partner." onClick={() => setPage("Find Gym Friends")} />
                <Feature title="Build Your Profile" text="Share your fitness level, goals and interests." onClick={() => setPage("Profile")} />
                <Feature title="Train at Home" text="Follow workouts when you cannot get to the gym." onClick={() => setPage("Train at Home")} />
                <Feature title="Train Together" text="Keep each other motivated and make fitness enjoyable." onClick={() => setPage("Find Gym Friends")} />
              </div>
            </section>
          </>
        )}

        {page === "Find Gym Friends" && (
          <section className="page-section">
            <h1>Find Gym Friends</h1>
            <p className="muted">Start building your fitness community.</p>
            <div className="profile-box">
              <h2>Meet your future training partner</h2>
              <p>Create your profile to tell people about your goals and training level.</p>
              <button className="primary-button" onClick={() => setPage("Profile")}>Create My Profile</button>
            </div>
          </section>
        )}

        {page === "Workouts" && (
          <WorkoutPage title="Gym Workouts" description="Structured workouts for every fitness level." />
        )}

        {page === "Train at Home" && (
          <WorkoutPage title="Train at Home" description="Workouts you can do without needing a gym." />
        )}

        {page === "Profile" && (
          <section className="page-section">
            <h1>Your GymLink Profile</h1>
            <div className="profile-box">
              <label htmlFor="profile-name">Your name</label>
              <input id="profile-name" value={name} onChange={e => { setName(e.target.value); setSaved(false); }} placeholder="Enter your name" />

              <label htmlFor="profile-level">Fitness level</label>
              <select id="profile-level" value={level} onChange={e => { setLevel(e.target.value); setSaved(false); }}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>

              <label htmlFor="profile-goal">Your goal</label>
              <select id="profile-goal" value={goal} onChange={e => { setGoal(e.target.value); setSaved(false); }}>
                <option>Build muscle</option>
                <option>Lose weight</option>
                <option>Improve fitness</option>
                <option>Increase strength</option>
                <option>Find a training partner</option>
              </select>

              <button className="primary-button" onClick={() => setSaved(true)}>Save Profile</button>
              {saved && <p role="status">Profile details saved for this session. Account storage is not connected yet.</p>}
            </div>
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
      <button className="text-button" onClick={onClick}>Explore →</button>
    </article>
  );
}

function WorkoutPage({ title, description }) {
  return (
    <section className="page-section">
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      <div className="grid">
        {workouts.map(workout => (
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
