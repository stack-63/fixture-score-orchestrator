# Fixture Score Orchestrator

Add an Admin Panel module for managing games, fixtures, and odds. This interface must be strictly hidden from regular users and only accessible to users with an "admin" role.

Implement this with the following features and visual components:

1. ADMIN SIMULATION TRICK (FOR TESTING)

- In the User Profile / Settings tab, add a simple toggle or button labeled "Simulate Admin View" so I can easily switch back and forth between regular user view and admin view while building.

- When Admin mode is ACTIVE, show a floating "Admin Dashboard" button or add an "Admin Panel" link to the primary navigation layout.

2. FIXTURES MANAGEMENT DASHBOARD (ADMIN VIEW ONLY)

Create a clean table or card list layout showing all current matches in the database. For each match, provide three clear actions:

- Create / Add Game Button: Opens a modal form to add a new fixture. Fields must include: Home Team Name, Away Team Name, Tournament/League, Match Date/Time, Status (Upcoming / Live), Home Odds (1), Draw Odds (X), and Away Odds (2).

- Edit Button: Opens the same modal pre-filled with that specific match's data, allowing the admin to update live scores, change match status, or adjust shifting odds on the fly.

- Delete Button: Triggers a confirmation dialog ("Are you sure you want to delete this fixture? This will void uncompleted betslips").

3. CONDITIONAL UI RENDERING

- Ensure that if the user state is not an admin, the entire fixtures management screen, the edit/delete buttons on match rows, and the dashboard links are completely removed from the DOM and completely invisible.

Use local React state to simulate adding, editing, and deleting games in the active live feed so I can see the matches update instantly on the home feed when I make changes as an admin. Leave clear code comments showing where the Supabase database mutations (.insert(), .update(), .delete()) will hook in later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/17e5f888-5132-474d-a1b2-fc553a26959a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
