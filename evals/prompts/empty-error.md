# Empty and error states

Build the "Trips" screen of "Wayfare", a travel planning app, in the states it can be in:

- Empty: the person has no trips yet. Explain what trips are for and offer a "Plan a trip" action.
- Loading: trips are being fetched.
- Loaded: a list of three trips (Lisbon, 12–18 May; Kyoto, 2–14 October; Oslo, 20–23 December),
  each with a cover placeholder, dates and the number of saved places.
- Offline: no connection; show the last saved list with a notice and a retry action.
- Error: the server failed; explain it plainly and offer "Try again" and "Contact support".
- Search with no results: the person searched for "Reykjavik" and nothing matched.

Provide a simple way to switch between these states so each one can be seen and reviewed.
