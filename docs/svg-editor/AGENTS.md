# SVG Editor Shared Rules

- Follow `TDD.md` and `PRD.md`; only change paths owned by the active task.
- The contracts directory is frozen after task 0.2; document a blocker in `STATUS.md` rather than changing a contract.
- Keep core free of DOM APIs; browser behavior belongs behind contract adapters.
- Treat uploaded SVG as hostile input. Never render it through JSX or an unsanitized HTML sink.
- Keep React to chrome and empty pane containers; pointer-rate data stays outside React state.
- Mounting effects must be idempotent under React StrictMode.
- Do not add dependencies unless the active task names them, and preserve existing site behavior.
