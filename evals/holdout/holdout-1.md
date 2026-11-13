# Appointment booking screen

I need the booking screen for "Larkspur Physio", a small physiotherapy practice that lets patients
book sessions themselves. A patient lands here after tapping "Book a session" and should be able to
pick a time and confirm in one place.

What the screen needs:
- A header with the practice name and a back action.
- Session type, chosen from three options: "Initial assessment" (60 min, $95), "Follow-up"
  (30 min, $60) and "Sports massage" (45 min, $70). One must be selected before times show.
- Therapist choice: "Any available", "Dana K." or "Ravi M.", each with a small avatar.
- A date picker showing the next two weeks. Sundays are closed and can't be selected. Today is
  Tuesday 14 May.
- Available times for the chosen day, grouped into Morning and Afternoon. Some slots are already
  taken and should look unavailable. If a day has no free slots, say so and suggest the next day
  that has some.
- An optional notes field ("Anything we should know?"), max 200 characters with a counter.
- A summary at the bottom with the session, therapist, date, time and price, plus a "Confirm
  booking" button that stays disabled until a time is picked.

It should be calm and quick to use, especially for people booking on their phone.
