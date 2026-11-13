# Team chat conversation screen

Please design the conversation screen for "Threadline", a chat app for small teams. This is the
view you see after opening one channel, here "#launch-week", which has 8 members.

The screen needs:
- A top bar with the channel name, member count, a search action and a menu for channel details.
- A pinned message banner at the top: "Launch checklist is in the shared folder", which can be
  dismissed.
- The message list, newest at the bottom. Messages from the same person in a row are grouped
  under one name and avatar. Show timestamps and a date divider ("Yesterday", "Today").
- Mix of message kinds: plain text, a reply quoting an earlier message, an attached file
  ("release-notes-v2.pdf, 1.4 MB"), an image thumbnail, and emoji reactions with counts.
- My own messages look different from others' and show a sent or read status.
- An "unread messages" divider where I left off, and a "jump to latest" button when scrolled up.
- A typing indicator: "Mara is typing…".
- A composer at the bottom with an attach action, a text field ("Message #launch-week") that grows
  to a few lines, and a send button that is only enabled when there is text.

Long-pressing a message should offer reply, react, copy and delete (own messages only).
