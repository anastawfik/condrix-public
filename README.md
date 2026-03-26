# Condrix — Website & Documentation

The official website and documentation for [Condrix](https://github.com/anastawfik/condrix), a Distributed AI Agent Orchestration Platform.

**Live site:** [condrix.dev](https://condrix.dev)

## Tech Stack

- [Astro](https://astro.build/) — Static site framework
- [Starlight](https://starlight.astro.build/) — Documentation theme
- [Pagefind](https://pagefind.app/) — Client-side search

## Development

```bash
npm install
npm run dev       # Start dev server at localhost:4321
npm run build     # Build static site to dist/
npm run preview   # Preview production build locally
```

## Documentation Structure

```
src/content/docs/
├── index.mdx                      # Landing page
├── getting-started/
│   ├── introduction.md            # What is Condrix
│   ├── quick-start.md             # Install & run
│   └── authentication.md          # OAuth & API key setup
├── architecture/
│   ├── overview.md                # 3-layer architecture
│   ├── connection-modes.md        # Direct, Maestro, Docker
│   └── security.md                # Auth, tokens, 2FA
├── deployment/
│   ├── docker.md                  # Docker Compose setup
│   ├── cloudflare-tunnel.md       # Remote access
│   └── environment-variables.md   # All config vars
└── development/
    ├── commands.md                # Dev commands
    ├── monorepo-structure.md      # Project layout
    └── roadmap.md                 # Feature roadmap
```

## Contributing

Edit docs in `src/content/docs/`. Pages use Markdown (`.md`) or MDX (`.mdx`) with YAML frontmatter. See [Starlight docs](https://starlight.astro.build/) for component reference.

## License

MIT
