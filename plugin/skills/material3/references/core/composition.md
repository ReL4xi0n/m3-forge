# Composition

How first-party Material 3 screens arrange their parts. Use it before writing code and again on
the screenshots.

## Placement

- The page background is the plain surface role; content groups sit in containers one or two
  surface-container steps away, with large corners. The container, not a line, shows the group.
- A screen reads top to bottom in this order: what this is (title, key visual), the key facts, the
  one main action, then supporting sections. The main action sits right under the facts it acts
  on, often full width on compact.
- Header block of a detail screen: the visual (image, icon or shape container) on the leading
  side, the name next to it, and one or two lines of qualifiers below the name. Key facts follow
  as a single row of short stat pairs (value above, label below) split by vertical dividers.
- Sections start with a title on its own line and, when more exists, a trailing text button or an
  arrow icon button that opens the full list. The title lines up with the container edge.
- Desktop settings and dashboards: navigation on the leading side, then one large container that
  fills the rest of the window to the bottom edge. The content inside keeps a reading width and
  starts at the top; the container itself does not end early.
- A focused task on desktop (sign-in, one form step) is one wide container centered on the page:
  title and short explanation on the leading half, fields on the trailing half, the action at the
  trailing bottom corner, small links under the container.
- Three-pane desktop views (navigation, main, details) give each content pane its own container
  with a gap between them; an empty details pane shows a short "select an item" message.

## Grouping

- Settings-style lists: one container per section; rows inside are separate tiles with a small
  gap, the outer corners of the first and last tile large and the inner corners small, so the
  section reads as one segmented block. Section labels sit above the block in the primary role at
  title small.
- Each row: leading icon in a full-round tonal container, label (and value) in the middle,
  control or value trailing. Every row of a block uses the same anatomy.
- Forms: one column of full-width fields; a field's extra action (remove, choose type) sits
  outside the field at its trailing side; optional fields hide behind a row of tonal "add" buttons
  at the end of the form; the save action lives in the top app bar or at the end, not both.
- Empty states: an illustration-sized shape container, a one-line title, one line of help, and
  the way out as the screen's FAB or a single button.

## Spacing rhythm

- Three distances only: tight inside a row or tile, medium between tiles of one group, large
  between sections (clearly larger than the gap inside a section). Repeat them everywhere.
- Vertical space above a section title is larger than the space below it, so the title belongs to
  what follows.

## Emphasis

- One filled element per view carries the strongest color: the main action, or the selected
  navigation item. Secondary actions are tonal, outlined or text buttons.
- The accent color appears in few places with a job: the active destination, the main action,
  section labels, links and the selected state. Large areas stay on surface roles.
- Alerts and warnings use the error-container pair (or a tonal container with an error icon),
  never a saturated error fill that outshouts the main action.
- A floating action (FAB, extended FAB) sits at the bottom trailing corner over content, and the
  scrolling content has bottom padding so the last row clears it.
