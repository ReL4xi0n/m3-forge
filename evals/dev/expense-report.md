# Expense report form

Build the screen where an employee fills in an expense report in "Ledgerleaf", an internal finance tool.

The form needs:
- a report title, a trip or project code (chosen from a list) and a date range for the report;
- line items, each with date, category (Travel, Meals, Lodging, Supplies or Other), merchant,
  amount and currency, and an optional note; people can add, duplicate and delete lines;
- a receipt attachment per line, shown as a small preview with a way to replace or remove it;
- a running subtotal per category and a grand total, converted to EUR when a line uses another currency;
- validation: dates inside the report range, amounts above zero, a receipt required for any line over 25 EUR;
- "Save draft" and "Submit for approval" actions, with a summary to confirm before submitting.

It should be efficient for someone entering twenty lines in one sitting.
