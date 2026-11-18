// A sample screen built only from the skill's tokens and the theme's color roles (gallery source).
// run.mjs rewrites the import below to material_ui for the material_ui project, like install-assets.
import 'package:flutter/material.dart';

import 'm3/tokens.dart';

// Material Symbols Outlined codepoints, from assets/fonts/MaterialSymbolsOutlined.codepoints.
const IconData _search = IconData(0xef7a, fontFamily: 'MaterialSymbolsOutlined');
const IconData _bookmark = IconData(0xe8e7, fontFamily: 'MaterialSymbolsOutlined');
const IconData _history = IconData(0xe8b3, fontFamily: 'MaterialSymbolsOutlined');
const IconData _chevronRight = IconData(0xe5cc, fontFamily: 'MaterialSymbolsOutlined');
const IconData _add = IconData(0xe145, fontFamily: 'MaterialSymbolsOutlined');
const IconData _home = IconData(0xe9b2, fontFamily: 'MaterialSymbolsOutlined');
const IconData _person = IconData(0xf0d3, fontFamily: 'MaterialSymbolsOutlined');

class SampleScreen extends StatefulWidget {
  const SampleScreen({super.key});

  @override
  State<SampleScreen> createState() => _SampleScreenState();
}

class _SampleScreenState extends State<SampleScreen> {
  bool _reminders = true;
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final ColorScheme colors = Theme.of(context).colorScheme;
    final TextTheme text = Theme.of(context).textTheme;
    // Classic themes carry no emphasized type: use the plain text roles there.
    final M3EmphasizedType? emphasized = Theme.of(context).extension<M3EmphasizedType>();
    return Scaffold(
      appBar: AppBar(title: const Text('Shelf'), actions: <Widget>[
        IconButton(icon: const Icon(_search), tooltip: 'Search', onPressed: () {}),
      ]),
      body: ListView(
        padding: const EdgeInsets.all(M3Space.space200),
        children: <Widget>[
          Text('Good evening', style: (emphasized?.headlineMedium ?? text.headlineMedium!).copyWith(color: colors.onSurface)),
          const SizedBox(height: M3Space.space100),
          Text('Three books are due this week.', style: text.bodyLarge!.copyWith(color: colors.onSurfaceVariant)),
          const SizedBox(height: M3Space.space200),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(M3Space.space200),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
                Text('Currently reading', style: text.titleMedium),
                const SizedBox(height: M3Space.space100),
                Text('The Left Hand of Darkness', style: emphasized?.titleLarge ?? text.titleLarge),
                const SizedBox(height: M3Space.space200),
                Row(children: <Widget>[
                  FilledButton(onPressed: () {}, child: const Text('Continue')),
                  const SizedBox(width: M3Space.space100),
                  ElevatedButton(onPressed: () {}, child: const Text('Details')),
                  const SizedBox(width: M3Space.space100),
                  IconButton.filledTonal(icon: const Icon(_bookmark), tooltip: 'Bookmark', onPressed: () {}),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: M3Space.space200),
          Wrap(spacing: M3Space.space100, children: <Widget>[
            ChoiceChip(label: const Text('Fiction'), selected: true, onSelected: (bool _) {}),
            ChoiceChip(label: const Text('Essays'), selected: false, onSelected: (bool _) {}),
            ChoiceChip(label: const Text('Poetry'), selected: false, onSelected: (bool _) {}),
          ]),
          const SizedBox(height: M3Space.space200),
          SwitchListTile(
            title: const Text('Due date reminders'),
            subtitle: const Text('A note the day before'),
            value: _reminders,
            onChanged: (bool v) => setState(() => _reminders = v),
          ),
          ListTile(leading: const Icon(_history), title: const Text('Reading history'), trailing: const Icon(_chevronRight)),
          const SizedBox(height: M3Space.space200),
          Container(
            padding: const EdgeInsets.all(M3Space.space200),
            decoration: BoxDecoration(color: colors.tertiaryContainer, borderRadius: M3Corners.extraLarge),
            child: Text('Shape step extra-large', style: text.bodyMedium!.copyWith(color: colors.onTertiaryContainer)),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(tooltip: 'Add a book', onPressed: () {}, child: const Icon(_add)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (int i) => setState(() => _tab = i),
        destinations: <NavigationDestination>[
          NavigationDestination(icon: const Icon(_home), label: 'Home'),
          NavigationDestination(icon: const Icon(_search), label: 'Search'),
          NavigationDestination(icon: const Icon(_person), label: 'Profile'),
        ],
      ),
    );
  }
}
