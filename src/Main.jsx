import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

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

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          GYM<span>LINK</span>
        </div>

        <p className="tagline">
          Meet people. Train together. Get healthier.
        </p>
      </header>

      <nav className="navigation">
        {[
          "Home",
          "Find Gym Friends",
          "Workouts",
          "Train at Home",
          "Profile"
        ].map((item) => (
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
              <h1>
                Meet people.
                <br />
                Train harder.
                <br />
                Get healthier.
              </h1>

              <p>
                GymLink is built to help people connect with gym friends,
                training partners and a fitness community that keeps everyone
                motivated.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("Find Gym Friends")}
              >
                Find Gym Friends
              </button>
            </section>

            <section>
              <h2>Everything you need to stay motivated</h2>

              <div className="grid">
                <Feature
                  title="Find Gym Friends"
                  text="Meet people with similar fitness goals and find the right training partner."
                />

                <Feature
                  title="Build Your Profile"
                  text="Share your fitness level, goals and interests so people can connect with you."
                />

                <Feature
                  title="Train at Home"
                  text="Follow structured workouts when you can't get to the gym."
                />

                <Feature
                  title="Train Together"
                  text="Keep each other motivated and make fitness more enjoyable."
                />
              </div>
            </section>
          </>
        )}

        {page === "Find Gym Friends" && (
          <section className="page-section">
            <h1>Find Gym Friends</h1>

            <p className="muted">
              Connect with people who want to train, improve and stay
              motivated together.
            </p>

            <div className="profile-box">
              <h2>Build your fitness community</h2>

              <p>
                GymLink will allow members to create profiles, discover
                training partners, connect by fitness level and communicate
                with other members.
              </p>

              <button className="primary-button">
                Create My Profile
              </button>
            </div>
          </section>
        )}

        {page === "Workouts" && (
          <WorkoutPage
            title="Gym Workouts"
            description="Structured workouts for beginners through advanced lifters."
          />
        )}

        {page === "Train at Home" && (
          <WorkoutPage
            title="Train at Home"
            description="Complete workouts you can follow without needing a gym."
          />
        )}

        {page === "Profile" && (
          <section className="page-section">
            <h1>Your GymLink Profile</h1>

            <div className="profile-box">
              <h2>Become part of the community</h2>

              <p>
                Add your fitness level, goals, training preferences and bio.
              </p>

              <button className="primary-button">
                Create Profile
              </button>
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

function Feature({ title, text }) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <p>{text}</p>

      <button className="text-button">
        Explore →
      </button>
    </article>
  );
}

function WorkoutPage({ title, description }) {
  return (
    <section className="page-section">
      <h1>{title}</h1>

      <p
